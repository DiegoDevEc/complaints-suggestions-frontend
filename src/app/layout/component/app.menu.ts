import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li class="pi-text-blue" app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Inicio',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
                { label: 'Mapa de Calor', icon: 'pi pi-fw pi-map', routerLink: ['/heat-map'] }]
            },
            {
                label: 'Administración',
                items: [
                    { label: 'Quejas', icon: 'pi pi-exclamation-triangle', routerLink: ['/complaints/complaints'] },
                    { label: 'Sugerencias', icon: 'pi pi-lightbulb', routerLink: ['/complaints/suggestions'] },
                    { label: 'Felicitaciones', icon: 'pi pi-heart', routerLink: ['/complaints/congratulations'] },
                ]
            },
            {
                label: 'Configuración',
                items: [
                    { label: 'Usuarios', icon: 'pi pi-fw pi-users', routerLink: ['/complaints/users'] },
                    { label: 'Roles', icon: 'pi pi-id-card', routerLink: ['/complaints/roles'] },
                    { label: 'Permisos', icon: 'pi pi-shield', routerLink: ['/complaints/permissions'] },
                    { label: 'Empresas', icon: 'pi pi-fw pi-briefcase', routerLink: ['/complaints/companies'] },
                ]
            },
            {
                label: 'Reportes',
                items: [

                ]
            },

        ];
    }
}
