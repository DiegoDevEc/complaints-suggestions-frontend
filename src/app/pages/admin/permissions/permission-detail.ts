import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { PermissionsService, Permission } from '@/pages/service/permissions.service';

@Component({
    selector: 'app-permission-detail',
    standalone: true,
    templateUrl: './permission-detail.html',
    styleUrl: './permission-detail.scss',
    imports: [CommonModule, ButtonModule, CardModule, TagModule, MessageModule]
})
export class PermissionDetailComponent implements OnInit {
    readonly permission = signal<Permission | null>(null);
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
        private readonly permissionsService: PermissionsService
    ) {}

    ngOnInit(): void {
        const permissionId = this.route.snapshot.paramMap.get('id');
        if (!permissionId) {
            this.error.set('No se encontró el identificador del permiso.');
            this.loading.set(false);
            return;
        }

        this.permissionsService.findOne(permissionId).subscribe({
            next: (permission) => {
                this.permission.set(permission);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('No se pudo cargar la información del permiso.');
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
        this.router.navigate(['/complaints/permissions']);
    }
}
