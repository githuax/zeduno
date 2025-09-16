import { useQuery } from '@tanstack/react-query';

import { AnalyticsMetrics, ReportFilters, DashboardStats } from '@/types/analytics.types';

// Mock data generator for analytics
const generateMockAnalytics = (): AnalyticsMetrics => {
  const currentDate = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    return {
      period: date.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 50) + 10
    };
  }).reverse();

  return {
    totalRevenue: last30Days.reduce((sum, day) => sum + day.revenue, 0),
    totalOrders: last30Days.reduce((sum, day) => sum + day.orders, 0),
    averageOrderValue: last30Days.reduce((sum, day) => sum + day.revenue, 0) / last30Days.reduce((sum, day) => sum + day.orders, 0),
    customerCount: Math.floor(Math.random() * 1000) + 500,
    tableUtilization: Math.floor(Math.random() * 30) + 70,
    popularItems: [
      { name: 'Margherita Pizza', quantity: 145, revenue: 2175 },
      { name: 'Caesar Salad', quantity: 89, revenue: 1068 },
      { name: 'Grilled Chicken', quantity: 76, revenue: 1520 },
      { name: 'Pasta Carbonara', quantity: 65, revenue: 975 },
      { name: 'Fish & Chips', quantity: 54, revenue: 864 }
    ],
    revenueByPeriod: last30Days,
    ordersByService: [
      { service: 'dine-in', orders: 450, revenue: 13500 },
      { service: 'takeaway', orders: 320, revenue: 8960 },
      { service: 'delivery', orders: 280, revenue: 7840 }
    ],
    customerSatisfaction: 4.6,
    peakHours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      orders: hour >= 11 && hour <= 14 ? Math.floor(Math.random() * 20) + 15 :
              hour >= 18 && hour <= 21 ? Math.floor(Math.random() * 25) + 20 :
              Math.floor(Math.random() * 5) + 1,
      revenue: hour >= 11 && hour <= 14 ? Math.floor(Math.random() * 800) + 600 :
               hour >= 18 && hour <= 21 ? Math.floor(Math.random() * 1000) + 800 :
               Math.floor(Math.random() * 200) + 50
    }))
  };
};

const generateMockDashboardStats = (): DashboardStats => ({
  todayRevenue: Math.floor(Math.random() * 3000) + 1500,
  todayOrders: Math.floor(Math.random() * 40) + 20,
  activeOrders: Math.floor(Math.random() * 15) + 5,
  tablesOccupied: Math.floor(Math.random() * 15) + 10,
  totalTables: 24,
  deliveriesInProgress: Math.floor(Math.random() * 8) + 2,
  takeawayPending: Math.floor(Math.random() * 12) + 5,
  staffOnDuty: Math.floor(Math.random() * 8) + 12
});

export const useAnalytics = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: ['analytics', filters],
    queryFn: () => generateMockAnalytics(),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000 // Consider data stale after 30 seconds
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => generateMockDashboardStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000 // Consider data stale after 15 seconds
  });
};

export const useRevenueChart = (period: 'daily' | 'weekly' | 'monthly' = 'daily') => {
  return useQuery({
    queryKey: ['revenue-chart', period],
    queryFn: () => {
      const analytics = generateMockAnalytics();
      return analytics.revenueByPeriod;
    },
    refetchInterval: 60000,
    staleTime: 30000
  });
};