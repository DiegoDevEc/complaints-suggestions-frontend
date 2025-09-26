import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { FeedbackReportStatus, FeedbackReportType, ReportsFilters, ReportsService } from '@/services/reports.service';
import { Select } from 'primeng/select';

interface SelectOption<T> {
    label: string;
    value: T;
}

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, Select],
    templateUrl: './reports.component.html'
})
export class ReportsComponent {
    private readonly reportsService = inject(ReportsService);
    private readonly formBuilder = inject(FormBuilder);

    readonly typeOptions: SelectOption<FeedbackReportType>[] = [
         { label: 'Queja', value: 'complaint' },
        { label: 'Sugerencia', value: 'suggestion' },
        { label: 'Felicitación', value: 'compliment' }
    ];

    readonly statusOptions: SelectOption<FeedbackReportStatus>[] = [
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'RESOLVED', label: 'Resuelto' },
        { value: 'IN_PROGRESS', label: 'En progreso' },
        { value: 'RETURNED', label: 'Devuelto' },
        { value: 'FORWARDED', label: 'Derivado' },
        { value: 'CANCEL', label: 'Cancelado' }
    ];

    readonly filtersForm: FormGroup = this.formBuilder.group({
        startDate: [null],
        endDate: [null],
        type: [null],
        status: [null]
    });

    isDownloadingFeedbacks = false;
    isDownloadingByCompany = false;

    get isDateRangeInvalid(): boolean {
        const start = this.filtersForm.get('startDate')?.value;
        const end = this.filtersForm.get('endDate')?.value;

        if (!start || !end) {
            return false;
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate > endDate;
    }

    downloadFeedbacksReport(): void {
        if (this.isDateRangeInvalid) {
            return;
        }

        this.isDownloadingFeedbacks = true;
        const filters = this.getFilters();

        this.reportsService
            .downloadFeedbacksReport(filters)
            .pipe(finalize(() => (this.isDownloadingFeedbacks = false)))
            .subscribe({
                next: (blob) => this.saveFile(blob, 'reporte-feedbacks.xlsx'),
                error: (error) => console.error('Error al descargar el reporte de feedbacks', error)
            });
    }

    downloadFeedbacksByCompanyReport(): void {
        if (this.isDateRangeInvalid) {
            return;
        }

        this.isDownloadingByCompany = true;
        const filters = this.getFilters();

        this.reportsService
            .downloadFeedbacksByCompanyReport(filters)
            .pipe(finalize(() => (this.isDownloadingByCompany = false)))
            .subscribe({
                next: (blob) => this.saveFile(blob, 'reporte-feedbacks-por-empresa.xlsx'),
                error: (error) => console.error('Error al descargar el reporte por empresa', error)
            });
    }

    private getFilters(): ReportsFilters {
        const { startDate, endDate, type, status } = this.filtersForm.value;

        return {
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            type: type ?? null,
            status: status ?? null
        };
    }

    private saveFile(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
