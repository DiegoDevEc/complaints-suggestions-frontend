import { DashboardService } from '@/pages/service/dashboard.service';
import { Component, AfterViewInit, ElementRef, OnDestroy, ViewChild } from '@angular/core';
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
    private readonly defaultCenter: L.LatLngTuple = [-0.1807, -78.4678];
    private readonly defaultZoom = 12;

    @ViewChild('mapContainer', { static: true })
    private mapContainer!: ElementRef<HTMLDivElement>;

    private map!: L.Map;
    private heatLayer?: L.Layer;
    private resizeObserver?: ResizeObserver;

    constructor(private readonly dashboardService: DashboardService) { }

    ngAfterViewInit(): void {
        this.initializeMap();
        this.observeResize();
        this.loadFeedbacks();
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
        this.map?.remove();
    }

    private initializeMap(): void {
        this.map = L.map(this.mapContainer.nativeElement, {
            zoomControl: true
        }).setView(this.defaultCenter, this.defaultZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        // Ajusta inmediatamente después de la creación para evitar recortes.
        setTimeout(() => this.map.invalidateSize(), 0);
    }

    private observeResize(): void {
        if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined' || !this.mapContainer) {
            return;
        }

        this.resizeObserver = new ResizeObserver(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        });

        this.resizeObserver.observe(this.mapContainer.nativeElement);
    }

    private loadFeedbacks(): void {
        this.dashboardService.getAllFeedbacks().subscribe({
            next: feedbacks => {
                const heatData: [number, number, number][] = feedbacks
                    .filter(f => typeof f.latitude === 'number' && typeof f.longitude === 'number')
                    .map(f => [f.latitude, f.longitude, 0.6]);

                if (this.heatLayer) {
                    this.map.removeLayer(this.heatLayer);
                }

                if (heatData.length > 0) {
                    this.heatLayer = (L as any).heatLayer(heatData, {
                        radius: 28,
                        blur: 18,
                        maxZoom: 17,
                        minOpacity: 0.35
                    });
                    this.heatLayer.addTo(this.map);

                    const bounds = L.latLngBounds(heatData.map(([lat, lng]) => [lat, lng] as L.LatLngTuple));
                    this.map.fitBounds(bounds.pad(0.1));
                } else {
                    this.map.setView(this.defaultCenter, this.defaultZoom);
                }

                // Asegura que el mapa se reajuste después de aplicar capas o bounds.
                setTimeout(() => this.map.invalidateSize(), 0);
            },
            error: () => {
                this.map.setView(this.defaultCenter, this.defaultZoom);
                setTimeout(() => this.map.invalidateSize(), 0);
            }
        });
    }
}
