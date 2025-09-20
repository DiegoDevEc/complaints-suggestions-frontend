import { DashboardService } from '@/pages/service/dashboard.service';
import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.heat';

@Component({
    selector: 'app-heat-map',
    standalone: true,
    imports: [],
    templateUrl: './heat-map.component.html',
    styleUrl: './heat-map.component.scss'
})
export class HeatMapComponent implements AfterViewInit, OnDestroy {
    private map!: L.Map;
    private heatLayer!: any;

    constructor(private readonly dashboardService: DashboardService) { }

    ngAfterViewInit(): void {
        this.map = L.map('map').setView([-0.1807, -78.4678], 12); // Quito

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        // 🔑 recalcula el tamaño al cargar dentro del card
        setTimeout(() => {
            this.map.invalidateSize();
        }, 0);

        // Cargar datos de feedbacks
        this.dashboardService.getAllFeedbacks().subscribe(feedbacks => {
            const heatData = feedbacks.map(f => [f.latitude, f.longitude, 0.5]);
            console.log(heatData);

            (L as any).heatLayer(heatData, {
                radius: 25,
                blur: 15,
                maxZoom: 17
            }).addTo(this.map);

            // ✅ bounds solo con lat/lng
            if (feedbacks.length > 0) {
                const bounds: [number, number][] = feedbacks.map(f => [f.latitude, f.longitude]);
                this.map.fitBounds(bounds);
            }
        });
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }
}
