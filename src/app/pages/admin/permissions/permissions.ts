import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Select } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
    CreatePermissionDto,
    Permission,
    PermissionFilters,
    PermissionsService,
    UpdatePermissionDto
} from '@/pages/service/permissions.service';

interface StatusOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-permissions',
    standalone: true,
    templateUrl: './permissions.html',
    styleUrl: './permissions.scss',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        ToastModule,
        ConfirmDialogModule,
        DialogModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        Select,
        TagModule,
        TextareaModule
    ],
    providers: [MessageService, ConfirmationService]
})
export class PermissionsComponent implements OnInit {
    readonly permissions = signal<Permission[]>([]);
    readonly loading = signal(false);
    readonly totalRecords = signal(0);
    rows = 10;

    readonly search$ = new Subject<string>();

    readonly filtersForm: FormGroup;
    readonly permissionForm: FormGroup;

    readonly statusOptions: StatusOption[] = [
        { label: 'Todos', value: 'ALL' },
        { label: 'Activo', value: 'ACT' },
        { label: 'Inactivo', value: 'INA' },
        { label: 'Bloqueado', value: 'BLO' }
    ];

    readonly statusLabel = computed(() => ({
        ACT: 'Activo',
        INA: 'Inactivo',
        BLO: 'Bloqueado'
    }));

    readonly statusSeverity = computed(() => ({
        ACT: 'success',
        INA: 'warning',
        BLO: 'danger'
    }));

    permissionDialog = false;
    isEditMode = false;
    submitted = false;

    private lastLazyEvent: TableLazyLoadEvent | null = null;
    private selectedPermission: Permission | null = null;

    constructor(
        private readonly fb: FormBuilder,
        private readonly permissionsService: PermissionsService,
        private readonly messageService: MessageService,
        private readonly confirmationService: ConfirmationService,
        private readonly router: Router
    ) {
        this.filtersForm = this.fb.group({
            search: [''],
            status: ['ALL']
        });

        this.permissionForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            status: ['ACT', Validators.required]
        });

        this.search$
            .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
            .subscribe(() => this.reloadPermissions(true));

        this.filtersForm
            .get('search')!
            .valueChanges.pipe(debounceTime(300), takeUntilDestroyed())
            .subscribe((term) => this.search$.next((term as string) ?? ''));

        this.filtersForm
            .get('status')!
            .valueChanges.pipe(takeUntilDestroyed())
            .subscribe(() => this.reloadPermissions(true));
    }

    ngOnInit(): void {
        const initialEvent: TableLazyLoadEvent = { first: 0, rows: this.rows };
        this.loadPermissions(initialEvent);
    }

    loadPermissions(event: TableLazyLoadEvent): void {
        this.lastLazyEvent = { ...event };
        const first = event.first ?? 0;
        const rows = event.rows && event.rows > 0 ? event.rows : this.rows;
        this.rows = rows;

        const page = Math.floor(first / rows) + 1;
        const limit = rows;

        const filters: PermissionFilters = {
            search: (this.filtersForm.get('search')?.value ?? '').trim(),
            status: this.filtersForm.get('status')?.value ?? 'ALL'
        };

        this.loading.set(true);

        this.permissionsService.findAll(page, limit, filters).subscribe({
            next: (response) => {
                this.permissions.set(response.data);
                this.totalRecords.set(response.total);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los permisos'
                });
            }
        });
    }

    reloadPermissions(resetPage = false): void {
        if (resetPage) {
            this.loadPermissions({ first: 0, rows: this.rows });
            return;
        }

        if (this.lastLazyEvent) {
            this.loadPermissions(this.lastLazyEvent);
        }
    }

    getStatusLabel(status?: string): string {
        const map = this.statusLabel();
        return map[status as keyof typeof map] ?? status ?? 'Desconocido';
    }

    getStatusSeverity(status?: string): string {
        const map = this.statusSeverity();
        return map[status as keyof typeof map] ?? 'info';
    }

    openNew(): void {
        this.permissionForm.reset({ name: '', description: '', status: 'ACT' });
        this.submitted = false;
        this.isEditMode = false;
        this.selectedPermission = null;
        this.permissionDialog = true;
    }

    hideDialog(): void {
        this.permissionDialog = false;
        this.submitted = false;
    }

    viewPermission(permission: Permission): void {
        const id = this.getPermissionId(permission);
        if (id) {
            this.router.navigate(['/complaints/permissions', id]);
        }
    }

    editPermission(permission: Permission): void {
        this.permissionForm.patchValue({
            name: permission.name,
            description: permission.description ?? '',
            status: permission.status ?? 'ACT'
        });
        this.selectedPermission = permission;
        this.isEditMode = true;
        this.submitted = false;
        this.permissionDialog = true;
    }

    confirmDelete(permission: Permission): void {
        const id = this.getPermissionId(permission);
        if (!id) {
            return;
        }

        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el permiso "${permission.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.permissionsService.remove(id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Permiso eliminado',
                            detail: 'El permiso se marcó como inactivo.'
                        });
                        this.reloadPermissions();
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo eliminar el permiso'
                        });
                    }
                });
            }
        });
    }

    savePermission(): void {
        this.submitted = true;

        if (this.permissionForm.invalid) {
            this.permissionForm.markAllAsTouched();
            return;
        }

        const { name, description, status } = this.permissionForm.value;
        const payload: CreatePermissionDto | UpdatePermissionDto = {
            name: name!.trim(),
            description: description?.trim() || undefined,
            status: status ?? 'ACT'
        };

        const permissionId = this.getPermissionId(this.selectedPermission);

        if (this.isEditMode && permissionId) {
            this.permissionsService.update(permissionId, payload as UpdatePermissionDto).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Permiso actualizado',
                        detail: 'El permiso se actualizó correctamente.'
                    });
                    this.permissionDialog = false;
                    this.submitted = false;
                    this.reloadPermissions();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo actualizar el permiso.'
                    });
                }
            });
            return;
        }

        this.permissionsService.create(payload as CreatePermissionDto).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Permiso creado',
                    detail: 'El permiso se creó correctamente.'
                });
                this.permissionDialog = false;
                this.submitted = false;
                this.reloadPermissions(true);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo crear el permiso.'
                });
            }
        });
    }

    isInvalid(controlName: string): boolean {
        const control = this.permissionForm.get(controlName);
        return !!control && control.invalid && (control.dirty || control.touched || this.submitted);
    }

    private getPermissionId(permission: Permission | null | undefined): string | undefined {
        if (!permission) {
            return undefined;
        }

        return permission._id ?? permission.id ?? undefined;
    }
}
