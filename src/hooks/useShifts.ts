import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shift, CreateShiftInput, UpdateShiftInput, ShiftStatus } from '@/types/staff.types';

const API_BASE = '/api';

interface UseShiftsOptions {
  employeeId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: ShiftStatus;
}

interface ShiftsResponse {
  shifts: Shift[];
  total: number;
}

const fetchShifts = async (options: UseShiftsOptions = {}): Promise<Shift[]> => {
  const params = new URLSearchParams();
  
  if (options.employeeId) params.append('employeeId', options.employeeId);
  if (options.date) params.append('date', options.date);
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.endDate) params.append('endDate', options.endDate);
  if (options.status) params.append('status', options.status);

  const response = await fetch(`${API_BASE}/shifts?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch shifts');
  }

  const data: ShiftsResponse = await response.json();
  return data.shifts || data as any; // Handle both array and object responses
};

const fetchShift = async (id: string): Promise<Shift> => {
  const response = await fetch(`${API_BASE}/shifts/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch shift');
  }

  return response.json();
};

const createShift = async (shiftData: CreateShiftInput): Promise<Shift> => {
  const response = await fetch(`${API_BASE}/shifts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(shiftData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create shift');
  }

  return response.json();
};

const updateShift = async ({ id, data }: { id: string; data: UpdateShiftInput }): Promise<Shift> => {
  const response = await fetch(`${API_BASE}/shifts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update shift');
  }

  return response.json();
};

const deleteShift = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/shifts/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete shift');
  }
};

const startShift = async (id: string): Promise<Shift> => {
  const response = await fetch(`${API_BASE}/shifts/${id}/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start shift');
  }

  return response.json();
};

const endShift = async (id: string): Promise<Shift> => {
  const response = await fetch(`${API_BASE}/shifts/${id}/end`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to end shift');
  }

  return response.json();
};

const startBreak = async (id: string): Promise<Shift> => {
  const response = await fetch(`${API_BASE}/shifts/${id}/break/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start break');
  }

  return response.json();
};

const endBreak = async (id: string): Promise<Shift> => {
  const response = await fetch(`${API_BASE}/shifts/${id}/break/end`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to end break');
  }

  return response.json();
};

export const useShifts = (options: UseShiftsOptions = {}) => {
  return useQuery({
    queryKey: ['shifts', options],
    queryFn: () => fetchShifts(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useShift = (id: string) => {
  return useQuery({
    queryKey: ['shift', id],
    queryFn: () => fetchShift(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShift,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift', data._id] });
    },
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useStartShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startShift,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift', data._id] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

export const useEndShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endShift,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift', data._id] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

export const useStartBreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startBreak,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift', data._id] });
    },
  });
};

export const useEndBreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endBreak,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift', data._id] });
    },
  });
};

// Shift stats hook
export const useShiftStats = (options: UseShiftsOptions = {}) => {
  return useQuery({
    queryKey: ['shift-stats', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (options.employeeId) params.append('employeeId', options.employeeId);
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);

      const response = await fetch(`${API_BASE}/shifts/stats?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shift stats');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};