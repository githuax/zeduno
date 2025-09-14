import { Building2, Plus, Edit, Trash2, Users, Calendar, Search, Filter, Smartphone, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import { getAllCurrencies, getCurrencyName } from '@/utils/currency';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Tenant {
  _id: string;
  name: string;
  email: string;
  domain?: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  maxUsers: number;
  currentUsers: number;
  createdAt: string;
  expiryDate?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  settings?: {
    currency?: string;
    timezone?: string;
    language?: string;
    businessType?: 'restaurant' | 'hotel' | 'both';
  };
}

const TenantManagement = () => {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showSecrets, setShowSecrets] = useState({
    mpesaPasskey: false,
    mpesaConsumerSecret: false
  });
  const [generatedAdminPassword, setGeneratedAdminPassword] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    domain: '',
    plan: 'basic',
    maxUsers: 10,
    address: '',
    phone: '',
    contactPerson: '',
    currency: 'KES',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
    generateAdminTempPassword: true,
    // M-Pesa configuration
    mpesaEnabled: false,
    mpesaEnvironment: 'sandbox',
    mpesaAccountType: 'till',
    mpesaTillNumber: '',
    mpesaPaybillNumber: '',
    mpesaBusinessShortCode: '',
    mpesaPasskey: '',
    mpesaConsumerKey: '',
    mpesaConsumerSecret: ''
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('superadmin_token') || localStorage.getItem('token');
      const response = await fetch(getApiUrl('superadmin/tenants'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTenants(data.tenants || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tenants',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('superadmin_token') || localStorage.getItem('token');
      const response = await fetch(getApiUrl('superadmin/tenants'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          settings: {
            currency: formData.currency,
            businessType: 'restaurant'
          },
          admin: {
            email: formData.adminEmail,
            ...(formData.generateAdminTempPassword ? {} : { password: formData.adminPassword }),
            firstName: formData.adminFirstName,
            lastName: formData.adminLastName
          },
          paymentConfig: {
            mpesa: {
              enabled: formData.mpesaEnabled,
              environment: formData.mpesaEnvironment,
              accountType: formData.mpesaAccountType,
              tillNumber: formData.mpesaTillNumber,
              paybillNumber: formData.mpesaPaybillNumber,
              businessShortCode: formData.mpesaBusinessShortCode,
              passkey: formData.mpesaPasskey,
              consumerKey: formData.mpesaConsumerKey,
              consumerSecret: formData.mpesaConsumerSecret
            },
            stripe: { enabled: false },
            square: { enabled: false },
            cash: { enabled: true }
          }
        })
      });

      if (response.ok) {
        let data: any = null;
        try {
          data = await response.json();
        } catch {}

        let initialPasswordHandled = false;
        if (data?.initialPassword) {
          try {
            await navigator.clipboard.writeText(data.initialPassword);
            initialPasswordHandled = true;
            toast({
              title: 'Tenant created',
              description: 'Temporary admin password generated and copied to clipboard.'
            });
          } catch {
            toast({
              title: 'Tenant created',
              description: `Temporary admin password: ${data.initialPassword}`
            });
          }
          // Show inline banner with password and keep dialog open
          setGeneratedAdminPassword(data.initialPassword);
          // Refresh list in background
          fetchTenants();
          setIsLoading(false);
          return;
        }

        if (!initialPasswordHandled && !data?.initialPassword) {
          toast({
            title: 'Success',
            description: 'Tenant created successfully'
          });
        }

        setIsCreateOpen(false);
        resetForm();
        fetchTenants();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to create tenant',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create tenant',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('superadmin_token') || localStorage.getItem('token');
      const response = await fetch(getApiUrl(`superadmin/tenants/${selectedTenant._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          domain: formData.domain,
          plan: formData.plan,
          maxUsers: formData.maxUsers,
          address: formData.address,
          phone: formData.phone,
          contactPerson: formData.contactPerson,
          settings: {
            currency: formData.currency,
            businessType: 'restaurant'
          }
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Tenant updated successfully'
        });
        setIsEditOpen(false);
        fetchTenants();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to update tenant',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tenant',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('superadmin_token') || localStorage.getItem('token');
      const response = await fetch(getApiUrl(`superadmin/tenants/${tenantId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Tenant deleted successfully'
        });
        fetchTenants();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete tenant',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete tenant',
        variant: 'destructive'
      });
    }
  };

  const toggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const token = localStorage.getItem('superadmin_token') || localStorage.getItem('token');
      const response = await fetch(getApiUrl(`superadmin/tenants/${tenantId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Tenant ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
        });
        fetchTenants();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to update tenant status',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tenant status',
        variant: 'destructive'
      });
    }
  };

  const toggleSecret = (field: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };


  const accessTenant = (tenant: Tenant) => {
    // Store tenant context for superadmin access
    localStorage.setItem('superadmin_accessing_tenant', JSON.stringify({
      tenantId: tenant._id,
      tenantName: tenant.name,
      accessedAt: new Date().toISOString()
    }));
    
    // Redirect to tenant dashboard
    window.location.href = '/dashboard';
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      domain: '',
      plan: 'basic',
      maxUsers: 10,
      address: '',
      phone: '',
      contactPerson: '',
      currency: 'KES',
      adminEmail: '',
      adminPassword: '',
      adminFirstName: '',
      adminLastName: '',
      generateAdminTempPassword: true,
      // M-Pesa configuration
      mpesaEnabled: false,
      mpesaEnvironment: 'sandbox',
      mpesaAccountType: 'till',
      mpesaTillNumber: '',
      mpesaPaybillNumber: '',
      mpesaBusinessShortCode: '',
      mpesaPasskey: '',
      mpesaConsumerKey: '',
      mpesaConsumerSecret: ''
    });
    setShowSecrets({
      mpesaPasskey: false,
      mpesaConsumerSecret: false
    });
  };

  const openEditDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      email: tenant.email,
      domain: tenant.domain || '',
      plan: tenant.plan,
      maxUsers: tenant.maxUsers,
      address: tenant.address || '',
      phone: tenant.phone || '',
      contactPerson: tenant.contactPerson || '',
      currency: tenant.settings?.currency || 'KES',
      adminEmail: '',
      adminPassword: '',
      adminFirstName: '',
      adminLastName: ''
    });
    setIsEditOpen(true);
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

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.domain?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || tenant.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tenant Management</h1>
            <p className="text-muted-foreground">Create and manage restaurant tenants</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#032541] hover:bg-[#021a2e]">
                <Plus className="mr-2 h-4 w-4" />
                Create Tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              {generatedAdminPassword ? (
                <div className="space-y-6">
                  <DialogHeader>
                    <DialogTitle>Tenant Created</DialogTitle>
                    <DialogDescription>
                      A secure temporary password has been generated for the tenant admin. Share it securely and ask them to change it on first login.
                    </DialogDescription>
                  </DialogHeader>
                  <Alert>
                    <AlertDescription>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Temporary Admin Password</div>
                          <div className="mt-1 font-mono break-all text-foreground">{generatedAdminPassword}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(generatedAdminPassword!);
                              toast({ title: 'Copied', description: 'Password copied to clipboard' });
                            } catch {
                              toast({ title: 'Copy failed', description: 'Please copy manually', variant: 'destructive' });
                            }
                          }}>Copy</Button>
                          <Button type="button" onClick={() => {
                            setGeneratedAdminPassword(null);
                            setIsCreateOpen(false);
                            resetForm();
                          }} className="bg-[#032541] hover:bg-[#021a2e]">Close</Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
              <form onSubmit={handleCreateTenant}>
                <DialogHeader>
                  <DialogTitle>Create New Tenant</DialogTitle>
                  <DialogDescription>
                    Set up a new restaurant tenant with admin account
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Restaurant Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Contact Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="domain">Domain (Optional)</Label>
                      <Input
                        id="domain"
                        placeholder="restaurant.com"
                        value={formData.domain}
                        onChange={(e) => setFormData({...formData, domain: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan">Subscription Plan</Label>
                      <Select
                        value={formData.plan}
                        onValueChange={(value) => setFormData({...formData, plan: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxUsers">Max Users</Label>
                      <Input
                        id="maxUsers"
                        type="number"
                        value={formData.maxUsers}
                        onChange={(e) => setFormData({...formData, maxUsers: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({...formData, currency: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAllCurrencies().map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Admin Account Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminFirstName">Admin First Name *</Label>
                        <Input
                          id="adminFirstName"
                          value={formData.adminFirstName}
                          onChange={(e) => setFormData({...formData, adminFirstName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminLastName">Admin Last Name *</Label>
                        <Input
                          id="adminLastName"
                          value={formData.adminLastName}
                          onChange={(e) => setFormData({...formData, adminLastName: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminEmail">Admin Email *</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          value={formData.adminEmail}
                          onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="adminPassword">Admin Password (optional)</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Generate temporary</span>
                            <Switch
                              checked={formData.generateAdminTempPassword}
                              onCheckedChange={(checked) => setFormData({...formData, generateAdminTempPassword: checked})}
                            />
                          </div>
                        </div>
                        <Input
                          id="adminPassword"
                          type="password"
                          value={formData.adminPassword}
                          onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                          required={!formData.generateAdminTempPassword}
                          minLength={8}
                          disabled={formData.generateAdminTempPassword}
                          placeholder={formData.generateAdminTempPassword ? 'A secure temporary password will be generated' : 'Enter admin password'}
                        />
                        <p className="text-xs text-muted-foreground">
                          If left empty, a secure temporary password will be generated and the admin will be required to change it on first login.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          M-Pesa Payment Configuration
                        </h3>
                        <p className="text-sm text-muted-foreground">Configure M-Pesa settings for this tenant</p>
                      </div>
                      <Switch
                        checked={formData.mpesaEnabled}
                        onCheckedChange={(checked) => setFormData({...formData, mpesaEnabled: checked})}
                      />
                    </div>

                    {formData.mpesaEnabled && (
                      <>
                        <Separator className="mb-4" />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="mpesa-environment">Environment</Label>
                            <Select
                              value={formData.mpesaEnvironment}
                              onValueChange={(value) => setFormData({...formData, mpesaEnvironment: value as any})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                                <SelectItem value="production">Production (Live)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mpesa-account-type">Account Type</Label>
                            <Select
                              value={formData.mpesaAccountType}
                              onValueChange={(value) => setFormData({...formData, mpesaAccountType: value as any})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="till">Till Number</SelectItem>
                                <SelectItem value="paybill">PayBill Number</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {formData.mpesaAccountType === 'till' ? (
                            <div className="space-y-2">
                              <Label htmlFor="mpesa-till">Till Number</Label>
                              <Input
                                id="mpesa-till"
                                value={formData.mpesaTillNumber}
                                onChange={(e) => setFormData({...formData, mpesaTillNumber: e.target.value})}
                                placeholder="Enter till number"
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label htmlFor="mpesa-paybill">PayBill Number</Label>
                              <Input
                                id="mpesa-paybill"
                                value={formData.mpesaPaybillNumber}
                                onChange={(e) => setFormData({...formData, mpesaPaybillNumber: e.target.value})}
                                placeholder="Enter paybill number"
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="mpesa-shortcode">Business Short Code</Label>
                            <Input
                              id="mpesa-shortcode"
                              value={formData.mpesaBusinessShortCode}
                              onChange={(e) => setFormData({...formData, mpesaBusinessShortCode: e.target.value})}
                              placeholder="Enter business short code"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="mpesa-consumer-key">Consumer Key</Label>
                            <Input
                              id="mpesa-consumer-key"
                              value={formData.mpesaConsumerKey}
                              onChange={(e) => setFormData({...formData, mpesaConsumerKey: e.target.value})}
                              placeholder="Enter consumer key"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mpesa-consumer-secret">Consumer Secret</Label>
                            <div className="relative">
                              <Input
                                id="mpesa-consumer-secret"
                                type={showSecrets.mpesaConsumerSecret ? "text" : "password"}
                                value={formData.mpesaConsumerSecret}
                                onChange={(e) => setFormData({...formData, mpesaConsumerSecret: e.target.value})}
                                placeholder="Enter consumer secret"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => toggleSecret('mpesaConsumerSecret')}
                              >
                                {showSecrets.mpesaConsumerSecret ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="mpesa-passkey">Passkey</Label>
                            <div className="relative">
                              <Input
                                id="mpesa-passkey"
                                type={showSecrets.mpesaPasskey ? "text" : "password"}
                                value={formData.mpesaPasskey}
                                onChange={(e) => setFormData({...formData, mpesaPasskey: e.target.value})}
                                placeholder="Enter passkey"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => toggleSecret('mpesaPasskey')}
                              >
                                {showSecrets.mpesaPasskey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="bg-[#032541] hover:bg-[#021a2e]">
                    {isLoading ? 'Creating...' : 'Create Tenant'}
                  </Button>
                </DialogFooter>
              </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or domain..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Tenants ({filteredTenants.length})
            </CardTitle>
            <CardDescription>Manage all restaurant tenants in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant Name</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading tenants...
                      </TableCell>
                    </TableRow>
                  ) : filteredTenants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No tenants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTenants.map((tenant) => (
                      <TableRow key={tenant._id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{tenant.name}</p>
                            {tenant.domain && (
                              <p className="text-xs text-muted-foreground">{tenant.domain}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{tenant.email}</p>
                            {tenant.contactPerson && (
                              <p className="text-xs text-muted-foreground">{tenant.contactPerson}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tenant.settings?.currency || 'KES'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{tenant.currentUsers}/{tenant.maxUsers}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => accessTenant(tenant)}
                              title="Access Tenant Dashboard"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(tenant)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleTenantStatus(tenant._id, tenant.status)}
                            >
                              {tenant.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteTenant(tenant._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleUpdateTenant}>
              <DialogHeader>
                <DialogTitle>Edit Tenant</DialogTitle>
                <DialogDescription>
                  Update tenant information
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Restaurant Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Contact Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-domain">Domain</Label>
                    <Input
                      id="edit-domain"
                      value={formData.domain}
                      onChange={(e) => setFormData({...formData, domain: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-plan">Subscription Plan</Label>
                    <Select
                      value={formData.plan}
                      onValueChange={(value) => setFormData({...formData, plan: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-maxUsers">Max Users</Label>
                    <Input
                      id="edit-maxUsers"
                      type="number"
                      value={formData.maxUsers}
                      onChange={(e) => setFormData({...formData, maxUsers: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({...formData, currency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAllCurrencies().map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-contactPerson">Contact Person</Label>
                    <Input
                      id="edit-contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Input
                      id="edit-address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-[#032541] hover:bg-[#021a2e]">
                  {isLoading ? 'Updating...' : 'Update Tenant'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default TenantManagement;
