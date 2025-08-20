import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export type FeedbackStatus = 'PENDING' | 'CANCEL';
export type FeedbackType = 'complaint' | 'compliment' | 'suggestion';

export interface Feedback {
  _id: string;
  status: FeedbackStatus;
  lastName: string;
  firstName: string;
  email: string;
  description: string;
  phone: string;
  type: FeedbackType;
  contacted: boolean;
  latitude: number;
  longitude: number;
  dateRegister: string; // ISO 8601 string
  __v: number;
}

export interface FeedbackListResponse {
  data: Feedback[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ComplaintsService {

    private readonly apiUrl = environment.backendUrl

    constructor(private http: HttpClient) {}

    getComplaints() {
        return this.http.get<FeedbackListResponse>(`${this.apiUrl}/private/feedback?page=1&limit=10`);
    }

    cancelFeedback(feedbackId: string) {
        console.log('Cancelling feedback with ID:', feedbackId);
        return this.http.delete(`${this.apiUrl}/private/feedback/${feedbackId}`);
    }

}
