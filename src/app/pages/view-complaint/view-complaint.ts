import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NotificationsService } from '../service/notification.service';

type KnownStatus = 'PENDING' | 'RESOLVED' | 'IN_PROGRESS' | 'CANCEL' | 'RETURNED' | 'FORWARDED';

interface StatusHistoryUser {
    name: string | null;
    lastname: string | null;
    email: string | null;
    phone: string | null;
}

interface StatusHistoryEntry {
    status: string | null;
    changedAt: string | null;
    changedBy: StatusHistoryUser | null;
    note: string | null;
}

interface ViewFeedback {
    caseNumber: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    description: string | null;
    address: string | null;
    dateRegister: string | null;
    status: string | null;
    attachmentUrl: string | null;
    statusHistory: StatusHistoryEntry[];
}

@Component({
    selector: 'app-view-complaint',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule],
    templateUrl: './view-complaint.html',
    styleUrl: './view-complaint.scss'
})
export class ViewComplaint {
    private readonly http = inject(HttpClient);
    private readonly fb = inject(FormBuilder);
    private readonly backendUrl = environment.backendUrl;

    readonly searchForm = this.fb.nonNullable.group({
        caseNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/), Validators.minLength(5)]]
    });

    readonly statusLabels: Record<KnownStatus, string> = {
        PENDING: 'Pendiente',
        RESOLVED: 'Resuelto',
        IN_PROGRESS: 'En progreso',
        CANCEL: 'Cancelado',
        RETURNED: 'Devuelto',
        FORWARDED: 'Derivado'
    };

    loading = false;
    notFound = false;
    errorMessage = '';
    feedback: ViewFeedback | null = null;

    constructor(private socketService: NotificationsService) {
        this.socketService.onFeedbackStatusUpdated().subscribe((update) => {

            if (this.feedback && this.feedback.caseNumber === update.caseNumber) {
                this.feedback = update;
            }

        });
    }

    async onSearch() {
        if (this.searchForm.invalid) {
            this.searchForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.notFound = false;
        this.errorMessage = '';
        this.feedback = null;
        const caseNumber = this.searchForm.controls.caseNumber.value.trim();

        try {
            const response = await firstValueFrom(
                this.http.post(`${this.backendUrl}/public/feedback/view-feedback`, {
                    caseNumber
                })
            );

            const feedback = this.mapFeedback(response, caseNumber);
            if (feedback) {
                this.feedback = feedback;
                return;
            }

            this.notFound = true;
        } catch (error) {
            if (error instanceof HttpErrorResponse && error.status === 404) {
                this.notFound = true;
                return;
            }

            this.errorMessage = 'No se pudo obtener la información del caso. Inténtalo nuevamente más tarde.';
        } finally {
            this.loading = false;
        }
    }

    getStatusClass(status: string | null): string {
        const normalized = (status ?? 'unknown').toLowerCase();
        return `status-${normalized.replace(/[\s_]+/g, '-')}`;
    }

    getStatusLabel(status: string | null): string {
        const normalized = (status ?? '').toUpperCase() as KnownStatus;
        return this.statusLabels[normalized] ?? status ?? 'Sin estado';
    }

    getFullName(feedback: ViewFeedback): string {
        const parts = [feedback.firstName, feedback.lastName].filter(Boolean);
        return parts.length ? parts.join(' ') : 'Nombre no disponible';
    }

    getInitials(feedback: ViewFeedback): string {
        const initials = [feedback.firstName, feedback.lastName]
            .map((part) => part?.trim().charAt(0) ?? '')
            .join('')
            .toUpperCase();

        return initials || 'FB';
    }

    formatDate(dateValue: string | null): string {
        if (!dateValue) {
            return 'Sin fecha disponible';
        }

        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) {
            return dateValue;
        }

        return new Intl.DateTimeFormat('es-PE', {
            dateStyle: 'long',
            timeStyle: 'short'
        }).format(parsed);
    }

    formatChangedBy(user: StatusHistoryUser | null): string {
        if (!user) {
            return 'Usuario no disponible';
        }

        const parts = [user.name, user.lastname].filter((value): value is string => !!value);
        if (parts.length) {
            return parts.join(' ');
        }

        if (user.email) {
            return user.email;
        }

        if (user.phone) {
            return user.phone;
        }

        return 'Usuario no disponible';
    }

    private mapFeedback(response: unknown, fallbackCaseNumber: string): ViewFeedback | null {
        if (!response || typeof response !== 'object') {
            return null;
        }

        const candidate = this.unwrapResponse(response);
        if (!candidate || typeof candidate !== 'object') {
            return null;
        }

        const firstName = this.toNullableString((candidate as any).firstName) ?? '';
        const lastName = this.toNullableString((candidate as any).lastName) ?? '';
        const caseNumber = this.toNullableString((candidate as any).caseNumber) ?? fallbackCaseNumber ?? '';

        const feedback: ViewFeedback = {
            caseNumber,
            firstName,
            lastName,
            email: this.toNullableString((candidate as any).email),
            phone: this.toNullableString((candidate as any).phone ?? (candidate as any).telephone ?? (candidate as any).mobile),
            description: this.toNullableString((candidate as any).description ?? (candidate as any).detail ?? (candidate as any).message),
            address: this.composeAddress((candidate as any).address ?? (candidate as any).addressLine ?? (candidate as any).location),
            dateRegister: this.toNullableString((candidate as any).dateRegister ?? (candidate as any).createdAt ?? (candidate as any).updatedAt) ?? null,
            status: this.toNullableString((candidate as any).status)?.toUpperCase() ?? null,
            attachmentUrl: this.resolveAttachmentUrl((candidate as any).attachment ?? (candidate as any).image ?? (candidate as any).attachmentUrl),
            statusHistory: this.mapStatusHistory((candidate as any).statusHistory ?? (candidate as any).status_history ?? (candidate as any).statusChanges ?? (candidate as any).statusTimeline ?? (candidate as any).history)
        };
        return feedback;
    }

    private unwrapResponse(response: any): any {
        if (!response || typeof response !== 'object') {
            return null;
        }

        if (response.data && typeof response.data === 'object') {
            return response.data;
        }

        if (response.feedback && typeof response.feedback === 'object') {
            return response.feedback;
        }

        return response;
    }

    private toNullableString(value: unknown): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed ? trimmed : null;
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        return null;
    }

    private composeAddress(raw: unknown): string | null {
        if (!raw) {
            return null;
        }

        if (typeof raw === 'string') {
            return raw.trim() || null;
        }

        if (Array.isArray(raw)) {
            const parts = raw.map((value) => this.toNullableString(value)).filter((value): value is string => !!value);
            return parts.length ? Array.from(new Set(parts)).join(', ') : null;
        }

        if (typeof raw === 'object') {
            const addressObj = raw as Record<string, unknown>;
            const preferredOrder = ['addressLine', 'streetA', 'streetB', 'district', 'city', 'state', 'province', 'country', 'postalCode', 'zipCode', 'reference'];

            const parts: string[] = [];
            for (const key of preferredOrder) {
                const value = this.toNullableString(addressObj[key]);
                if (value && !parts.includes(value)) {
                    parts.push(value);
                }
            }

            if (!parts.length) {
                const fallback = Object.values(addressObj)
                    .map((value) => this.toNullableString(value))
                    .filter((value): value is string => !!value);
                return fallback.length ? Array.from(new Set(fallback)).join(', ') : null;
            }

            return parts.join(', ');
        }

        return null;
    }

    private resolveAttachmentUrl(raw: unknown): string | null {
        if (!raw) {
            return null;
        }

        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            return trimmed ? this.ensureAbsoluteUrl(trimmed) : null;
        }

        if (typeof raw === 'object') {
            const candidateUrl = this.toNullableString((raw as any).url ?? (raw as any).path ?? (raw as any).secure_url ?? (raw as any).location);
            return candidateUrl ? this.ensureAbsoluteUrl(candidateUrl) : null;
        }

        return null;
    }

    private ensureAbsoluteUrl(url: string): string {
        if (/^https?:\/\//i.test(url)) {
            return url;
        }

        if (url.startsWith('/')) {
            return `${this.backendUrl}${url}`;
        }

        return `${this.backendUrl}/${url}`;
    }

    private mapStatusHistory(raw: unknown): StatusHistoryEntry[] {
        if (!Array.isArray(raw)) {
            return [];
        }

        const mapped = raw
            .map((entry): StatusHistoryEntry | null => {
                if (!entry || typeof entry !== 'object') {
                    return null;
                }

                const source = entry as Record<string, unknown>;
                const status = this.toNullableString(
                    source['status'] ?? source['state'] ?? source['statusName'] ?? source['newStatus'] ?? source['value']

                );
                const changedAt = this.toNullableString(
                    source['changedAt'] ?? source['date'] ?? source['createdAt'] ?? source['updatedAt'] ?? source['timestamp']

                );
                const note = this.toNullableString(source['note'] ?? source['description'] ?? source['comment'] ?? source['detail']);
                const changedBy = this.mapStatusHistoryUser(
                    source['changedBy'] ?? source['user'] ?? source['updatedBy'] ?? source['modifiedBy'] ?? source['assignedTo']
                );

                if (!status && !changedAt && !note && !changedBy) {
                    return null;
                }

                return {
                    status: status?.toUpperCase() ?? null,
                    changedAt: changedAt ?? null,
                    changedBy,
                    note
                };
            })
            .filter((entry): entry is StatusHistoryEntry => !!entry);

        mapped.sort((a, b) => {
            const timeA = this.getComparableTimestamp(a.changedAt);
            const timeB = this.getComparableTimestamp(b.changedAt);

            if (!Number.isFinite(timeA) && !Number.isFinite(timeB)) {
                return 0;
            }

            if (!Number.isFinite(timeA)) {
                return 1;
            }

            if (!Number.isFinite(timeB)) {
                return -1;
            }

            return timeA - timeB;
        });

        return mapped;
    }

    private mapStatusHistoryUser(raw: unknown): StatusHistoryUser | null {
        if (!raw) {
            return null;
        }

        if (typeof raw === 'string') {
            const normalized = this.toNullableString(raw);
            if (!normalized) {
                return null;
            }

            return {
                name: normalized,
                lastname: null,
                email: null,
                phone: null
            };
        }

        if (typeof raw !== 'object') {
            return null;
        }

        const source = raw as Record<string, unknown>;
        const fullName = this.toNullableString(source['fullName'] ?? source['displayName'] ?? source['username']);
        const name = this.toNullableString(source['name'] ?? source['firstName'] ?? source['names']) ?? fullName;
        const lastname = this.toNullableString(source['lastname'] ?? source['lastName'] ?? source['surname'] ?? source['secondName']);
        const email = this.toNullableString(source['email'] ?? source['emailAddress'] ?? source['mail']);
        const phone = this.toNullableString(
            source['phone'] ?? source['phoneNumber'] ?? source['telephone'] ?? source['mobile'] ?? source['cellphone']
        );

        if (!name && !lastname && !email && !phone) {
            return null;
        }

        return {
            name,
            lastname,
            email,
            phone
        };
    }

    private getComparableTimestamp(value: string | null): number {
        if (!value) {
            return Number.POSITIVE_INFINITY;
        }

        const parsed = new Date(value).getTime();
        if (Number.isNaN(parsed)) {
            return Number.POSITIVE_INFINITY;
        }

        return parsed;
    }
}
