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
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ComplaintsService, Feedback, FeedbackStatus } from '@/pages/service/complaints.service';

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
        DropdownModule,
        RadioButtonModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule
    ],
    templateUrl: './complaints.html',
    styleUrl: './complaints.scss',
    providers: [MessageService, ProductService, ConfirmationService, ComplaintsService]
})
export class Complaints implements OnInit {
    complaintsDialog: boolean = false;

    products = signal<Product[]>([]);
    complaints = signal<Feedback[]>([]);

    feedback!: Feedback;

    selectedProducts!: Product[] | null;

    submitted: boolean = false;

    statuses: { label: string; value: FeedbackStatus }[] = [
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'RESOLVED', label: 'Resuelto' },
        { value: 'IN_PROGRESS', label: 'En progreso' }
    ];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private productService: ProductService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private complaintsService: ComplaintsService
    ) {}

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.complaintsService.getComplaints().subscribe((response) => {
            console.log('Complaints loaded:', response.data);
            this.complaints.set(response.data);
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
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
        console.log('Cancel feedback:', feedback);

        this.confirmationService.confirm({
            message: 'Esta seguro de cancelar la queja:  ' + feedback.description + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.complaintsService.cancelFeedback(feedback._id).subscribe(() => {
                    this.loadData();
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
            default:
                return 'info';
        }
    }

    saveFeedback() {
        this.submitted = true;
        const updated = this.complaints().map((c) => (c._id === this.feedback._id ? { ...c, status: this.feedback.status } : c));
        this.complaints.set(updated);
        this.complaintsDialog = false;
    }
}
