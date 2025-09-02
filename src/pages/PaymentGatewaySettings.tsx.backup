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
  ArrowLeft
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
  
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    mpesaPasskey: false,
    mpesaConsumerSecret: false,
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
          setPaymentConfig(data.config);
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
                <CardTitle>M-Pesa Configuration</CardTitle>
                <CardDescription>
                  Configure M-Pesa payment gateway settings for Kenyan mobile payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mpesa-enabled">Enable M-Pesa Payments</Label>
                  <Switch
                    id="mpesa-enabled"
                    checked={paymentConfig.mpesa.enabled}
                    onCheckedChange={(checked) => 
                      setPaymentConfig(prev => ({
                        ...prev,
                        mpesa: { ...prev.mpesa, enabled: checked }
                      }))
                    }
                  />
                </div>

                {paymentConfig.mpesa.enabled && (
                  <>
                    <Separator />
                    
                    <div>
                      <Label>Environment</Label>
                      <Select
                        value={paymentConfig.mpesa.environment}
                        onValueChange={(value: 'sandbox' | 'production') => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            mpesa: { ...prev.mpesa, environment: value }
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
                        value={paymentConfig.mpesa.accountType}
                        onValueChange={(value: 'till' | 'paybill') => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            mpesa: { ...prev.mpesa, accountType: value }
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

                    {paymentConfig.mpesa.accountType === 'till' ? (
                      <div>
                        <Label htmlFor="till-number">Till Number</Label>
                        <Input
                          id="till-number"
                          type="text"
                          value={paymentConfig.mpesa.tillNumber}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              mpesa: { ...prev.mpesa, tillNumber: e.target.value }
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
                          value={paymentConfig.mpesa.paybillNumber}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              mpesa: { ...prev.mpesa, paybillNumber: e.target.value }
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
                        value={paymentConfig.mpesa.businessShortCode}
                        onChange={(e) => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            mpesa: { ...prev.mpesa, businessShortCode: e.target.value }
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
                        value={paymentConfig.mpesa.consumerKey}
                        onChange={(e) => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            mpesa: { ...prev.mpesa, consumerKey: e.target.value }
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
                          value={paymentConfig.mpesa.consumerSecret}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              mpesa: { ...prev.mpesa, consumerSecret: e.target.value }
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
                          value={paymentConfig.mpesa.passkey}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              mpesa: { ...prev.mpesa, passkey: e.target.value }
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
                        {paymentConfig.mpesa.environment === 'sandbox' ? 
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
                    checked={paymentConfig.stripe.enabled}
                    onCheckedChange={(checked) => 
                      setPaymentConfig(prev => ({
                        ...prev,
                        stripe: { ...prev.stripe, enabled: checked }
                      }))
                    }
                  />
                </div>

                {paymentConfig.stripe.enabled && (
                  <>
                    <Separator />
                    
                    <div>
                      <Label htmlFor="stripe-public">Publishable Key</Label>
                      <Input
                        id="stripe-public"
                        type="text"
                        value={paymentConfig.stripe.publicKey}
                        onChange={(e) => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            stripe: { ...prev.stripe, publicKey: e.target.value }
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
                          value={paymentConfig.stripe.secretKey}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              stripe: { ...prev.stripe, secretKey: e.target.value }
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
                          value={paymentConfig.stripe.webhookSecret}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              stripe: { ...prev.stripe, webhookSecret: e.target.value }
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
                    checked={paymentConfig.square.enabled}
                    onCheckedChange={(checked) => 
                      setPaymentConfig(prev => ({
                        ...prev,
                        square: { ...prev.square, enabled: checked }
                      }))
                    }
                  />
                </div>

                {paymentConfig.square.enabled && (
                  <>
                    <Separator />
                    
                    <div>
                      <Label htmlFor="square-app">Application ID</Label>
                      <Input
                        id="square-app"
                        type="text"
                        value={paymentConfig.square.applicationId}
                        onChange={(e) => 
                          setPaymentConfig(prev => ({
                            ...prev,
                            square: { ...prev.square, applicationId: e.target.value }
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
                          value={paymentConfig.square.accessToken}
                          onChange={(e) => 
                            setPaymentConfig(prev => ({
                              ...prev,
                              square: { ...prev.square, accessToken: e.target.value }
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
                    checked={paymentConfig.cash.enabled}
                    onCheckedChange={(checked) => 
                      setPaymentConfig(prev => ({
                        ...prev,
                        cash: { ...prev.cash, enabled: checked }
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>M-Pesa</span>
                </div>
                <Badge variant={paymentConfig.mpesa.enabled ? "default" : "secondary"}>
                  {paymentConfig.mpesa.enabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Stripe</span>
                </div>
                <Badge variant={paymentConfig.stripe.enabled ? "default" : "secondary"}>
                  {paymentConfig.stripe.enabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Square</span>
                </div>
                <Badge variant={paymentConfig.square.enabled ? "default" : "secondary"}>
                  {paymentConfig.square.enabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  <span>Cash</span>
                </div>
                <Badge variant={paymentConfig.cash.enabled ? "default" : "secondary"}>
                  {paymentConfig.cash.enabled ? "Active" : "Inactive"}
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