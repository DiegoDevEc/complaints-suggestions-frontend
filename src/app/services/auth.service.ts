import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
    login(email: string, password: string): boolean {
        const token = 'mock-token';
        localStorage.setItem('token', token);
        return true;
    }

    logout(): void {
        localStorage.removeItem('token');
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    }
}
