import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, MapPin, Phone, Mail, ArrowLeft, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl } from '@/config/api';
import { formatCurrency } from '@/utils/currency';

interface OrderDetails {
  _id: string;
  orderNumber: string;
  orderType: 'delivery' | 'pickup' | 'dine-in' | 'takeaway';
  status: string;
  items: Array<{
    menuItem: {
      _id: string;
      name: string;
      price: number;
      images?: string[];
    };
    quantity: number;
    price: number;
    customizations?: any;
    specialInstructions?: string;
  }>;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryInfo?: {
    deliveryFee: number;
  };
  subtotal: number;
  tax: number;
  total: number;
  estimatedTime?: string;
  preparationTime?: number;
  createdAt: string;
}

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = location.state?.orderId;
  const orderNumber = location.state?.orderNumber;

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      console.log('Fetching order details for ID:', orderId);
      const response = await fetch(getApiUrl(`public-orders/${orderId}`));
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Received order data:', data);
        setOrder(data.data);
      } else {
        console.error('Failed to fetch order:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'picked_up': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'Order Received';
      case 'confirmed': return 'Order Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready for Pickup';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'picked_up': return 'Picked Up';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order && !orderNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Order not found</h2>
            <p className="text-gray-600 mb-6">We couldn't find your order details</p>
            <Button onClick={() => navigate('/order')}>
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use mock data if order details couldn't be fetched but we have order number
  const displayOrder = order || {
    orderNumber: orderNumber || 'N/A',
    orderType: 'takeaway' as const,
    status: 'pending',
    preparationTime: 30,
    customerName: 'Customer',
    customerEmail: '',
    customerPhone: '',
    subtotal: 0,
    tax: 0,
    total: 0,
    items: [],
    createdAt: new Date().toISOString(),
    deliveryInfo: { deliveryFee: 0 }
  };

  // Calculate delivery fee if applicable
  const deliveryFee = displayOrder.orderType === 'delivery' ? (displayOrder.deliveryInfo?.deliveryFee || 2.99) : 0;

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
            <h1 className="text-2xl font-bold">Order Confirmation</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Message */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                Order Placed Successfully!
              </h2>
              <p className="text-green-700 mb-4">
                Thank you for your order. We've received it and will start preparing your food shortly.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  <span>Order #{displayOrder.orderNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Est. {displayOrder.preparationTime || 30} minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Status</span>
                <Badge className={getStatusColor(displayOrder.status)}>
                  {formatStatus(displayOrder.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Steps */}
                <div className="flex items-center justify-between">
                  {['pending', 'confirmed', 'preparing', displayOrder.orderType === 'delivery' ? 'out_for_delivery' : 'ready'].map((step, index, arr) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        ['pending', 'confirmed', 'preparing'].includes(displayOrder.status)
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      {index < arr.length - 1 && (
                        <div className={`flex-1 h-1 mx-2 ${
                          index < arr.indexOf(displayOrder.status) ? 'bg-primary' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Status Description */}
                <div className="text-center py-4">
                  <p className="text-gray-600">
                    {displayOrder.status === 'pending' && 'We have received your order and are processing it.'}
                    {displayOrder.status === 'confirmed' && 'Your order has been confirmed and will be prepared shortly.'}
                    {displayOrder.status === 'preparing' && 'Our kitchen is preparing your delicious meal.'}
                    {displayOrder.status === 'ready' && 'Your order is ready for pickup!'}
                    {displayOrder.status === 'out_for_delivery' && 'Your order is on its way to you.'}
                    {displayOrder.status === 'delivered' && 'Your order has been delivered. Enjoy your meal!'}
                    {displayOrder.status === 'picked_up' && 'You have picked up your order. Enjoy your meal!'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {order && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {displayOrder.orderType === 'delivery' ? <MapPin className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                  {displayOrder.orderType === 'delivery' ? 'Delivery Information' : 'Pickup Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Customer</h4>
                  <p className="text-gray-600">
                    {displayOrder.customerName || 'Customer'}
                  </p>
                  {(displayOrder.customerPhone || displayOrder.customerEmail) && (
                    <div className="flex flex-col gap-1 mt-2">
                      {displayOrder.customerPhone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{displayOrder.customerPhone}</span>
                        </div>
                      )}
                      {displayOrder.customerEmail && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{displayOrder.customerEmail}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {displayOrder.orderType === 'delivery' && displayOrder.deliveryAddress && (
                  <div>
                    <h4 className="font-medium text-gray-900">Delivery Address</h4>
                    <p className="text-gray-600">
                      {displayOrder.deliveryAddress.street}<br />
                      {displayOrder.deliveryAddress.city}, {displayOrder.deliveryAddress.zipCode}
                    </p>
                    {displayOrder.deliveryAddress.instructions && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        "{displayOrder.deliveryAddress.instructions}"
                      </p>
                    )}
                  </div>
                )}

                {(displayOrder.orderType === 'pickup' || displayOrder.orderType === 'takeaway') && (
                  <div>
                    <h4 className="font-medium text-gray-900">Pickup Location</h4>
                    <p className="text-gray-600">
                      Joe's Pizza Palace<br />
                      123 Main Street<br />
                      Anytown, ST 12345
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          {order && displayOrder.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start border-b last:border-b-0 pb-3 last:pb-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.quantity}x</span>
                          <span>{item.menuItem?.name || 'Menu Item'}</span>
                        </div>
                        {item.specialInstructions && (
                          <p className="text-sm text-gray-500 italic mt-1">
                            "{item.specialInstructions}"
                          </p>
                        )}
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}

                  {/* Order Total */}
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(displayOrder.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>{formatCurrency(displayOrder.tax || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{displayOrder.orderType === 'delivery' ? 'Delivery Fee' : 'Pickup'}</span>
                      <span>
                        {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>{formatCurrency(displayOrder.total || 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={() => navigate('/order')} className="flex-1">
              Order Again
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              Print Receipt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;