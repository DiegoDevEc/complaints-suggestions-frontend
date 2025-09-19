import { MessageService } from 'primeng/api';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '@/services/auth.service';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ToastModule],
    providers: [MessageService],
    template: `
        <app-floating-configurator />
        <p-toast></p-toast>
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, #244086 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <img src="images/logo-distrito-quito.png" alt="Logo" class="block mx-auto h-20 sm:h-28 w-auto mb-6"/>
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Bienvenido!</div>
                            <span class="text-muted-color font-medium">Inicia sesión para continuar</span>
                        </div>

                        <div>
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Correo electrónico</label>
                            <input pInputText id="email1" type="text" placeholder="Correo electrónico" class="w-full md:w-120 mb-8" [(ngModel)]="email" />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Clave</label>
                            <p-password id="password1" [(ngModel)]="password" placeholder="Password" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                             <button pButton  (click)="login()" label="Ingresar" icon="pi pi-send"
                                class="p-button-rounded pi-button-blue w-full"></button>
                            <br><br>
                            <button severity="danger" pButton pRipple label="Cancelar" routerLink="/"  [rounded]="true"  [text]="true" class="w-full">
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    email: string = '';

    password: string = '';

    checked: boolean = false;

    constructor(private auth: AuthService, private router: Router, private messageService: MessageService) { }

    login() {

        if (!this.email || !this.password) {
            this.messageService.add({severity:'error', summary: 'Advertencia', detail: 'El correo y la clave son obligatorios.'});
            console.error('Email and password are required');
            return;
        }


        this.auth.login(this.email, this.password).subscribe({
            next: () => this.router.navigateByUrl('/dashboard'),
            error: (err) => console.error('Login error:', err)
        });
    }
}
