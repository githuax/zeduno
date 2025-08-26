import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '../config/api';

interface DashboardStats {
  orders: {
    active: number;
    pending: number;
    preparing: number;
    ready: number;
    totalToday: number;
    takeaway: number;
    delivery: number;
  };
  tables: {
    total: number;
    occupied: number;
    available: number;
    reserved: number;
    occupancyRate: number;
  };
  menu: {
    total: number;
    available: number;
    outOfStock: number;
  };
  staff: {
    total: number;
    active: number;
    onShift: number;
  };
  revenue: {
    today: number;
  };
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const token = localStorage.getItem('token') || localStorage.getItem('superadmin_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(getApiUrl('dashboard/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      return data.stats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 3,
  });
};