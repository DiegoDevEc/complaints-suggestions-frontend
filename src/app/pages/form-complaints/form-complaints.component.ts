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
    imports: [RouterModule, TopbarWidget, RippleModule, StyleClassModule, ButtonModule, DividerModule, InputTextModule,
        FluidModule, ButtonModule, SelectModule, FormsModule, TextareaModule, CheckboxModule, GoogleMapsModule],
    standalone: true,
    templateUrl: './form-complaints.component.html',
    styleUrl: './form-complaints.component.scss'
})
export class FormComplaintsComponent {

    center: google.maps.LatLngLiteral = { lat: 40.73061, lng: -73.935242 };
    zoom = 10;
    markers = [
        { lat: 40.73061, lng: -73.935242 },
        { lat: 40.74988, lng: -73.968285 }
    ];

    dropdownItem = null;
    checkboxValue: any[] = [];


    dropdownItems = [
        { name: 'Queja', code: 'COMPLAINT' },
        { name: 'Denuncia', code: 'COMPLAINT' },
        { name: 'Sugerencia', code: 'SUGGESTION' },
        { name: 'Felicitación', code: 'COMPLIMENT' }
    ];

}
