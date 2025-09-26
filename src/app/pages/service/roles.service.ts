import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface Role {
    _id?: string;
    id?: string;
    name: string;
    description?: string;
    status: 'ACT' | 'INA' | 'BLO' | string;
    permissions?: string[];
}

export interface RoleFilters {
    search?: string;
    status?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateRoleDto {
    name: string;
    description?: string;
    status?: Role['status'];
    permissions?: string[];
}

export interface UpdateRoleDto {
    name?: string;
    description?: string;
    status?: Role['status'];
    permissions?: string[];
}

@Injectable({ providedIn: 'root' })
export class RolesService {
    private readonly apiUrl = environment.backendUrl;
    private readonly rolesEndpoint = `${this.apiUrl}/private/roles`;

    constructor(private readonly http: HttpClient) {}

    findAll(page: number = 1, limit: number = 10, filters?: RoleFilters) {
        let params = new HttpParams().set('page', page).set('limit', limit);

        if (filters?.search) {
            params = params.set('search', filters.search.trim());
        }

        if (filters?.status && filters.status !== 'ALL') {
            params = params.set('status', filters.status);
        }

        return this.http.get<PaginatedResponse<Role>>(this.rolesEndpoint, { params });
    }

    findOne(id: string) {
        return this.http.get<Role>(`${this.rolesEndpoint}/${id}`);
    }

    create(dto: CreateRoleDto) {
        return this.http.post<Role>(this.rolesEndpoint, dto);
    }

    update(id: string, dto: UpdateRoleDto) {
        return this.http.patch<Role>(`${this.rolesEndpoint}/${id}`, dto);
    }

    remove(id: string) {
        return this.http.delete<void>(`${this.rolesEndpoint}/${id}`);
    }
}
