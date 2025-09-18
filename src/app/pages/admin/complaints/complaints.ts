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
import { ComplaintsService, Feedback, FeedbackStatus } from '@/pages/service/complaints.service';
import { environment } from 'src/environments/environment';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ImagePreviewDialogComponent } from '@/shared/components/image-preview-dialog/image-preview-dialog.component';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { AvatarModule } from 'primeng/avatar';

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
    providers: [MessageService, ConfirmationService, ComplaintsService, DialogService]
})
export class Complaints implements OnInit {
    complaintsDialog: boolean = false;
    viewDialogVisible = false;

    complaints = signal<Feedback[]>([]);
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
        private dialogService: DialogService
    ) { }

    ngOnInit() {
        this.loadComplaintsLazy({ first: 0, rows: 10 });
        // this.loadData();
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
