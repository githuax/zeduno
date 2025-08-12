import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { usePaymentMethods, useProcessPayment } from "@/hooks/usePayments";
import { PaymentIntent } from "@/types/payment.types";
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Building2, 
  Gift,
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign
} from "lucide-react";

interface QuickPaymentProps {
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
}

export const QuickPayment = ({ onPaymentSuccess, onPaymentError }: QuickPaymentProps) => {
  const [amount, setAmount] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  const { data: paymentMethods } = usePaymentMethods();
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

  const calculateTotal = () => {
    const baseAmount = parseFloat(amount) || 0;
    const processingFee = selectedMethod && selectedMethod.processingFee > 0 
      ? baseAmount * (selectedMethod.processingFee / 100) 
      : 0;
    return baseAmount + processingFee;
  };

  const handlePayment = async () => {
    if (!selectedMethod || !amount || !customerName) return;

    setIsProcessing(true);
    setPaymentResult(null);

    const paymentIntent: PaymentIntent = {
      id: `pi_${Date.now()}`,
      amount: calculateTotal(),
      currency: 'USD',
      paymentMethod: selectedMethod.id,
      orderId: `quick_${Date.now()}`,
      customerInfo: {
        name: customerName
      },
      metadata: {
        description: description || 'Quick payment',
        originalAmount: parseFloat(amount),
        processingFee: calculateTotal() - parseFloat(amount)
      }
    };

    try {
      const result = await processPayment.mutateAsync(paymentIntent);
      setPaymentResult({ status: 'success', message: `Payment processed successfully. Transaction ID: ${result.id}` });
      onPaymentSuccess?.(result.id);
      
      // Reset form after success
      setTimeout(() => {
        setAmount('');
        setCustomerName('');
        setSelectedPaymentMethod('');
        setDescription('');
        setPaymentResult(null);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setPaymentResult({ status: 'error', message: errorMessage });
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = amount && customerName && selectedPaymentMethod && parseFloat(amount) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Quick Payment
        </CardTitle>
        <CardDescription>
          Process a quick payment for walk-in customers or manual transactions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {paymentResult && (
          <div className={`p-4 rounded-lg border ${
            paymentResult.status === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {paymentResult.status === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <p className="font-medium">{paymentResult.message}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                step="0.01"
                min="0.01"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer">Customer Name *</Label>
            <Input
              id="customer"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            placeholder="Payment description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        <div className="space-y-3">
          <Label>Payment Method *</Label>
          <div className="grid grid-cols-1 gap-2">
            {activePaymentMethods.map((method) => {
              const Icon = getPaymentIcon(method.type);
              return (
                <div
                  key={method.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedPaymentMethod === method.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
                  onClick={() => !isProcessing && setSelectedPaymentMethod(method.id)}
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
          </div>
        </div>

        {selectedMethod && selectedMethod.processingFee > 0 && amount && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Amount:</span>
                <span>${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Fee ({selectedMethod.processingFee}%):</span>
                <span>${(calculateTotal() - parseFloat(amount)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={handlePayment}
          disabled={!isFormValid || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing Payment...
            </>
          ) : (
            `Process Payment ${amount ? `$${calculateTotal().toFixed(2)}` : ''}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
};