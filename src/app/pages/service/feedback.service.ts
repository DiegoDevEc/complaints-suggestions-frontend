import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface FeedbackGeoDto {
  latitude: number;
  longitude: number;
  type?: 'complaint' | 'suggestion' | 'compliment';
  status?: 'PENDING' | 'RESOLVED' | 'IN_PROGRESS' | 'FORWARDED' | 'CANCEL' | 'RETURNED';
  caseNumber?: string;
  description?: string;
}

export interface FeedbackGeoFilters {
  type?: 'complaint' | 'suggestion' | 'compliment' | '' | null;
  status?: 'PENDING' | 'RESOLVED' | 'IN_PROGRESS' | 'FORWARDED' | 'CANCEL' | 'RETURNED' | '' | null;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly baseUrl = environment.backendUrl;

  constructor(private readonly http: HttpClient) {}

  getFeedbacksGeo(filters?: FeedbackGeoFilters): Observable<FeedbackGeoDto[]> {
    let params = new HttpParams();

    if (filters?.type) {
      params = params.set('type', filters.type);
    }

    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<FeedbackGeoDto[]>(`${this.baseUrl}/feedbacks/geo`, { params });
  }
}
