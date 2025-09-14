import React, { useEffect, useState } from 'react';
import {
  Activity,
  DollarSign,
  ShoppingCart,
  Users,
  Wifi,
  WifiOff,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import KPICard from '@/components/analytics/KPICard';
import RealTimeCharts from '@/components/analytics/RealTimeCharts';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { useTenant } from '@/hooks/useTenant';

const RealTimeAnalytics = () => {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const {
    isConnected,
    metrics,
    chartData,
    lastUpdate,
    error,
    reconnect,
    requestUpdate
  } = useRealTimeAnalytics();

  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Request initial data when component mounts
    if (isConnected) {
      requestUpdate();
    }
  }, [isConnected]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getConnectionStatus = () => {
    if (error) {
      return { color: 'red', text: 'Error', icon: AlertCircle } as const;
    }
    if (isConnected) {
      return { color: 'green', text: 'Connected', icon: Wifi } as const;
    }
    return { color: 'gray', text: 'Disconnected', icon: WifiOff } as const;
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Real-time Analytics
            </h1>
            <p className="text-muted-foreground">
              Live business metrics and performance monitoring for {currentTenant?.name || 'your restaurant'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <Badge
              variant={status.color === 'green' ? 'default' : 'destructive'}
              className="flex items-center space-x-1"
            >
              <StatusIcon className="h-3 w-3" />
              <span>{status.text}</span>
            </Badge>

            {/* Last Update */}
            {lastUpdate && (
              <span className="text-sm text-muted-foreground">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}

            {/* Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={reconnect}
              disabled={isConnected}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reconnect
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/reports')}
            >
              View Reports
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error} -
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-destructive hover:text-destructive/90"
                onClick={reconnect}
              >
                Try reconnecting
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Revenue"
            value={metrics?.revenue.current || 0}
            change={metrics?.revenue.change || 0}
            changePercent={metrics?.revenue.changePercent || 0}
            formatValue={formatCurrency}
            icon={<DollarSign className="h-4 w-4" />}
            color="green"
          />

          <KPICard
            title="Total Orders"
            value={metrics?.orders.current || 0}
            change={metrics?.orders.change || 0}
            changePercent={metrics?.orders.changePercent || 0}
            formatValue={(v) => v.toString()}
            icon={<ShoppingCart className="h-4 w-4" />}
            color="blue"
          />

          <KPICard
            title="Average Order Value"
            value={metrics?.averageOrderValue.current || 0}
            change={metrics?.averageOrderValue.change || 0}
            changePercent={metrics?.averageOrderValue.changePercent || 0}
            formatValue={formatCurrency}
            icon={<Activity className="h-4 w-4" />}
            color="purple"
          />

          <KPICard
            title="Table Utilization"
            value={metrics?.tableUtilization.current || 0}
            change={metrics?.tableUtilization.change || 0}
            changePercent={metrics?.tableUtilization.changePercent || 0}
            formatValue={formatPercentage}
            icon={<Users className="h-4 w-4" />}
            color="default"
          />
        </div>

        {/* Charts Section */}
        {chartData ? (
          <RealTimeCharts chartData={chartData} isLoading={false} />
        ) : (
          <RealTimeCharts
            chartData={{
              revenue: [],
              orders: [],
              paymentMethods: [],
              serviceTypes: []
            }}
            isLoading={true}
          />
        )}

        {/* Live Activity Feed */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Live Activity</span>
              <div className={`h-2 w-2 rounded-full animate-pulse ${
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </CardTitle>
            <CardDescription>
              Real-time business activity updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isConnected ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                  <p>Monitoring live activity...</p>
                  <p className="text-sm">Updates arrive every 30 seconds</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <WifiOff className="h-8 w-8 mx-auto mb-2" />
                  <p>Disconnected from live updates</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={reconnect}
                    className="mt-2"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RealTimeAnalytics;

