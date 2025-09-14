import { 
  Building, 
  Users, 
  Activity,
  TrendingUp,
  Plus,
  Eye,
  AlertCircle,
  Shield
} from "lucide-react";
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiUrl } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  email: string;
  domain?: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  maxUsers: number;
  currentUsers: number;
  createdAt: string;
  description?: string;
  phone?: string;
  contactPerson?: string;
}

interface SuperAdminUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  isSuperAdmin: boolean;
}

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in and is superadmin
    if (!isAuthenticated || user?.role !== 'superadmin') {
      navigate('/login');
      return;
    }

    // For superadmin routes, use superadmin_token
    const token = localStorage.getItem('superadmin_token') || localStorage.getItem('token');
    if (token) {
      fetchTenants(token);
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, navigate]);

  const fetchTenants = async (token: string) => {
    try {
      const response = await fetch(getApiUrl('superadmin/tenants'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setTenants(data.tenants || []);
      } else {
        setError('Failed to fetch tenants');
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setError('Network error while fetching tenants');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToTenant = async (tenantId: string) => {
    const token = localStorage.getItem('superadmin_token') || localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(getApiUrl('superadmin/switch-tenant'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tenantId }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Open tenant in new tab
        const tenant = data.tenant;
        // Set up authentication for tenant dashboard access
        const superadminToken = localStorage.getItem('superadmin_token');
        const superadminUser = localStorage.getItem('superadmin_user');
        if (superadminToken && superadminUser) {
          localStorage.setItem('token', superadminToken);
          localStorage.setItem('user', superadminUser);
        }
        window.open(`/dashboard?tenant=${tenant.slug}`, '_blank');
      } else {
        setError('Failed to switch to tenant');
      }
    } catch (error) {
      console.error('Error switching tenant:', error);
      setError('Network error while switching tenant');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Shield className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading SuperAdmin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
              <p className="text-xs text-muted-foreground">
                Active restaurant tenants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.reduce((total, tenant) => total + tenant.currentUsers, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all tenants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Max Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.reduce((total, tenant) => total + tenant.maxUsers, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total user capacity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tenant Management</CardTitle>
                <CardDescription>Manage all restaurant tenants in the platform</CardDescription>
              </div>
              <Button onClick={() => navigate('/superadmin/tenants')} className="bg-[#032541] hover:bg-[#021a2e]">
                <Plus className="h-4 w-4 mr-2" />
                Manage Tenants
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-gray-600">{tenant.domain || `${tenant.slug}.hotelzed.com`}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="text-sm">{tenant.email}</p>
                        {tenant.contactPerson && (
                          <p className="text-xs text-gray-600">{tenant.contactPerson}</p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getPlanColor(tenant.plan || 'basic')}>
                        {tenant.plan ? tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1) : 'Basic'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{tenant.currentUsers}/{tenant.maxUsers}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getStatusColor(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => switchToTenant(tenant._id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Access
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {tenants.length === 0 && (
              <div className="text-center py-8">
                <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No tenants found</p>
                <p className="text-sm text-gray-500 mb-4">Create your first restaurant tenant to get started</p>
                <Button onClick={() => navigate('/superadmin/tenants')} className="bg-[#032541] hover:bg-[#021a2e]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Tenant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;