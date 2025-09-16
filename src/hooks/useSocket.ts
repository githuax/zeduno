import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface PaymentStatusUpdate {
  orderId: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  transactionReference?: string;
  amount?: number;
  currency?: string;
  timestamp: Date;
  message?: string;
}

export interface OrderStatusUpdate {
  orderId: string;
  orderNumber: string;
  status: string;
  timestamp: Date;
  message?: string;
}

export interface KitchenOrderUpdate {
  orderId: string;
  orderNumber: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  status: 'confirmed' | 'preparing' | 'ready';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tableNumber?: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    customizations?: Array<{ name: string; value: string; }>;
    specialInstructions?: string;
    status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  }>;
  kitchenNotes?: string;
  preparationTime?: number;
  createdAt: string;
  timestamp: Date;
  tenantId: string;
  action: 'new' | 'updated' | 'cancelled';
}

interface UseSocketOptions {
  autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = { autoConnect: true }) => {
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const getSocketUrl = () => {
    // For production domain, the WebSocket should go through the same domain
    // but we need to check if it's properly configured
    if (window.location.hostname === 'zeduno.piskoe.com') {
      // Try the main domain first, but if it fails, we'll fall back to direct backend connection
      return 'https://zeduno.piskoe.com';
    }
    
    // For local network access (192.168.x.x)
    if (window.location.hostname.startsWith('192.168.')) {
      // When accessing via local network, backend is on same host but port 5000
      return `http://${window.location.hostname}:5000`;
    }
    
    // For localhost development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // Default fallback - try same protocol and hostname with port 5000
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  };

  const connect = () => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    try {
      const socketUrl = getSocketUrl();
      console.log(`🔌 Connecting to WebSocket server: ${socketUrl}`);

      socketRef.current = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current.on('connect', () => {
        console.log('🔌 WebSocket connected:', socketRef.current?.id);
        setConnected(true);
        setConnectionError(null);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        setConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('🔌 WebSocket connection error:', error);
        setConnectionError(error.message);
        setConnected(false);
      });

      return socketRef.current;
    } catch (error) {
      console.error('🔌 Failed to create socket connection:', error);
      setConnectionError('Failed to create socket connection');
      return null;
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting from WebSocket server');
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  };

  const joinOrderRoom = (orderId: string) => {
    if (socketRef.current?.connected) {
      console.log(`📦 Joining order room: ${orderId}`);
      socketRef.current.emit('join-order', orderId);
    }
  };

  const joinUserRoom = (userId: string) => {
    if (socketRef.current?.connected) {
      console.log(`👤 Joining user room: ${userId}`);
      socketRef.current.emit('join-user', userId);
    }
  };

  const joinKitchenRoom = (tenantId: string) => {
    if (socketRef.current?.connected && tenantId) {
      console.log(`🍳 Joining kitchen room: ${tenantId}`);
      socketRef.current.emit('join-kitchen', tenantId);
    }
  };

  const leaveKitchenRoom = (tenantId: string) => {
    if (socketRef.current?.connected && tenantId) {
      console.log(`🍳 Leaving kitchen room: ${tenantId}`);
      socketRef.current.emit('leave-kitchen', tenantId);
    }
  };

  const onPaymentStatusUpdate = (callback: (update: PaymentStatusUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.on('payment:status-update', callback);
    }
  };

  const onOrderStatusUpdate = (callback: (update: OrderStatusUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.on('order:status-update', callback);
    }
  };

  const offPaymentStatusUpdate = (callback?: (update: PaymentStatusUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.off('payment:status-update', callback);
    }
  };

  const offOrderStatusUpdate = (callback?: (update: OrderStatusUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.off('order:status-update', callback);
    }
  };

  const onKitchenOrderUpdate = (callback: (update: KitchenOrderUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.on('kitchen:order-update', callback);
    }
  };

  const onKitchenNewOrder = (callback: (update: KitchenOrderUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.on('kitchen:new-order', callback);
    }
  };

  const onKitchenOrderUpdated = (callback: (update: KitchenOrderUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.on('kitchen:order-updated', callback);
    }
  };

  const onKitchenOrderCancelled = (callback: (update: KitchenOrderUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.on('kitchen:order-cancelled', callback);
    }
  };

  const offKitchenOrderUpdate = (callback?: (update: KitchenOrderUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.off('kitchen:order-update', callback);
    }
  };

  const offKitchenNewOrder = (callback?: (update: KitchenOrderUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.off('kitchen:new-order', callback);
    }
  };

  const offKitchenOrderUpdated = (callback?: (update: KitchenOrderUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.off('kitchen:order-updated', callback);
    }
  };

  const offKitchenOrderCancelled = (callback?: (update: KitchenOrderUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.off('kitchen:order-cancelled', callback);
    }
  };

  useEffect(() => {
    if (options.autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    connected,
    connectionError,
    connect,
    disconnect,
    joinOrderRoom,
    joinUserRoom,
    joinKitchenRoom,
    leaveKitchenRoom,
    onPaymentStatusUpdate,
    onOrderStatusUpdate,
    offPaymentStatusUpdate,
    offOrderStatusUpdate,
    onKitchenOrderUpdate,
    onKitchenNewOrder,
    onKitchenOrderUpdated,
    onKitchenOrderCancelled,
    offKitchenOrderUpdate,
    offKitchenNewOrder,
    offKitchenOrderUpdated,
    offKitchenOrderCancelled,
  };
};

// Hook specifically for payment status updates
export const usePaymentStatus = (orderId: string) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusUpdate | null>(null);
  const { socket, connected, joinOrderRoom, onPaymentStatusUpdate, offPaymentStatusUpdate } = useSocket();

  useEffect(() => {
    if (connected && orderId) {
      // Join the order room
      joinOrderRoom(orderId);

      // Listen for payment updates
      const handlePaymentUpdate = (update: PaymentStatusUpdate) => {
        console.log('💳 Payment status update received:', update);
        if (update.orderId === orderId || update.orderNumber === orderId) {
          setPaymentStatus(update);
        }
      };

      onPaymentStatusUpdate(handlePaymentUpdate);

      return () => {
        offPaymentStatusUpdate(handlePaymentUpdate);
      };
    }
  }, [connected, orderId]);

  return {
    paymentStatus,
    connected,
    socket
  };
};

// Hook specifically for kitchen updates
export const useKitchenUpdates = (tenantId: string, onNewOrder?: (order: KitchenOrderUpdate) => void) => {
  const [orders, setOrders] = useState<KitchenOrderUpdate[]>([]);
  const [lastUpdate, setLastUpdate] = useState<KitchenOrderUpdate | null>(null);
  const { 
    connected, 
    joinKitchenRoom, 
    leaveKitchenRoom,
    onKitchenOrderUpdate,
    onKitchenNewOrder,
    onKitchenOrderUpdated,
    onKitchenOrderCancelled,
    offKitchenOrderUpdate,
    offKitchenNewOrder,
    offKitchenOrderUpdated,
    offKitchenOrderCancelled
  } = useSocket();

  useEffect(() => {
    if (connected && tenantId) {
      console.log('🍳 Setting up kitchen WebSocket listeners for tenant:', tenantId);
      
      // Join the kitchen room
      joinKitchenRoom(tenantId);

      // Handle new orders
      const handleNewOrder = (update: KitchenOrderUpdate) => {
        console.log('🍳 New kitchen order received:', update);
        setOrders(prev => {
          const exists = prev.find(o => o.orderId === update.orderId);
          if (exists) {
            return prev.map(o => o.orderId === update.orderId ? update : o);
          }
          return [update, ...prev];
        });
        setLastUpdate(update);
        onNewOrder?.(update);
      };

      // Handle order updates
      const handleOrderUpdate = (update: KitchenOrderUpdate) => {
        console.log('🍳 Kitchen order updated:', update);
        setOrders(prev => {
          const exists = prev.find(o => o.orderId === update.orderId);
          if (exists) {
            // Update existing order
            return prev.map(o => o.orderId === update.orderId ? update : o);
          } else if (update.status === 'confirmed') {
            // Add new confirmed order
            return [update, ...prev];
          }
          return prev;
        });
        setLastUpdate(update);
      };

      // Handle cancelled orders
      const handleOrderCancelled = (update: KitchenOrderUpdate) => {
        console.log('🍳 Kitchen order cancelled:', update);
        setOrders(prev => prev.filter(o => o.orderId !== update.orderId));
        setLastUpdate(update);
      };

      // Set up listeners
      onKitchenNewOrder(handleNewOrder);
      onKitchenOrderUpdated(handleOrderUpdate);
      onKitchenOrderCancelled(handleOrderCancelled);
      onKitchenOrderUpdate(handleOrderUpdate); // General fallback

      return () => {
        // Clean up listeners
        offKitchenNewOrder(handleNewOrder);
        offKitchenOrderUpdated(handleOrderUpdate);
        offKitchenOrderCancelled(handleOrderCancelled);
        offKitchenOrderUpdate(handleOrderUpdate);
        
        // Leave kitchen room
        leaveKitchenRoom(tenantId);
      };
    }
  }, [connected, tenantId]);

  return {
    orders,
    lastUpdate,
    connected,
    setOrders
  };
};
