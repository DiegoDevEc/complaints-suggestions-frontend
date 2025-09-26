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
                    { label: 'Usuarios', icon: 'pi pi-fw pi-users', routerLink: ['/complaints/users'] },
                    { label: 'Roles', icon: 'pi pi-id-card', routerLink: ['/complaints/roles'] },
                    { label: 'Permisos', icon: 'pi pi-shield', routerLink: ['/complaints/permissions'] },
                    { label: 'Empresas', icon: 'pi pi-fw pi-briefcase', routerLink: ['/complaints/companies'] },
                    /*{ label: 'Input', icon: 'pi pi-fw pi-check-square', routerLink: ['/uikit/input'] },
                    { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/uikit/table'] },
                    { label: 'Menu', icon: 'pi pi-fw pi-bars', routerLink: ['/uikit/menu'] },
                       { label: 'Button', icon: 'pi pi-fw pi-mobile', class: 'rotated-icon', routerLink: ['/uikit/button'] },
                     { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/uikit/table'] },
                     { label: 'List', icon: 'pi pi-fw pi-list', routerLink: ['/uikit/list'] },
                     { label: 'Tree', icon: 'pi pi-fw pi-share-alt', routerLink: ['/uikit/tree'] },
                     { label: 'Panel', icon: 'pi pi-fw pi-tablet', routerLink: ['/uikit/panel'] },
                     { label: 'Overlay', icon: 'pi pi-fw pi-clone', routerLink: ['/uikit/overlay'] },
                     { label: 'Media', icon: 'pi pi-fw pi-image', routerLink: ['/uikit/media'] },
                     { label: 'Menu', icon: 'pi pi-fw pi-bars', routerLink: ['/uikit/menu'] },
                     { label: 'Message', icon: 'pi pi-fw pi-comment', routerLink: ['/uikit/message'] },
                     { label: 'File', icon: 'pi pi-fw pi-file', routerLink: ['/uikit/file'] },
                     { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/uikit/charts'] },
                     { label: 'Timeline', icon: 'pi pi-fw pi-calendar', routerLink: ['/uikit/timeline'] },
                     { label: 'Misc', icon: 'pi pi-fw pi-circle', routerLink: ['/uikit/misc'] }*/
                ]
            },
            /* {
                 label: 'Pages',
                 icon: 'pi pi-fw pi-briefcase',
                 routerLink: ['/pages'],
                 items: [
                     {
                         label: 'Crud',
                         icon: 'pi pi-fw pi-pencil',
                         routerLink: ['/pages/crud']
                     },
                     {
                         label: 'Not Found',
                         icon: 'pi pi-fw pi-exclamation-circle',
                         routerLink: ['/pages/notfound']
                     },
                     {
                         label: 'Empty',
                         icon: 'pi pi-fw pi-circle-off',
                         routerLink: ['/pages/empty']
                     }
                 ]
             },*/
        ];
    }
}
