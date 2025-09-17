import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, Table, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Select } from 'primeng/select';
import { RippleModule } from 'primeng/ripple';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CompaniesService, Company, CompanyStatus, NotAssignedUser } from '@/pages/service/companies.service';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

interface CompanyStatusOption {
    label: string;
    value: CompanyStatus;
}

@Component({
    selector: 'app-companies',
    standalone: true,
    templateUrl: './companies.html',
    styleUrl: './companies.scss',
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        TagModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        DialogModule,
        TextareaModule,
        ToastModule,
        ConfirmDialogModule,
        Select,
        RippleModule,
        CardModule,
        ProgressSpinnerModule
    ],
    providers: [MessageService, ConfirmationService, CompaniesService]
})
export class Companies implements OnInit {
    companies = signal<Company[]>([]);
    totalRecords = 0;
    loading = false;

    companyDialog = false;
    selectedCompany: Company | null = null;
    submitted = false;

    assignContactDialog = false;
    selectedCompanyForContact: Company | null = null;
    availableContacts = signal<NotAssignedUser[]>([]);
    availableContactsTotal = 0;
    availableContactsLoading = false;
    availableContactsRows = 10;
    assigningContactId: string | null = null;

    statuses: CompanyStatusOption[] = [
        { label: 'Activa', value: 'ACT' },
        { label: 'Inactiva', value: 'INA' }
    ];

    private lastLazyEvent: TableLazyLoadEvent | null = null;

    constructor(
        private companiesService: CompaniesService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        const initialEvent: TableLazyLoadEvent = { first: 0, rows: 10 };
        this.loadCompaniesLazy(initialEvent);
    }

    loadCompaniesLazy(event: TableLazyLoadEvent) {
        this.lastLazyEvent = { ...event };
        const first = event.first ?? 0;
        const rows = event.rows && event.rows > 0 ? event.rows : 10;
        const page = Math.floor(first / rows) + 1;
        const limit = rows;

        this.loading = true;

        this.companiesService.getCompanies(page, limit).subscribe({
            next: (response) => {
                this.companies.set(response.data);
                this.totalRecords = response.total;
                if (this.selectedCompany) {
                    const updatedCompany = response.data.find((item) => item._id === this.selectedCompany?._id);
                    if (updatedCompany) {
                        this.selectedCompany = {
                            ...updatedCompany,
                            contacts: updatedCompany.contacts ? [...updatedCompany.contacts] : []
                        };
                    }
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar las empresas',
                    life: 3000
                });
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    getStatusSeverity(status: CompanyStatus) {
        switch (status) {
            case 'ACT':
                return 'success';
            case 'INA':
                return 'danger';
            default:
                return 'info';
        }
    }

    getStatusLabel(status: CompanyStatus) {
        switch (status) {
            case 'ACT':
                return 'Activa';
            case 'INA':
                return 'Inactiva';
            default:
                return status;
        }
    }

    getRoleLabel(role: string) {
        switch (role) {
            case 'ADMIN':
                return 'Administrador';
            case 'EMPLOYEE':
                return 'Empleado';
            default:
                return role || 'Empleado';
        }
    }

    editCompany(company: Company) {
        this.selectedCompany = {
            ...company,
            contacts: company.contacts ? [...company.contacts] : []
        };
        this.companyDialog = true;
    }

    hideDialog() {
        this.companyDialog = false;
        this.submitted = false;
        this.selectedCompany = null;
    }

    saveCompany() {
        this.submitted = true;

        if (!this.selectedCompany) {
            return;
        }

        const name = this.selectedCompany.name?.trim();
        const description = this.selectedCompany.description?.trim();
        const status = this.selectedCompany.status;

        if (!name || !description || !status) {
            return;
        }

        this.companiesService.updateCompany(this.selectedCompany._id, { name, description, status }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Empresa actualizada correctamente',
                    life: 3000
                });
                this.hideDialog();
                this.reloadCurrentPage();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo actualizar la empresa',
                    life: 3000
                });
            }
        });
    }

    confirmDeleteCompany(company: Company) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la empresa ${company.name}?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: 'Sí', icon: 'pi pi-check' },
            rejectButtonProps: { label: 'No', icon: 'pi pi-times', class: 'p-button-text' },
            accept: () => {
                this.companiesService.deleteCompany(company._id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Empresa eliminada correctamente',
                            life: 3000
                        });
                        this.reloadCurrentPage();
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo eliminar la empresa',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    openAssignContactDialog(company: Company) {
        this.selectedCompanyForContact = company;
        this.assignContactDialog = true;
        const initialEvent: TableLazyLoadEvent = { first: 0, rows: this.availableContactsRows };
        this.loadAvailableContacts(initialEvent);
    }

    loadAvailableContacts(event: TableLazyLoadEvent) {
        const first = event.first ?? 0;
        const rows = event.rows && event.rows > 0 ? event.rows : this.availableContactsRows;
        const page = Math.floor(first / rows) + 1;
        const limit = rows;

        this.availableContactsRows = rows;
        this.availableContactsLoading = true;

        this.companiesService.getNotAssignedUsers(page, limit).subscribe({
            next: (response) => {
                this.availableContacts.set(response.data);
                this.availableContactsTotal = response.total;
                this.availableContactsLoading = false;
            },
            error: () => {
                this.availableContacts.set([]);
                this.availableContactsTotal = 0;
                this.availableContactsLoading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los contactos disponibles',
                    life: 3000
                });
            }
        });
    }

    assignContact(user: NotAssignedUser) {
        if (!this.selectedCompanyForContact) {
            return;
        }

        const personId = user.personalData?._id;

        if (!personId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'El contacto seleccionado no tiene información personal válida',
                life: 3000
            });
            return;
        }

        this.assigningContactId = user._id;

        this.companiesService.addUserToCompany(this.selectedCompanyForContact._id, personId).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Contacto asignado correctamente',
                    life: 3000
                });
                this.assigningContactId = null;
                this.assignContactDialog = false;
                this.resetAssignContactDialogState();
                this.reloadCurrentPage();
            },
            error: () => {
                this.assigningContactId = null;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo asignar el contacto',
                    life: 3000
                });
            }
        });
    }

    closeAssignContactDialog() {
        this.assignContactDialog = false;
    }

    onAssignContactDialogHide() {
        this.resetAssignContactDialogState();
    }

    private reloadCurrentPage() {
        const fallbackEvent: TableLazyLoadEvent = { first: 0, rows: 10 };
        this.loadCompaniesLazy(this.lastLazyEvent ?? fallbackEvent);
    }

    private resetAssignContactDialogState() {
        this.selectedCompanyForContact = null;
        this.availableContacts.set([]);
        this.availableContactsTotal = 0;
        this.availableContactsLoading = false;
        this.availableContactsRows = 10;
        this.assigningContactId = null;
    }

    removeContact(idContact: string) {
        if (!this.selectedCompany) {
            return;
        }

        if (!idContact) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'El contacto seleccionado no tiene información personal válida',
                life: 3000
            });
            return;
        }

        this.companiesService.removeUserFromCompany(this.selectedCompany._id, idContact).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Contacto removido correctamente',
                    life: 3000
                });
                this.reloadCurrentPage();
                this.hideDialog();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo remover el contacto',
                    life: 3000
                });
            }
        });
    }
}
