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
   * Check if service is initialized
   */
  public isInitialized(): boolean {
    return this.io !== null;
  }
}

// Export singleton instance
export const websocketService = WebSocketService.getInstance();
