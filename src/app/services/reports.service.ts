import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type FeedbackType = 'COMPLAINT' | 'SUGGESTION' | 'CONGRATULATION';
export type FeedbackStatus = 'OPEN' | 'IN_PROGRESS' | 'RETURNED' | 'CLOSED';

export interface ReportFilters {
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    type?: FeedbackType | null;
    status?: FeedbackStatus | null;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
    private readonly baseUrl = `${environment.backendUrl}/api/private/reports`;

    constructor(private readonly http: HttpClient) {}

    downloadFeedbacksReport(filters: ReportFilters): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/feedbacks/excel`, {
            params: this.buildParams(filters),
            responseType: 'blob'
        });
    }

    downloadFeedbacksByCompanyReport(filters: ReportFilters): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/feedbacks-by-company/excel`, {
            params: this.buildParams(filters),
            responseType: 'blob'
        });
    }

    private buildParams(filters: ReportFilters): HttpParams {
        let params = new HttpParams();

        if (!filters) {
            return params;
        }

        const { startDate, endDate, type, status } = filters;

        if (startDate) {
            params = params.set('startDate', this.normalizeDateValue(startDate));
        }

        if (endDate) {
            params = params.set('endDate', this.normalizeDateValue(endDate));
        }

        if (type) {
            params = params.set('type', type);
        }

        if (status) {
            params = params.set('status', status);
        }

        return params;
    }

    private normalizeDateValue(value: string | Date): string {
        if (value instanceof Date) {
            return value.toISOString();
        }

        return value;
    }
}
