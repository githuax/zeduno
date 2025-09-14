import { ShoppingCart, X, Plus, Minus, ArrowRight, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/hooks/useCurrency';

interface ShoppingCartProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeFromCart, clearCart, getTotalItems, getTotalPrice } = useCart();
  const [open, setOpen] = useState(isOpen || false);
  const navigate = useNavigate();
  const { format: formatPrice } = useCurrency();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
  };

  const handleCheckout = () => {
    setOpen(false);
    navigate('/checkout');
  };

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.08; // 8% tax
  const deliveryFee = subtotal > 25 ? 0 : 2.99;
  const total = subtotal + tax + deliveryFee;

  const CartContent = () => (
    <div className="flex flex-col h-full max-h-[80vh]">
      <DialogHeader className="pb-4">
        <DialogTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Your Order ({getTotalItems()} items)
        </DialogTitle>
      </DialogHeader>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 text-center">Add some delicious items from our menu</p>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Item Image */}
                    <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 rounded-md"></div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Customizations */}
                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <div className="mb-2">
                          {Object.entries(item.customizations).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs mr-1">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Special Instructions */}
                      {item.specialInstructions && (
                        <p className="text-xs text-gray-600 mb-2 italic">
                          "{item.specialInstructions}"
                        </p>
                      )}

                      {/* Quantity and Price */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium text-sm w-6 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(item.price)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4 mt-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )}
                </span>
              </div>
              {subtotal < 25 && (
                <p className="text-xs text-gray-600">
                  Add {formatPrice(25 - subtotal)} more for free delivery
                </p>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleCheckout}
                className="w-full"
                disabled={items.length === 0}
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={clearCart}
                className="w-full text-red-600 hover:text-red-700"
                disabled={items.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-4 w-4 mr-2" />
          View Cart
          {getTotalItems() > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {getTotalItems()}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0">
        <div className="p-6">
          <CartContent />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShoppingCart;