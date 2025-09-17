import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface PersonalData {
    name?: string;
    lastname?: string;
    dni?: string;
    phone?: string;
}

export interface User {
    _id: string;
    username: string;
    email: string;
    role: 'ADMIN' | 'EMPLOYEE' | string;
    isFirstLogin?: boolean;
    personalData?: PersonalData | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateUserPayload {
    username: string;
    email: string;
    password: string;
    name?: string;
    lastname?: string;
    dni?: string;
    phone?: string;
}

export interface UpdateUserPayload {
    username?: string;
    email?: string;
    role?: string;
    isFirstLogin?: boolean;
    personalData?: PersonalData | null;
}

@Injectable()
export class UsersService {
    private readonly apiUrl = environment.backendUrl;
    private readonly usersEndpoint = `${this.apiUrl}/private/users`;
    private readonly registerEndpoint = `${this.apiUrl}/auth/register`;

    constructor(private readonly http: HttpClient) {}

    getUsers(page: number = 1, limit: number = 10, search?: string) {
        let params = new HttpParams().set('page', page).set('limit', limit);

        if (search && search.trim().length > 0) {
            params = params.set('search', search.trim());
        }

        return this.http.get<PaginatedResponse<User>>(this.usersEndpoint, { params });
    }

    createUser(payload: CreateUserPayload) {
        return this.http.post<User>(this.registerEndpoint, payload);
    }

    updateUser(userId: string, payload: UpdateUserPayload) {
        return this.http.patch<User>(`${this.usersEndpoint}/${userId}`, payload);
    }

    deleteUser(userId: string) {
        return this.http.delete<void>(`${this.usersEndpoint}/${userId}`);
    }
}
