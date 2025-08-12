import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuItem } from '@/types/order.types';

const API_URL = '/api/menu';

interface MenuQueryParams {
  category?: string;
  available?: boolean;
  search?: string;
}

export function useMenuItems(params?: MenuQueryParams) {
  return useQuery({
    queryKey: ['menuItems', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append('category', params.category);
      if (params?.available !== undefined) searchParams.append('available', params.available.toString());
      if (params?.search) searchParams.append('search', params.search);

      const response = await fetch(`${API_URL}?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      
      return response.json() as Promise<MenuItem[]>;
    },
  });
}

export function useMenuItem(id: string) {
  return useQuery({
    queryKey: ['menuItem', id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu item');
      }
      
      return response.json() as Promise<MenuItem>;
    },
    enabled: !!id,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (menuItemData: Partial<MenuItem>) => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(menuItemData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create menu item');
      }
      
      return response.json() as Promise<MenuItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MenuItem> }) => {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update menu item');
      }
      
      return response.json() as Promise<MenuItem>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['menuItem', data._id] });
    },
  });
}

export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/${id}/toggle-availability`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle availability');
      }
      
      return response.json() as Promise<MenuItem>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['menuItem', data._id] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}