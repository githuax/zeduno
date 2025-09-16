import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  alcoholic?: boolean;
  customizations?: {
    [key: string]: any;
  };
  specialInstructions?: string;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isInCart: (menuItemId: string) => boolean;
  getCartItem: (menuItemId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    const existingItem = items.find(item => 
      item.menuItemId === newItem.menuItemId && 
      JSON.stringify(item.customizations) === JSON.stringify(newItem.customizations)
    );

    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + newItem.quantity);
    } else {
      const cartItem: CartItem = {
        ...newItem,
        id: `${newItem.menuItemId}-${Date.now()}-${Math.random()}`
      };
      setItems(prev => [...prev, cartItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const isInCart = (menuItemId: string) => {
    return items.some(item => item.menuItemId === menuItemId);
  };

  const getCartItem = (menuItemId: string) => {
    return items.find(item => item.menuItemId === menuItemId);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isInCart,
        getCartItem
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
