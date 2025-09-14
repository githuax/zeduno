import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Clock,
  MapPin,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  AlertTriangle,
  Info,
  RefreshCw,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types
import { Branch, BranchMetrics } from '@/types/branch.types';

interface BranchMetricsCardProps {
  branch: Branch;
  metrics?: BranchMetrics;
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  onPeriodChange?: (period: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  showComparison?: boolean;
  comparisonData?: {
    previousPeriod: BranchMetrics;
    target?: {
      revenue: number;
      orders: number;
    };
  };
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  subtitle?: string;
  target?: number;
  format?: 'currency' | 'number' | 'percentage';
  currency?: string;
}

// Utility functions
const formatCurrency = (amount: number, currency: string = 'KES'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

const calculateChange = (current: number, previous: number): { value: number; type: 'positive' | 'negative' | 'neutral' } => {
  if (previous === 0) return { value: 0, type: 'neutral' };
  
  const change = ((current - previous) / previous) * 100;
  const type = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
  
  return { value: Math.abs(change), type };
};

const getPerformanceColor = (current: number, target?: number): string => {
  if (!target) return 'text-muted-foreground';
  
  const percentage = (current / target) * 100;
  if (percentage >= 100) return 'text-green-600';
  if (percentage >= 80) return 'text-yellow-600';
  return 'text-red-600';
};

const getProgressValue = (current: number, target?: number): number => {
  if (!target) return 0;
  return Math.min((current / target) * 100, 100);
};

// Metric Card Component
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  subtitle,
  target,
  format = 'number',
  currency = 'KES',
}) => {
  const formattedValue = useMemo(() => {
    if (format === 'currency' && typeof value === 'number') {
      return formatCurrency(value, currency);
    }
    if (format === 'percentage' && typeof value === 'number') {
      return formatPercentage(value);
    }
    if (format === 'number' && typeof value === 'number') {
      return formatNumber(value);
    }
    return value.toString();
  }, [value, format, currency]);

  const targetProgress = target && typeof value === 'number' ? getProgressValue(value, target) : undefined;
  const targetColor = target && typeof value === 'number' ? getPerformanceColor(value, target) : undefined;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${
              changeType === 'positive' ? 'text-green-600' :
              changeType === 'negative' ? 'text-red-600' :
              'text-muted-foreground'
            }`}>
              {changeType === 'positive' ? (
                <TrendingUp className="h-3 w-3" />
              ) : changeType === 'negative' ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {change.toFixed(1)}%
            </div>
          )}
        </div>
        
        <div className={`text-2xl font-bold ${targetColor || ''}`}>
          {formattedValue}
        </div>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}

        {target && targetProgress !== undefined && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Target Progress</span>
              <span>{targetProgress.toFixed(0)}%</span>
            </div>
            <Progress value={targetProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Target: {format === 'currency' ? formatCurrency(target, currency) : formatNumber(target)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Component
export const BranchMetricsCard: React.FC<BranchMetricsCardProps> = ({
  branch,
  metrics,
  period = 'month',
  onPeriodChange,
  onRefresh,
  loading = false,
  showComparison = true,
  comparisonData,
  className = '',
}) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed'>('overview');

  // Calculate changes from previous period
  const changes = useMemo(() => {
    if (!metrics || !comparisonData?.previousPeriod || !showComparison) {
      return {};
    }

    const current = metrics.summary;
    const previous = comparisonData.previousPeriod.summary;

    return {
      revenue: calculateChange(current.totalRevenue, previous.totalRevenue),
      orders: calculateChange(current.totalOrders, previous.totalOrders),
      aov: calculateChange(current.avgOrderValue, previous.avgOrderValue),
      items: calculateChange(current.totalItems, previous.totalItems),
    };
  }, [metrics, comparisonData, showComparison]);

  // Calculate daily averages for the period
  const dailyAverages = useMemo(() => {
    if (!metrics?.daily || metrics.daily.length === 0) return null;
    
    const days = metrics.daily.length;
    const totalRevenue = metrics.daily.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = metrics.daily.reduce((sum, day) => sum + day.orders, 0);
    
    return {
      revenue: totalRevenue / days,
      orders: totalOrders / days,
    };
  }, [metrics]);

  // Performance indicators
  const performanceIndicators = useMemo(() => {
    if (!metrics) return [];

    const indicators = [];
    const { totalRevenue, totalOrders, avgOrderValue } = metrics.summary;
    const targets = comparisonData?.target;

    if (targets?.revenue) {
      const revenuePerformance = (totalRevenue / targets.revenue) * 100;
      indicators.push({
        label: 'Revenue Target',
        value: revenuePerformance,
        status: revenuePerformance >= 100 ? 'excellent' : 
                revenuePerformance >= 80 ? 'good' : 
                revenuePerformance >= 60 ? 'warning' : 'poor',
        icon: Target,
      });
    }

    if (targets?.orders) {
      const orderPerformance = (totalOrders / targets.orders) * 100;
      indicators.push({
        label: 'Order Target',
        value: orderPerformance,
        status: orderPerformance >= 100 ? 'excellent' : 
                orderPerformance >= 80 ? 'good' : 
                orderPerformance >= 60 ? 'warning' : 'poor',
        icon: Target,
      });
    }

    // AOV performance (comparing to branch's historical average)
    const branchHistoricalAOV = branch.metrics.avgOrderValue;
    if (branchHistoricalAOV > 0) {
      const aovPerformance = (avgOrderValue / branchHistoricalAOV) * 100;
      indicators.push({
        label: 'AOV vs Historical',
        value: aovPerformance,
        status: aovPerformance >= 110 ? 'excellent' : 
                aovPerformance >= 100 ? 'good' : 
                aovPerformance >= 90 ? 'warning' : 'poor',
        icon: TrendingUp,
      });
    }

    return indicators;
  }, [metrics, comparisonData, branch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              <div className="h-4 w-60 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Metrics Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Metrics data is not available for the selected period.
            </p>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {branch.name} - Performance Metrics
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Performance overview and key indicators for the selected period
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            {onRefresh && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={onRefresh}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh Metrics</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Revenue"
            value={metrics.summary.totalRevenue}
            change={changes.revenue?.value}
            changeType={changes.revenue?.type}
            icon={DollarSign}
            format="currency"
            currency={branch.financial.currency}
            target={comparisonData?.target?.revenue}
            subtitle={dailyAverages ? `Avg: ${formatCurrency(dailyAverages.revenue, branch.financial.currency)}/day` : undefined}
          />

          <MetricCard
            title="Orders"
            value={metrics.summary.totalOrders}
            change={changes.orders?.value}
            changeType={changes.orders?.type}
            icon={ShoppingCart}
            format="number"
            target={comparisonData?.target?.orders}
            subtitle={dailyAverages ? `Avg: ${formatNumber(dailyAverages.orders)}/day` : undefined}
          />

          <MetricCard
            title="Average Order Value"
            value={metrics.summary.avgOrderValue}
            change={changes.aov?.value}
            changeType={changes.aov?.type}
            icon={TrendingUp}
            format="currency"
            currency={branch.financial.currency}
          />

          <MetricCard
            title="Total Items"
            value={metrics.summary.totalItems}
            change={changes.items?.value}
            changeType={changes.items?.type}
            icon={Activity}
            format="number"
            subtitle={`${(metrics.summary.totalItems / metrics.summary.totalOrders).toFixed(1)} items/order`}
          />
        </div>

        {/* Performance Indicators */}
        {performanceIndicators.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Performance Indicators
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {performanceIndicators.map((indicator, index) => {
                  const StatusIcon = indicator.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className={`p-2 rounded-lg ${getStatusColor(indicator.status)}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{indicator.label}</p>
                        <p className={`text-lg font-bold ${
                          indicator.status === 'excellent' ? 'text-green-600' :
                          indicator.status === 'good' ? 'text-blue-600' :
                          indicator.status === 'warning' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {indicator.value.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Branch Information */}
        <Separator />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Location:</span>
            <span>{branch.address.city}, {branch.address.state}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Staff:</span>
            <span>{branch.staffing.currentStaff}/{branch.staffing.maxStaff}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Hours:</span>
            <span>
              {new Date(`2000-01-01T${branch.operations.openTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
              {new Date(`2000-01-01T${branch.operations.closeTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Updated:</span>
            <span>{new Date(branch.metrics.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Additional Info */}
        {showComparison && comparisonData && (
          <div className="p-3 rounded-lg bg-muted/50 border border-dashed">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Period Comparison</p>
                <p className="text-muted-foreground">
                  Metrics are compared with the previous {period} period. 
                  {comparisonData.target && ' Performance is measured against set targets.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchMetricsCard;
