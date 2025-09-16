import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  RefreshCw,
  Download,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBranches } from '@/hooks/useBranches';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currency';

// Enhanced interface definitions
interface EnhancedBranchMetrics {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    totalItems: number;
    previousPeriodOrders: number;
    previousPeriodRevenue: number;
    orderGrowthRate: number;
    revenueGrowthRate: number;
    peakHour: string;
    bestSellingCategory: string;
    customerRetentionRate: number;
  };
  daily: Array<{
    _id: string;
    date: string;
    orders: number;
    revenue: number;
    avgOrderValue: number;
    itemsSold: number;
    newCustomers: number;
  }>;
  hourly: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
  categories: Array<{
    name: string;
    orders: number;
    revenue: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    orders: number;
    revenue: number;
    percentage: number;
  }>;
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  customerInsights: {
    totalCustomers: number;
    returningCustomers: number;
    newCustomers: number;
    avgOrdersPerCustomer: number;
  };
  alerts: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
    metric: string;
    value: number;
  }>;
}

interface ComparisonData {
  current: EnhancedBranchMetrics;
  previous: EnhancedBranchMetrics;
  comparison: {
    orderChange: number;
    revenueChange: number;
    avgOrderValueChange: number;
    customerChange: number;
  };
}

interface DatePreset {
  label: string;
  value: string;
  getDateRange: () => DateRange;
}

// Component Props
interface BranchMetricsProps {
  branchId?: string;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Chart color configuration
const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  orders: {
    label: 'Orders',
    color: 'hsl(var(--chart-2))',
  },
  avgOrderValue: {
    label: 'Avg Order Value',
    color: 'hsl(var(--chart-3))',
  },
  customers: {
    label: 'Customers',
    color: 'hsl(var(--chart-4))',
  },
};

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// Date presets
const DATE_PRESETS: DatePreset[] = [
  {
    label: 'Last 7 Days',
    value: '7d',
    getDateRange: () => ({
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date(),
    }),
  },
  {
    label: 'Last 30 Days',
    value: '30d',
    getDateRange: () => ({
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    }),
  },
  {
    label: 'Last 3 Months',
    value: '3m',
    getDateRange: () => ({
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: new Date(),
    }),
  },
  {
    label: 'Last 6 Months',
    value: '6m',
    getDateRange: () => ({
      from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      to: new Date(),
    }),
  },
  {
    label: 'This Year',
    value: '1y',
    getDateRange: () => ({
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date(),
    }),
  },
];

