import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export type CompanyStatus = 'ACT' | 'INA' | string;

export interface CompanyContactUser {
    _id: string;
    username: string;
    email: string;
    password: string;
    role: string;
    isFirstLogin: boolean;
    __v: number;
    personalData: string;
}

export interface CompanyContact {
    _id: string;
    name: string;
    lastname: string;
    dni: string;
    phone: string;
    user: CompanyContactUser;
    __v: number;
}

export interface Company {
    _id: string;
    name: string;
    description: string;
    status: CompanyStatus;
    __v: number;
    contacts: CompanyContact[];
}

export interface CompanyListResponse {
    data: Company[];
    total: number;
    page: number;
    limit: number;
}

export interface NotAssignedUserPersonalData {
    _id: string;
    name: string;
    lastname: string;
    dni: string;
    phone: string;
}

export interface NotAssignedUser {
    _id: string;
    username: string;
    email: string;
    personalData?: NotAssignedUserPersonalData | null;
}

export interface NotAssignedUsersResponse {
    data: NotAssignedUser[];
    total: number;
    page: number;
    limit: number;
}

export interface UpdateCompanyPayload {
    name: string;
    description: string;
    status: CompanyStatus;
}

@Injectable()
export class CompaniesService {
    private readonly apiUrl = environment.backendUrl;
    private readonly companiesEndpoint = `${this.apiUrl}/private/companies`;
    private readonly notAssignedUsersEndpoint = `${this.apiUrl}/auth/users/not-assigned`;

    constructor(private http: HttpClient) { }

    getCompanies(page: number = 1, limit: number = 10, search?: string) {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (search && search.trim().length > 0) {
            params = params.set('search', search.trim());
        }
        return this.http.get<CompanyListResponse>(this.companiesEndpoint, { params });
    }

    updateCompany(companyId: string, payload: UpdateCompanyPayload) {
        return this.http.patch(`${this.companiesEndpoint}/${companyId}`, payload);
    }

    deleteCompany(companyId: string) {
        return this.http.delete(`${this.companiesEndpoint}/${companyId}`);
    }

    addUserToCompany(companyId: string, personId: string) {
        return this.http.post(`${this.companiesEndpoint}/${companyId}/contacts`, { personId });
    }

    removeUserFromCompany(companyId: string, personId: string) {
        return this.http.patch(`${this.companiesEndpoint}/${companyId}/contacts`, { personId });
    }

    getNotAssignedUsers(page: number = 1, limit: number = 10) {
        const params = new HttpParams().set('page', page).set('limit', limit);
        return this.http.get<NotAssignedUsersResponse>(this.notAssignedUsersEndpoint, { params });
    }
}
