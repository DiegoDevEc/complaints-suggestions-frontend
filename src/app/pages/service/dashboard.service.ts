import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DashboardSummaryResponseDto } from '../dashboard/models/dashboard-summary-response.dto';

export interface FeedbackGeoDto {
  latitude: number;
  longitude: number;
  type?: 'complaint' | 'suggestion' | 'compliment';
  status?: 'PENDING' | 'RESOLVED' | 'IN_PROGRESS' | 'FORWARDED' | 'CANCEL';
  caseNumber?: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly baseUrl = environment.backendUrl;

    constructor(private readonly http: HttpClient) { }

    getDashboardSummary(): Observable<DashboardSummaryResponseDto> {
        return this.http.get<DashboardSummaryResponseDto>(`${this.baseUrl}/private/dashboard`);
    }

    getAllFeedbacks(): Observable<FeedbackGeoDto[]> {
        return this.http.get<FeedbackGeoDto[]>(`${this.baseUrl}/private/dashboard/feedbacks/geo`);
    }
}
