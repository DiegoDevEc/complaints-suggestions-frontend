import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { TopbarWidget } from './components/topbarwidget.component';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { FluidModule } from 'primeng/fluid';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
    selector: 'app-form-complaints',
    imports: [RouterModule, TopbarWidget, RippleModule, StyleClassModule, ButtonModule, DividerModule, InputTextModule, FluidModule, ButtonModule, SelectModule, FormsModule, TextareaModule, CheckboxModule, GoogleMapsModule],
    standalone: true,
    templateUrl: './form-complaints.component.html',
    styleUrl: './form-complaints.component.scss'
})
export class FormComplaintsComponent {
    center: google.maps.LatLngLiteral = { lat: 40.73061, lng: -73.935242 };
    zoom = 10;
    marker: google.maps.LatLngLiteral | null = null;
    latitude: number | null = null;
    longitude: number | null = null;
    mainStreet = '';
    crossStreet = '';

    dropdownItem = null;
    checkboxValue: any[] = [];

    dropdownItems = [
        { name: 'Queja', code: 'COMPLAINT' },
        { name: 'Denuncia', code: 'COMPLAINT' },
        { name: 'Sugerencia', code: 'SUGGESTION' },
        { name: 'Felicitación', code: 'COMPLIMENT' }
    ];

    onMapClick(event: google.maps.MapMouseEvent) {
        if (event.latLng) {
            this.marker = event.latLng.toJSON();
            this.latitude = this.marker.lat;
            this.longitude = this.marker.lng;

            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: this.marker }).then(({ results }) => {
                if (results[0]) {
                    const routes = results[0].address_components.filter((component) => component.types.includes('route'));
                    this.mainStreet = routes[0]?.long_name ?? '';
                    this.crossStreet = routes[1]?.long_name ?? '';
                }
            });
        }
    }
}
