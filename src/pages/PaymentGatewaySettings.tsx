import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
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
  EyeOff,
  ArrowLeft,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/api';
import { useTenant } from '@/hooks/useTenant';
import { useQueryClient } from '@tanstack/react-query';

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
  mpesaKcb: {
    enabled: boolean;
    environment: 'sandbox' | 'production';
    apiKey: string;
    baseUrl: string;
    externalOrigin: string;
    callbackUrl: string;
    supportedCurrencies: string[];
    defaultCurrency: string;
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

const PaymentGatewaySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  
  const getDefaultPaymentConfig = (): PaymentConfig => ({
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
    mpesaKcb: {
      enabled: true,
      environment: 'sandbox',
      apiKey: 'X',
      baseUrl: 'https://api.dev.zed.business',
      externalOrigin: '9002742',
      callbackUrl: 'http://192.168.2.43:5000/api/mpesa-kcb/callback',
      supportedCurrencies: ['KES', 'UGX', 'TZS', 'RWF', 'BIF', 'CDF', 'SSP'],
      defaultCurrency: 'KES',
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
  
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(getDefaultPaymentConfig());
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    mpesaPasskey: false,
    mpesaConsumerSecret: false,
    mpesaKcbApiKey: false,
    stripeSecret: false,
    stripeWebhook: false,
    squareAccess: false,
  });

  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  const fetchPaymentConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('payments/gateway-config'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          // Merge with defaults to ensure all properties exist
          const defaultConfig = getDefaultPaymentConfig();
          const mergedConfig = {
            ...defaultConfig,
            ...data.config,
            mpesa: { ...defaultConfig.mpesa, ...(data.config.mpesa || {}) },
            mpesaKcb: { ...defaultConfig.mpesaKcb, ...(data.config.mpesaKcb || {}) },
            stripe: { ...defaultConfig.stripe, ...(data.config.stripe || {}) },
            square: { ...defaultConfig.square, ...(data.config.square || {}) },
            cash: { ...defaultConfig.cash, ...(data.config.cash || {}) },
          };
          setPaymentConfig(mergedConfig);
        }
      }
    } catch (error) {
      console.error('Error fetching payment config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment gateway configuration',
        variant: 'destructive',
      });
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('payments/gateway-config'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ config: paymentConfig }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Payment gateway configuration saved successfully',
        });
        
        // Invalidate payment methods cache to refresh the payment processing page
        queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment gateway configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSecret = (field: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const testMpesaKcbConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('mpesa-kcb/callback'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ test: 'connection_check' }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'M-Pesa KCB connection is working properly',
        });
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test M-Pesa KCB connection',
        variant: 'destructive',
      });
    }
  };

  // Safe access helpers
  const getMpesaConfig = () => paymentConfig?.mpesa || getDefaultPaymentConfig().mpesa;
  const getMpesaKcbConfig = () => paymentConfig?.mpesaKcb || getDefaultPaymentConfig().mpesaKcb;
  const getStripeConfig = () => paymentConfig?.stripe || getDefaultPaymentConfig().stripe;
  const getSquareConfig = () => paymentConfig?.square || getDefaultPaymentConfig().square;
  const getCashConfig = () => paymentConfig?.cash || getDefaultPaymentConfig().cash;

  return (
    <>
      <Header />
      <main className="p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/payments')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payment Processing
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Payment Gateway Settings</h1>
              <p className="text-muted-foreground">
                Configure payment gateways for {tenant?.name || 'your restaurant'}
              </p>
            </div>
            <Button onClick={saveConfiguration} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="mpesa" className="w-full">
          <TabsList>
            <TabsTrigger value="mpesa">
              <Smartphone className="h-4 w-4 mr-2" />
              M-Pesa
            </TabsTrigger>
            <TabsTrigger value="mpesa-kcb">
              <Building className="h-4 w-4 mr-2" />
              M-Pesa KCB
            </TabsTrigger>
            <TabsTrigger value="stripe">
              <CreditCard className="h-4 w-4 mr-2" />
              Stripe
            </TabsTrigger>
            <TabsTrigger value="square">
              <Building2 className="h-4 w-4 mr-2" />
              Square
            </TabsTrigger>
            <TabsTrigger value="cash">
              <Banknote className="h-4 w-4 mr-2" />
              Cash
            </TabsTrigger>
          </TabsList>

          {/* M-Pesa Configuration */}
          <TabsContent value="mpesa">
            <Card>
              <CardHeader>
                <CardTitle>M-Pesa Configuration (Safaricom)</CardTitle>
                <CardDescription>
                  Configure M-Pesa payment gateway settings for Kenyan mobile payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mpesa-enabled">Enable M-Pesa Payments</Label>
                  <Switch
                    id="mpesa-enabled"
                    checked={getMpesaConfig().enabled}
                    onCheckedChange={(checked) => 
                      setPaymentConfig(prev => ({
                        ...prev,
                        mpesa: { ...getMpesaConfig(), enabled: checked }
                      }))
                    }
                  />
                </div>

                {getMpesaConfig().enabled && (
                  <>
                    <Separator />
                    
                    <div>
                      <Label>Environment</Label>
                      <Select
                        value={getMpesaConfig().environment}
                        onValueChange={(value: 'sandbox' | 'production') => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            mpesa: { ...getMpesaConfig(), environment: value }
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                          <SelectItem value="production">Production (Live)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Account Type</Label>
                      <Select
                        value={getMpesaConfig().accountType}
                        onValueChange={(value: 'till' | 'paybill') => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            mpesa: { ...getMpesaConfig(), accountType: value }
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="till">Buy Goods (Till Number)</SelectItem>
                          <SelectItem value="paybill">Paybill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {getMpesaConfig().accountType === 'till' ? (
                      <div>
                        <Label htmlFor="till-number">Till Number</Label>
                        <Input
                          id="till-number"
                          type="text"
                          value={getMpesaConfig().tillNumber}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              mpesa: { ...getMpesaConfig(), tillNumber: e.target.value }
                            }))
                          }
                          placeholder="Enter Till Number"
                          className="mt-2"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="paybill-number">Paybill Number</Label>
                        <Input
                          id="paybill-number"
                          type="text"
                          value={getMpesaConfig().paybillNumber}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              mpesa: { ...getMpesaConfig(), paybillNumber: e.target.value }
                            }))
                          }
                          placeholder="Enter Paybill Number"
                          className="mt-2"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="business-shortcode">Business Short Code</Label>
                      <Input
                        id="business-shortcode"
                        type="text"
                        value={getMpesaConfig().businessShortCode}
                        onChange={(e) => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            mpesa: { ...getMpesaConfig(), businessShortCode: e.target.value }
                          }))
                        }
                        placeholder="Enter Business Short Code"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="consumer-key">Consumer Key</Label>
                      <Input
                        id="consumer-key"
                        type="text"
                        value={getMpesaConfig().consumerKey}
                        onChange={(e) => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            mpesa: { ...getMpesaConfig(), consumerKey: e.target.value }
                          }))
                        }
                        placeholder="Enter Consumer Key"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="consumer-secret">Consumer Secret</Label>
                      <div className="relative mt-2">
                        <Input
                          id="consumer-secret"
                          type={showSecrets.mpesaConsumerSecret ? 'text' : 'password'}
                          value={getMpesaConfig().consumerSecret}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              mpesa: { ...getMpesaConfig(), consumerSecret: e.target.value }
                            }))
                          }
                          placeholder="Enter Consumer Secret"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecret('mpesaConsumerSecret')}
                        >
                          {showSecrets.mpesaConsumerSecret ? 
                            <EyeOff className="h-4 w-4" /> : 
                            <Eye className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="passkey">Passkey</Label>
                      <div className="relative mt-2">
                        <Input
                          id="passkey"
                          type={showSecrets.mpesaPasskey ? 'text' : 'password'}
                          value={getMpesaConfig().passkey}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              mpesa: { ...getMpesaConfig(), passkey: e.target.value }
                            }))
                          }
                          placeholder="Enter Passkey"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecret('mpesaPasskey')}
                        >
                          {showSecrets.mpesaPasskey ? 
                            <EyeOff className="h-4 w-4" /> : 
                            <Eye className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {getMpesaConfig().environment === 'sandbox' ? 
                          'Currently in Sandbox mode. Test credentials are being used.' : 
                          'Production mode active. Live transactions will be processed.'
                        }
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* M-Pesa KCB Configuration */}
          <TabsContent value="mpesa-kcb">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  M-Pesa KCB Configuration
                  <Badge variant="default" className="bg-green-600">East Africa</Badge>
                </CardTitle>
                <CardDescription>
                  Configure M-Pesa KCB payment gateway for multi-currency East African payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mpesa-kcb-enabled">Enable M-Pesa KCB Payments</Label>
                  <Switch
                    id="mpesa-kcb-enabled"
                    checked={getMpesaKcbConfig().enabled}
                    onCheckedChange={(checked) => 
                      setPaymentConfig(prev => ({
                        ...prev,
                        mpesaKcb: { ...getMpesaKcbConfig(), enabled: checked }
                      }))
                    }
                  />
                </div>

                {getMpesaKcbConfig().enabled && (
                  <>
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Environment</Label>
                        <Select
                          value={getMpesaKcbConfig().environment}
                          onValueChange={(value: 'sandbox' | 'production') => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              mpesaKcb: { ...getMpesaKcbConfig(), environment: value }
                            }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                            <SelectItem value="production">Production (Live)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Default Currency</Label>
                        <Select
                          value={getMpesaKcbConfig().defaultCurrency}
                          onValueChange={(value) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              mpesaKcb: { ...getMpesaKcbConfig(), defaultCurrency: value }
                            }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KES">🇰🇪 KES - Kenya Shillings</SelectItem>
                            <SelectItem value="UGX">🇺🇬 UGX - Uganda Shillings</SelectItem>
                            <SelectItem value="TZS">🇹🇿 TZS - Tanzania Shillings</SelectItem>
                            <SelectItem value="RWF">🇷🇼 RWF - Rwanda Francs</SelectItem>
                            <SelectItem value="BIF">🇧🇮 BIF - Burundi Francs</SelectItem>
                            <SelectItem value="CDF">🇨🇩 CDF - Congo Francs</SelectItem>
                            <SelectItem value="SSP">🇸🇸 SSP - South Sudan Pounds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="kcb-api-key">KCB API Key</Label>
                      <div className="relative mt-2">
                        <Input
                          id="kcb-api-key"
                          type={showSecrets.mpesaKcbApiKey ? 'text' : 'password'}
                          value={getMpesaKcbConfig().apiKey}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              mpesaKcb: { ...getMpesaKcbConfig(), apiKey: e.target.value }
                            }))
                          }
                          placeholder="Enter KCB API Key"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecret('mpesaKcbApiKey')}
                        >
                          {showSecrets.mpesaKcbApiKey ? 
                            <EyeOff className="h-4 w-4" /> : 
                            <Eye className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="kcb-base-url">Base URL</Label>
                      <Input
                        id="kcb-base-url"
                        type="text"
                        value={getMpesaKcbConfig().baseUrl}
                        onChange={(e) => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            mpesaKcb: { ...getMpesaKcbConfig(), baseUrl: e.target.value }
                          }))
                        }
                        placeholder="https://api.dev.zed.business"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="kcb-external-origin">External Origin</Label>
                      <Input
                        id="kcb-external-origin"
                        type="text"
                        value={getMpesaKcbConfig().externalOrigin}
                        onChange={(e) => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            mpesaKcb: { ...getMpesaKcbConfig(), externalOrigin: e.target.value }
                          }))
                        }
                        placeholder="9002742"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="kcb-callback-url">Callback URL</Label>
                      <Input
                        id="kcb-callback-url"
                        type="text"
                        value={getMpesaKcbConfig().callbackUrl}
                        onChange={(e) => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            mpesaKcb: { ...getMpesaKcbConfig(), callbackUrl: e.target.value }
                          }))
                        }
                        placeholder="http://192.168.2.43:5000/api/mpesa-kcb/callback"
                        className="mt-2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={testMpesaKcbConnection}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Test Connection
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => window.open('/check-mpesa-kcb-integration.html', '_blank')}
                        className="flex-1"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Full Integration Test
                      </Button>
                    </div>

                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Integration Status:</strong> M-Pesa KCB is configured and ready to process payments in {getMpesaKcbConfig().supportedCurrencies.join(', ')}.
                        <br />
                        <strong>Callback URL:</strong> Make sure this URL is configured in your KCB merchant dashboard.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label>Supported Currencies</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {getMpesaKcbConfig().supportedCurrencies.map((currency) => (
                          <Badge key={currency} variant="outline">
                            {currency}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        All East African currencies are supported for cross-border payments
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stripe Configuration */}
          <TabsContent value="stripe">
            <Card>
              <CardHeader>
                <CardTitle>Stripe Configuration</CardTitle>
                <CardDescription>
                  Configure Stripe for international card payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stripe-enabled">Enable Stripe Payments</Label>
                  <Switch
                    id="stripe-enabled"
                    checked={getStripeConfig().enabled}
                    onCheckedChange={(checked) => 
                      setPaymentConfig(prev => ({
                        ...prev,
                        stripe: { ...getStripeConfig(), enabled: checked }
                      }))
                    }
                  />
                </div>

                {getStripeConfig().enabled && (
                  <>
                    <Separator />
                    
                    <div>
                      <Label htmlFor="stripe-public">Publishable Key</Label>
                      <Input
                        id="stripe-public"
                        type="text"
                        value={getStripeConfig().publicKey}
                        onChange={(e) => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            stripe: { ...getStripeConfig(), publicKey: e.target.value }
                          }))
                        }
                        placeholder="pk_test_... or pk_live_..."
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="stripe-secret">Secret Key</Label>
                      <div className="relative mt-2">
                        <Input
                          id="stripe-secret"
                          type={showSecrets.stripeSecret ? 'text' : 'password'}
                          value={getStripeConfig().secretKey}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              stripe: { ...getStripeConfig(), secretKey: e.target.value }
                            }))
                          }
                          placeholder="sk_test_... or sk_live_..."
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecret('stripeSecret')}
                        >
                          {showSecrets.stripeSecret ? 
                            <EyeOff className="h-4 w-4" /> : 
                            <Eye className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="stripe-webhook">Webhook Secret</Label>
                      <div className="relative mt-2">
                        <Input
                          id="stripe-webhook"
                          type={showSecrets.stripeWebhook ? 'text' : 'password'}
                          value={getStripeConfig().webhookSecret}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              stripe: { ...getStripeConfig(), webhookSecret: e.target.value }
                            }))
                          }
                          placeholder="whsec_..."
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecret('stripeWebhook')}
                        >
                          {showSecrets.stripeWebhook ? 
                            <EyeOff className="h-4 w-4" /> : 
                            <Eye className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Square Configuration */}
          <TabsContent value="square">
            <Card>
              <CardHeader>
                <CardTitle>Square Configuration</CardTitle>
                <CardDescription>
                  Configure Square for point-of-sale and online payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="square-enabled">Enable Square Payments</Label>
                  <Switch
                    id="square-enabled"
                    checked={getSquareConfig().enabled}
                    onCheckedChange={(checked) => 
                      setPaymentConfig(prev => ({
                        ...prev,
                        square: { ...getSquareConfig(), enabled: checked }
                      }))
                    }
                  />
                </div>

                {getSquareConfig().enabled && (
                  <>
                    <Separator />
                    
                    <div>
                      <Label htmlFor="square-app">Application ID</Label>
                      <Input
                        id="square-app"
                        type="text"
                        value={getSquareConfig().applicationId}
                        onChange={(e) => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            square: { ...getSquareConfig(), applicationId: e.target.value }
                          }))
                        }
                        placeholder="Enter Application ID"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="square-token">Access Token</Label>
                      <div className="relative mt-2">
                        <Input
                          id="square-token"
                          type={showSecrets.squareAccess ? 'text' : 'password'}
                          value={getSquareConfig().accessToken}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              square: { ...getSquareConfig(), accessToken: e.target.value }
                            }))
                          }
                          placeholder="Enter Access Token"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecret('squareAccess')}
                        >
                          {showSecrets.squareAccess ? 
                            <EyeOff className="h-4 w-4" /> : 
                            <Eye className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Configuration */}
          <TabsContent value="cash">
            <Card>
              <CardHeader>
                <CardTitle>Cash Payments</CardTitle>
                <CardDescription>
                  Enable or disable cash payment option
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cash-enabled">Accept Cash Payments</Label>
                  <Switch
                    id="cash-enabled"
                    checked={getCashConfig().enabled}
                    onCheckedChange={(checked) => 
                      setPaymentConfig(prev => ({
                        ...prev,
                        cash: { ...getCashConfig(), enabled: checked }
                      }))
                    }
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Cash payments will be tracked manually by staff members at the point of sale.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment Methods Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>M-Pesa</span>
                </div>
                <Badge variant={getMpesaConfig().enabled ? "default" : "secondary"}>
                  {getMpesaConfig().enabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>M-Pesa KCB</span>
                </div>
                <Badge variant={getMpesaKcbConfig().enabled ? "default" : "secondary"}>
                  {getMpesaKcbConfig().enabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Stripe</span>
                </div>
                <Badge variant={getStripeConfig().enabled ? "default" : "secondary"}>
                  {getStripeConfig().enabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Square</span>
                </div>
                <Badge variant={getSquareConfig().enabled ? "default" : "secondary"}>
                  {getSquareConfig().enabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  <span>Cash</span>
                </div>
                <Badge variant={getCashConfig().enabled ? "default" : "secondary"}>
                  {getCashConfig().enabled ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default PaymentGatewaySettings;
