import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export interface ScheduledReport {
  _id: string;
  tenantId: string;
  createdBy: string;
  title: string;
  description?: string;
  reportType: 'sales' | 'menu-performance' | 'customer-analytics' | 'financial-summary' | 'staff-performance' | 'branch-performance';
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  cronExpression?: string;
  recipients: string[];
  format: 'pdf' | 'excel';
  parameters: {
    branchId?: string;
    dateRange?: 'auto' | number;
    includeCharts?: boolean;
    includeDetails?: boolean;
    customFilters?: Record<string, any>;
  };
  scheduledTime: {
    hour: number;
    minute: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  timezone: string;
  isActive: boolean;
  nextRun?: string;
  lastRun?: string;
  lastSuccess?: string;
  lastFailure?: string;
  failureCount: number;
  maxFailures: number;
  totalRuns: number;
  successfulRuns: number;
  successRate?: number;
  status: 'scheduled' | 'active' | 'inactive' | 'failed' | 'ready';
  executionHistory?: ScheduledReportExecution[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledReportExecution {
  runDate: string;
  status: 'success' | 'failure';
  error?: string;
  reportId?: string;
  executionTime?: number;
  recipientCount?: number;
}

export interface CreateScheduledReportRequest {
  title: string;
  description?: string;
  reportType: string;
  frequency: string;
  cronExpression?: string;
  recipients: string[];
  format: 'pdf' | 'excel';
  scheduledTime: {
    hour: number;
    minute: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  timezone: string;
  parameters: {
    branchId?: string;
    dateRange?: 'auto' | number;
    includeCharts?: boolean;
    includeDetails?: boolean;
    customFilters?: Record<string, any>;
  };
  maxFailures?: number;
}

export interface UpdateScheduledReportRequest extends CreateScheduledReportRequest {
  isActive?: boolean;
}

export interface ScheduleToggleRequest {
  scheduleId: string;
  isActive: boolean;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface DashboardSummary {
  summary: {
    totalSchedules: number;
    activeSchedules: number;
    recentExecutions: number;
    failedSchedules: number;
  };
  upcomingSchedules: Array<{
    _id: string;
    title: string;
    reportType: string;
    nextRun: string;
  }>;
  recentActivity: Array<{
    _id: string;
    title: string;
    reportType: string;
    runDate: string;
    status: 'success' | 'failure';
    executionTime?: number;
    recipientCount?: number;
  }>;
}

// Query hooks
export const useScheduledReports = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  reportType?: string;
  isActive?: boolean;
}) => {
  return useQuery({
    queryKey: ['scheduled-reports', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.status) searchParams.append('status', params.status);
      if (params?.reportType) searchParams.append('reportType', params.reportType);
      if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

      const response = await api.get(`/scheduler/reports?${searchParams.toString()}`);
      return response.data.data as ScheduledReport[];
    },
  });
};

export const useScheduledReport = (id: string) => {
  return useQuery({
    queryKey: ['scheduled-report', id],
    queryFn: async () => {
      const response = await api.get(`/scheduler/reports/${id}`);
      return response.data.data as ScheduledReport;
    },
    enabled: !!id,
  });
};

export const useScheduleExecutionHistory = (id: string, params?: {
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['schedule-execution-history', id, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const response = await api.get(`/scheduler/reports/${id}/history?${searchParams.toString()}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useQueueStats = () => {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      const response = await api.get('/scheduler/queue/stats');
      return response.data.data as {
        queueStats: QueueStats;
        recentJobs: any[];
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['scheduler-dashboard-summary'],
    queryFn: async () => {
      const response = await api.get('/scheduler/dashboard');
      return response.data.data as DashboardSummary;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};

// Mutation hooks
export const useCreateScheduledReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateScheduledReportRequest) => {
      const response = await api.post('/scheduler/reports', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-dashboard-summary'] });
    },
  });
};

export const useUpdateScheduledReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateScheduledReportRequest }) => {
      const response = await api.put(`/scheduler/reports/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-report', id] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-dashboard-summary'] });
    },
  });
};

