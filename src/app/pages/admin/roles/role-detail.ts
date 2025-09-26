import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { RolesService, Role } from '@/pages/service/roles.service';

@Component({
    selector: 'app-role-detail',
    standalone: true,
    templateUrl: './role-detail.html',
    styleUrl: './role-detail.scss',
    imports: [CommonModule, ButtonModule, CardModule, TagModule, MessageModule]
})
export class RoleDetailComponent implements OnInit {
    readonly role = signal<Role | null>(null);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);

    readonly statusLabel = computed(() => ({
        ACT: 'Activo',
        INA: 'Inactivo',
        BLO: 'Bloqueado'
    }));

    readonly statusSeverity = computed(() => ({
        ACT: 'success',
        INA: 'warning',
        BLO: 'danger'
    }));

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly rolesService: RolesService
    ) {}

    ngOnInit(): void {
        const roleId = this.route.snapshot.paramMap.get('id');
        if (!roleId) {
            this.error.set('No se encontró el identificador del rol.');
            this.loading.set(false);
            return;
        }

        this.rolesService.findOne(roleId).subscribe({
            next: (role) => {
                this.role.set(role);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('No se pudo cargar la información del rol.');
                this.loading.set(false);
            }
        });
    }

    getStatusLabel(status?: string): string {
        const map = this.statusLabel();
        return map[status as keyof typeof map] ?? status ?? 'Desconocido';
    }

    getStatusSeverity(status?: string): string {
        const map = this.statusSeverity();
        return map[status as keyof typeof map] ?? 'info';
    }

    goBack(): void {
        this.router.navigate(['/complaints/roles']);
    }
}
