import { style } from '@angular/animations';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { AppFloatingConfigurator } from "@/layout/component/app.floatingconfigurator";

@Component({
    selector: 'topbar-widget',
    standalone: true,
    imports: [RouterModule, ButtonModule, RippleModule, AppFloatingConfigurator],
    template: `
    <nav class="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 bg-surface-0 dark:bg-surface-900 shadow-md">
      <!-- Logo -->
      <a class="flex items-center gap-2" routerLink="/">
        <img src="images/logo-distrito-quito.png" alt="Logo" class="h-8 sm:h-20 w-auto">
      </a>

      <!-- Menú siempre visible -->
      <div class="flex items-center gap-4">
        <button
          class="pi-text-blue"
          pButton
          pRipple
          label="Iniciar Sesión"
          routerLink="/auth/login"
          [rounded]="true"
          [text]="true">
        </button>
        <button
          class="pi-text-blue"
          pButton
          pRipple
          label="Seguimiento"
          routerLink="/view-complaint"
          [rounded]="true"
          [text]="true">
        </button>

        <app-floating-configurator [float]="false" />
      </div>
    </nav>
  `
})
export class TopbarWidget {
    constructor(public router: Router) { }
}
