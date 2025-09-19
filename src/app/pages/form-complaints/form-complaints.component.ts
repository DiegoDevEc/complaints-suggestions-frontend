import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { TopbarWidget } from './components/topbarwidget.component';
import { InputTextModule } from 'primeng/inputtext';
import { FluidModule } from 'primeng/fluid';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { GoogleMapsModule } from '@angular/google-maps';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ComplaintsService } from '../service/complaints.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { GeocodingService } from '../service/geocoding.service';

@Component({
    selector: 'app-form-complaints',
    imports: [
        CommonModule,
        RouterModule,
        TopbarWidget,
        RippleModule,
        StyleClassModule,
        ButtonModule,
        DividerModule,
        InputTextModule,
        FluidModule,
        SelectModule,
        TextareaModule,
        CheckboxModule,
        GoogleMapsModule,
        ReactiveFormsModule,
        ToastModule
    ],
    standalone: true,
    templateUrl: './form-complaints.component.html',
    styleUrl: './form-complaints.component.scss',
    providers: [ComplaintsService, MessageService]
})
export class FormComplaintsComponent implements OnInit, OnDestroy {

    @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

    previewUrl: string | null = null;
    attachmentName: string | null = null;
    isDragOver = false;

    complaintForm!: FormGroup;
    submitted = false;

    center: google.maps.LatLngLiteral | null = null;
    zoom = 18;
    selectedPosition: google.maps.LatLngLiteral | null = null;

    mapOptions: google.maps.MapOptions = {
        disableDefaultUI: false,
        clickableIcons: false,
        zoomControl: true,
        streetViewControl: false
    };

    markerOptions: google.maps.MarkerOptions = {
        draggable: true
    };

    private geocoder = new google.maps.Geocoder();

    dropdownItems = [
        { name: 'Queja', code: 'complaint' },
        { name: 'Sugerencia', code: 'suggestion' },
        { name: 'Felicitación', code: 'compliment' }
    ];

    constructor(
        private fb: FormBuilder,
        private complaintsService: ComplaintsService,
        private messageService: MessageService,
        private geocodingService: GeocodingService
    ) { }

