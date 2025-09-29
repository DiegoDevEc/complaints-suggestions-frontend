import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@/services/auth.service';

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
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    private readonly authService = inject(AuthService);

    ngOnInit(): void {
        const baseMenu: MenuItem[] = [
            {
                label: 'Inicio',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
                    { label: 'Mapa de Calor', icon: 'pi pi-fw pi-map', routerLink: ['/heat-map'] }
                ]
            },
            {
                label: 'Administración',
                items: [
                    { label: 'Quejas', icon: 'pi pi-exclamation-triangle', routerLink: ['/complaints/complaints'] },
                    { label: 'Sugerencias', icon: 'pi pi-lightbulb', routerLink: ['/complaints/suggestions'] },
                    { label: 'Felicitaciones', icon: 'pi pi-heart', routerLink: ['/complaints/congratulations'] }
                ]
            },
            {
                label: 'Configuración',
                data: { roles: ['ADMIN'] },
                items: [
                    {
                        label: 'Usuarios',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/complaints/users'],
                        data: { roles: ['ADMIN'] }
                    },
                    {
                        label: 'Roles',
                        icon: 'pi pi-id-card',
                        routerLink: ['/complaints/roles'],
                        data: { roles: ['ADMIN'] }
                    },
                    {
                        label: 'Permisos',
                        icon: 'pi pi-shield',
                        routerLink: ['/complaints/permissions'],
                        data: { roles: ['ADMIN'] }
                    },
                    {
                        label: 'Empresas',
                        icon: 'pi pi-fw pi-briefcase',
                        routerLink: ['/complaints/companies'],
                        data: { roles: ['ADMIN'] }
                    }
                ]
            },
            {
                label: 'Reportes',
                items: [
                    { label: 'Descargas', icon: 'pi pi-download', routerLink: ['/complaints/reports'] }
                ]
            }
        ];

        this.model = this.applyRoleVisibility(baseMenu);
    }

    private applyRoleVisibility(menu: MenuItem[]): MenuItem[] {
        return menu
            .map(item => {
                const itemCopy: MenuItem = { ...item };

                const requiredRoles = this.extractRoles(itemCopy);
                if (requiredRoles.length > 0 && !this.authService.hasRole(requiredRoles)) {
                    itemCopy.visible = false;
                }

                if (itemCopy.items) {
                    itemCopy.items = this.applyRoleVisibility(itemCopy.items);
                    if ((itemCopy.items?.length ?? 0) === 0 && !itemCopy.routerLink) {
                        itemCopy.visible = false;
                    }
                }

                return itemCopy;
            })
            .filter(item => item.visible !== false);
    }

    private extractRoles(item: MenuItem): string[] {
        const metadata = item['data'] as { roles?: string[] } | undefined;

        if (!metadata?.roles) {
            return [];
        }

        return metadata.roles.filter((role): role is string => typeof role === 'string');
    }
}
