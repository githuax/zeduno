import { useState } from 'react';
import { Plus, Minus, Clock, User, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMenuItems } from '@/hooks/useMenuItems';
import { CreateOrderInput, MenuItem, OrderItemCustomization } from '@/types/order.types';
import { toast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { getApiUrl } from '@/config/api';

interface QuickOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface QuickOrderItem {
  menuItem: MenuItem;
  quantity: number;
  totalPrice: number;
}

// Popular items that are quick to prepare for takeaway
const QUICK_ITEMS = [
  'Caesar Salad',
  'Buffalo Wings',
  'Mozzarella Sticks',
  'Margherita Pizza',
  'Fresh Orange Juice',
  'Craft Beer Selection'
];

export function QuickOrderDialog({ open, onOpenChange, onSuccess }: QuickOrderDialogProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [quickCart, setQuickCart] = useState<QuickOrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: menuItems = [] } = useMenuItems({
    available: true
  });
  const { format: formatPrice } = useCurrency();

  // Filter items for quick ordering (fast prep items and popular choices)
  const quickMenuItems = menuItems.filter(item => 
    QUICK_ITEMS.includes(item.name) || 
    item.preparationTime <= 10 ||
    item.tags?.includes('popular')
  ).slice(0, 12); // Limit to 12 items for quick selection

  const addToQuickCart = (menuItem: MenuItem) => {
    const existingItem = quickCart.find(item => item.menuItem._id === menuItem._id);
    if (existingItem) {
      updateQuickQuantity(menuItem._id, existingItem.quantity + 1);
    } else {
      setQuickCart([...quickCart, {
        menuItem,
        quantity: 1,
        totalPrice: menuItem.price,
      }]);
    }
  };

  const updateQuickQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromQuickCart(menuItemId);
      return;
    }
    setQuickCart(quickCart.map(item => {
      if (item.menuItem._id === menuItemId) {
        return {
          ...item,
          quantity,
          totalPrice: item.menuItem.price * quantity,
        };
      }
      return item;
    }));
  };

  const removeFromQuickCart = (menuItemId: string) => {
    setQuickCart(quickCart.filter(item => item.menuItem._id !== menuItemId));
  };

  const calculateQuickTotal = () => {
    return quickCart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getEstimatedPrepTime = () => {
    if (quickCart.length === 0) return 0;
    return Math.max(...quickCart.map(item => item.menuItem.preparationTime * item.quantity));
  };

  const handleQuickSubmit = async () => {
    if (!customerName) {
      toast({
        title: 'Error',
        description: 'Customer name is required',
        variant: 'destructive',
      });
      return;
    }

    if (quickCart.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add items to the order',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const orderData: CreateOrderInput = {
      orderType: 'takeaway',
      customerName,
      customerPhone,
      items: quickCart.map(item => ({
        menuItem: item.menuItem._id,
        quantity: item.quantity,
        customizations: [], // No customizations for quick orders
        specialInstructions: '',
      })),
      notes: 'Quick Order - Fast prep items',
    };

    try {
      const response = await fetch(getApiUrl('orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const newOrder = await response.json();
        toast({
          title: 'Quick Order Created!',
          description: `Order ${newOrder.orderNumber} created with ${getEstimatedPrepTime()}min prep time`,
        });
        onSuccess();
        resetQuickForm();
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create quick order',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuickForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setQuickCart([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Takeaway Order
          </DialogTitle>
          <DialogDescription>
            Fast ordering for popular items with quick preparation times
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="quickCustomerName">
                    <User className="h-3 w-3 inline mr-1" />
                    Customer Name *
                  </Label>
                  <Input
                    id="quickCustomerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter name"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="quickCustomerPhone">
                    <Phone className="h-3 w-3 inline mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    id="quickCustomerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone"
                    type="tel"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                  {quickCart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No items selected</p>
                  ) : (
                    <div className="space-y-3">
                      {quickCart.map((item) => (
                        <div key={item.menuItem._id} className="flex items-center justify-between border-b pb-2">
                          <div className="flex-1">
                            <p className="font-medium">{item.menuItem.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.menuItem.preparationTime}min prep
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateQuickQuantity(item.menuItem._id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateQuickQuantity(item.menuItem._id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                {quickCart.length > 0 && (
                  <div className="border-t pt-3 mt-3 space-y-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>${calculateQuickTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Est. prep time: {getEstimatedPrepTime()} minutes</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleQuickSubmit}
                disabled={isSubmitting || quickCart.length === 0}
              >
                {isSubmitting ? 'Creating...' : 'Create Quick Order'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Quick Menu Items</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Popular items and fast preparation times for quick takeaway orders
              </p>
            </div>

            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 gap-3">
                {quickMenuItems.map((item) => (
                  <Card key={item._id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{item.name}</h4>
                            {item.tags?.includes('popular') && (
                              <Badge variant="secondary" className="text-xs">Popular</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-semibold text-lg">{formatPrice(item.price)}</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{item.preparationTime}min</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addToQuickCart(item)}
                          disabled={!item.isAvailable}
                          className="ml-2"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {quickCart.find(c => c.menuItem._id === item._id) && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-green-600 font-medium">
                              ✓ {quickCart.find(c => c.menuItem._id === item._id)?.quantity} in cart
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}