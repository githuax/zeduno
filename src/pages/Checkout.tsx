import { ArrowLeft, CreditCard, MapPin, Clock, Phone, User, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/api';
import { useCart } from '@/contexts/CartContext';
import { useTenantContext } from '@/hooks/useTenant';
import { useCurrency } from '@/hooks/useCurrency';

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface DeliveryInfo {
  address: string;
  city: string;
  zipCode: string;
  instructions: string;
}

interface PaymentInfo {
  method: 'card' | 'cash';
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

const Checkout = () => {
  const { items, getTotalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { format: formatPrice } = useCurrency();

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    address: '',
    city: '',
    zipCode: '',
    instructions: ''
  });

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const { data: tenantContext } = useTenantContext();
  const subtotal = getTotalPrice();
  const baseTaxRate = tenantContext?.tenant.settings.defaultTaxRate ?? 0;
  const alcoholTaxRate = baseTaxRate; // Optional: add tenant setting override in future
  const tax = items.reduce((acc, item) => {
    const rate = item.alcoholic ? alcoholTaxRate : baseTaxRate;
    return acc + (item.price * item.quantity) * (rate / 100);
  }, 0);
  const deliveryFee = deliveryType === 'delivery' ? (subtotal > 25 ? 0 : 2.99) : 0;
  const total = subtotal + tax + deliveryFee;

  const handleCustomerInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(2);
  };

  const handleDeliveryInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryType === 'delivery' && (!deliveryInfo.address || !deliveryInfo.city || !deliveryInfo.zipCode)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all delivery details",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(3);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customizations: item.customizations,
          specialInstructions: item.specialInstructions
        })),
        customer: customerInfo,
        deliveryType,
        deliveryInfo: deliveryType === 'delivery' ? deliveryInfo : null,
        payment: {
          method: paymentInfo.method,
          amount: total
        },
        totals: {
          subtotal,
          tax,
          deliveryFee,
          total
        }
      };

      const response = await fetch(getApiUrl('public-orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        clearCart();
        toast({
          title: "Order Placed Successfully!",
          description: `Your order #${result.data?.orderNumber || 'N/A'} has been received`,
        });
        navigate('/order-confirmation', { 
          state: { 
            orderId: result.data?._id,
            orderNumber: result.data?.orderNumber 
          } 
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place order');
      }
    } catch (error: any) {
      toast({
        title: "Order Failed",
        description: error.message || "There was an error placing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some items to your cart before checking out</p>
            <Button onClick={() => navigate('/order')}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/order')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Menu
            </Button>
            <h1 className="text-2xl font-bold">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center space-x-4 mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      currentStep > step ? 'bg-primary' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Customer Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCustomerInfoSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={customerInfo.firstName}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={customerInfo.lastName}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Continue to Delivery
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Delivery Information */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDeliveryInfoSubmit} className="space-y-4">
                    <RadioGroup
                      value={deliveryType}
                      onValueChange={(value: 'delivery' | 'pickup') => setDeliveryType(value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery">Delivery (+{formatPrice(deliveryFee)})</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup">Pickup (Free)</Label>
                      </div>
                    </RadioGroup>

                    {deliveryType === 'delivery' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="address">Street Address *</Label>
                          <Input
                            id="address"
                            value={deliveryInfo.address}
                            onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">City *</Label>
                            <Input
                              id="city"
                              value={deliveryInfo.city}
                              onChange={(e) => setDeliveryInfo(prev => ({ ...prev, city: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="zipCode">ZIP Code *</Label>
                            <Input
                              id="zipCode"
                              value={deliveryInfo.zipCode}
                              onChange={(e) => setDeliveryInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="instructions">Delivery Instructions</Label>
                          <Textarea
                            id="instructions"
                            value={deliveryInfo.instructions}
                            onChange={(e) => setDeliveryInfo(prev => ({ ...prev, instructions: e.target.value }))}
                            placeholder="e.g., Leave at door, Ring bell, etc."
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                        Back
                      </Button>
                      <Button type="submit" className="flex-1">
                        Continue to Payment
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                    <RadioGroup
                      value={paymentInfo.method}
                      onValueChange={(value: 'card' | 'cash') => setPaymentInfo(prev => ({ ...prev, method: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card">Credit/Debit Card</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash">Cash on {deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}</Label>
                      </div>
                    </RadioGroup>

                    {paymentInfo.method === 'card' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardholderName">Cardholder Name</Label>
                          <Input
                            id="cardholderName"
                            value={paymentInfo.cardholderName}
                            onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardholderName: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            value={paymentInfo.cardNumber}
                            onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardNumber: e.target.value }))}
                            placeholder="1234 5678 9012 3456"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiryDate">Expiry Date</Label>
                            <Input
                              id="expiryDate"
                              value={paymentInfo.expiryDate}
                              onChange={(e) => setPaymentInfo(prev => ({ ...prev, expiryDate: e.target.value }))}
                              placeholder="MM/YY"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              value={paymentInfo.cvv}
                              onChange={(e) => setPaymentInfo(prev => ({ ...prev, cvv: e.target.value }))}
                              placeholder="123"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                        Back
                      </Button>
                      <Button type="submit" className="flex-1" disabled={loading}>
                        {loading ? 'Processing...' : `Place Order - ${formatPrice(total)}`}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="flex-1">{item.quantity}x {item.name}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{deliveryType === 'delivery' ? 'Delivery Fee' : 'Pickup'}</span>
                    <span>
                      {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Estimated Time */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      Estimated {deliveryType === 'delivery' ? 'delivery' : 'pickup'}: 25-35 minutes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
