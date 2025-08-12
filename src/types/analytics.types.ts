export interface AnalyticsMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  customerCount: number;
  tableUtilization: number;
  popularItems: PopularItem[];
  revenueByPeriod: RevenueData[];
  ordersByService: ServiceOrderData[];
  customerSatisfaction: number;
  peakHours: PeakHourData[];
}

export interface PopularItem {
  name: string;
  quantity: number;
  revenue: number;
}

export interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
}

export interface ServiceOrderData {
  service: 'dine-in' | 'takeaway' | 'delivery';
  orders: number;
  revenue: number;
}

export interface PeakHourData {
  hour: number;
  orders: number;
  revenue: number;
}

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  service?: 'dine-in' | 'takeaway' | 'delivery' | 'all';
  period: 'daily' | 'weekly' | 'monthly';
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeOrders: number;
  tablesOccupied: number;
  totalTables: number;
  deliveriesInProgress: number;
  takeawayPending: number;
  staffOnDuty: number;
}