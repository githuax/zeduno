import React, { useState, memo, useMemo, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Star,
  Download,
  Calendar,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalytics, useDashboardStats } from "@/hooks/useAnalytics";
import { useCurrency } from "@/hooks/useCurrency";

// Custom comparison function for Analytics memo
const areAnalyticsEqual = (prevProps: any, nextProps: any) => {
  return (
    prevProps.analytics === nextProps.analytics &&
    prevProps.dashboardStats === nextProps.dashboardStats &&
    prevProps.isLoading === nextProps.isLoading
  );
};

const AnalyticsComponent = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const { data: analytics, isLoading } = useAnalytics();
  const { data: dashboardStats } = useDashboardStats();
  const { format: formatCurrency } = useCurrency();

  // Memoized calculations
  const formatPercentage = useCallback((value: number) => `${value.toFixed(1)}%`, []);
  const COLORS = useMemo(() => ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'], []);

  // Memoized handlers
  const handlePeriodChange = useCallback((value: 'daily' | 'weekly' | 'monthly') => {
    setSelectedPeriod(value);
  }, []);

  const handleGenerateReports = useCallback(() => {
    navigate("/reports");
  }, [navigate]);

  // Memoized chart data processing
  const processedRevenueData = useMemo(() => {
    return analytics?.revenueByPeriod || [];
  }, [analytics?.revenueByPeriod]);

  const processedServiceData = useMemo(() => {
    return analytics?.ordersByService || [];
  }, [analytics?.ordersByService]);

  const processedPeakHours = useMemo(() => {
    return analytics?.peakHours?.filter(hour => hour.hour >= 8 && hour.hour <= 23) || [];
  }, [analytics?.peakHours]);

  const processedPopularItems = useMemo(() => {
    return analytics?.popularItems || [];
  }, [analytics?.popularItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics & Reports</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your restaurant's performance
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => navigate("/real-time-analytics")}
            >
              <TrendingUp className="h-4 w-4" />
              Real-time Dashboard
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleGenerateReports}
            >
              <Download className="h-4 w-4" />
              Generate Reports
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleGenerateReports}
            >
              <Download className="h-4 w-4" />
              Generate Reports
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                +8.2% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.averageOrderValue || 0)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                +3.8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {analytics?.customerSatisfaction || 0}
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-xs text-muted-foreground">Based on 234 reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Daily revenue over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={processedRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="period" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Distribution</CardTitle>
              <CardDescription>Orders by service type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={processedServiceData}
                    dataKey="orders"
                    nameKey="service"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ service, orders }) => `${service}: ${orders}`}
                  >
                    {processedServiceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Popular Items and Peak Hours */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Popular Items</CardTitle>
              <CardDescription>Top selling menu items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processedPopularItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.revenue)}</p>
                      <p className="text-sm text-muted-foreground">revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peak Hours</CardTitle>
              <CardDescription>Busiest hours of the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={processedPeakHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(value) => `${value}:00`}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'orders' ? `${value} orders` : formatCurrency(value),
                      name === 'orders' ? 'Orders' : 'Revenue'
                    ]}
                    labelFormatter={(label) => `${label}:00`}
                  />
                  <Bar dataKey="orders" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Customers</span>
                <span className="font-medium">{analytics?.customerCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Repeat Customers</span>
                <span className="font-medium">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Customers</span>
                <span className="font-medium">32%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operational Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Table Utilization</span>
                <span className="font-medium">{formatPercentage(analytics?.tableUtilization || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Order Time</span>
                <span className="font-medium">18 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Time</span>
                <span className="font-medium">32 min</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Growth Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue Growth</span>
                <span className="font-medium text-green-600">+12.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Growth</span>
                <span className="font-medium text-green-600">+8.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer Growth</span>
                <span className="font-medium text-green-600">+15.3%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Memoized export
const Analytics = memo(AnalyticsComponent);
export default Analytics;