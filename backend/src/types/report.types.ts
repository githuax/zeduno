import mongoose from 'mongoose';

// Base interfaces for common report data
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ReportFilters extends DateRange {
  branchId?: string;
  branchIds?: string[];
  tenantId: string;
  orderType?: 'dine-in' | 'takeaway' | 'delivery';
  paymentMethod?: 'cash' | 'card' | 'upi' | 'wallet' | 'online' | 'mpesa' | 'stripe' | 'square';
  status?: string[];
  categoryId?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface ReportConfig {
  format: 'pdf' | 'excel';
  fileName?: string;
  includeCharts?: boolean;
  includeDetails?: boolean;
  groupBy?: 'day' | 'week' | 'month' | 'branch' | 'category' | 'paymentMethod';
  sortBy?: 'date' | 'revenue' | 'orders' | 'name';
  sortOrder?: 'asc' | 'desc';
  timezone?: string;
  currency?: string;
}

// Sales Report Types
export interface SalesMetrics {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalItems: number;
  totalCustomers: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  grossRevenue: number;
  netRevenue: number;
  taxAmount: number;
  discountAmount: number;
  tipAmount: number;
  serviceChargeAmount: number;
}

export interface SalesByPeriod extends SalesMetrics {
  period: string;
  date: Date;
  formattedDate?: string;
}

export interface SalesByBranch extends SalesMetrics {
  branchId: string;
  branchName: string;
  branchCode: string;
}

export interface SalesByPaymentMethod extends SalesMetrics {
  paymentMethod: string;
  percentage: number;
}

export interface SalesReportData {
  summary: SalesMetrics;
  byPeriod: SalesByPeriod[];
  byBranch: SalesByBranch[];
  byPaymentMethod: SalesByPaymentMethod[];
  byOrderType: {
    orderType: string;
    orders: number;
    revenue: number;
    percentage: number;
  }[];
  topPerformingHours: {
    hour: number;
    orders: number;
    revenue: number;
  }[];
  filters: ReportFilters;
  generatedAt: Date;
  totalPages?: number;
}

// Menu Performance Report Types
export interface MenuItemMetrics {
  itemId: string;
  itemName: string;
  categoryName: string;
  totalOrdered: number;
  totalRevenue: number;
  avgPrice: number;
  popularity: number;
  profitMargin?: number;
  stockTurns?: number;
  lastOrdered?: Date;
}

export interface CategoryMetrics {
  categoryId: string;
  categoryName: string;
  totalItems: number;
  totalOrdered: number;
  totalRevenue: number;
  avgItemsPerOrder: number;
  popularityScore: number;
}

export interface MenuPerformanceReportData {
  summary: {
    totalMenuItems: number;
    totalCategories: number;
    totalOrderedItems: number;
    topSellingItem: MenuItemMetrics;
    leastSellingItem: MenuItemMetrics;
    mostProfitableCategory: CategoryMetrics;
  };
  topPerformingItems: MenuItemMetrics[];
  underperformingItems: MenuItemMetrics[];
  categoryPerformance: CategoryMetrics[];
  itemsByCategory: {
    categoryName: string;
    items: MenuItemMetrics[];
  }[];
  stockAlerts: {
    itemId: string;
    itemName: string;
    currentStock: number;
    minStockLevel: number;
    status: 'low' | 'out';
  }[];
  filters: ReportFilters;
  generatedAt: Date;
}

// Customer Analytics Report Types
export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  avgOrdersPerCustomer: number;
  avgRevenuePerCustomer: number;
  customerRetentionRate: number;
  churnRate: number;
}

export interface CustomerSegment {
  segment: string;
  customerCount: number;
  totalRevenue: number;
  avgOrderValue: number;
  percentage: number;
}

export interface CustomerBehavior {
  preferredOrderType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  preferredPaymentMethod: {
    method: string;
    count: number;
    percentage: number;
  }[];
  orderFrequency: {
    frequency: string;
    customerCount: number;
  }[];
  avgOrderTime: {
    hour: number;
    orderCount: number;
  }[];
}

export interface CustomerAnalyticsReportData {
  summary: CustomerMetrics;
  segments: CustomerSegment[];
  behavior: CustomerBehavior;
  topCustomers: {
    customerId: string;
    customerName: string;
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderDate: Date;
  }[];
  customerFeedback: {
    avgRating: number;
    totalReviews: number;
    ratingDistribution: {
      rating: number;
      count: number;
      percentage: number;
    }[];
  };
  filters: ReportFilters;
  generatedAt: Date;
}

// Financial Summary Report Types
export interface FinancialMetrics {
  grossRevenue: number;
  netRevenue: number;
  totalTax: number;
  totalDiscounts: number;
  totalTips: number;
  totalServiceCharges: number;
  totalRefunds: number;
  operatingRevenue: number;
  avgTransactionValue: number;
  totalTransactions: number;
}

