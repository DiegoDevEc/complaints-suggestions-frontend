import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface Permission {
    _id?: string;
    id?: string;
    name: string;
    description?: string;
    status: 'ACT' | 'INA' | 'BLO' | string;
}

export interface PermissionFilters {
    search?: string;
    status?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface CreatePermissionDto {
    name: string;
    description?: string;
    status?: Permission['status'];
}

export interface UpdatePermissionDto {
    name?: string;
    description?: string;
    status?: Permission['status'];
}

@Injectable({ providedIn: 'root' })
export class PermissionsService {
    private readonly apiUrl = environment.backendUrl;
    private readonly permissionsEndpoint = `${this.apiUrl}/private/permissions`;

    constructor(private readonly http: HttpClient) {}

    findAll(page: number = 1, limit: number = 10, filters?: PermissionFilters) {
        let params = new HttpParams().set('page', page).set('limit', limit);

        if (filters?.search) {
            params = params.set('search', filters.search.trim());
        }

        if (filters?.status && filters.status !== 'ALL') {
            params = params.set('status', filters.status);
        }

        return this.http.get<PaginatedResponse<Permission>>(this.permissionsEndpoint, { params });
    }

    findOne(id: string) {
        return this.http.get<Permission>(`${this.permissionsEndpoint}/${id}`);
    }

    create(dto: CreatePermissionDto) {
        return this.http.post<Permission>(this.permissionsEndpoint, dto);
    }

    update(id: string, dto: UpdatePermissionDto) {
        return this.http.patch<Permission>(`${this.permissionsEndpoint}/${id}`, dto);
    }

    remove(id: string) {
        return this.http.delete<void>(`${this.permissionsEndpoint}/${id}`);
    }
}
