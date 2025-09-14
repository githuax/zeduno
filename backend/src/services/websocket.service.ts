import { Server } from 'socket.io';

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

export interface AnalyticsUpdate {
  tenantId: string;
  timestamp: Date;
  metrics: {
    revenue: {
      current: number;
      change: number;
      changePercent: number;
    };
    orders: {
      current: number;
      change: number;
      changePercent: number;
    };
    averageOrderValue: {
      current: number;
      change: number;
      changePercent: number;
    };
    tableUtilization: {
      current: number;
      change: number;
      changePercent: number;
    };
  };
  chartData: {
    revenue: Array<{ time: string; value: number; }>;
    orders: Array<{ time: string; value: number; }>;
    paymentMethods: Array<{ name: string; value: number; }>;
    serviceTypes: Array<{ name: string; value: number; }>;
  };
}

export class WebSocketService {
  private static instance: WebSocketService;
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(io: Server): void {
    this.io = io;
    console.log('🔌 WebSocket service initialized');
  }

  /**
   * Emit payment status update to specific order room
   */
  public emitPaymentStatusUpdate(update: PaymentStatusUpdate): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket service not initialized');
      return;
    }

    const room = `order:${update.orderId}`;
    
    console.log(`📡 Emitting payment update to room: ${room}`, {
      orderNumber: update.orderNumber,
      status: update.status,
      transactionId: update.transactionId
    });

    // Emit to order-specific room
    this.io.to(room).emit('payment:status-update', update);
    
    // Also emit to order number room (fallback)
    this.io.to(`order:${update.orderNumber}`).emit('payment:status-update', update);
  }

  /**
   * Emit order status update
   */
  public emitOrderStatusUpdate(update: OrderStatusUpdate): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket service not initialized');
      return;
    }

    const room = `order:${update.orderId}`;
    
    console.log(`📡 Emitting order update to room: ${room}`, {
      orderNumber: update.orderNumber,
      status: update.status
    });

    this.io.to(room).emit('order:status-update', update);
    this.io.to(`order:${update.orderNumber}`).emit('order:status-update', update);
  }

  /**
   * Emit general notification to user
   */
  public emitUserNotification(userId: string, notification: {
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    data?: any;
  }): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket service not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Get current connection count
   */
  public getConnectionCount(): number {
    return this.io?.engine.clientsCount || 0;
  }

  /**
   * Broadcast to all connected clients
   */
  public broadcast(event: string, data: any): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket service not initialized');
      return;
    }

    this.io.emit(event, data);
  }

  /**
   * Emit kitchen order update to kitchen rooms
   */
  public emitKitchenOrderUpdate(update: KitchenOrderUpdate): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket service not initialized');
      return;
    }

    const kitchenRoom = `kitchen:${update.tenantId}`;
    
    console.log(`🍳 Emitting kitchen update to room: ${kitchenRoom}`, {
      orderNumber: update.orderNumber,
      status: update.status,
      action: update.action
    });

    // Emit to tenant-specific kitchen room
    this.io.to(kitchenRoom).emit('kitchen:order-update', update);
    
    // Emit specific event types for better handling
    switch (update.action) {
      case 'new':
        this.io.to(kitchenRoom).emit('kitchen:new-order', update);
        break;
      case 'updated':
        this.io.to(kitchenRoom).emit('kitchen:order-updated', update);
        break;
      case 'cancelled':
        this.io.to(kitchenRoom).emit('kitchen:order-cancelled', update);
        break;
    }
  }

  /**
   * Join kitchen room for tenant
   */
  public joinKitchenRoom(socketId: string, tenantId: string): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket service not initialized');
      return;
    }

    const kitchenRoom = `kitchen:${tenantId}`;
    const socket = this.io.sockets.sockets.get(socketId);
    
    if (socket) {
      socket.join(kitchenRoom);
      console.log(`🍳 Socket ${socketId} joined kitchen room: ${kitchenRoom}`);
    }
  }

  /**
   * Leave kitchen room for tenant
   */
  public leaveKitchenRoom(socketId: string, tenantId: string): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket service not initialized');
      return;
    }

    const kitchenRoom = `kitchen:${tenantId}`;
    const socket = this.io.sockets.sockets.get(socketId);
    
    if (socket) {
      socket.leave(kitchenRoom);
      console.log(`🍳 Socket ${socketId} left kitchen room: ${kitchenRoom}`);
    }
  }

  /**
   * Join analytics room for tenant-specific real-time updates
   */
  public joinAnalyticsRoom(socketId: string, tenantId: string): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket service not initialized');
      return;
    }

    const analyticsRoom = `analytics:${tenantId}`;
    const socket = this.io.sockets.sockets.get(socketId);
    
    if (socket) {
      socket.join(analyticsRoom);
      console.log(`📊 Analytics joined room: ${analyticsRoom} (socket: ${socket.id})`);
      
      // Confirm joining
      socket.emit('analytics-room-joined', { tenantId, room: analyticsRoom });
    }
  }

  /**
   * Leave analytics room
   */
  public leaveAnalyticsRoom(socketId: string, tenantId: string): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket service not initialized');
      return;
    }

    const analyticsRoom = `analytics:${tenantId}`;
    const socket = this.io.sockets.sockets.get(socketId);
    
    if (socket) {
      socket.leave(analyticsRoom);
      console.log(`📊 Analytics left room: ${analyticsRoom} (socket: ${socket.id})`);
    }
  }

  /**
   * Emit real-time analytics update to tenant analytics room
   */
  public emitAnalyticsUpdate(update: AnalyticsUpdate): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket service not initialized');
      return;
    }

    const analyticsRoom = `analytics:${update.tenantId}`;
    
    console.log(`📊 Emitting analytics update to room: ${analyticsRoom}`, {
      revenue: update.metrics.revenue.current,
      orders: update.metrics.orders.current,
      timestamp: update.timestamp
    });

    // Emit comprehensive analytics update
    this.io.to(analyticsRoom).emit('analytics:update', update);
    
    // Emit specific metric updates for granular handling
    this.io.to(analyticsRoom).emit('analytics:revenue', {
      tenantId: update.tenantId,
      timestamp: update.timestamp,
      data: update.metrics.revenue
    });
    
    this.io.to(analyticsRoom).emit('analytics:orders', {
      tenantId: update.tenantId,
      timestamp: update.timestamp,
      data: update.metrics.orders
    });
    
    this.io.to(analyticsRoom).emit('analytics:charts', {
      tenantId: update.tenantId,
      timestamp: update.timestamp,
      data: update.chartData
    });
  }

  /**
   * Get analytics room connection count for a tenant
   */
  public getAnalyticsConnectionCount(tenantId: string): number {
    if (!this.io) return 0;
    
    const analyticsRoom = `analytics:${tenantId}`;
    const room = this.io.sockets.adapter.rooms.get(analyticsRoom);
    return room ? room.size : 0;
  }

  /**
   * Check if service is initialized
   */
  public isInitialized(): boolean {
    return this.io !== null;
  }
}

// Export singleton instance
export const websocketService = WebSocketService.getInstance();
