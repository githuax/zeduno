import React, { useState, useEffect } from 'react';
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
import { useCurrency } from '@/hooks/useCurrency';
import { useEmployees } from '@/hooks/useEmployees';
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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
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
  const { data: employees = [], isLoading: employeesLoading } = useEmployees({ status: 'active' });
  const { format: formatPrice } = useCurrency();

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

  const categories = ['all', ...new Set((menuItems || []).map(item => typeof item.category === 'string' ? item.category : item.category?.name || 'Unknown'))];

  const filteredMenuItems = selectedCategory === 'all' 
    ? (menuItems || [])
    : (menuItems || []).filter(item => {
        const itemCategory = typeof item.category === 'string' ? item.category : item.category?.name || 'Unknown';
        return itemCategory === selectedCategory;
      });

  // Debug logging
  React.useEffect(() => {
    if (open) {
      console.log('CreateOrderDialog opened - Debug info:');
      console.log('Menu items:', menuItems);
      console.log('Menu items length:', menuItems?.length);
      console.log('Menu loading:', menuLoading);
      console.log('Filtered menu items:', filteredMenuItems);
      console.log('Categories:', categories);
      console.log('Current user token exists:', !!localStorage.getItem('token'));
      console.log('Selected category:', selectedCategory);
      
      // Check for Jack Daniels specifically
      const jackDaniels = menuItems?.find(item => 
        item.name.toLowerCase().includes('jack daniels') || 
        item.name.toLowerCase().includes('tennessee')
      );
      console.log('Jack Daniels found:', jackDaniels);
      
      // Log first few menu items for reference
      console.log('First 3 menu items:', menuItems?.slice(0, 3));
    }
  }, [open, menuItems, menuLoading, filteredMenuItems, categories, selectedCategory]);

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

    // Find the menu item to check stock
    const menuItem = menuItems?.find(item => item._id === menuItemId);
    if (menuItem?.trackInventory && menuItem.amount !== undefined) {
      if (quantity > menuItem.amount) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${menuItem.amount} units of ${menuItem.name} are available in stock.`,
          variant: "destructive",
        });
        return;
      }
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
    if (!selectedEmployeeId) {
      toast({
        title: 'Error',
        description: 'Please select an employee placing the order',
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
      staffId: selectedEmployeeId, // Link the employee who placed the order (backend expects staffId)
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
    setSelectedEmployeeId('');
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
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Create New Order</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Add items and customer details to create a new order
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4 order-2 lg:order-1">
            <div>
              <Label className="text-sm sm:text-base">Order Type</Label>
              <Tabs value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dine-in" className="text-xs sm:text-sm">Dine In</TabsTrigger>
                  <TabsTrigger value="takeaway" className="text-xs sm:text-sm">Takeaway</TabsTrigger>
                  <TabsTrigger value="delivery" className="text-xs sm:text-sm">Delivery</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="employee" className="text-xs sm:text-sm">Employee (Placing Order) *</Label>
                <Select value={selectedEmployeeId} onValueChange={(value) => {
                  setSelectedEmployeeId(value);
                  const employee = employees.find(e => e._id === value);
                  if (employee) {
                    setCustomerName(`${employee.firstName} ${employee.lastName}`);
                    setCustomerPhone(employee.phone || '');
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee._id} value={employee._id}>
                        {employee.firstName} {employee.lastName} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Employee phone"
                  disabled={true}
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

            {/* Mobile Order Summary */}
            <Card className="lg:hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ScrollArea className="h-[120px] pr-2">
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4 text-sm">No items added</p>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.menuItem._id} className="flex items-start justify-between text-sm">
                          <div className="flex-1">
                            <p className="font-medium">{item.menuItem.name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs">Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desktop Order Summary */}
            <Card className="hidden lg:block">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ScrollArea className="h-[150px] sm:h-[200px] pr-2 sm:pr-4">
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
                                {item.customizations.filter(c => c && c.option).map(c => c.option).join(', ')}
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
                            <p className="font-medium">{formatPrice(item.totalPrice)}</p>
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
                <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
                  <div className="flex justify-between text-base sm:text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 sm:gap-3">
              <Button
                className="flex-1 text-xs sm:text-sm"
                onClick={handleSubmit}
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? 'Creating...' : 'Create Order'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="text-xs sm:text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 order-1 lg:order-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base sm:text-lg font-semibold">Menu Items</Label>
                {orderType === 'dine-in' && (
                  <Badge variant="secondary" className="bg-restaurant-primary/10 text-restaurant-primary text-xs">
                    <ChefHat className="h-3 w-3 mr-0.5 sm:mr-1" />
                    Dine-In Menu
                  </Badge>
                )}
              </div>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                  {categories.map(cat => (
                    <TabsTrigger key={cat} value={cat} className="capitalize text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5">
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <ScrollArea className="h-[300px] sm:h-[400px] lg:h-[500px] pr-2 sm:pr-4">
              <div className="grid grid-cols-1 gap-3">
                {menuLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading menu items...</p>
                    </div>
                  </div>
                ) : filteredMenuItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No menu items available</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {selectedCategory === 'all' 
                        ? 'No menu items have been created yet, or they may be marked as unavailable.'
                        : `No items found in the "${selectedCategory}" category.`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Please check Menu Management to add items or make them available.
                    </p>
                  </div>
                ) : filteredMenuItems.map((item) => (
                  <Card key={item._id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <h4 className="font-semibold text-sm sm:text-base">{item.name}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1 sm:mt-2">
                            <span className="font-semibold text-base sm:text-lg">{formatPrice(item.price)}</span>
                            {!item.isAvailable && (
                              <Badge variant="secondary" className="text-xs">Unavailable</Badge>
                            )}
                            {item.trackInventory && item.amount !== undefined && (
                              <Badge 
                                variant={item.amount <= (item.minStockLevel || 0) ? "destructive" : "outline"}
                                className="text-xs"
                              >
                                {item.amount === 0 ? "Out of Stock" : `${item.amount} left`}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addToCart(item)}
                          disabled={!item.isAvailable || (item.trackInventory && item.amount === 0)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      
                      {cart.find(c => c.menuItem._id === item._id) && item.customizations && item.customizations.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-2">Customizations:</p>
                          {item.customizations.filter(custom => custom && custom.option).map((custom) => (
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
                                      {option.name} {option.price > 0 && `+${formatPrice(option.price)}`}
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