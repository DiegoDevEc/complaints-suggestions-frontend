import { Select } from 'primeng/select';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ComplaintsService, Feedback, FeedbackCompany, FeedbackStatus } from '@/pages/service/complaints.service';
import { environment } from 'src/environments/environment';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ImagePreviewDialogComponent } from '@/shared/components/image-preview-dialog/image-preview-dialog.component';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { AvatarModule } from 'primeng/avatar';
import { NotificationsService } from '@/pages/service/notification.service';
import { CompaniesService, Company } from '@/pages/service/companies.service';
import { finalize, switchMap, tap } from 'rxjs';

@Component({
    selector: 'app-complaints',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        InputTextModule,
        TextareaModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        PaginatorModule,
        AvatarModule,
        Select,
        DynamicDialogModule
    ],
    templateUrl: './complaints.html',
    styleUrl: './complaints.scss',
    providers: [MessageService, ConfirmationService, ComplaintsService, DialogService, CompaniesService]
})
export class Complaints implements OnInit {
    complaintsDialog: boolean = false;
    viewDialogVisible = false;

    complaints = signal<Feedback[]>([]);
    availableCompanies = signal<Company[]>([]);
    companyOptions = computed(() =>
        this.availableCompanies().map((company) => ({
            label: company.name,
            value: company._id,
            description: company.description,
            data: this.mapCompanyToFeedback(company)
        }))
    );
    totalRecords = 0;
    rowsPerPageOptions = [10, 20, 30];
    rows = 10;
    first = 0;

