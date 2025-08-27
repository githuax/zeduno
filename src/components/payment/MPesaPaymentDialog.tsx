import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Phone,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

interface MPesaPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: {
    id: string;
    amount: number;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  };
  onPaymentSuccess?: (transactionId: string, mpesaReceipt: string) => void;
  onPaymentError?: (error: string) => void;
}

interface PaymentStatus {
  status: 'idle' | 'initiating' | 'waiting' | 'completed' | 'failed' | 'timeout';
  message: string;
  transactionId?: string;
  checkoutRequestId?: string;
  mpesaReceipt?: string;
}

export const MPesaPaymentDialog = ({ 
  open, 
  onOpenChange, 
  orderData, 
  onPaymentSuccess, 
  onPaymentError 
}: MPesaPaymentDialogProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: 'idle',
    message: '',
  });
  const [countdown, setCountdown] = useState(0);
  const [isValidPhone, setIsValidPhone] = useState(false);

  const { toast } = useToast();
  const { format: formatPrice } = useCurrency();

  useEffect(() => {
    // Validate phone number (Kenyan format)
    const phoneRegex = /^(?:\+?254|0)?[17]\d{8}$/;
    setIsValidPhone(phoneRegex.test(phoneNumber.replace(/\s/g, '')));
  }, [phoneNumber]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (paymentStatus.status === 'waiting' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setPaymentStatus({
              status: 'timeout',
              message: 'Payment request timed out. Please try again.',
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentStatus.status, countdown]);

  // Poll payment status when waiting
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (paymentStatus.status === 'waiting' && paymentStatus.transactionId) {
      pollInterval = setInterval(() => {
        checkPaymentStatus();
      }, 3000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [paymentStatus.status, paymentStatus.transactionId]);

  const formatPhoneNumber = (phone: string): string => {
    // Remove all spaces and special characters
    let cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Convert to 254 format
    if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(4);
    } else if (cleaned.startsWith('254')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    return `254${cleaned}`;
  };

  const initiatePayment = async () => {
    if (!isValidPhone) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid Kenyan phone number',
        variant: 'destructive',
      });
      return;
    }

    setPaymentStatus({
      status: 'initiating',
      message: 'Initiating M-Pesa payment...',
    });

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const response = await fetch(`${window.location.hostname === '192.168.2.43' ? 'http://192.168.2.43:5000/api' : '/api'}/payments/mpesa/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          orderId: orderData.id,
          phoneNumber: formattedPhone,
          amount: orderData.amount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentStatus({
          status: 'waiting',
          message: data.message || 'Please complete the payment on your phone',
          transactionId: data.transactionId,
          checkoutRequestId: data.checkoutRequestId,
        });
        setCountdown(120); // 2 minutes timeout
        
        toast({
          title: 'Payment Request Sent',
          description: 'Check your phone and enter your M-Pesa PIN to complete the payment',
        });
      } else {
        throw new Error(data.error || 'Failed to initiate payment');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment initiation failed';
      setPaymentStatus({
        status: 'failed',
        message: errorMessage,
      });
      
      toast({
        title: 'Payment Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      onPaymentError?.(errorMessage);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentStatus.transactionId) return;

    try {
      const response = await fetch(`/api/payments/mpesa/status/${paymentStatus.transactionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (data.transactionStatus === 'completed') {
        setPaymentStatus({
          status: 'completed',
          message: 'Payment completed successfully!',
          transactionId: paymentStatus.transactionId,
          mpesaReceipt: data.mpesaStatus?.mpesaReceiptNumber || 'N/A',
        });

        toast({
          title: 'Payment Successful',
          description: `M-Pesa receipt: ${data.mpesaStatus?.mpesaReceiptNumber || 'N/A'}`,
        });

        setTimeout(() => {
          onPaymentSuccess?.(
            paymentStatus.transactionId!,
            data.mpesaStatus?.mpesaReceiptNumber || 'N/A'
          );
          handleClose();
        }, 2000);
      } else if (data.transactionStatus === 'failed') {
        setPaymentStatus({
          status: 'failed',
          message: 'Payment was cancelled or failed',
        });
        
        onPaymentError?.('Payment was cancelled or failed');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setPaymentStatus({
      status: 'idle',
      message: '',
    });
    setCountdown(0);
    onOpenChange(false);
  };

  const retryPayment = () => {
    setPaymentStatus({
      status: 'idle',
      message: '',
    });
    setCountdown(0);
  };

  const getStatusIcon = () => {
    switch (paymentStatus.status) {
      case 'initiating':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'waiting':
        return <Clock className="h-8 w-8 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'failed':
      case 'timeout':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Smartphone className="h-8 w-8 text-primary" />;
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus.status) {
      case 'initiating':
        return 'text-blue-600';
      case 'waiting':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
      case 'timeout':
        return 'text-red-600';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            M-Pesa Payment
          </DialogTitle>
          <DialogDescription>
            Process payment via M-Pesa for order #{orderData.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Order ID:</span>
                  <span className="font-mono">{orderData.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Customer:</span>
                  <span>{orderData.customerName}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span className="text-primary">{formatPrice(orderData.amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <div className="space-y-6">
            {paymentStatus.status === 'idle' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Customer Phone Number
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="phone-number">M-Pesa Phone Number</Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0712345678 or +254712345678"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the customer's M-Pesa registered phone number
                    </p>
                  </div>

                  <Button
                    onClick={initiatePayment}
                    disabled={!isValidPhone}
                    className="w-full"
                    size="lg"
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Send Payment Request {formatPrice(orderData.amount)}
                  </Button>

                  {phoneNumber && !isValidPhone && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please enter a valid Kenyan phone number (e.g., 0712345678)
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {paymentStatus.status !== 'idle' && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  {getStatusIcon()}
                  
                  <h3 className={`text-lg font-medium mt-4 mb-2 ${getStatusColor()}`}>
                    {paymentStatus.status === 'initiating' && 'Initiating Payment...'}
                    {paymentStatus.status === 'waiting' && 'Waiting for Payment'}
                    {paymentStatus.status === 'completed' && 'Payment Successful!'}
                    {paymentStatus.status === 'failed' && 'Payment Failed'}
                    {paymentStatus.status === 'timeout' && 'Payment Timed Out'}
                  </h3>
                  
                  <p className="text-muted-foreground text-center mb-4">
                    {paymentStatus.message}
                  </p>

                  {paymentStatus.status === 'waiting' && countdown > 0 && (
                    <div className="text-center">
                      <Badge variant="outline" className="mb-4">
                        <Clock className="mr-1 h-3 w-3" />
                        {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} remaining
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        The customer should receive an M-Pesa prompt on their phone.
                        <br />
                        They need to enter their M-Pesa PIN to complete the payment.
                      </p>
                    </div>
                  )}

                  {paymentStatus.status === 'completed' && paymentStatus.mpesaReceipt && (
                    <div className="text-center">
                      <Badge variant="default" className="mb-2">
                        <DollarSign className="mr-1 h-3 w-3" />
                        Receipt: {paymentStatus.mpesaReceipt}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Payment of {formatPrice(orderData.amount)} completed successfully
                      </p>
                    </div>
                  )}

                  {(paymentStatus.status === 'failed' || paymentStatus.status === 'timeout') && (
                    <Button 
                      onClick={retryPayment}
                      variant="outline"
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {paymentStatus.status === 'waiting' && (
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  <strong>Instructions for customer:</strong>
                  <br />
                  1. Check your phone for an M-Pesa payment request
                  <br />
                  2. Enter your M-Pesa PIN when prompted
                  <br />
                  3. Confirm the payment to complete the transaction
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};