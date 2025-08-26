import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Smartphone, 
  CreditCard, 
  Building2, 
  Banknote, 
  Settings,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentConfig {
  mpesa: {
    enabled: boolean;
    environment: 'sandbox' | 'production';
    accountType: 'till' | 'paybill';
    tillNumber: string;
    paybillNumber: string;
    businessShortCode: string;
    passkey: string;
    consumerKey: string;
    consumerSecret: string;
  };
  stripe: {
    enabled: boolean;
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  square: {
    enabled: boolean;
    applicationId: string;
    accessToken: string;
  };
  cash: {
    enabled: boolean;
  };
}

interface Tenant {
  _id: string;
  name: string;
  email: string;
  status: string;
  settings: {
    currency: string;
  };
}

export const PaymentGatewaySettings = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    mpesa: {
      enabled: false,
      environment: 'sandbox',
      accountType: 'till',
      tillNumber: '',
      paybillNumber: '',
      businessShortCode: '',
      passkey: '',
      consumerKey: '',
      consumerSecret: '',
    },
    stripe: {
      enabled: false,
      publicKey: '',
      secretKey: '',
      webhookSecret: '',
    },
    square: {
      enabled: false,
      applicationId: '',
      accessToken: '',
    },
    cash: {
      enabled: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    mpesaPasskey: false,
    mpesaConsumerSecret: false,
    stripeSecret: false,
    stripeWebhook: false,
    squareAccess: false,
  });

  const { toast } = useToast();

  // Fetch tenants on component mount
  useEffect(() => {
    fetchTenants();
  }, []);

  // Fetch payment config when tenant is selected
  useEffect(() => {
    if (selectedTenant) {
      fetchPaymentConfig();
    }
  }, [selectedTenant]);

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/superadmin/tenants', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setTenants(data.tenants || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch tenants',
        variant: 'destructive',
      });
    }
  };

  const fetchPaymentConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/payments/config/${selectedTenant}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentConfig(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch payment configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const savePaymentConfig = async () => {
    if (!selectedTenant) {
      toast({
        title: 'Error',
        description: 'Please select a tenant first',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/payments/config/${selectedTenant}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ paymentConfig }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Payment configuration updated successfully',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update configuration');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateMPesaConfig = (field: keyof PaymentConfig['mpesa'], value: any) => {
    setPaymentConfig(prev => ({
      ...prev,
      mpesa: {
        ...prev.mpesa,
        [field]: value,
      },
    }));
  };

  const updateStripeConfig = (field: keyof PaymentConfig['stripe'], value: any) => {
    setPaymentConfig(prev => ({
      ...prev,
      stripe: {
        ...prev.stripe,
        [field]: value,
      },
    }));
  };

  const updateSquareConfig = (field: keyof PaymentConfig['square'], value: any) => {
    setPaymentConfig(prev => ({
      ...prev,
      square: {
        ...prev.square,
        [field]: value,
      },
    }));
  };

  const updateCashConfig = (field: keyof PaymentConfig['cash'], value: any) => {
    setPaymentConfig(prev => ({
      ...prev,
      cash: {
        ...prev.cash,
        [field]: value,
      },
    }));
  };

  const toggleSecret = (field: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const selectedTenantData = tenants.find(t => t._id === selectedTenant);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Payment Gateway Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure payment methods and gateways for your tenants
        </p>
      </div>

      {/* Tenant Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Tenant</CardTitle>
          <CardDescription>
            Choose a tenant to configure their payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tenant..." />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant._id} value={tenant._id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{tenant.name}</span>
                    <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                      {tenant.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTenantData && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{selectedTenantData.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTenantData.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Currency: {selectedTenantData.settings.currency || 'USD'}</p>
                  <Badge variant={selectedTenantData.status === 'active' ? 'default' : 'secondary'}>
                    {selectedTenantData.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTenant && (
        <>
          <Tabs defaultValue="mpesa" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="mpesa" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                M-Pesa
              </TabsTrigger>
              <TabsTrigger value="stripe" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Stripe
              </TabsTrigger>
              <TabsTrigger value="square" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Square
              </TabsTrigger>
              <TabsTrigger value="cash" className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Cash
              </TabsTrigger>
            </TabsList>

            {/* M-Pesa Configuration */}
            <TabsContent value="mpesa">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    M-Pesa Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure M-Pesa payment gateway for mobile money transactions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Enable M-Pesa</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow customers to pay using M-Pesa mobile money
                      </p>
                    </div>
                    <Switch
                      checked={paymentConfig.mpesa.enabled}
                      onCheckedChange={(checked) => updateMPesaConfig('enabled', checked)}
                    />
                  </div>

                  {paymentConfig.mpesa.enabled && (
                    <>
                      <Separator />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="mpesa-environment">Environment</Label>
                            <Select
                              value={paymentConfig.mpesa.environment}
                              onValueChange={(value: 'sandbox' | 'production') => 
                                updateMPesaConfig('environment', value)
                              }
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

                          <div>
                            <Label htmlFor="mpesa-account-type">Account Type</Label>
                            <Select
                              value={paymentConfig.mpesa.accountType}
                              onValueChange={(value: 'till' | 'paybill') => 
                                updateMPesaConfig('accountType', value)
                              }
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

                          {paymentConfig.mpesa.accountType === 'till' ? (
                            <div>
                              <Label htmlFor="mpesa-till">Till Number</Label>
                              <Input
                                id="mpesa-till"
                                value={paymentConfig.mpesa.tillNumber}
                                onChange={(e) => updateMPesaConfig('tillNumber', e.target.value)}
                                placeholder="Enter till number"
                              />
                            </div>
                          ) : (
                            <div>
                              <Label htmlFor="mpesa-paybill">PayBill Number</Label>
                              <Input
                                id="mpesa-paybill"
                                value={paymentConfig.mpesa.paybillNumber}
                                onChange={(e) => updateMPesaConfig('paybillNumber', e.target.value)}
                                placeholder="Enter paybill number"
                              />
                            </div>
                          )}

                          <div>
                            <Label htmlFor="mpesa-shortcode">Business Short Code</Label>
                            <Input
                              id="mpesa-shortcode"
                              value={paymentConfig.mpesa.businessShortCode}
                              onChange={(e) => updateMPesaConfig('businessShortCode', e.target.value)}
                              placeholder="Enter business short code"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="mpesa-consumer-key">Consumer Key</Label>
                            <Input
                              id="mpesa-consumer-key"
                              value={paymentConfig.mpesa.consumerKey}
                              onChange={(e) => updateMPesaConfig('consumerKey', e.target.value)}
                              placeholder="Enter consumer key"
                            />
                          </div>

                          <div>
                            <Label htmlFor="mpesa-consumer-secret">Consumer Secret</Label>
                            <div className="relative">
                              <Input
                                id="mpesa-consumer-secret"
                                type={showSecrets.mpesaConsumerSecret ? "text" : "password"}
                                value={paymentConfig.mpesa.consumerSecret}
                                onChange={(e) => updateMPesaConfig('consumerSecret', e.target.value)}
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

                          <div>
                            <Label htmlFor="mpesa-passkey">Passkey</Label>
                            <div className="relative">
                              <Input
                                id="mpesa-passkey"
                                type={showSecrets.mpesaPasskey ? "text" : "password"}
                                value={paymentConfig.mpesa.passkey}
                                onChange={(e) => updateMPesaConfig('passkey', e.target.value)}
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
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>M-Pesa Setup Instructions:</strong>
                          <br />
                          1. Register for M-Pesa API on the Safaricom Developer Portal
                          <br />
                          2. Create an app and get your Consumer Key and Consumer Secret
                          <br />
                          3. Get your Passkey from the STK Push simulation
                          <br />
                          4. Use your actual business shortcode for production
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stripe Configuration */}
            <TabsContent value="stripe">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Stripe Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure Stripe for credit/debit card payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Enable Stripe</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow customers to pay with credit/debit cards
                      </p>
                    </div>
                    <Switch
                      checked={paymentConfig.stripe.enabled}
                      onCheckedChange={(checked) => updateStripeConfig('enabled', checked)}
                    />
                  </div>

                  {paymentConfig.stripe.enabled && (
                    <>
                      <Separator />
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="stripe-public-key">Publishable Key</Label>
                          <Input
                            id="stripe-public-key"
                            value={paymentConfig.stripe.publicKey}
                            onChange={(e) => updateStripeConfig('publicKey', e.target.value)}
                            placeholder="pk_test_..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="stripe-secret-key">Secret Key</Label>
                          <div className="relative">
                            <Input
                              id="stripe-secret-key"
                              type={showSecrets.stripeSecret ? "text" : "password"}
                              value={paymentConfig.stripe.secretKey}
                              onChange={(e) => updateStripeConfig('secretKey', e.target.value)}
                              placeholder="sk_test_..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => toggleSecret('stripeSecret')}
                            >
                              {showSecrets.stripeSecret ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="stripe-webhook-secret">Webhook Secret</Label>
                          <div className="relative">
                            <Input
                              id="stripe-webhook-secret"
                              type={showSecrets.stripeWebhook ? "text" : "password"}
                              value={paymentConfig.stripe.webhookSecret}
                              onChange={(e) => updateStripeConfig('webhookSecret', e.target.value)}
                              placeholder="whsec_..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => toggleSecret('stripeWebhook')}
                            >
                              {showSecrets.stripeWebhook ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Get your Stripe keys from your Stripe Dashboard under Developers → API keys
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Square Configuration */}
            <TabsContent value="square">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Square Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure Square for payment processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Enable Square</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow customers to pay with Square
                      </p>
                    </div>
                    <Switch
                      checked={paymentConfig.square.enabled}
                      onCheckedChange={(checked) => updateSquareConfig('enabled', checked)}
                    />
                  </div>

                  {paymentConfig.square.enabled && (
                    <>
                      <Separator />
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="square-app-id">Application ID</Label>
                          <Input
                            id="square-app-id"
                            value={paymentConfig.square.applicationId}
                            onChange={(e) => updateSquareConfig('applicationId', e.target.value)}
                            placeholder="sandbox-sq0idb-..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="square-access-token">Access Token</Label>
                          <div className="relative">
                            <Input
                              id="square-access-token"
                              type={showSecrets.squareAccess ? "text" : "password"}
                              value={paymentConfig.square.accessToken}
                              onChange={(e) => updateSquareConfig('accessToken', e.target.value)}
                              placeholder="EAAAEOPLw5..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => toggleSecret('squareAccess')}
                            >
                              {showSecrets.squareAccess ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Get your Square credentials from your Square Developer Dashboard
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cash Configuration */}
            <TabsContent value="cash">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Cash Payment Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure cash payment options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Enable Cash Payments</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow staff to record cash payments
                      </p>
                    </div>
                    <Switch
                      checked={paymentConfig.cash.enabled}
                      onCheckedChange={(checked) => updateCashConfig('enabled', checked)}
                    />
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Cash payments are processed manually by staff members and marked as completed immediately.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={savePaymentConfig} 
              disabled={saving || loading}
              size="lg"
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};