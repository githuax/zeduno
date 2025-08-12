import { useState, useEffect } from 'react';
import { Plus, Minus, X, ChefHat } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useTables } from '@/hooks/useTables';
import { CreateOrderInput, MenuItem, OrderItemCustomization, OrderType } from '@/types/order.types';
import { toast } from '@/hooks/use-toast';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedTableId?: string;
  preselectedOrderType?: OrderType;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customizations: OrderItemCustomization[];
  specialInstructions: string;
  totalPrice: number;
}

export function CreateOrderDialog({ open, onOpenChange, onSuccess, preselectedTableId, preselectedOrderType }: CreateOrderDialogProps) {
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableId, setTableId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    zipCode: '',
    instructions: '',
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems();
  const { data: tables = [], isLoading: tablesLoading } = useTables();

  const availableTables = tables.filter(t => t.status === 'available');
  
  // Set preselected values when dialog opens
  useEffect(() => {
    if (open) {
      if (preselectedTableId) {
        setTableId(preselectedTableId);
        setOrderType('dine-in');
      }
      if (preselectedOrderType) {
        setOrderType(preselectedOrderType);
      }
    }
  }, [preselectedTableId, preselectedOrderType, open]);
  const categories = ['all', ...new Set(menuItems.map(item => item.category))];

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const addToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find(item => item.menuItem._id === menuItem._id);
    if (existingItem) {
      updateQuantity(menuItem._id, existingItem.quantity + 1);
    } else {
      setCart([...cart, {
        menuItem,
        quantity: 1,
        customizations: [],
        specialInstructions: '',
        totalPrice: menuItem.price,
      }]);
    }
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart(cart.map(item => {
      if (item.menuItem._id === menuItemId) {
        const customizationPrice = item.customizations.reduce((sum, c) => sum + c.price, 0);
        return {
          ...item,
          quantity,
          totalPrice: (item.menuItem.price + customizationPrice) * quantity,
        };
      }
      return item;
    }));
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter(item => item.menuItem._id !== menuItemId));
  };

  const updateCustomizations = (menuItemId: string, customizations: OrderItemCustomization[]) => {
    setCart(cart.map(item => {
      if (item.menuItem._id === menuItemId) {
        const customizationPrice = customizations.reduce((sum, c) => sum + c.price, 0);
        return {
          ...item,
          customizations,
          totalPrice: (item.menuItem.price + customizationPrice) * item.quantity,
        };
      }
      return item;
    }));
  };

  const updateSpecialInstructions = (menuItemId: string, instructions: string) => {
    setCart(cart.map(item => 
      item.menuItem._id === menuItemId 
        ? { ...item, specialInstructions: instructions }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = async () => {
    if (!customerName) {
      toast({
        title: 'Error',
        description: 'Customer name is required',
        variant: 'destructive',
      });
      return;
    }

    if (orderType === 'dine-in' && !tableId) {
      toast({
        title: 'Error',
        description: 'Please select a table',
        variant: 'destructive',
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add items to the order',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const orderData: CreateOrderInput = {
      orderType,
      customerName,
      customerPhone,
      tableId: orderType === 'dine-in' ? tableId : undefined,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      items: cart.map(item => ({
        menuItem: item.menuItem._id,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
      })),
      notes,
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order created successfully',
        });
        onSuccess();
        resetForm();
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create order',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setTableId('');
    setDeliveryAddress({
      street: '',
      city: '',
      zipCode: '',
      instructions: '',
    });
    setCart([]);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Add items and customer details to create a new order
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Order Type</Label>
              <Tabs value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dine-in">Dine In</TabsTrigger>
                  <TabsTrigger value="takeaway">Takeaway</TabsTrigger>
                  <TabsTrigger value="delivery">Delivery</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone"
                />
              </div>
            </div>

            {orderType === 'dine-in' && (
              <div>
                <Label htmlFor="table">Table *</Label>
                <Select value={tableId} onValueChange={setTableId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.map(table => (
                      <SelectItem key={table._id} value={table._id}>
                        Table {table.tableNumber} (Capacity: {table.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {orderType === 'delivery' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                    placeholder="Enter street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={deliveryAddress.zipCode}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, zipCode: e.target.value})}
                      placeholder="Enter zip"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="instructions">Delivery Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={deliveryAddress.instructions}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, instructions: e.target.value})}
                    placeholder="Special delivery instructions"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Order Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special requests or notes"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No items added</p>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.menuItem._id} className="flex items-start justify-between border-b pb-2">
                          <div className="flex-1">
                            <p className="font-medium">{item.menuItem.name}</p>
                            {item.customizations.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {item.customizations.map(c => c.option).join(', ')}
                              </p>
                            )}
                            {item.specialInstructions && (
                              <p className="text-xs text-muted-foreground italic">
                                {item.specialInstructions}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateQuantity(item.menuItem._id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateQuantity(item.menuItem._id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 mt-1"
                              onClick={() => removeFromCart(item.menuItem._id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? 'Creating...' : 'Create Order'}
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
              <Label>Menu Items</Label>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="w-full flex-wrap h-auto">
                  {categories.map(cat => (
                    <TabsTrigger key={cat} value={cat} className="capitalize">
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 gap-3">
                {filteredMenuItems.map((item) => (
                  <Card key={item._id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-semibold text-lg">${item.price.toFixed(2)}</span>
                            {!item.isAvailable && (
                              <Badge variant="secondary">Unavailable</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addToCart(item)}
                          disabled={!item.isAvailable}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {cart.find(c => c.menuItem._id === item._id) && item.customizations && item.customizations.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-2">Customizations:</p>
                          {item.customizations.map((custom) => (
                            <div key={custom.name} className="space-y-1">
                              <p className="text-xs font-medium">{custom.name}:</p>
                              <div className="flex flex-wrap gap-2">
                                {custom.options.map((option) => {
                                  const cartItem = cart.find(c => c.menuItem._id === item._id);
                                  const isSelected = cartItem?.customizations.some(
                                    c => c.name === custom.name && c.option === option.name
                                  );
                                  return (
                                    <Button
                                      key={option.name}
                                      size="sm"
                                      variant={isSelected ? 'default' : 'outline'}
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        if (!cartItem) return;
                                        const newCustomizations = cartItem.customizations.filter(
                                          c => c.name !== custom.name
                                        );
                                        if (!isSelected) {
                                          newCustomizations.push({
                                            name: custom.name,
                                            option: option.name,
                                            price: option.price,
                                          });
                                        }
                                        updateCustomizations(item._id, newCustomizations);
                                      }}
                                    >
                                      {option.name} {option.price > 0 && `+$${option.price}`}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          <div className="mt-2">
                            <Input
                              placeholder="Special instructions..."
                              value={cart.find(c => c.menuItem._id === item._id)?.specialInstructions || ''}
                              onChange={(e) => updateSpecialInstructions(item._id, e.target.value)}
                              className="text-sm"
                            />
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