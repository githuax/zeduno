import { useQueryClient } from "@tanstack/react-query";
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Building2, 
  Gift, 
  Settings, 
  TrendingUp,
  DollarSign,
  Receipt,
  AlertCircle,
  CheckCircle,
  History
} from "lucide-react";
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePaymentMethods, usePaymentAnalytics, usePaymentSettings, useTogglePaymentMethod, useUpdatePaymentSettings } from "@/hooks/usePayments";

const PaymentProcessing = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: paymentMethods, isLoading: methodsLoading } = usePaymentMethods();
  const { data: analytics, isLoading: analyticsLoading } = usePaymentAnalytics();
  const { data: settings } = usePaymentSettings();
  const togglePaymentMethod = useTogglePaymentMethod();
  const updateSettings = useUpdatePaymentSettings();
  
  const [localSettings, setLocalSettings] = useState(settings);
  
  const refreshPaymentMethods = () => {
    queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
  };

  // Debug logging
  console.log('PaymentProcessing - paymentMethods:', paymentMethods);
  console.log('PaymentProcessing - methodsLoading:', methodsLoading);

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        return CreditCard;
      case 'digital_wallet':
        return Smartphone;
      case 'cash':
        return Banknote;
      case 'bank_transfer':
        return Building2;
      case 'gift_card':
        return Gift;
      default:
        return CreditCard;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  const formatCurrency = (amount: number) => `KES ${(amount * 130).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const handleMethodToggle = async (methodId: string, enabled: boolean) => {
    try {
      await togglePaymentMethod.mutateAsync({ methodId, enabled });
    } catch (error) {
      console.error('Failed to toggle payment method:', error);
    }
  };

  const handleSettingsUpdate = async (newSettings: any) => {
    try {
      setLocalSettings(newSettings);
      await updateSettings.mutateAsync(newSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  if (methodsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array(3).fill(0).map((_, i) => (
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Payment Processing</h1>
            <p className="text-muted-foreground">
              Manage payment methods, transactions, and financial settings
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/payments/gateway-settings")}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Gateway Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/payments/transactions")}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Transaction History
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/analytics")}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.totalProcessed || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.transactionCount || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.averageTransaction || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Per transaction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Fees</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.totalFees || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage((analytics?.totalFees || 0) / (analytics?.totalProcessed || 1) * 100)} of revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(100 - (analytics?.declineRate || 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(analytics?.declineRate || 0)} decline rate
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>


          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method Distribution</CardTitle>
                  <CardDescription>Transaction volume by payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics?.paymentMethodStats || []}
                        dataKey="amount"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ method, percentage }) => `${method}: ${percentage.toFixed(1)}%`}
                      >
                        {analytics?.paymentMethodStats?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction Volume</CardTitle>
                  <CardDescription>Number of transactions by payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics?.paymentMethodStats || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="method" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method Performance</CardTitle>
                <CardDescription>Detailed breakdown of payment methods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.paymentMethodStats?.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <div>
                          <p className="font-medium">{stat.method}</p>
                          <p className="text-sm text-muted-foreground">{stat.count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(stat.amount)}</p>
                        <p className="text-sm text-muted-foreground">{formatPercentage(stat.percentage)} of total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Configure your payment processing preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={localSettings?.currency || 'KES'} 
                      onValueChange={(value) => handleSettingsUpdate({ ...localSettings, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                        <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                        <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                        <SelectItem value="BIF">BIF - Burundian Franc</SelectItem>
                        <SelectItem value="CDF">CDF - Congolese Franc</SelectItem>
                        <SelectItem value="SSP">SSP - South Sudanese Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      value={localSettings?.taxRate || 0}
                      onChange={(e) => handleSettingsUpdate({ ...localSettings, taxRate: parseFloat(e.target.value) })}
                      step="0.1"
                      min="0"
                      max="50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-amount">Minimum Transaction Amount</Label>
                    <Input
                      id="min-amount"
                      type="number"
                      value={localSettings?.minimumAmount || 0}
                      onChange={(e) => handleSettingsUpdate({ ...localSettings, minimumAmount: parseFloat(e.target.value) })}
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-amount">Maximum Transaction Amount</Label>
                    <Input
                      id="max-amount"
                      type="number"
                      value={localSettings?.maximumAmount || 0}
                      onChange={(e) => handleSettingsUpdate({ ...localSettings, maximumAmount: parseFloat(e.target.value) })}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Processing Options</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-settlement">Auto Settlement</Label>
                      <p className="text-sm text-muted-foreground">Automatically settle transactions daily</p>
                    </div>
                    <Switch
                      id="auto-settlement"
                      checked={localSettings?.autoSettlement || false}
                      onCheckedChange={(checked) => handleSettingsUpdate({ ...localSettings, autoSettlement: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="require-signature">Require Signature</Label>
                      <p className="text-sm text-muted-foreground">Require customer signature for transactions</p>
                    </div>
                    <Switch
                      id="require-signature"
                      checked={localSettings?.requireSignature || false}
                      onCheckedChange={(checked) => handleSettingsUpdate({ ...localSettings, requireSignature: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="require-receipt">Require Receipt</Label>
                      <p className="text-sm text-muted-foreground">Always generate receipt for transactions</p>
                    </div>
                    <Switch
                      id="require-receipt"
                      checked={localSettings?.requireReceipt || false}
                      onCheckedChange={(checked) => handleSettingsUpdate({ ...localSettings, requireReceipt: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Default Tip Options (%)</Label>
                  <div className="flex gap-2">
                    {[15, 18, 20, 25].map((tip) => (
                      <Badge key={tip} variant="secondary" className="px-3 py-1">
                        {tip}%
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default PaymentProcessing;