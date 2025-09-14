import { useQuery } from '@tanstack/react-query';

import { getApiUrl } from '@/config/api';

interface DashboardStats {
  orders: {
    active: number;
    pending: number;
    preparing: number;
    ready: number;
    totalToday: number;
    takeaway: number;
    delivery: number;
    deliveryStatus?: {
      preparing: number;
      ready: number;
      outForDelivery: number;
      deliveredToday: number;
    };
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
  inventory?: {
    lowStock: number;
    expiringSoon?: number;
  };
  staff: {
    total: number;
    active: number;
    onShift: number;
  };
  branches?: {
    total: number;
    active: number;
  };
  revenue: {
    today: number;
  };
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Try multiple token sources
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('superadmin_token') ||
                   localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log('Making dashboard stats request to:', getApiUrl('dashboard/stats'));
      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await fetch(getApiUrl('dashboard/stats'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Log the response for debugging
      console.log('Dashboard stats response status:', response.status);
      console.log('Dashboard stats response ok:', response.ok);

      if (response.status === 401) {
        // Clear invalid tokens
        localStorage.removeItem('token');
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('auth_token');
        throw new Error('Authentication failed. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error('Access denied. Insufficient permissions.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dashboard stats API error:', errorText);
        throw new Error(`Failed to fetch dashboard stats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Dashboard stats response data:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch dashboard stats');
      }

      return data.stats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: (failureCount, error) => {
      // Don't retry authentication errors
      if (error.message.includes('Authentication failed') || 
          error.message.includes('Please log in again')) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
