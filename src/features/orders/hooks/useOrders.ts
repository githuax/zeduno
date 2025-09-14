import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Order, CreateOrderInput, UpdateOrderInput, OrderType, OrderStatus } from '@/types/order.types';

const API_URL = '/api/orders';

interface OrdersQueryParams {
  orderType?: OrderType;
  status?: OrderStatus;
  paymentStatus?: string;
  date?: string;
}

export function useOrders(params?: OrdersQueryParams) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.orderType) searchParams.append('orderType', params.orderType);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.paymentStatus) searchParams.append('paymentStatus', params.paymentStatus);
      if (params?.date) searchParams.append('date', params.date);

      const response = await fetch(`${API_URL}?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      return data.orders || data as Order[];
    },
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      
      const data = await response.json();
      return data.order || data as Order;
    },
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: CreateOrderInput) => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      const data = await response.json();
      return data.order || data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOrderInput }) => {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order');
      }
      
      const result = await response.json();
      return result.order || result as Order;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data._id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      const data = await response.json();
      return data.order || data as Order;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data._id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useSplitOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, splits }: { id: string; splits: any[] }) => {
      const response = await fetch(`${API_URL}/${id}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ splits }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to split order');
      }
      
      const data = await response.json();
      return data.order || data as Order;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data._id] });
    },
  });
}

export function useMergeOrders() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderIds, tableId }: { orderIds: string[]; tableId?: string }) => {
      const response = await fetch(`${API_URL}/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ orderIds, tableId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to merge orders');
      }
      
      const data = await response.json();
      return data.order || data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}