    ngOnInit() {
        this.complaintForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            description: ['', Validators.required],
            attachment: [null],
            phone: ['', Validators.required],
            type: ['', Validators.required],
            contacted: [true, Validators.requiredTrue],
            latitude: ['', Validators.required],
            longitude: ['', Validators.required],
            // Opcional si harás reverse geocoding:
            address: ['']
        });
        // Prevenir errores por contexto inseguro (HTTP)
        if (!isSecureContext) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sitio no seguro',
                detail: 'La geolocalización requiere HTTPS o localhost. Puedes seleccionar el punto manualmente.'
            });
        }
    }

    ngOnDestroy(): void {
        if (this.previewUrl) {
            URL.revokeObjectURL(this.previewUrl);
        }
    }

    setMarker(event: google.maps.MapMouseEvent) {
        if (!event.latLng) return;
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        this.selectedPosition = { lat, lng };
        this.complaintForm.patchValue({ latitude: lat, longitude: lng });

        this.geocodingService.reverseGeocodeToString(lat, lng)
            .subscribe(dir => {
                console.log("extrayendo datos de geocoding");
                // dir es UN SOLO string ya formateado
                this.complaintForm.patchValue({ address: dir, latitud: lat, longitud: lng });
            });
        // (Opcional) reverse geocoding al hacer click:
        this.reverseGeocode(lat, lng);
    }

    onMarkerDragEnd(event: google.maps.MapMouseEvent) {
        if (!event.latLng) return;
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        this.selectedPosition = { lat, lng };
        this.complaintForm.patchValue({ latitude: lat, longitude: lng });
        this.geocodingService.reverseGeocodeToString(lat, lng)
            .subscribe(dir => {
                console.log("extrayendo datos de geocoding");
                // dir es UN SOLO string ya formateado
                this.complaintForm.patchValue({ address: dir, latitud: lat, longitud: lng });
            });
        this.reverseGeocode(lat, lng);
    }

    private reverseGeocode(lat: number, lng: number) {
        this.geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status !== 'OK' || !results?.length) return;
            const first = results[0];
            const address = first.formatted_address;

            // Intenta extraer dos calles si están en address_components
            const route = first.address_components?.find(c => c.types.includes('route'))?.long_name || '';
            const neighborhood = first.address_components?.find(c => c.types.includes('sublocality') || c.types.includes('neighborhood'))?.long_name || '';
            // Heurística simple: streetA = route; streetB = neighborhood/otro
            const streetA = route;
            const streetB = neighborhood;

            this.complaintForm.patchValue({
                addressLine: address,
                streetA,
                streetB
            });
        });
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files && input.files.length ? input.files[0] : null;
        if (file) {
            this.handleIncomingFile(file);
        }
        this.resetFileInput();
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        this.isDragOver = false;
    }

    onFileDrop(event: DragEvent) {
        event.preventDefault();
        this.isDragOver = false;
        const file = event.dataTransfer?.files && event.dataTransfer.files.length
            ? event.dataTransfer.files[0]
            : null;
        if (file) {
            this.handleIncomingFile(file);
        }
        this.resetFileInput();
    }

    private handleIncomingFile(file: File) {
        if (!file.type.startsWith('image/')) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formato inválido',
                detail: 'Selecciona una imagen en formato PNG, JPG o GIF.'
            });
            return;
        }

        const maxSizeInMb = 5;
        if (file.size > maxSizeInMb * 1024 * 1024) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Archivo muy grande',
                detail: `La imagen debe pesar menos de ${maxSizeInMb}MB.`
            });
            return;
        }

        this.complaintForm.patchValue({ attachment: file });
        this.complaintForm.get('attachment')?.updateValueAndValidity();

        if (this.previewUrl) {
            URL.revokeObjectURL(this.previewUrl);
        }
        this.previewUrl = URL.createObjectURL(file);
        this.attachmentName = file.name;
    }

    private resetFileInput() {
        if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
        }
    }

    private getCurrentPositionOnce(timeout = 10000): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout,
                maximumAge: 0
            });
        });
    }

    private async checkGeoPermission(): Promise<PermissionState | 'unknown'> {
        if (!('permissions' in navigator) || !(navigator as any).permissions?.query) return 'unknown';
        try {
            const status = await (navigator as any).permissions.query({ name: 'geolocation' as PermissionName });
            return status.state; // 'granted' | 'prompt' | 'denied'
        } catch {
            return 'unknown';
        }
    }

    async requestUserLocation() {
        if (!('geolocation' in navigator)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Geolocalización no soportada',
                detail: 'Tu navegador no soporta geolocalización.'
            });
            return;
        }
        if (!isSecureContext) {
            this.messageService.add({
                severity: 'warn',
                summary: 'HTTPS requerido',
                detail: 'Activa HTTPS o usa localhost para obtener la ubicación automáticamente.'
            });
            return;
        }

        const perm = await this.checkGeoPermission();
        if (perm === 'denied') {
            this.messageService.add({
                severity: 'warn',
                summary: 'Permiso denegado',
                detail: 'Activa el permiso de ubicación en el navegador o selecciona un punto en el mapa.'
            });
            return;
        }

        // Reintentos en POSITION_UNAVAILABLE (p.ej. kCLErrorLocationUnknown)
        const maxRetries = 2;
        let attempt = 0;
        while (attempt <= maxRetries) {
            try {
                const pos = await this.getCurrentPositionOnce(10000);
                const { latitude, longitude } = pos.coords;
                this.center = { lat: latitude, lng: longitude };
                this.zoom = 18;
                this.selectedPosition = { lat: latitude, lng: longitude };
                this.complaintForm.patchValue({ latitude, longitude });

                this.geocodingService.reverseGeocodeToString(latitude, longitude)
                    .subscribe(dir => {
                        console.log("extrayendo datos de geocoding");

                        // dir es UN SOLO string ya formateado
                        this.complaintForm.patchValue({ address: dir, latitud: latitude, longitud: longitude });
                    });

                this.messageService.add({
                    severity: 'success',
                    summary: 'Ubicación obtenida',
                    detail: 'Puedes mover el marcador para ajustar el punto.'
                });
                // (Opcional) reverse geocoding automático al obtener la ubicación
                this.reverseGeocode(latitude, longitude);
                return;
            } catch (err: any) {
                if (err?.code === err?.PERMISSION_DENIED) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Permiso denegado',
                        detail: 'Autoriza la ubicación en el candado del navegador o selecciona un punto en el mapa.'
                    });
                    return;
                }
                if (err?.code === err?.POSITION_UNAVAILABLE && attempt < maxRetries) {
                    // Espera breve y reintenta
                    await new Promise(r => setTimeout(r, 1500));
                    attempt++;
                    continue;
                }
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Ubicación no disponible',
                    detail: 'No se pudo obtener la ubicación del dispositivo. Selecciona un punto en el mapa.'
                });
                return;
            }
        }
    }

    onSubmit() {
        this.submitted = true;

        const { latitude, longitude } = this.complaintForm.value;
        if (!latitude || !longitude) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Falta ubicación',
                detail: 'Haz clic en "Usar mi ubicación" o selecciona un punto en el mapa.'
            });
            return;
        }

        if (this.complaintForm.invalid) {
            this.complaintForm.markAllAsTouched();
            return;
        }

        const formData = new FormData();
        Object.keys(this.complaintForm.controls).forEach(key => {
            const value = this.complaintForm.get(key)?.value;
            if (value !== null && value !== undefined) {
                formData.append(key, value instanceof Blob ? value : String(value));
            }
        });

        this.complaintsService.createComplaint(formData).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Formulario enviado correctamente'
                });
                this.complaintForm.reset();
                this.complaintForm.controls['contacted'].setValue(true);
                this.submitted = false;
                this.selectedPosition = null;
                this.previewUrl = null;
                this.attachmentName = null;
                this.resetFileInput();
            },
            error: (err) => {
                const msg = err?.status === 401
                    ? 'No autorizado: inicia sesión para enviar el formulario.'
                    : 'No se pudo enviar la información';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }


}
