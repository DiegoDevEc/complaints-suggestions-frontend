import { Component, OnInit } from '@angular/core';
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
export class FormComplaintsComponent implements OnInit {

    complaintForm!: FormGroup;
    submitted = false;

    center: google.maps.LatLngLiteral = null!;
    zoom = 20;
    selectedPosition: google.maps.LatLngLiteral | null = null;

    dropdownItems = [
        { name: 'Queja', code: 'complaint' },
        { name: 'Sugerencia', code: 'suggestion' },
        { name: 'Felicitación', code: 'compliment' }
    ];

    constructor(
        private fb: FormBuilder,
        private complaintsService: ComplaintsService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.complaintForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            description: ['', Validators.required],
            phone: ['', Validators.required],
            type: ['', Validators.required],
            contacted: [false, Validators.requiredTrue],
            latitude: ['', Validators.required],
            longitude: ['', Validators.required]
        });
    }

    setMarker(event: google.maps.MapMouseEvent) {
        if (!event.latLng) return;
        this.selectedPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        this.complaintForm.patchValue({
            latitude: this.selectedPosition.lat,
            longitude: this.selectedPosition.lng
        });
    }

    requestUserLocation() {
        if (!('geolocation' in navigator)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Geolocalización no soportada',
                detail: 'Tu navegador no soporta geolocalización.'
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.center = { lat: latitude, lng: longitude };
                this.zoom = 20;
                this.selectedPosition = { lat: latitude, lng: longitude };
                this.complaintForm.patchValue({ latitude, longitude });

                this.messageService.add({
                    severity: 'success',
                    summary: 'Ubicación obtenida',
                    detail: 'Puedes mover el marcador para ajustar el punto.'
                });
            },
            (error) => {
                let detail = 'No se pudo obtener la ubicación del dispositivo.';
                if (error.code === error.PERMISSION_DENIED) {
                    detail = 'Permiso denegado. Selecciona un punto en el mapa.';
                }
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Ubicación no disponible',
                    detail
                });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }


    onSubmit() {
        this.submitted = true;

        if (!this.complaintForm.value.latitude || !this.complaintForm.value.longitude) {
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

        this.complaintsService.createComplaint(this.complaintForm.value).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Formulario enviado correctamente'
                });
                this.complaintForm.reset();
                this.submitted = false;
                this.selectedPosition = null;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo enviar la información'
                });
            }
        });
    }
}
