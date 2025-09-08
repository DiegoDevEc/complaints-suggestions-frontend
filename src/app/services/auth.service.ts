import { LoginResponse } from '@/pages/auth/interfaces/login-response';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private cookies = inject(CookieService);
    private router = inject(Router);

    backendUrl = environment.backendUrl;

    login(credentials: { email: string; password: string; remember: boolean }): Observable<boolean> {
        const { email, password, remember } = credentials;
        if (!email || !password) throw new Error('Email and password are required.');

        const loginUrl = `${this.backendUrl}/auth/login`;

        return this.http.post<LoginResponse>(loginUrl, { email, password }).pipe(
            tap((res) => {
                const secure = window.location.protocol === 'https:';
                if (remember) {
                    const expires = new Date();
                    expires.setDate(expires.getDate() + 7);
                    this.cookies.set('access_token', res.access_token, expires, '/', undefined, secure, 'Lax');
                } else {
                    this.cookies.set('access_token', res.access_token, undefined, '/', undefined, secure, 'Lax');
                }
            }),
            map(() => true)
        );
    }

    getToken(): string | null {
        const token = this.cookies.get('access_token');
        return token ? token : null;
    }

    logout(): void {
        this.cookies.delete('access_token', '/');
        this.router.navigateByUrl('/login');
    }

    isAuthenticated(): boolean {
        return this.cookies.check('access_token');
    }
}
