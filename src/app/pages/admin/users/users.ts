import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CheckboxModule } from 'primeng/checkbox';
import { RippleModule } from 'primeng/ripple';
import { Select } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
    UsersService,
    User,
    CreateUserPayload,
    UpdateUserPayload,
    PersonalData
} from '@/pages/service/users.service';

interface RoleOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-users',
    standalone: true,
    templateUrl: './users.html',
    styleUrl: './users.scss',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        ToastModule,
        ConfirmDialogModule,
        DialogModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        CheckboxModule,
        RippleModule,
        Select
    ],
    providers: [MessageService, ConfirmationService, UsersService]
})
export class Users implements OnInit {
    readonly users = signal<User[]>([]);
    readonly searchTerm = signal('');

    totalRecords = 0;
    rows = 10;
    loading = false;

    userDialog = false;
    submitted = false;
    isEditMode = false;

    searchValue = '';

    readonly roleOptions: RoleOption[] = [
        { label: 'Administrador', value: 'ADMIN' },
        { label: 'Empleado', value: 'EMPLOYEE' }
    ];

    readonly userForm: FormGroup;

    private readonly search$ = new Subject<string>();
    private lastLazyEvent: TableLazyLoadEvent | null = null;
    private selectedUser: User | null = null;

    constructor(
        private readonly fb: FormBuilder,
        private readonly usersService: UsersService,
        private readonly messageService: MessageService,
        private readonly confirmationService: ConfirmationService
    ) {
        this.userForm = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            role: ['EMPLOYEE', Validators.required],
            isFirstLogin: [false],
            password: [''],
            personalData: this.fb.group({
                name: [''],
                lastname: [''],
                dni: [''],
                phone: ['']
            })
        });

        this.search$
            .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
            .subscribe((term) => {
                this.searchTerm.set(term.trim());
                this.reloadUsers(true);
            });
    }

    ngOnInit(): void {
        const initialEvent: TableLazyLoadEvent = { first: 0, rows: this.rows };
        this.loadUsers(initialEvent);
    }

    loadUsers(event: TableLazyLoadEvent): void {
        this.lastLazyEvent = { ...event };
        const first = event.first ?? 0;
        const rows = event.rows && event.rows > 0 ? event.rows : this.rows;
        this.rows = rows;

        const page = Math.floor(first / rows) + 1;
        const limit = rows;
        const search = this.searchTerm();

        this.loading = true;

        this.usersService.getUsers(page, limit, search).subscribe({
            next: (response) => {
                this.users.set(response.data);
                this.totalRecords = response.total;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los usuarios',
                    life: 3000
                });
            }
        });
    }

    addUser(): void {
        this.isEditMode = false;
        this.submitted = false;
        this.selectedUser = null;
        this.resetForm();
        this.setPasswordValidators(true);
        this.userDialog = true;
    }

    editUser(user: User): void {
        this.isEditMode = true;
        this.submitted = false;
        this.selectedUser = user;
        this.resetForm();
        this.setPasswordValidators(false);

        this.userForm.patchValue({
            username: user.username,
            email: user.email,
            role: user.role || 'EMPLOYEE',
            isFirstLogin: user.isFirstLogin ?? false,
            password: ''
        });

        const personalDataGroup = this.userForm.get('personalData') as FormGroup;
        personalDataGroup.patchValue({
            name: user.personalData?.name ?? '',
            lastname: user.personalData?.lastname ?? '',
            dni: user.personalData?.dni ?? '',
            phone: user.personalData?.phone ?? ''
        });

        this.userDialog = true;
    }

    deleteUser(user: User): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar al usuario ${user.username}?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: 'Sí', icon: 'pi pi-check' },
            rejectButtonProps: { label: 'No', icon: 'pi pi-times', class: 'p-button-text' },
            accept: () => {
                this.usersService.deleteUser(user._id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Usuario eliminado correctamente',
                            life: 3000
                        });
                        this.reloadUsers();
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo eliminar el usuario',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    saveUser(): void {
        this.submitted = true;

        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            return;
        }

        const formValue = this.userForm.getRawValue();

        if (this.isEditMode && this.selectedUser) {
            const payload: UpdateUserPayload = {
                username: formValue.username?.trim(),
                email: formValue.email?.trim(),
                role: formValue.role,
                isFirstLogin: formValue.isFirstLogin ?? false,
                personalData: this.buildPersonalData(formValue.personalData)
            };

            this.usersService.updateUser(this.selectedUser._id, payload).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Usuario actualizado correctamente',
                        life: 3000
                    });
                    this.hideDialog();
                    this.reloadUsers();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo actualizar el usuario',
                        life: 3000
                    });
                }
            });
            return;
        }

        const payload: CreateUserPayload = {
            username: formValue.username?.trim(),
            email: formValue.email?.trim(),
            password: formValue.password?.trim() || '',
            name: formValue.personalData?.name?.trim() ?? '',
            lastname: formValue.personalData?.lastname?.trim() ?? '',
            dni: formValue.personalData?.dni?.trim() ?? '',
            phone: formValue.personalData?.phone?.trim() ?? ''
        };

        this.usersService.createUser(payload).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Usuario creado correctamente',
                    life: 3000
                });
                this.hideDialog();
                this.reloadUsers(true);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo crear el usuario',
                    life: 3000
                });
            }
        });
    }

    hideDialog(): void {
        this.userDialog = false;
        this.isEditMode = false;
        this.submitted = false;
        this.selectedUser = null;
        this.resetForm();
        this.setPasswordValidators(false);
    }

    onSearch(event: Event): void {
        const value = (event.target as HTMLInputElement)?.value ?? '';
        this.searchValue = value;
        this.search$.next(value);
    }

    clearSearch(): void {
        this.searchValue = '';
        this.search$.next('');
    }

    isInvalid(controlName: string): boolean {
        const control = this.userForm.get(controlName);
        return !!control && control.invalid && (control.dirty || control.touched || this.submitted);
    }

    private reloadUsers(resetToFirst: boolean = false): void {
        const event: TableLazyLoadEvent = this.lastLazyEvent
            ? { ...this.lastLazyEvent }
            : { first: 0, rows: this.rows };

        if (resetToFirst) {
            event.first = 0;
        }

        this.loadUsers(event);
    }

    private resetForm(): void {
        this.userForm.reset({
            username: '',
            email: '',
            role: 'EMPLOYEE',
            isFirstLogin: false,
            password: ''
        });

        const personalDataGroup = this.userForm.get('personalData') as FormGroup;
        personalDataGroup.reset({
            name: '',
            lastname: '',
            dni: '',
            phone: ''
        });
    }

    private setPasswordValidators(required: boolean): void {
        const passwordControl = this.userForm.get('password');
        if (!passwordControl) {
            return;
        }

        if (required) {
            passwordControl.setValidators([Validators.required, Validators.minLength(8)]);
        } else {
            passwordControl.clearValidators();
        }
        passwordControl.updateValueAndValidity();
    }

    private buildPersonalData(data: PersonalData | null | undefined): PersonalData | null {
        if (!data) {
            return null;
        }

        const trimmed: PersonalData = {
            name: data.name?.trim() || '',
            lastname: data.lastname?.trim() || '',
            dni: data.dni?.trim() || '',
            phone: data.phone?.trim() || ''
        };

        const hasValue = Object.values(trimmed).some((value) => !!value);
        return hasValue ? trimmed : null;
    }
}
