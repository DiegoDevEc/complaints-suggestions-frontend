import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { finalize } from 'rxjs';
import { FeedbackStatus, FeedbackType, ReportFilters, ReportsService } from '@/services/reports.service';

interface FeedbackOption {
    value: FeedbackType;
    label: string;
}

interface StatusOption {
    value: FeedbackStatus;
    label: string;
}

type ReportsForm = FormGroup<{
    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;
    type: FormControl<FeedbackType | null>;
    status: FormControl<FeedbackStatus | null>;
}>;

@Component({
    selector: 'app-reports',
    standalone: true,
    templateUrl: './reports.component.html',
    styleUrl: './reports.component.scss',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
        MatButtonModule
    ]
})
export class ReportsComponent {
    private readonly fb = inject(FormBuilder);
    private readonly reportsService = inject(ReportsService);

    readonly filtersForm: ReportsForm = this.fb.group({
        startDate: this.fb.control<Date | null>(null),
        endDate: this.fb.control<Date | null>(null),
        type: this.fb.control<FeedbackType | null>(null),
        status: this.fb.control<FeedbackStatus | null>(null)
    });

    readonly feedbackTypes: FeedbackOption[] = [
        { value: 'COMPLAINT', label: 'Queja' },
        { value: 'SUGGESTION', label: 'Sugerencia' },
        { value: 'CONGRATULATION', label: 'Felicitación' }
    ];

    readonly feedbackStatuses: StatusOption[] = [
        { value: 'OPEN', label: 'Abierto' },
        { value: 'IN_PROGRESS', label: 'En progreso' },
        { value: 'RETURNED', label: 'Devuelto' },
        { value: 'CLOSED', label: 'Cerrado' }
    ];

    isDownloadingGeneral = false;
    isDownloadingByCompany = false;
    errorMessage: string | null = null;

    downloadFeedbacksReport(): void {
        const filters = this.extractFilters();
        this.errorMessage = null;
        this.isDownloadingGeneral = true;

        this.reportsService
            .downloadFeedbacksReport(filters)
            .pipe(finalize(() => (this.isDownloadingGeneral = false)))
            .subscribe({
                next: (blob) => this.saveBlob(blob, 'reporte-feedbacks.xlsx'),
                error: (error) => {
                    console.error('No se pudo descargar el reporte general de feedbacks', error);
                    this.errorMessage = 'Ocurrió un error al descargar el listado general. Intente nuevamente.';
                }
            });
    }

    downloadFeedbacksByCompanyReport(): void {
        const filters = this.extractFilters();
        this.errorMessage = null;
        this.isDownloadingByCompany = true;

        this.reportsService
            .downloadFeedbacksByCompanyReport(filters)
            .pipe(finalize(() => (this.isDownloadingByCompany = false)))
            .subscribe({
                next: (blob) => this.saveBlob(blob, 'reporte-feedbacks-por-empresa.xlsx'),
                error: (error) => {
                    console.error('No se pudo descargar el reporte por empresa', error);
                    this.errorMessage = 'Ocurrió un error al descargar el reporte por empresa. Intente nuevamente.';
                }
            });
    }

    private extractFilters(): ReportFilters {
        const { startDate, endDate, type, status } = this.filtersForm.getRawValue();

        const filters: ReportFilters = {};

        if (startDate) {
            filters.startDate = startDate;
        }

        if (endDate) {
            filters.endDate = endDate;
        }

        if (type) {
            filters.type = type;
        }

        if (status) {
            filters.status = status;
        }

        return filters;
    }

    private saveBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    }
}
