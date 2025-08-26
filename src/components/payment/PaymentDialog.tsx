import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePaymentMethods, useProcessPayment } from "@/hooks/usePayments";
import { PaymentIntent } from "@/types/payment.types";
import { useCurrency } from '@/hooks/useCurrency';
import { MPesaPaymentDialog } from './MPesaPaymentDialog';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Building2, 
  Gift,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: {
    id: string;
    amount: number;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  };
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
}

export const PaymentDialog = ({ 
  open, 
  onOpenChange, 
  orderData, 
  onPaymentSuccess, 
  onPaymentError 
}: PaymentDialogProps) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [paymentStep, setPaymentStep] = useState<'select' | 'process' | 'success' | 'error'>('select');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showMPesaDialog, setShowMPesaDialog] = useState<boolean>(false);

  const { data: paymentMethods } = usePaymentMethods();
  const { format: formatPrice } = useCurrency();
  const processPayment = useProcessPayment();

  const activePaymentMethods = paymentMethods?.filter(method => method.isEnabled) || [];
  const selectedMethod = activePaymentMethods.find(method => method.id === selectedPaymentMethod);

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

  const subtotal = orderData.amount;
  const taxAmount = subtotal * 0.085; // 8.5% tax
  const processingFee = selectedMethod ? (subtotal + tipAmount) * (selectedMethod.processingFee / 100) : 0;
  const total = subtotal + taxAmount + tipAmount + processingFee;

  const handlePayment = async () => {
    if (!selectedMethod) return;

    // Handle M-Pesa payment separately
    if (selectedMethod.id === 'mpesa') {
      setShowMPesaDialog(true);
      return;
    }

    setPaymentStep('process');

    const paymentIntent: PaymentIntent = {
      id: `pi_${Date.now()}`,
      amount: total,
      currency: 'USD',
      paymentMethod: selectedMethod.id,
      orderId: orderData.id,
      customerInfo: {
        name: orderData.customerName
      },
      metadata: {
        tipAmount,
        taxAmount,
        processingFee
      }
    };

    try {
      const result = await processPayment.mutateAsync(paymentIntent);
      setPaymentStep('success');
      setTimeout(() => {
        onPaymentSuccess?.(result.id);
        handleClose();
      }, 2000);
    } catch (error) {
      setPaymentStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
      onPaymentError?.(errorMessage);
      setTimeout(() => {
        setPaymentStep('select');
      }, 3000);
    }
  };

  const handleClose = () => {
    setPaymentStep('select');
    setSelectedPaymentMethod('');
    setTipAmount(0);
    setErrorMessage('');
    setShowMPesaDialog(false);
    onOpenChange(false);
  };

  const handleMPesaSuccess = (transactionId: string, mpesaReceipt: string) => {
    onPaymentSuccess?.(transactionId);
    handleClose();
  };

  const handleMPesaError = (error: string) => {
    onPaymentError?.(error);
    setShowMPesaDialog(false);
  };

  const tipOptions = [0, 15, 18, 20, 25];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Process Payment
          </DialogTitle>
          <DialogDescription>
            Complete the payment for order #{orderData.id}
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

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8.5%):</span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tip:</span>
                  <span>{formatPrice(tipAmount)}</span>
                </div>
                {selectedMethod && processingFee > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Processing Fee ({selectedMethod.processingFee}%):</span>
                    <span>{formatPrice(processingFee)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <div className="space-y-6">
            {paymentStep === 'select' && (
              <>
                {/* Payment Method Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activePaymentMethods.map((method) => {
                      const Icon = getPaymentIcon(method.type);
                      return (
                        <div
                          key={method.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            selectedPaymentMethod === method.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">{method.name}</p>
                                <p className="text-sm text-muted-foreground">{method.provider}</p>
                              </div>
                            </div>
                            {method.processingFee > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {method.processingFee}% fee
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Tip Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Tip</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {tipOptions.map((tip) => (
                        <Button
                          key={tip}
                          variant={tipAmount === (subtotal * tip / 100) ? "default" : "outline"}
                          onClick={() => setTipAmount(subtotal * tip / 100)}
                          className="text-sm"
                        >
                          {tip === 0 ? 'No Tip' : `${tip}%`}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="custom-tip">Custom Tip Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                        <Input
                          id="custom-tip"
                          type="number"
                          placeholder="0.00"
                          value={tipAmount > 0 ? tipAmount.toFixed(2) : ''}
                          onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                          className="pl-8"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={handlePayment}
                  disabled={!selectedPaymentMethod}
                  className="w-full"
                  size="lg"
                >
                  Process Payment {formatPrice(total)}
                </Button>
              </>
            )}

            {paymentStep === 'process' && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
                  <p className="text-muted-foreground text-center">
                    Please wait while we process your payment...
                  </p>
                </CardContent>
              </Card>
            )}

            {paymentStep === 'success' && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Payment Successful</h3>
                  <p className="text-muted-foreground text-center">
                    Your payment of {formatPrice(total)} has been processed successfully.
                  </p>
                </CardContent>
              </Card>
            )}

            {paymentStep === 'error' && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Payment Failed</h3>
                  <p className="text-muted-foreground text-center">
                    {errorMessage || 'There was an error processing your payment. Please try again.'}
                  </p>
                  <Button 
                    onClick={() => setPaymentStep('select')}
                    variant="outline"
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
      
      {/* M-Pesa Payment Dialog */}
      <MPesaPaymentDialog
        open={showMPesaDialog}
        onOpenChange={setShowMPesaDialog}
        orderData={orderData}
        onPaymentSuccess={handleMPesaSuccess}
        onPaymentError={handleMPesaError}
      />
    </Dialog>
  );
};