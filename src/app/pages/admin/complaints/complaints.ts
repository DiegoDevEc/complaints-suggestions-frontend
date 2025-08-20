import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { InputNumberModule } from "primeng/inputnumber";
import { ButtonModule } from "primeng/button";
import { Table, TableModule } from "primeng/table";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { RatingModule } from "primeng/rating";
import { TagModule } from "primeng/tag";
import { Product, ProductService } from '@/pages/service/product.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ComplaintsService, Feedback } from '@/pages/service/complaints.service';

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
        SelectModule,
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

    statuses!: any[];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private productService: ProductService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private complaintsService: ComplaintsService
    ) { }

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

    getSeverity(status: string) {
        switch (status) {
            case 'PENDING':
                return 'warn';
            case 'RESOLVED':
                return 'success';
            case 'IN_PROGRESS':
                return 'warn';
            case 'CANCEL':
                return 'danger';
            default:
                return 'info';
        }
    }

    saveFeedback() {
        this.submitted = true;
        let _products = this.complaints();
        /*if (this.product.name?.trim()) {
            if (this.product.id) {
                _products[this.findIndexById(this.product.id)] = this.product;
                this.products.set([..._products]);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Product Updated',
                    life: 3000
                });
            } else {
                this.product.id = this.createId();
                this.product.image = 'product-placeholder.svg';
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Product Created',
                    life: 3000
                });
                this.products.set([..._products, this.product]);
            }


            this.product = {};
        }*/
        this.complaintsDialog = false;
    }
}
