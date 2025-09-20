import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { DashboardService } from '@/pages/service/dashboard.service';

@Component({
  selector: 'app-heat-map',
  standalone: true,
  templateUrl: './heat-map.component.html',
  styleUrl: './heat-map.component.scss'
})
export class HeatMapComponent implements AfterViewInit, OnDestroy {
  private map!: google.maps.Map;
  private heatmap!: google.maps.visualization.HeatmapLayer;

  constructor(private readonly dashboardService: DashboardService) {}

  ngAfterViewInit(): void {
    this.initMap();
    this.loadHeatmap();
  }

  private initMap(): void {
    const center = new google.maps.LatLng(-0.1807, -78.4678); // Quito
    this.map = new google.maps.Map(document.getElementById('gmap') as HTMLElement, {
      zoom: 12,
      center,
      mapTypeId: 'roadmap'
    });
  }

  private loadHeatmap(): void {
    this.dashboardService.getAllFeedbacks().subscribe(feedbacks => {
      const heatData = feedbacks.map(f => new google.maps.LatLng(f.latitude, f.longitude));

      this.heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatData,
        map: this.map,
        radius: 25
      });

      // Ajustar el mapa a los puntos
      if (heatData.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        heatData.forEach(point => bounds.extend(point));
        this.map.fitBounds(bounds);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.heatmap) {
      this.heatmap.setMap(null);
    }
  }
}
