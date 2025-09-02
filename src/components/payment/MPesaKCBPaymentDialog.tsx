import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building,
  Smartphone, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Phone,
  Globe,
  Clock
} from "lucide-react";
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/api';
import { usePaymentStatus } from '@/hooks/useSocket';

interface MPesaKCBPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: {
    id: string;
    amount: number;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  };
  onPaymentSuccess?: (transactionId: string, reference: string) => void;
  onPaymentError?: (error: string) => void;
}

export const MPesaKCBPaymentDialog = ({ 
  open, 
  onOpenChange, 
  orderData, 
  onPaymentSuccess, 
  onPaymentError 
}: MPesaKCBPaymentDialogProps) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('KES');
  const [paymentStep, setPaymentStep] = useState<'input' | 'processing' | 'pending' | 'success' | 'error'>('input');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [transactionReference, setTransactionReference] = useState<string>('');
  
  const { format: formatPrice, currencyCode } = useCurrency();
  const { toast } = useToast();
  
  // 🔥 REAL-TIME PAYMENT STATUS UPDATES
  const { paymentStatus, connected } = usePaymentStatus(orderData.id);
  
  // Handle real-time payment status updates
  useEffect(() => {
    if (paymentStatus && paymentStep === 'pending') {
      console.log('🔥 Real-time payment update received:', paymentStatus);
      
      if (paymentStatus.status === 'completed') {
        setPaymentStep('success');
        setTransactionReference(paymentStatus.transactionReference || paymentStatus.transactionId || '');
        
        toast({
          title: '🎉 Payment Confirmed!',
          description: 'Your M-Pesa payment has been processed successfully.',
        });
        
        // Auto-close after showing success
        setTimeout(() => {
          onPaymentSuccess?.(
            paymentStatus.transactionId || 'realtime_success',
            paymentStatus.transactionReference || ''
          );
        }, 2000);
        
      } else if (paymentStatus.status === 'failed') {
        setPaymentStep('error');
        setErrorMessage(paymentStatus.message || 'Payment failed');
        
        toast({
          title: '❌ Payment Failed',
          description: paymentStatus.message || 'Payment could not be processed.',
          variant: 'destructive'
        });
      }
    }
  }, [paymentStatus, paymentStep]);

  const supportedCurrencies = [
    { code: 'KES', name: 'Kenya Shillings', flag: '🇰🇪' },
    { code: 'UGX', name: 'Uganda Shillings', flag: '🇺🇬' },
    { code: 'TZS', name: 'Tanzania Shillings', flag: '🇹🇿' },
    { code: 'RWF', name: 'Rwanda Francs', flag: '🇷🇼' },
    { code: 'BIF', name: 'Burundi Francs', flag: '🇧🇮' },
    { code: 'CDF', name: 'Congo Francs', flag: '🇨🇩' },
    { code: 'SSP', name: 'South Sudan Pounds', flag: '🇸🇸' }
  ];

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format based on country code patterns
    if (digits.startsWith('254')) {
      // Kenya: +254 XXX XXX XXX
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '+$1 $2 $3 $4');
    } else if (digits.startsWith('256')) {
      // Uganda: +256 XXX XXX XXX
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '+$1 $2 $3 $4');
    } else if (digits.startsWith('255')) {
      // Tanzania: +255 XXX XXX XXX
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '+$1 $2 $3 $4');
    }
    
    return phone;
  };

  const validatePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    
    // Check for valid East African country codes
    const validPrefixes = ['254', '256', '255', '250', '257', '243', '211'];
    return validPrefixes.some(prefix => digits.startsWith(prefix)) && digits.length >= 12;
  };

  const handlePayment = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setErrorMessage('Please enter a valid East African phone number');
      return;
    }

    setPaymentStep('processing');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('mpesa-kcb/initiate'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderData.id,
          amount: orderData.amount,
          currency: selectedCurrency,
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          customerName: orderData.customerName,
          description: `Order #${orderData.id} - ${orderData.customerName}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate M-Pesa KCB payment');
      }

      const result = await response.json();
      setTransactionReference(result.reference || `KCB${Date.now()}`);
      
      // IMPORTANT FIX: Check if this is a real payment or mock
      if (result.paymentStatus === 'initiated' || result.requiresUserAction) {
        // This is a mock/pending payment - don't mark order as paid
        setPaymentStep('pending');
        
        // Show user the pending state instead of success
        toast({
          title: 'Payment Request Sent',
          description: 'Please wait for M-Pesa STK push on your phone',
        });
        
        // DO NOT call onPaymentSuccess here - order should remain unpaid
      } else if (result.paymentStatus === 'completed') {
        // Real payment completed - safe to mark as paid
        setPaymentStep('success');
        setTimeout(() => {
          onPaymentSuccess?.(result.transactionId || `kcb_${Date.now()}`, result.reference || '');
          handleClose();
        }, 3000);
      } else {
        // Default to pending for safety
        setPaymentStep('pending');
      }

    } catch (error) {
      console.error('M-Pesa KCB payment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
      setPaymentStep('error');
      onPaymentError?.(errorMessage);
      
      // Reset to input step after showing error
      setTimeout(() => {
        setPaymentStep('input');
      }, 3000);
    }
  };

  const handleClose = () => {
    setPaymentStep('input');
    setPhoneNumber('');
    setSelectedCurrency('KES');
    setErrorMessage('');
    setTransactionReference('');
    onOpenChange(false);
  };

  const copyReference = () => {
    navigator.clipboard.writeText(transactionReference);
    toast({
      title: 'Copied',
      description: 'Transaction reference copied to clipboard',
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-green-600" />
            M-Pesa KCB Payment
            <Badge variant="default" className="bg-green-600">East Africa</Badge>
          </DialogTitle>
          <DialogDescription>
            Complete payment using M-Pesa KCB for order #{orderData.id}
          </DialogDescription>
        </DialogHeader>

        {paymentStep === 'input' && (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Order ID:</span>
                  <span className="font-mono">{orderData.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Customer:</span>
                  <span>{orderData.customerName}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Amount:</span>
                  <span>{formatPrice(orderData.amount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Currency Selection */}
            <div>
              <Label>Currency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number Input */}
            <div>
              <Label htmlFor="phone">Mobile Phone Number</Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+254 XXX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter phone number with country code (Kenya +254, Uganda +256, Tanzania +255, etc.)
              </p>
            </div>

            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                M-Pesa KCB supports cross-border payments across East Africa.
                The customer will receive an SMS prompt to complete the payment.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handlePayment}
              disabled={!validatePhoneNumber(phoneNumber)}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Building className="h-4 w-4 mr-2" />
              Send Payment Request
            </Button>
          </div>
        )}

        {paymentStep === 'processing' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">Processing M-Pesa KCB Payment</h3>
              <p className="text-muted-foreground text-center">
                Sending payment request to {formatPhoneNumber(phoneNumber)}...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Please check your phone for the payment prompt
              </p>
            </CardContent>
          </Card>
        )}

        {paymentStep === 'pending' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Waiting for Payment</h3>
              <p className="text-muted-foreground text-center mb-4">
                Payment request sent to {formatPhoneNumber(phoneNumber)}
              </p>
              
              {transactionReference && (
                <div className="w-full space-y-2">
                  <Label>Transaction Reference</Label>
                  <div className="flex gap-2">
                    <Input
                      value={transactionReference}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={copyReference}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Please complete the M-Pesa payment on your phone. 
                  The order will remain pending until payment is confirmed.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={() => setPaymentStep('input')} variant="secondary">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentStep === 'success' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Payment Confirmed</h3>
              <p className="text-muted-foreground text-center mb-4">
                Payment of {formatPrice(orderData.amount)} completed successfully.
              </p>
              
              {transactionReference && (
                <div className="w-full space-y-2">
                  <Label>Transaction Reference</Label>
                  <div className="flex gap-2">
                    <Input
                      value={transactionReference}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={copyReference}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <Alert className="mt-4">
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Thank you! Your payment has been processed successfully.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {paymentStep === 'error' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Payment Failed</h3>
              <p className="text-muted-foreground text-center mb-4">
                {errorMessage || 'There was an error processing your M-Pesa KCB payment.'}
              </p>
              <Button 
                onClick={() => setPaymentStep('input')}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};
