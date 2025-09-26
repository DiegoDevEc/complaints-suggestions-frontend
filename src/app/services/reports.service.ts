import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export type FeedbackReportType = 'COMPLAINT' | 'SUGGESTION' | 'CONGRATULATION';
export type FeedbackReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RETURNED' | 'CLOSED';

export interface ReportsFilters {
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    type?: FeedbackReportType | null;
    status?: FeedbackReportStatus | null;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
    private readonly baseUrl = `${environment.backendUrl}/api/private/reports`;

    constructor(private http: HttpClient) {}

    downloadFeedbacksReport(filters: ReportsFilters) {
        const params = this.buildParams(filters);
        return this.http.get(`${this.baseUrl}/feedbacks/excel`, {
            params,
            responseType: 'blob'
        });
    }

    downloadFeedbacksByCompanyReport(filters: ReportsFilters) {
        const params = this.buildParams(filters);
        return this.http.get(`${this.baseUrl}/feedbacks-by-company/excel`, {
            params,
            responseType: 'blob'
        });
    }

    private buildParams(filters: ReportsFilters): HttpParams {
        let params = new HttpParams();

        if (filters.startDate) {
            params = params.set('startDate', this.toIsoString(filters.startDate));
        }

        if (filters.endDate) {
            params = params.set('endDate', this.toIsoString(filters.endDate));
        }

        if (filters.type) {
            params = params.set('type', filters.type);
        }

        if (filters.status) {
            params = params.set('status', filters.status);
        }

        return params;
    }

    private toIsoString(value: Date | string): string {
        if (value instanceof Date) {
            return value.toISOString();
        }

        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? value : parsed.toISOString();
    }
}