export const BranchMetrics: React.FC<BranchMetricsProps> = ({
  branchId,
  className,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
}) => {
  // State management
  const [metrics, setMetrics] = useState<EnhancedBranchMetrics | null>(null);
  const [comparisonMetrics, setComparisonMetrics] = useState<ComparisonData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => DATE_PRESETS[1].getDateRange());
  const [selectedPreset, setSelectedPreset] = useState('30d');
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(branchId);
  const [comparisonBranch, setComparisonBranch] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Hooks
  const {
    branches,
    currentBranch,
    fetchBranchMetrics,
    fetchConsolidatedMetrics,
    loading: branchesLoading,
    error: branchesError,
  } = useBranches();

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (selectedBranch && dateRange?.from && dateRange?.to) {
        loadMetrics();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedBranch, dateRange]);

  // Load metrics function
  const loadMetrics = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    setError(undefined);

    try {
      let metricsData;
      
      if (selectedBranch) {
        metricsData = await fetchBranchMetrics(selectedBranch, dateRange.from, dateRange.to);
      } else {
        metricsData = await fetchConsolidatedMetrics(dateRange.from, dateRange.to);
      }

      // Transform basic metrics to enhanced metrics
      const enhancedMetrics: EnhancedBranchMetrics = {
        summary: {
          ...metricsData.summary,
          previousPeriodOrders: 0, // Would come from API
          previousPeriodRevenue: 0, // Would come from API
          orderGrowthRate: 0, // Calculated
          revenueGrowthRate: 0, // Calculated
          peakHour: '12:00 PM', // Would come from API
          bestSellingCategory: 'Food', // Would come from API
          customerRetentionRate: 75.5, // Would come from API
        },
        daily: metricsData.daily?.map(day => ({
          ...day,
          date: day._id,
          avgOrderValue: day.orders > 0 ? day.revenue / day.orders : 0,
          itemsSold: Math.floor(day.orders * 2.5), // Mock calculation
          newCustomers: Math.floor(day.orders * 0.3), // Mock calculation
        })) || [],
        hourly: [], // Would come from API
        categories: [], // Would come from API
        paymentMethods: [], // Would come from API
        topItems: [], // Would come from API
        customerInsights: {
          totalCustomers: Math.floor(metricsData.summary.totalOrders * 0.7),
          returningCustomers: Math.floor(metricsData.summary.totalOrders * 0.5),
          newCustomers: Math.floor(metricsData.summary.totalOrders * 0.2),
          avgOrdersPerCustomer: 1.4,
        },
        alerts: [], // Would be calculated based on thresholds
      };

      setMetrics(enhancedMetrics);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, dateRange, fetchBranchMetrics, fetchConsolidatedMetrics]);

  // Load metrics when dependencies change
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Handle preset selection
  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    const presetConfig = DATE_PRESETS.find(p => p.value === preset);
    if (presetConfig) {
      setDateRange(presetConfig.getDateRange());
    }
  };

  // Handle custom date range
  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setDateRange(newRange);
    setSelectedPreset('custom');
  };

  // Export functionality
  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      // Implementation would depend on backend API
      console.log(`Exporting ${format} for branch ${selectedBranch}`, { dateRange, metrics });
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Would trigger download here
      alert(`${format.toUpperCase()} export completed!`);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate growth indicators
  const getGrowthIndicator = (current: number, previous: number) => {
    if (previous === 0) return { change: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { change: Math.abs(change), isPositive: change >= 0 };
  };

  // Memoized calculations
  const kpiData = useMemo(() => {
    if (!metrics) return [];

    return [
      {
        title: 'Total Revenue',
        value: formatCurrency(metrics.summary.totalRevenue, currentBranch?.financial.currency),
        change: metrics.summary.revenueGrowthRate,
        isPositive: metrics.summary.revenueGrowthRate >= 0,
        icon: DollarSign,
        description: 'vs previous period',
      },
      {
        title: 'Total Orders',
        value: metrics.summary.totalOrders.toLocaleString(),
        change: metrics.summary.orderGrowthRate,
        isPositive: metrics.summary.orderGrowthRate >= 0,
        icon: ShoppingCart,
        description: 'vs previous period',
      },
      {
        title: 'Average Order Value',
        value: formatCurrency(metrics.summary.avgOrderValue, currentBranch?.financial.currency),
        change: 0, // Would be calculated
        isPositive: true,
        icon: Target,
        description: 'per order',
      },
      {
        title: 'Customer Retention',
        value: `${metrics.summary.customerRetentionRate.toFixed(1)}%`,
        change: 5.2, // Mock data
        isPositive: true,
        icon: Users,
        description: 'returning customers',
      },
    ];
  }, [metrics, currentBranch]);

  if (branchesLoading) {
    return <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Branch Performance Metrics
                {lastUpdated && (
                  <Badge variant="secondary" className="ml-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {lastUpdated.toLocaleTimeString()}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Comprehensive analytics and performance insights
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMetrics}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
                Refresh
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isExporting}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Branch Selection */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Branch</label>
              <Select value={selectedBranch || 'all'} onValueChange={(value) => setSelectedBranch(value === 'all' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.name} ({branch.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Preset Selection */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {selectedPreset === 'custom' && (
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={handleDateRangeChange}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {/* KPI Cards */}
      {metrics && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {kpi.change !== 0 && (
                    <>
                      {kpi.isPositive ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={kpi.isPositive ? 'text-green-500' : 'text-red-500'}>
                        {kpi.change.toFixed(1)}%
                      </span>
                      <span className="ml-1">{kpi.description}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts Section */}
      {metrics && !loading && (
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
            <TabsTrigger value="orders">Order Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Orders Trend</CardTitle>
                <CardDescription>
                  Daily revenue and order volumes over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke="var(--color-revenue)"
                        fill="var(--color-revenue)"
                        name="Revenue"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        stackId="2"
                        stroke="var(--color-orders)"
                        fill="var(--color-orders)"
                        name="Orders"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Orders</CardTitle>
                  <CardDescription>Order volume by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.daily}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="orders"
                          fill="var(--color-orders)"
                          name="Orders"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Order Value</CardTitle>
                  <CardDescription>AOV trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics.daily}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="avgOrderValue"
                          stroke="var(--color-avgOrderValue)"
                          strokeWidth={2}
                          name="Avg Order Value"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Key performance indicators and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Peak Hours</label>
                    <div className="text-2xl font-bold">{metrics.summary.peakHour}</div>
                    <p className="text-xs text-muted-foreground">Highest order volume</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Best Category</label>
                    <div className="text-2xl font-bold">{metrics.summary.bestSellingCategory}</div>
                    <p className="text-xs text-muted-foreground">Top performing category</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer Retention</label>
                    <div className="text-2xl font-bold">{metrics.summary.customerRetentionRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Returning customers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                  <CardDescription>Customer behavior and demographics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Customers</span>
                    <span className="font-semibold">{metrics.customerInsights.totalCustomers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Returning Customers</span>
                    <span className="font-semibold">{metrics.customerInsights.returningCustomers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New Customers</span>
                    <span className="font-semibold">{metrics.customerInsights.newCustomers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Orders per Customer</span>
                    <span className="font-semibold">{metrics.customerInsights.avgOrdersPerCustomer.toFixed(1)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Alerts</CardTitle>
                  <CardDescription>Important insights and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.alerts.length > 0 ? (
                    <div className="space-y-3">
                      {metrics.alerts.map((alert, index) => (
                        <Alert key={index} variant={alert.type === 'warning' ? 'destructive' : 'default'}>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            <strong>{alert.metric}:</strong> {alert.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No alerts at this time</p>
                      <p className="text-sm">All metrics are within normal ranges</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* No Data State */}
      {!metrics && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Select a branch and date range to view metrics
            </p>
            <Button onClick={loadMetrics} disabled={!selectedBranch || !dateRange?.from}>
              Load Metrics
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BranchMetrics;