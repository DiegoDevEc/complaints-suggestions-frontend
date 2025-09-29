import { LoginResponse } from '@/pages/auth/interfaces/login-response';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

interface JwtPayload {
    role?: string;
    roles?: string[];
    [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

    private http = inject(HttpClient);

    backendUrl = environment.backendUrl;

    login(email: string, password: string): Observable<boolean> {

        if (!email || !password) throw new Error('Email and password are required.');

        let loginUrl = `${this.backendUrl}/auth/login`;

        console.log(`Attempting to login with URL: ${loginUrl} and credentials: ${email}, ${password}`);


        return this.http.post<LoginResponse>(loginUrl, { email, password }).pipe(
            tap(res => localStorage.setItem('token', res.access_token)),
            map(() => true)
        );
    }

    logout(): void {
        localStorage.removeItem('token');
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    getUserRoles(): string[] {
        const payload = this.getTokenPayload();

        if (!payload) {
            return [];
        }

        if (typeof payload.role === 'string') {
            return [payload.role];
        }

        if (Array.isArray(payload.roles)) {
            return payload.roles.filter((role): role is string => typeof role === 'string');
        }

        return [];
    }

    hasRole(requiredRoles: string | string[]): boolean {
        const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        const userRoles = this.getUserRoles();

        if (rolesToCheck.length === 0) {
            return true;
        }

        return rolesToCheck.some(role => userRoles.includes(role));
    }

    private getTokenPayload(): JwtPayload | null {
        const token = this.getToken();

        if (!token) {
            return null;
        }

        const [, payload] = token.split('.');

        if (!payload) {
            return null;
        }

        try {
            const decoded = this.base64UrlDecode(payload);
            return JSON.parse(decoded) as JwtPayload;
        } catch (error) {
            console.error('Failed to parse token payload', error);
            return null;
        }
    }

    private base64UrlDecode(value: string): string {
        const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
        const paddedValue = normalizedValue.padEnd(normalizedValue.length + (4 - (normalizedValue.length % 4)) % 4, '=');
        return atob(paddedValue);
    }
}
