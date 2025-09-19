import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { finalize, Subject, takeUntil } from 'rxjs';
import { DashboardSummaryResponseDto } from './models/dashboard-summary-response.dto';
import { DashboardService } from '../service/dashboard.service';

interface DashboardTypeItem {
    key: string;
    label: string;
    count: number;
    percentage: number;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
    imports: [CommonModule, CardModule, ChartModule, TableModule, ProgressSpinnerModule, ButtonModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
    loading = false;

    error: string | null = null;

    summary: DashboardSummaryResponseDto | null = null;

    statusChartData: ChartData<'bar'> | null = null;

    statusChartOptions: ChartOptions<'bar'> | null = null;

    typeChartData: ChartData<'doughnut'> | null = null;

    typeChartOptions: ChartOptions<'doughnut'> | null = null;

    feedbackTrendData: ChartData<'line'> | null = null;

    feedbackTrendOptions: ChartOptions<'line'> | null = null;

    private readonly destroy$ = new Subject<void>();

    constructor(private readonly dashboardService: DashboardService) {}

    ngOnInit(): void {
        this.loadDashboard();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    retry(): void {
        this.loadDashboard();
    }

    private loadDashboard(): void {
        this.loading = true;
        this.error = null;

        this.dashboardService
            .getDashboardSummary()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => {
                    this.loading = false;
                })
            )
            .subscribe({
                next: (summary) => {
                    this.summary = summary;
                    this.configureCharts(summary);
                },
                error: (err) => {
                    console.error('Error al cargar el dashboard', err);
                    this.error = 'Ocurrió un error al cargar los indicadores.';
                }
            });
    }

    private configureCharts(summary: DashboardSummaryResponseDto): void {
        const colors = this.resolveChartColors();

        this.configureStatusChart(summary, colors);
        this.configureTypeChart(summary, colors);
        this.configureFeedbackTrendChart(summary, colors);
    }

    private configureStatusChart(summary: DashboardSummaryResponseDto, colors: ReturnType<typeof this.resolveChartColors>): void {
        const statuses = summary.feedbacksByStatus ?? [];
        const labels = statuses.map((item) => this.formatStatusLabel(item._id));
        const data = statuses.map((item) => item.count);
        const palette = statuses.map((_, index) => this.pickFromPalette(index, colors.palette));

        this.statusChartData = {
            labels,
            datasets: [
                {
                    label: 'Casos',
                    data,
                    backgroundColor: palette,
                    borderColor: palette,
                    borderWidth: 1
                }
            ]
        };

        this.statusChartOptions = {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y ?? context.parsed}`
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: colors.textSecondary
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    ticks: {
                        color: colors.textSecondary
                    },
                    grid: {
                        color: colors.surfaceBorder
                    },
                    border: {
                        display: false
                    }
                }
            }
        };
    }

    private configureTypeChart(summary: DashboardSummaryResponseDto, colors: ReturnType<typeof this.resolveChartColors>): void {
        const typeItems = this.buildTypeItems(summary);
        const labels = typeItems.map((item) => item.label);
        const data = typeItems.map((item) => item.count);
        const palette = typeItems.map((_, index) => this.pickFromPalette(index, colors.palette));

        this.typeChartData = {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: palette,
                    hoverBackgroundColor: palette
                }
            ]
        };

        this.typeChartOptions = {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: colors.textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const index = context.dataIndex;
                            const item = typeItems[index];
                            const value = context.parsed as number;
                            const percentage = item?.percentage ?? 0;
                            return `${item?.label ?? ''}: ${value} (${percentage.toFixed(1)}%)`;
                        }
                    }
                }
            }
        };
    }

    private configureFeedbackTrendChart(
        summary: DashboardSummaryResponseDto,
        colors: ReturnType<typeof this.resolveChartColors>
    ): void {
        const trend = [...(summary.feedbacksLast7Days ?? [])].sort(
            (a, b) => new Date(a._id).getTime() - new Date(b._id).getTime()
        );
        const labels = trend.map((item) => this.formatDate(item._id));
        const data = trend.map((item) => item.count);

        this.feedbackTrendData = {
            labels,
            datasets: [
                {
                    label: 'Casos diarios',
                    data,
                    fill: false,
                    tension: 0.4,
                    borderColor: colors.primary,
                    backgroundColor: colors.primary,
                    pointBackgroundColor: colors.primary,
                    pointBorderColor: colors.primary,
                    pointHoverBackgroundColor: colors.primaryLight,
                    pointHoverBorderColor: colors.primaryLight
                }
            ]
        };

        this.feedbackTrendOptions = {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: colors.textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: colors.textSecondary
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    ticks: {
                        color: colors.textSecondary
                    },
                    grid: {
                        color: colors.surfaceBorder
                    },
                    border: {
                        display: false
                    }
                }
            }
        };
    }

    private buildTypeItems(summary: DashboardSummaryResponseDto): DashboardTypeItem[] {
        if (summary.typeDistribution?.length) {
            return summary.typeDistribution.map((item) => ({
                key: item.type,
                label: this.formatTypeLabel(item.type),
                count: item.count,
                percentage: item.percentage
            }));
        }

        const total = summary.totalFeedbacks || 0;
        return (summary.feedbacksByType ?? []).map((item) => ({
            key: item._id,
            label: this.formatTypeLabel(item._id),
            count: item.count,
            percentage: total ? (item.count / total) * 100 : 0
        }));
    }

    private resolveChartColors() {
        const documentStyle = getComputedStyle(document.documentElement);

        const pick = (variable: string) => documentStyle.getPropertyValue(variable).trim();

        return {
            primary: pick('--p-primary-500'),
            primaryLight: pick('--p-primary-200'),
            textColor: pick('--text-color'),
            textSecondary: pick('--text-color-secondary'),
            surfaceBorder: pick('--surface-border'),
            palette: [
                pick('--p-blue-500'),
                pick('--p-green-500'),
                pick('--p-yellow-500'),
                pick('--p-orange-500'),
                pick('--p-purple-500'),
                pick('--p-teal-500'),
                pick('--p-indigo-500')
            ]
        };
    }

    private pickFromPalette(index: number, palette: string[]): string {
        if (!palette.length) {
            return '#64748b';
        }

        return palette[index % palette.length];
    }

    private formatStatusLabel(status: string): string {
        const normalized = status?.toUpperCase?.() ?? '';
        const map: Record<string, string> = {
            PENDING: 'Pendientes',
            RESOLVED: 'Resueltos',
            IN_PROGRESS: 'En progreso',
            RETURNED: 'Devueltos',
            FORWARDED: 'Derivados',
            CANCEL: 'Cancelados'
        };

        return map[normalized] ?? this.toTitleCase(normalized.replace(/_/g, ' ').toLowerCase());
    }

    private formatTypeLabel(type: string): string {
        const normalized = type?.toLowerCase?.() ?? '';
        const map: Record<string, string> = {
            complaint: 'Quejas',
            suggestion: 'Sugerencias',
            compliment: 'Felicitaciones'
        };

        return map[normalized] ?? this.toTitleCase(normalized.replace(/_/g, ' '));
    }

    private formatDate(value: string): string {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString('es-EC', {
            day: '2-digit',
            month: 'short'
        });
    }

    private toTitleCase(value: string): string {
        return value
            .split(' ')
            .filter(Boolean)
            .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
            .join(' ');
    }
}