export const useToggleScheduledReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduleId, isActive }: ScheduleToggleRequest) => {
      const response = await api.post(`/scheduler/reports/${scheduleId}/toggle`, {
        isActive,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-dashboard-summary'] });
    },
  });
};

export const useRunScheduledReportNow = () => {
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await api.post(`/scheduler/reports/${scheduleId}/run`);
      return response.data.data;
    },
  });
};

export const useDeleteScheduledReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await api.delete(`/scheduler/reports/${scheduleId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-dashboard-summary'] });
    },
  });
};

// Combined action hooks for convenience
export const useScheduledReportActions = () => {
  return {
    toggleScheduleMutation: useToggleScheduledReport(),
    runNowMutation: useRunScheduledReportNow(),
    deleteScheduleMutation: useDeleteScheduledReport(),
    createMutation: useCreateScheduledReport(),
    updateMutation: useUpdateScheduledReport(),
  };
};

// Utility functions
export const getScheduleStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'blue';
    case 'active':
      return 'green';
    case 'inactive':
      return 'gray';
    case 'failed':
      return 'red';
    case 'ready':
      return 'orange';
    default:
      return 'gray';
  }
};

export const getFrequencyDescription = (frequency: string, scheduledTime: any) => {
  const timeStr = `${scheduledTime.hour.toString().padStart(2, '0')}:${scheduledTime.minute.toString().padStart(2, '0')}`;
  
  switch (frequency) {
    case 'daily':
      return `Daily at ${timeStr}`;
    case 'weekly':
      const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayName = dayNames[scheduledTime.dayOfWeek] || 'Unknown';
      return `Weekly on ${dayName} at ${timeStr}`;
    case 'monthly':
      const dayOfMonth = scheduledTime.dayOfMonth || 1;
      const suffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th';
      return `Monthly on the ${dayOfMonth}${suffix} at ${timeStr}`;
    case 'custom':
      return 'Custom schedule';
    default:
      return 'Unknown frequency';
  }
};

export const validateScheduleForm = (data: Partial<CreateScheduledReportRequest>) => {
  const errors: Record<string, string> = {};

  if (!data.title?.trim()) {
    errors.title = 'Title is required';
  }

  if (!data.reportType) {
    errors.reportType = 'Report type is required';
  }

  if (!data.frequency) {
    errors.frequency = 'Frequency is required';
  }

  if (data.frequency === 'custom' && !data.cronExpression?.trim()) {
    errors.cronExpression = 'Cron expression is required for custom frequency';
  }

  if (!data.recipients || data.recipients.length === 0) {
    errors.recipients = 'At least one recipient is required';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = data.recipients.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      errors.recipients = `Invalid email addresses: ${invalidEmails.join(', ')}`;
    }
  }

  if (!data.format) {
    errors.format = 'Report format is required';
  }

  if (data.scheduledTime) {
    if (data.scheduledTime.hour < 0 || data.scheduledTime.hour > 23) {
      errors.hour = 'Hour must be between 0 and 23';
    }
    if (data.scheduledTime.minute < 0 || data.scheduledTime.minute > 59) {
      errors.minute = 'Minute must be between 0 and 59';
    }
    if (data.frequency === 'weekly' && (!data.scheduledTime.dayOfWeek || data.scheduledTime.dayOfWeek < 1 || data.scheduledTime.dayOfWeek > 7)) {
      errors.dayOfWeek = 'Day of week must be between 1 (Monday) and 7 (Sunday)';
    }
    if (data.frequency === 'monthly' && (!data.scheduledTime.dayOfMonth || data.scheduledTime.dayOfMonth < 1 || data.scheduledTime.dayOfMonth > 31)) {
      errors.dayOfMonth = 'Day of month must be between 1 and 31';
    }
  }

  if (!data.timezone?.trim()) {
    errors.timezone = 'Timezone is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};