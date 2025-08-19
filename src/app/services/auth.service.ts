import { LoginResponse } from '@/pages/auth/interfaces/login-response';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

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
        return !!localStorage.getItem('token');
    }
}
