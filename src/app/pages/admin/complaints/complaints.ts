import { Select } from 'primeng/select';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { Product, ProductService } from '@/pages/service/product.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ComplaintsService, Feedback, FeedbackStatus } from '@/pages/service/complaints.service';
import { environment } from 'src/environments/environment';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ImagePreviewDialogComponent } from '@/shared/components/image-preview-dialog/image-preview-dialog.component';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-complaints',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        TextareaModule,
        RadioButtonModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        Select,
        DynamicDialogModule
    ],
    templateUrl: './complaints.html',
    styleUrl: './complaints.scss',
    providers: [MessageService, ProductService, ConfirmationService, ComplaintsService, DialogService]
})
export class Complaints implements OnInit {
    complaintsDialog: boolean = false;

    products = signal<Product[]>([]);
    complaints = signal<Feedback[]>([]);
    totalRecords = 0;

    feedback!: Feedback;

    selectedProducts!: Product[] | null;

    submitted: boolean = false;

    statuses: { label: string; value: FeedbackStatus }[] = [
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'RESOLVED', label: 'Resuelto' },
        { value: 'IN_PROGRESS', label: 'En progreso' },
        { value: 'CANCEL', label: 'Cancelado' }
    ];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private productService: ProductService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private complaintsService: ComplaintsService,
        private dialogService: DialogService
    ) { }

    ngOnInit() {
        this.loadComplaintsLazy({ first: 0, rows: 10 });
        // this.loadData();
    }

    loadComplaintsLazy(event: any) {
        const page = Math.floor(event.first / event.rows) + 1; // backend usa page base 1
        const limit = event.rows;

        this.complaintsService.getComplaints(page, limit).subscribe((response) => {
            this.complaints.set(response.data);
            this.totalRecords = response.total;
        });
    }

    // loadData() {
    //     this.complaintsService.getComplaints().subscribe((response) => {
    //        this.complaints.set(response.data);
    //     });
    // }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
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

    hideDialog() {
        this.complaintsDialog = false;
        this.submitted = false;
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
                return 'text-red-500'; // rojo
            case 'suggestion':
                return 'text-blue-500'; // azul
            case 'compliment':
                return 'text-green-500'; // verde
            default:
                return 'text-gray-500'; // gris
        }
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
