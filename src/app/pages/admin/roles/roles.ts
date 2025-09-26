import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Select } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
    CreateRoleDto,
    Role,
    RoleFilters,
    RolesService,
    UpdateRoleDto
} from '@/pages/service/roles.service';

interface StatusOption {
    label: string;
    value: string;
}

interface PermissionOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-roles',
    standalone: true,
    templateUrl: './roles.html',
    styleUrl: './roles.scss',
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
        MultiSelectModule,
        TagModule,
        TextareaModule
    ],
    providers: [MessageService, ConfirmationService]
})
export class RolesComponent implements OnInit {
    readonly roles = signal<Role[]>([]);
    readonly loading = signal(false);

    readonly totalRecords = signal(0);
    rows = 10;

    readonly search$ = new Subject<string>();

    readonly filtersForm: FormGroup;
    readonly roleForm: FormGroup;

    readonly statusOptions: StatusOption[] = [
        { label: 'Todos', value: 'ALL' },
        { label: 'Activo', value: 'ACT' },
        { label: 'Inactivo', value: 'INA' },
        { label: 'Bloqueado', value: 'BLO' }
    ];

    readonly statusSeverity = computed(() => ({
        ACT: 'success',
        INA: 'warning',
        BLO: 'danger'
    }));

    permissionOptions: PermissionOption[] = [];

    roleDialog = false;
    isEditMode = false;
    submitted = false;

    private lastLazyEvent: TableLazyLoadEvent | null = null;
    private selectedRole: Role | null = null;

    constructor(
        private readonly fb: FormBuilder,
        private readonly rolesService: RolesService,
        private readonly messageService: MessageService,
        private readonly confirmationService: ConfirmationService,
        private readonly router: Router
    ) {
        this.filtersForm = this.fb.group({
            search: [''],
            status: ['ALL']
        });

        this.roleForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            status: ['ACT', Validators.required],
            permissions: [[] as string[]]
        });

        this.search$
            .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
            .subscribe(() => this.reloadRoles(true));

        this.filtersForm
            .get('search')!
            .valueChanges.pipe(debounceTime(300), takeUntilDestroyed())
            .subscribe((term) => this.search$.next((term as string) ?? ''));

        this.filtersForm
            .get('status')!
            .valueChanges.pipe(takeUntilDestroyed())
            .subscribe(() => this.reloadRoles(true));
    }

    ngOnInit(): void {
        const initialEvent: TableLazyLoadEvent = { first: 0, rows: this.rows };
        this.loadRoles(initialEvent);
    }

    loadRoles(event: TableLazyLoadEvent): void {
        this.lastLazyEvent = { ...event };
        const first = event.first ?? 0;
        const rows = event.rows && event.rows > 0 ? event.rows : this.rows;
        this.rows = rows;

        const page = Math.floor(first / rows) + 1;
        const limit = rows;

        const filters: RoleFilters = {
            search: (this.filtersForm.get('search')?.value ?? '').trim(),
            status: this.filtersForm.get('status')?.value ?? 'ALL'
        };

        this.loading.set(true);

        this.rolesService.findAll(page, limit, filters).subscribe({
            next: (response) => {
                this.roles.set(response.data);
                this.totalRecords.set(response.total);
                this.loading.set(false);
                this.updatePermissionOptions(response.data);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los roles',
                    life: 3000
                });
            }
        });
    }

    reloadRoles(resetPage = false): void {
        if (resetPage && this.lastLazyEvent) {
            this.lastLazyEvent = { ...this.lastLazyEvent, first: 0 };
        }

        if (this.lastLazyEvent) {
            this.loadRoles(this.lastLazyEvent);
        } else {
            this.loadRoles({ first: 0, rows: this.rows });
        }
    }

    openNew(): void {
        this.roleDialog = true;
        this.isEditMode = false;
        this.submitted = false;
        this.selectedRole = null;
        this.resetForm();
        this.roleForm.patchValue({ status: 'ACT', permissions: [] });
    }

    editRole(role: Role): void {
        this.roleDialog = true;
        this.isEditMode = true;
        this.submitted = false;
        this.selectedRole = role;
        this.resetForm();
        this.roleForm.patchValue({
            name: role.name,
            description: role.description ?? '',
            status: role.status ?? 'ACT',
            permissions: role.permissions ?? []
        });
    }

    viewRole(role: Role): void {
        const id = this.getRoleId(role);
        if (id) {
            this.router.navigate(['/complaints/roles', id]);
        }
    }

    hideDialog(): void {
        this.roleDialog = false;
    }

    saveRole(): void {
        this.submitted = true;

        if (this.roleForm.invalid) {
            this.roleForm.markAllAsTouched();
            return;
        }

        const { name, description, status, permissions } = this.roleForm.value;
        const payload: CreateRoleDto | UpdateRoleDto = {
            name: name!.trim(),
            description: description?.trim() || undefined,
            status: status ?? 'ACT',
            permissions: permissions && permissions.length > 0 ? permissions : undefined
        };

        const roleId = this.getRoleId(this.selectedRole);

        if (this.isEditMode && roleId) {
            this.rolesService.update(roleId, payload).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Rol actualizado',
                        detail: 'El rol se actualizó correctamente.',
                        life: 3000
                    });
                    this.roleDialog = false;
                    this.reloadRoles();
                },
                error: () =>
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo actualizar el rol.',
                        life: 3000
                    })
            });
            return;
        }

        this.rolesService.create(payload as CreateRoleDto).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Rol creado',
                    detail: 'El rol se creó correctamente.',
                    life: 3000
                });
                this.roleDialog = false;
                this.reloadRoles();
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo crear el rol.',
                    life: 3000
                })
        });
    }

    confirmDelete(role: Role): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar el rol "${role.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteRole(role)
        });
    }

    deleteRole(role: Role): void {
        const roleId = this.getRoleId(role);
        if (!roleId) {
            return;
        }

        this.rolesService.remove(roleId).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Rol eliminado',
                    detail: 'El rol se marcó como inactivo.',
                    life: 3000
                });
                this.reloadRoles();
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo eliminar el rol.',
                    life: 3000
                })
        });
    }

    getStatusLabel(status?: string): string {
        switch (status) {
            case 'ACT':
                return 'Activo';
            case 'INA':
                return 'Inactivo';
            case 'BLO':
                return 'Bloqueado';
            default:
                return status ?? 'Desconocido';
        }
    }

    getStatusSeverity(status?: string): string {
        const severityMap = this.statusSeverity();
        return severityMap[status as keyof typeof severityMap] ?? 'info';
    }

    isInvalid(controlName: string): boolean {
        const control = this.roleForm.get(controlName);
        return !!control && control.invalid && (control.dirty || control.touched || this.submitted);
    }

    private resetForm(): void {
        this.roleForm.reset({
            name: '',
            description: '',
            status: 'ACT',
            permissions: []
        });
    }

    private updatePermissionOptions(roles: Role[]): void {
        const permissions = new Set<string>();
        roles.forEach((role) => {
            role.permissions?.forEach((permission) => permissions.add(permission));
        });

        this.permissionOptions = Array.from(permissions).map((permission) => ({
            label: permission,
            value: permission
        }));
    }

    private getRoleId(role: Role | null | undefined): string | undefined {
        if (!role) {
            return undefined;
        }

        return role._id ?? role.id ?? undefined;
    }
}
