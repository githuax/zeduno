import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table } from '@/types/order.types';

const API_URL = '/api/tables';

interface TablesQueryParams {
  status?: string;
  floor?: number;
  section?: string;
}

export function useTables(params?: TablesQueryParams) {
  return useQuery({
    queryKey: ['tables', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.floor !== undefined) searchParams.append('floor', params.floor.toString());
      if (params?.section) searchParams.append('section', params.section);

      const response = await fetch(`${API_URL}?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      
      return response.json() as Promise<Table[]>;
    },
  });
}

export function useTable(id: string) {
  return useQuery({
    queryKey: ['table', id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch table');
      }
      
      return response.json() as Promise<Table>;
    },
    enabled: !!id,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tableData: Partial<Table>) => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(tableData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create table');
      }
      
      return response.json() as Promise<Table>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Table> }) => {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update table');
      }
      
      return response.json() as Promise<Table>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table', data._id] });
    },
  });
}

export function useUpdateTableStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update table status');
      }
      
      return response.json() as Promise<Table>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table', data._id] });
    },
  });
}

export function useDeleteTable() {
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
        throw new Error('Failed to delete table');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}