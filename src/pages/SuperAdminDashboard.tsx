import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Crown, 
  Building, 
  Users, 
  Calendar,
  Activity,
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
  Plus,
  Eye,
  AlertCircle
} from "lucide-react";

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  status: string;
  plan: {
    name: string;
    displayName: string;
  };
  limits: {
    currentUsers: number;
    currentTables: number;
    currentOrders: number;
  };
  createdAt: string;
  trialEndsAt?: string;
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
  const [user, setUser] = useState<SuperAdminUser | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('superadmin_token');
    const userData = localStorage.getItem('superadmin_user');
    
    if (!token || !userData) {
      navigate('/superadmin/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchTenants(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/superadmin/login');
    }
  }, [navigate]);

  const fetchTenants = async (token: string) => {
    try {
      const response = await fetch('/api/superadmin/tenants', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setTenants(data.tenants);
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

  const handleLogout = () => {
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_user');
    navigate('/superadmin/login');
  };

  const switchToTenant = async (tenantId: string) => {
    const token = localStorage.getItem('superadmin_token');
    if (!token) return;

    try {
      const response = await fetch('/api/superadmin/switch-tenant', {
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
        window.open(`http://localhost:8080/dashboard?tenant=${tenant.slug}`, '_blank');
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
      case 'starter': return 'bg-gray-100 text-gray-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-yellow-500" />
                <Crown className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HotelZed SuperAdmin</h1>
                <p className="text-gray-600">Platform Administration Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-right">
                  <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
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
                {tenants.reduce((total, tenant) => total + tenant.limits.currentUsers, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all tenants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.reduce((total, tenant) => total + tenant.limits.currentTables, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Restaurant tables managed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.reduce((total, tenant) => total + tenant.limits.currentOrders, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Orders processed today
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
              <Button onClick={() => navigate('/onboarding')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Tables</TableHead>
                  <TableHead>Orders</TableHead>
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
                        <p className="text-sm text-gray-600">{tenant.slug}.hotelzed.com</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getStatusColor(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getPlanColor(tenant.plan.name)}>
                        {tenant.plan.displayName}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>{tenant.limits.currentUsers}</TableCell>
                    <TableCell>{tenant.limits.currentTables}</TableCell>
                    <TableCell>{tenant.limits.currentOrders}</TableCell>
                    
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
                <Button onClick={() => navigate('/onboarding')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Tenant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;