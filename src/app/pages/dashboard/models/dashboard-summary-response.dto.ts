export interface DashboardCountById {
    _id: string;
    count: number;
}

export interface DashboardTypeDistributionItem {
    type: string;
    count: number;
    percentage: number;
}

export interface DashboardSummaryResponseDto {
    totalFeedbacks: number;
    feedbacksByStatus: DashboardCountById[];
    feedbacksByType: DashboardCountById[];
    topCompanies: DashboardCountById[];
    feedbacksLast7Days: DashboardCountById[];
    resolutionRate: number;
    avgResolutionTime: number;
    averageFeedbacksPerUser: number;
    typeDistribution: DashboardTypeDistributionItem[];
}