export interface FinancialByPeriod extends FinancialMetrics {
  period: string;
  date: Date;
}

export interface PaymentMethodBreakdown {
  paymentMethod: string;
  transactionCount: number;
  totalAmount: number;
  percentage: number;
  avgTransactionValue: number;
  successRate: number;
  failureRate: number;
}

export interface FinancialSummaryReportData {
  summary: FinancialMetrics;
  byPeriod: FinancialByPeriod[];
  byBranch: {
    branchId: string;
    branchName: string;
    metrics: FinancialMetrics;
    contribution: number;
  }[];
  paymentMethods: PaymentMethodBreakdown[];
  taxBreakdown: {
    taxType: string;
    amount: number;
    percentage: number;
  }[];
  discountAnalysis: {
    discountType: string;
    totalDiscount: number;
    orderCount: number;
    avgDiscountPerOrder: number;
  }[];
  filters: ReportFilters;
  generatedAt: Date;
}

// Staff Performance Report Types
export interface StaffMetrics {
  staffId: string;
  staffName: string;
  role: string;
  branchName: string;
  ordersProcessed: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgProcessingTime: number;
  customerRating?: number;
  hoursWorked?: number;
  productivity: number;
}

export interface StaffPerformanceReportData {
  summary: {
    totalStaff: number;
    activeStaff: number;
    avgOrdersPerStaff: number;
    avgRevenuePerStaff: number;
    topPerformer: StaffMetrics;
  };
  staffPerformance: StaffMetrics[];
  performanceByBranch: {
    branchId: string;
    branchName: string;
    staffCount: number;
    totalOrders: number;
    avgPerformance: number;
  }[];
  performanceByRole: {
    role: string;
    staffCount: number;
    avgOrdersProcessed: number;
    avgRevenue: number;
  }[];
  filters: ReportFilters;
  generatedAt: Date;
}

// Branch Performance Report Types
export interface BranchMetrics extends SalesMetrics {
  branchId: string;
  branchName: string;
  branchCode: string;
  staffCount: number;
  avgOrderProcessingTime: number;
  customerSatisfactionScore?: number;
  marketShare: number;
  growthRate: number;
}

export interface BranchPerformanceReportData {
  summary: {
    totalBranches: number;
    activeBranches: number;
    totalRevenue: number;
    avgRevenuePerBranch: number;
    topPerformingBranch: BranchMetrics;
    fastestGrowingBranch: BranchMetrics;
  };
  branchPerformance: BranchMetrics[];
  performanceComparison: {
    metric: string;
    branches: {
      branchId: string;
      branchName: string;
      value: number;
      rank: number;
    }[];
  }[];
  regionalAnalysis?: {
    region: string;
    branchCount: number;
    totalRevenue: number;
    avgPerformance: number;
  }[];
  filters: ReportFilters;
  generatedAt: Date;
}

// Union type for all report data
export type ReportData = 
  | SalesReportData 
  | MenuPerformanceReportData 
  | CustomerAnalyticsReportData 
  | FinancialSummaryReportData 
  | StaffPerformanceReportData 
  | BranchPerformanceReportData;

// Report type identifier
export type ReportType = 
  | 'sales' 
  | 'menu-performance' 
  | 'customer-analytics' 
  | 'financial-summary' 
  | 'staff-performance' 
  | 'branch-performance';

// Template context for handlebars
export interface ReportTemplateContext {
  title: string;
  subtitle?: string;
  data: ReportData;
  config: ReportConfig;
  companyInfo: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  generatedBy: {
    userId: string;
    userName: string;
    userRole: string;
  };
  generatedAt: Date;
  formattedGeneratedAt: string;
}

// Excel worksheet configuration
export interface ExcelWorksheetConfig {
  name: string;
  data: any[];
  columns: {
    header: string;
    key: string;
    width?: number;
    style?: any;
  }[];
  chartConfig?: {
    type: 'line' | 'bar' | 'pie' | 'doughnut';
    title: string;
    dataRange: string;
    position: {
      row: number;
      column: number;
    };
    size: {
      width: number;
      height: number;
    };
  };
}

// API Response types
export interface ReportGenerationRequest {
  type: ReportType;
  filters: ReportFilters;
  config: ReportConfig;
}

export interface ReportGenerationResponse {
  success: boolean;
  reportId: string;
  fileName: string;
  downloadUrl: string;
  filePath: string;
  generatedAt: Date;
  expiresAt: Date;
  error?: string;
}

// Error types
export class ReportError extends Error {
  constructor(
    message: string, 
    public code: string = 'REPORT_ERROR',
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ReportError';
  }
}

export class ReportValidationError extends ReportError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ReportValidationError';
  }
}

export class ReportGenerationError extends ReportError {
  constructor(message: string) {
    super(message, 'GENERATION_ERROR', 500);
    this.name = 'ReportGenerationError';
  }
}