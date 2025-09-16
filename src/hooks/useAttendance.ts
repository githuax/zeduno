import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Attendance, AttendanceStatus, ClockInOutInput } from '@/types/staff.types';

const API_BASE = '/api';

interface UseAttendanceOptions {
  employeeId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}

interface AttendanceResponse {
  attendance: Attendance[];
  total: number;
}

const fetchAttendance = async (options: UseAttendanceOptions = {}): Promise<Attendance[]> => {
  const params = new URLSearchParams();
  
  if (options.employeeId) params.append('employeeId', options.employeeId);
  if (options.date) params.append('date', options.date);
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.endDate) params.append('endDate', options.endDate);
  if (options.status) params.append('status', options.status);

  const response = await fetch(`${API_BASE}/attendance?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch attendance');
  }

  const data: AttendanceResponse = await response.json();
  return data.attendance || data as any; // Handle both array and object responses
};

const fetchAttendanceRecord = async (id: string): Promise<Attendance> => {
  const response = await fetch(`${API_BASE}/attendance/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch attendance record');
  }

  return response.json();
};

const clockIn = async (data: ClockInOutInput): Promise<Attendance> => {
  const response = await fetch(`${API_BASE}/attendance/clock-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({
      ...data,
      type: 'clock_in',
      timestamp: data.timestamp || new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to clock in');
  }

  return response.json();
};

const clockOut = async (data: ClockInOutInput): Promise<Attendance> => {
  const response = await fetch(`${API_BASE}/attendance/clock-out`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({
      ...data,
      type: 'clock_out',
      timestamp: data.timestamp || new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to clock out');
  }

  return response.json();
};

const startBreak = async (data: ClockInOutInput): Promise<Attendance> => {
  const response = await fetch(`${API_BASE}/attendance/break-start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({
      ...data,
      type: 'break_start',
      timestamp: data.timestamp || new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start break');
  }

  return response.json();
};

const endBreak = async (data: ClockInOutInput): Promise<Attendance> => {
  const response = await fetch(`${API_BASE}/attendance/break-end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({
      ...data,
      type: 'break_end',
      timestamp: data.timestamp || new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to end break');
  }

  return response.json();
};

const createManualEntry = async (data: {
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  notes?: string;
}): Promise<Attendance> => {
  const response = await fetch(`${API_BASE}/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create attendance entry');
  }

  return response.json();
};

const updateAttendance = async ({ id, data }: { 
  id: string; 
  data: Partial<Attendance> 
}): Promise<Attendance> => {
  const response = await fetch(`${API_BASE}/attendance/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update attendance');
  }

  return response.json();
};

const deleteAttendance = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/attendance/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete attendance record');
  }
};

export const useAttendance = (options: UseAttendanceOptions = {}) => {
  return useQuery({
    queryKey: ['attendance', options],
    queryFn: () => fetchAttendance(options),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useAttendanceRecord = (id: string) => {
  return useQuery({
    queryKey: ['attendance', id],
    queryFn: () => fetchAttendanceRecord(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
};

export const useClockIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clockIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useClockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clockOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useStartBreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startBreak,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useEndBreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endBreak,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useCreateManualEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createManualEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAttendance,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', data._id] });
    },
  });
};

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

// Attendance stats hook
export const useAttendanceStats = (options: UseAttendanceOptions = {}) => {
  return useQuery({
    queryKey: ['attendance-stats', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (options.employeeId) params.append('employeeId', options.employeeId);
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);

      const response = await fetch(`${API_BASE}/attendance/stats?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance stats');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Employee attendance summary for a specific employee
export const useEmployeeAttendanceSummary = (employeeId: string, options: { startDate?: string; endDate?: string } = {}) => {
  return useQuery({
    queryKey: ['employee-attendance-summary', employeeId, options],
    queryFn: async () => {
      const params = new URLSearchParams({ employeeId });
      
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);

      const response = await fetch(`${API_BASE}/attendance/employee/${employeeId}/summary?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employee attendance summary');
      }

      return response.json();
    },
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};