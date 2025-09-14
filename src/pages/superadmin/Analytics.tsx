import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2, 
  Banknote,
  Activity,
  Calendar,
  Server
} from 'lucide-react';
import { useState, useEffect } from 'react';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/api';
import { formatCurrency } from '@/utils/currency';

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
  systemUptime: string;
  lastBackup: string;
}

interface TenantAnalytics {
  _id: string;
  name: string;
  plan: string;
  status: string;
  userCount: number;
  orderCount: number;
  revenue: number;
  lastActive: string;
  createdAt: string;
}

const SuperAdminAnalytics = () => {
  const { toast } = useToast();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [tenantAnalytics, setTenantAnalytics] = useState<TenantAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [systemResponse, tenantsResponse] = await Promise.all([
        fetch(getApiUrl('superadmin/analytics/system'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(getApiUrl('superadmin/analytics/tenants'), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (systemResponse.ok && tenantsResponse.ok) {
        const systemData = await systemResponse.json();
        const tenantsData = await tenantsResponse.json();
        
        if (systemData.success) setSystemStats(systemData.stats);
        if (tenantsData.success) setTenantAnalytics(tenantsData.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'basic':
        return <Badge variant="outline">Basic</Badge>;
      case 'premium':
        return <Badge className="bg-blue-100 text-blue-800">Premium</Badge>;
      case 'enterprise':
        return <Badge className="bg-purple-100 text-purple-800">Enterprise</Badge>;
      default:
        return <Badge>{plan}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-pulse text-center">
            <BarChart3 className="h-16 w-16 text-[#032541] mx-auto mb-4" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Analytics</h1>
          <p className="text-muted-foreground">Platform performance and usage statistics</p>
        </div>

        {/* System Overview Cards */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalTenants}</div>
                <p className="text-xs text-muted-foreground">
                  {systemStats.activeTenants} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {systemStats.activeUsers} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalOrders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Platform-wide orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(systemStats.totalRevenue, "KES")}</div>
                <p className="text-xs text-muted-foreground">
                  Across all tenants
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* System Health */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">System Uptime</span>
                  <Badge className="bg-green-100 text-green-800">{systemStats.systemUptime}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Backup</span>
                  <span className="text-sm text-muted-foreground">{systemStats.lastBackup}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Database Status</span>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>New tenant registrations (24h)</span>
                    <span className="font-medium">+2</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>User signups (24h)</span>
                    <span className="font-medium">+15</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Orders processed (24h)</span>
                    <span className="font-medium">+247</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Revenue generated (24h)</span>
                    <span className="font-medium">+{formatCurrency(3420, "KES")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tenant Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tenant Performance
            </CardTitle>
            <CardDescription>
              Performance metrics for all tenants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantAnalytics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No analytics data available
                    </TableCell>
                  </TableRow>
                ) : (
                  tenantAnalytics.map((tenant) => (
                    <TableRow key={tenant._id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{tenant.userCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>{tenant.orderCount.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Banknote className="h-4 w-4 text-muted-foreground" />
                          <span>{formatCurrency(tenant.revenue, "KES")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {tenant.lastActive ? new Date(tenant.lastActive).toLocaleDateString() : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminAnalytics;