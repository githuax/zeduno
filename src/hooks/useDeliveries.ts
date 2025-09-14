import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Delivery, CreateDeliveryInput, UpdateDeliveryInput, DeliveryStatus } from '@/types/delivery.types';

const API_URL = '/api/deliveries';

interface DeliveriesQueryParams {
  status?: DeliveryStatus;
  driverId?: string;
  date?: string;
}

export function useDeliveries(params?: DeliveriesQueryParams) {
  return useQuery({
    queryKey: ['deliveries', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.driverId) searchParams.append('driverId', params.driverId);
      if (params?.date) searchParams.append('date', params.date);

      const response = await fetch(`${API_URL}?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      
      return response.json() as Promise<Delivery[]>;
    },
  });
}

export function useDelivery(deliveryId: string) {
  return useQuery({
    queryKey: ['delivery', deliveryId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/${deliveryId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch delivery');
      }
      
      return response.json() as Promise<Delivery>;
    },
    enabled: !!deliveryId,
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (deliveryData: CreateDeliveryInput) => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(deliveryData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create delivery');
      }
      
      return response.json() as Promise<Delivery>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateDelivery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDeliveryInput }) => {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update delivery');
      }
      
      return response.json() as Promise<Delivery>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['delivery', data._id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DeliveryStatus }) => {
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update delivery status');
      }
      
      return response.json() as Promise<Delivery>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['delivery', data._id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
}

export function useAssignDelivery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: string; driverId: string }) => {
      const response = await fetch(`${API_URL}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ orderId, driverId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign delivery');
      }
      
      return response.json() as Promise<Delivery>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
}