    searchTerm = signal('');
    filteredComplaints = computed(() => {
        const term = this.searchTerm().trim().toLowerCase();
        const list = this.complaints();

        if (!term) {
            return list;
        }

        return list.filter((feedback) => {
            const searchable = [
                feedback.firstName,
                feedback.lastName,
                feedback.email,
                feedback.phone,
                feedback.description,
                this.getTypeDescription(feedback.type),
                this.getDescriptionStatus(feedback.status)
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchable.includes(term);
        });
    });

    feedback!: Feedback;
    viewFeedback: Feedback | null = null;

    submitted: boolean = false;

    assignCompanyDialog = false;
    assigningFeedback: Feedback | null = null;
    selectedCompanyId: string | null = null;
    isLoadingCompanies = false;
    isAssigningCompany = false;
    isCreatingCompany = false;
    newCompanyName = '';
    newCompanyDescription = '';

    statuses: { label: string; value: FeedbackStatus }[] = [
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'RESOLVED', label: 'Resuelto' },
        { value: 'IN_PROGRESS', label: 'En progreso' },
        { value: 'RETURNED', label: 'Devuelto' },
        { value: 'FORWARDED', label: 'Derivado' },
        { value: 'CANCEL', label: 'Cancelado' }
    ];

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private complaintsService: ComplaintsService,
        private dialogService: DialogService,
        private socketService: NotificationsService,
        private companiesService: CompaniesService
    ) { }

    ngOnInit() {
        this.loadComplaintsLazy({ first: 0, rows: 10 });

        this.socketService.onFeedbackStatusUpdated().subscribe((update) => {
            const current = this.complaints();
            const index = current.findIndex(c => c._id === update._id);
            if (index !== -1) {
                const newList = [...current];
                newList[index] = { ...newList[index], status: update.status };
                this.complaints.set(newList);
            }
        });

    }

    loadComplaintsLazy(event: Partial<PaginatorState>) {
        const first = event.first ?? 0;
        const limit = event.rows ?? this.rows;
        const page = Math.floor(first / limit) + 1; // backend usa page base 1

        this.complaintsService.getComplaints(page, limit).subscribe((response) => {
            this.complaints.set(response.data);
            this.totalRecords = response.total;
            this.rows = limit;
            this.first = first;
        });
    }

    onPageChange(event: PaginatorState) {
        const first = event.first ?? 0;
        const rows = event.rows ?? this.rows;
        this.loadComplaintsLazy({ first, rows });
    }

    onSearch(event: Event) {
        const value = (event.target as HTMLInputElement).value ?? '';
        this.searchTerm.set(value);
    }

    trackById(_: number, feedback: Feedback) {
        return feedback._id;
    }

    getAttachmentUrl(feedback: Feedback): string | null {
        return feedback.attachment?.url ? `${environment.backendUrl}${feedback.attachment.url}` : null;
    }

    openImageDialog(feedback: Feedback) {
        const imageUrl = this.getAttachmentUrl(feedback);
        if (!imageUrl) {
            return;
        }
        this.dialogService.open(ImagePreviewDialogComponent, {
            data: {
                imageUrl,
                originalName: feedback.attachment?.originalName
            },
            header: feedback.attachment?.originalName,
            width: '60vw',
            modal: true,
            dismissableMask: true
        });
    }

    editComplaints(feedback: Feedback) {
        this.feedback = { ...feedback };
        this.complaintsDialog = true;
    }

    viewComplaints(feedback: Feedback) {
        this.viewFeedback = feedback;
        this.viewDialogVisible = true;
    }

    hideDialog() {
        this.complaintsDialog = false;
        this.submitted = false;
    }

    closeViewDialog() {
        this.viewDialogVisible = false;
        this.viewFeedback = null;
    }

    openAssignCompanyDialog(feedback: Feedback) {
        this.assigningFeedback = feedback;
        this.assignCompanyDialog = true;
        this.selectedCompanyId = feedback.company?.id ?? null;
        this.newCompanyName = '';
        this.newCompanyDescription = '';
        this.fetchCompanies();
    }

    closeAssignCompanyDialog() {
        this.assignCompanyDialog = false;
        this.assigningFeedback = null;
        this.selectedCompanyId = null;
        this.newCompanyName = '';
        this.newCompanyDescription = '';
    }

    assignSelectedCompany() {
        if (!this.assigningFeedback) {
            return;
        }

        const selected = this.getSelectedCompany();

        if (!selected) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Seleccione una empresa',
                detail: 'Debe elegir una empresa existente para asignarla.',
                life: 3000
            });
            return;
        }

        const feedbackId = this.assigningFeedback._id;

        this.isAssigningCompany = true;
        this.complaintsService
            .assignCompanyToFeedback(feedbackId, selected)
            .pipe(
                finalize(() => {
                    this.isAssigningCompany = false;
                })
            )
            .subscribe({
                next: () => {
                    this.applyCompanyToFeedback(feedbackId, selected);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Empresa asignada',
                        detail: 'Se asignó la empresa seleccionada correctamente.',
                        life: 3000
                    });
                    this.closeAssignCompanyDialog();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo asignar la empresa seleccionada.',
                        life: 3000
                    });
                }
            });
    }

    createAndAssignCompany() {
        if (!this.assigningFeedback) {
            return;
        }

        const name = this.newCompanyName.trim();
        const description = this.newCompanyDescription.trim();

        if (!name || !description) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Datos incompletos',
                detail: 'Complete el nombre y la descripción para crear la empresa.',
                life: 3000
            });
            return;
        }

        const feedbackId = this.assigningFeedback._id;

        this.isCreatingCompany = true;

        this.companiesService
            .createCompany({ name, description })
            .pipe(
                switchMap((company) => {
                    this.availableCompanies.update((companies) => {
                        const filtered = companies.filter((item) => item._id !== company._id);
                        return [company, ...filtered];
                    });

                    const mapped = this.mapCompanyToFeedback(company);

                    return this.complaintsService.assignCompanyToFeedback(feedbackId, mapped).pipe(
                        tap(() => this.applyCompanyToFeedback(feedbackId, mapped))
                    );
                }),
                finalize(() => {
                    this.isCreatingCompany = false;
                })
            )
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Empresa creada',
                        detail: 'Se creó y asignó la empresa correctamente.',
                        life: 3000
                    });
                    this.closeAssignCompanyDialog();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo crear y asignar la empresa.',
                        life: 3000
                    });
                }
            });
    }

    getSelectedCompany(): FeedbackCompany | null {
        const id = this.selectedCompanyId;
        if (!id) {
            return null;
        }

        const fromList = this.companyOptions().find((option) => option.value === id)?.data ?? null;

        if (fromList) {
            return fromList;
        }

        if (this.assigningFeedback?.company && this.assigningFeedback.company.id === id) {
            return this.assigningFeedback.company;
        }

        return null;
    }

    canCreateCompany(): boolean {
        return !!(
            this.assigningFeedback &&
            this.newCompanyName.trim().length > 0 &&
            this.newCompanyDescription.trim().length > 0
        );
    }

    private fetchCompanies() {
        this.isLoadingCompanies = true;
        this.companiesService
            .getCompanies(1, 100)
            .pipe(
                finalize(() => {
                    this.isLoadingCompanies = false;
                })
            )
            .subscribe({
                next: (response) => {
                    this.availableCompanies.set(response.data ?? []);
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudieron cargar las empresas disponibles.',
                        life: 3000
                    });
                }
            });
    }

    private applyCompanyToFeedback(feedbackId: string, company: FeedbackCompany | null) {
        const updated = this.complaints().map((feedback) =>
            feedback._id === feedbackId ? { ...feedback, company } : feedback
        );
        this.complaints.set(updated);

        if (this.viewFeedback && this.viewFeedback._id === feedbackId) {
            this.viewFeedback = { ...this.viewFeedback, company };
        }

        if (this.feedback && this.feedback._id === feedbackId) {
            this.feedback = { ...this.feedback, company } as Feedback;
        }
    }

    private mapCompanyToFeedback(company: Company): FeedbackCompany {
        return {
            id: company._id,
            name: company.name,
            description: company.description
        };
    }

    cancelFeedback(feedback: Feedback) {
        this.confirmationService.confirm({
            message: 'Esta seguro de cancelar la queja:  ' + feedback.description + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: 'Sí', icon: 'pi pi-check' },
            rejectButtonProps: { label: 'No', icon: 'pi pi-times', class: 'p-button-text' },
            accept: () => {
                this.complaintsService.cancelFeedback(feedback._id).subscribe(() => {
                    this.loadComplaintsLazy({ first: 0, rows: 10 });
                    this.feedback = {} as Feedback;
                });
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Cancelar queja',
                    life: 3000
                });
            }
        });
    }

    getSeverity(status: FeedbackStatus) {
        switch (status) {
            case 'PENDING':
                return 'warn';
            case 'RESOLVED':
                return 'success';
            case 'RETURNED':
                return 'warn';
            case 'FORWARDED':
                return 'info';
            case 'IN_PROGRESS':
                return 'info';
            case 'CANCEL':
                return 'danger';
            default:
                return 'info';
        }
    }

    getDescriptionStatus(status: FeedbackStatus) {
        switch (status) {
            case 'PENDING':
                return 'Pendiente';
            case 'RESOLVED':
                return 'Resuelto';
            case 'RETURNED':
                return 'Devuelto';
            case 'FORWARDED':
                return 'Derivado';
            case 'IN_PROGRESS':
                return 'En progreso';
            case 'CANCEL':
                return 'Cancelado';
            default:
                return 'Desconocido';
        }
    }

    getTypeDescription(type: string) {
        switch (type) {
            case 'complaint':
                return 'Queja';
            case 'compliment':
                return 'Felicitación';
            case 'suggestion':
                return 'Sugerencia';
            default:
                return 'Desconocido';
        }
    }

    getTypeClass(type: string): string {
        switch (type) {
            case 'complaint':
                return 'type-chip--complaint';
            case 'suggestion':
                return 'type-chip--suggestion';
            case 'compliment':
                return 'type-chip--compliment';
            default:
                return 'type-chip--unknown';
        }
    }

    getShortDescription(description: string | null | undefined, maxLength: number = 160) {
        const text = (description ?? '').trim();
        if (!text) {
            return 'Sin descripción proporcionada.';
        }

        if (text.length <= maxLength) {
            return text;
        }

        return `${text.slice(0, maxLength - 1).trim()}…`;
    }

    formatDate(dateValue: string | null | undefined) {
        if (!dateValue) {
            return 'Sin fecha disponible';
        }

        const parsed = new Date(dateValue);

        if (Number.isNaN(parsed.getTime())) {
            return dateValue;
        }

        return new Intl.DateTimeFormat('es-PE', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(parsed);
    }

    saveFeedback() {
        this.submitted = true;
        // const updated = this.complaints().map((c) => (c._id === this.feedback._id ? { ...c, status: this.feedback.status } : c));
        // this.complaints.set(updated);
        this.complaintsService.updateFeedback(this.feedback).subscribe(() => {

            this.loadComplaintsLazy({ first: 0, rows: 10 });
            this.messageService.add({
                severity: 'success',
                summary: 'Successful',
                detail: 'Queja actualizada',
                life: 3000
            });
        });
        this.submitted = false;
        this.feedback = {} as Feedback;

        this.complaintsDialog = false;
    }
}
