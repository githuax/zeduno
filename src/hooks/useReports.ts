import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/utils/api';
import { API_BASE_URL } from '@/config/api';

// Report Types
export type ReportType = 
  | 'sales'
  | 'menu-performance'
  | 'customer-analytics'
  | 'financial-summary'
  | 'staff-performance'
  | 'branch-performance';

export type ReportFormat = 'pdf' | 'excel' | 'csv';

// Report Request Interfaces
export interface BaseReportRequest {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  format: ReportFormat;
  branchId?: string;
  branchIds?: string[];
  fileName?: string;
  includeCharts?: boolean;
  includeDetails?: boolean;
  period?: 'daily' | 'weekly' | 'monthly';
}

export interface SalesReportRequest extends BaseReportRequest {
  orderType?: 'dine-in' | 'takeaway' | 'delivery';
  paymentMethod?: 'cash' | 'card' | 'upi' | 'wallet' | 'online' | 'mpesa' | 'stripe' | 'square';
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  timezone?: string;
  currency?: string;
}

export interface MenuPerformanceReportRequest extends BaseReportRequest {
  categoryId?: string;
}

export interface CustomerAnalyticsReportRequest extends BaseReportRequest {}

export interface FinancialSummaryReportRequest extends BaseReportRequest {}

export interface StaffPerformanceReportRequest extends BaseReportRequest {}

export interface BranchPerformanceReportRequest extends BaseReportRequest {}

// Report Response Interfaces
export interface ReportGenerationResponse {
  success: boolean;
  data?: {
    fileName: string;
    downloadUrl: string;
    reportData?: any; // For UI display if needed
  };
  error?: string;
  message?: string;
}

export interface ReportType_Info {
  type: ReportType;
  name: string;
  description: string;
  requiredRole: string[];
  formats: ReportFormat[];
}

export interface Branch {
  _id: string;
  name: string;
  code: string;
  tenantId?: string;
}

// API Functions
const reportAPI = {
  // Generate specific report types
  generateSalesReport: (data: SalesReportRequest): Promise<ReportGenerationResponse> =>
    apiRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateMenuPerformanceReport: (data: MenuPerformanceReportRequest): Promise<ReportGenerationResponse> =>
    apiRequest('/reports/menu-performance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateCustomerAnalyticsReport: (data: CustomerAnalyticsReportRequest): Promise<ReportGenerationResponse> =>
    apiRequest('/reports/customer-analytics', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateFinancialSummaryReport: (data: FinancialSummaryReportRequest): Promise<ReportGenerationResponse> =>
    apiRequest('/reports/financial-summary', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateStaffPerformanceReport: (data: StaffPerformanceReportRequest): Promise<ReportGenerationResponse> =>
    apiRequest('/reports/staff-performance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateBranchPerformanceReport: (data: BranchPerformanceReportRequest): Promise<ReportGenerationResponse> =>
    apiRequest('/reports/branch-performance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Utility endpoints
  getReportTypes: (): Promise<{ success: boolean; reports: ReportType_Info[] }> =>
    apiRequest('/reports/types'),

  getUserBranches: (): Promise<{ success: boolean; branches: Branch[] }> =>
    apiRequest('/reports/branches'),

  // Download report file
  downloadReport: (fileName: string): Promise<Blob> =>
    fetch(`${API_BASE_URL}/reports/download/${fileName}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      return response.blob();
    }),
};

// Custom Hooks
export const useReportTypes = () => {
  return useQuery({
    queryKey: ['report-types'],
    queryFn: reportAPI.getReportTypes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserBranches = () => {
  return useQuery({
    queryKey: ['user-branches'],
    queryFn: reportAPI.getUserBranches,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Generic report generation hook
export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, data }: { type: ReportType; data: BaseReportRequest }) => {
      switch (type) {
        case 'sales':
          return reportAPI.generateSalesReport(data as SalesReportRequest);
        case 'menu-performance':
          return reportAPI.generateMenuPerformanceReport(data as MenuPerformanceReportRequest);
        case 'customer-analytics':
          return reportAPI.generateCustomerAnalyticsReport(data as CustomerAnalyticsReportRequest);
        case 'financial-summary':
          return reportAPI.generateFinancialSummaryReport(data as FinancialSummaryReportRequest);
        case 'staff-performance':
          return reportAPI.generateStaffPerformanceReport(data as StaffPerformanceReportRequest);
        case 'branch-performance':
          return reportAPI.generateBranchPerformanceReport(data as BranchPerformanceReportRequest);
        default:
          throw new Error(`Unknown report type: ${type}`);
      }
    },
    onSuccess: () => {
      // Invalidate any cached data that might be affected
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

// Specific report hooks for individual use
export const useSalesReport = () => {
  return useMutation({
    mutationFn: reportAPI.generateSalesReport,
  });
};

export const useMenuPerformanceReport = () => {
  return useMutation({
    mutationFn: reportAPI.generateMenuPerformanceReport,
  });
};

export const useCustomerAnalyticsReport = () => {
  return useMutation({
    mutationFn: reportAPI.generateCustomerAnalyticsReport,
  });
};

export const useFinancialSummaryReport = () => {
  return useMutation({
    mutationFn: reportAPI.generateFinancialSummaryReport,
  });
};

export const useStaffPerformanceReport = () => {
  return useMutation({
    mutationFn: reportAPI.generateStaffPerformanceReport,
  });
};

export const useBranchPerformanceReport = () => {
  return useMutation({
    mutationFn: reportAPI.generateBranchPerformanceReport,
  });
};

// Download report file hook
export const useDownloadReport = () => {
  return useMutation({
    mutationFn: async (fileName: string) => {
      const blob = await reportAPI.downloadReport(fileName);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return fileName;
    },
  });
};

// Utility function to map frontend template IDs to backend report types
export const mapTemplateToReportType = (templateId: string): ReportType => {
  const mapping: Record<string, ReportType> = {
    'daily-sales': 'sales',
    'customer-analytics': 'customer-analytics',
    'operational-summary': 'staff-performance', // closest match
    'financial-overview': 'financial-summary',
    'inventory-report': 'menu-performance', // closest match
    'custom-report': 'sales', // default to sales for custom reports
  };
  
  return mapping[templateId] || 'sales';
};

// Utility function to build report request from UI state
export const buildReportRequest = (
  templateId: string,
  dateRange: { from?: Date; to?: Date } | undefined,
  format: ReportFormat,
  selectedFields: string[],
  branchId?: string
): BaseReportRequest => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return {
    startDate: dateRange?.from?.toISOString() || thirtyDaysAgo.toISOString(),
    endDate: dateRange?.to?.toISOString() || now.toISOString(),
    format,
    branchId,
    includeCharts: true,
    includeDetails: true,
    period: 'daily',
  };
};

// Error handling utility
export const handleReportError = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred while generating the report';
};