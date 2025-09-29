import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FeedbackGeoDto, FeedbackGeoFilters, FeedbackService } from '@/pages/service/feedback.service';

@Component({
  selector: 'app-heat-map',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './heat-map.component.html',
  styleUrl: './heat-map.component.scss'
})
export class HeatMapComponent implements AfterViewInit, OnDestroy {
  private map!: google.maps.Map;
  private heatmap: google.maps.visualization.HeatmapLayer | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly defaultCenter = new google.maps.LatLng(-0.1807, -78.4678); // Quito

  private readonly fb = inject(FormBuilder);
  private readonly feedbackService = inject(FeedbackService);

  readonly filtersForm = this.fb.nonNullable.group({
    type: '' as '' | FeedbackGeoDto['type'],
    status: '' as '' | NonNullable<FeedbackGeoDto['status']>
  });

  readonly typeOptions: { label: string; value: '' | FeedbackGeoDto['type'] }[] = [
    { label: 'Todos', value: '' },
    { label: 'Quejas', value: 'complaint' },
    { label: 'Sugerencias', value: 'suggestion' },
    { label: 'Felicitaciones', value: 'compliment' }
  ];

  readonly statusOptions: { label: string; value: '' | NonNullable<FeedbackGeoDto['status']> }[] = [
    { label: 'Todos', value: '' },
    { label: 'Pendientes', value: 'PENDING' },
    { label: 'En progreso', value: 'IN_PROGRESS' },
    { label: 'Resueltos', value: 'RESOLVED' },
    { label: 'Devueltos', value: 'RETURNED' },
    { label: 'Reasignados', value: 'FORWARDED' },
    { label: 'Cancelados', value: 'CANCEL' }
  ];

  ngAfterViewInit(): void {
    this.initMap();
    this.setupFiltersListener();
  }

  private initMap(): void {
    this.map = new google.maps.Map(document.getElementById('gmap') as HTMLElement, {
      zoom: 12,
      center: this.defaultCenter,
      mapTypeId: 'roadmap'
    });
  }

  private setupFiltersListener(): void {
    this.filtersForm.valueChanges
      .pipe(
        startWith(this.filtersForm.getRawValue()),
        debounceTime(300),
        map(filters => {
          const sanitized: FeedbackGeoFilters = {};

          if (filters.type) {
            sanitized.type = filters.type;
          }

          if (filters.status) {
            sanitized.status = filters.status;
          }

          return sanitized;
        }),
        distinctUntilChanged(
          (prev, curr) => prev.type === curr.type && prev.status === curr.status
        ),
        switchMap(filters => this.feedbackService.getFeedbacksGeo(filters)),
        takeUntil(this.destroy$)
      )
      .subscribe(feedbacks => this.renderHeatmap(feedbacks));
  }

  private renderHeatmap(feedbacks: FeedbackGeoDto[]): void {
    const heatData = feedbacks.map(f => new google.maps.LatLng(f.latitude, f.longitude));

    if (this.heatmap) {
      this.heatmap.setMap(null);
    }

    this.heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatData,
      map: this.map,
      radius: 25
    });

    if (heatData.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      heatData.forEach(point => bounds.extend(point));
      this.map.fitBounds(bounds);
    } else {
      this.map.setCenter(this.defaultCenter);
      this.map.setZoom(12);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.heatmap) {
      this.heatmap.setMap(null);
    }
  }
}
