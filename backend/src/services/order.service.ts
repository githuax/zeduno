import mongoose from 'mongoose';
import Order, { IOrder } from '../models/Order';
import Table from '../models/Table';
import { MenuItem } from '../models/MenuItem';

export interface OrderQueryParams {
  status?: string | string[];
  orderType?: string;
  paymentStatus?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  tenantId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  tableId?: string;
  orderNumber?: string;
}

export interface OrderQueryResult {
  orders: any[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
}

export class OrderService {
  /**
   * Generate unique order number
   */
  static generateOrderNumber(): string {
    // Generate shorter order number format: ORD-XXXX
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${random}`;
  }

  /**
   * Build order query based on parameters
   */
  static buildOrderQuery(params: OrderQueryParams): any {
    const { 
      status, 
      orderType, 
      paymentStatus, 
      date, 
      startDate, 
      endDate, 
      customerId, 
      tenantId,
      tableId,
      orderNumber
    } = params;

    let query: any = {};

    if (tenantId) {
      query.tenantId = tenantId;
    }
    
    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    }
    
    if (orderType) {
      query.orderType = orderType;
    }
    
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    if (customerId) {
      query.customerId = customerId;
    }

    if (tableId) {
      query.tableId = tableId;
    }

    if (orderNumber) {
      query.orderNumber = orderNumber;
    }
    
    // Date filtering
    if (date) {
      const dateStart = new Date(date);
      const dateEnd = new Date(date);
      dateEnd.setDate(dateEnd.getDate() + 1);
      query.createdAt = { $gte: dateStart, $lt: dateEnd };
    } else if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        query.createdAt.$lt = end;
      }
    }

    return query;
  }

  /**
   * Get orders with pagination and filtering
   */
  static async getOrders(params: OrderQueryParams): Promise<OrderQueryResult> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const query = this.buildOrderQuery(params);
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;

    // Execute query with population
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.menuItem', 'name price')
        .populate('tableId', 'number section')
        .populate('customerId', 'firstName lastName email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query)
    ]);

    return {
      orders,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum
    };
  }

  /**
   * Get single order by ID
   */
  static async getOrderById(
    id: string, 
    tenantId?: string,
    populateFields: boolean = true
  ): Promise<IOrder | null> {
    const query: any = { _id: new mongoose.Types.ObjectId(id) };
    
    if (tenantId) {
      query.tenantId = tenantId;
    }

    let orderQuery = Order.findOne(query);

    if (populateFields) {
      orderQuery = orderQuery
        .populate('items.menuItem', 'name price description')
        .populate('tableId', 'number section status')
        .populate('customerId', 'firstName lastName email phone');
    }

    return await orderQuery.lean();
  }

  /**
   * Get order by order number
   */
  static async getOrderByNumber(
    orderNumber: string,
    tenantId?: string
  ): Promise<IOrder | null> {
    const query: any = { orderNumber };
    
    if (tenantId) {
      query.tenantId = tenantId;
    }

    return await Order.findOne(query)
      .populate('items.menuItem', 'name price')
      .lean();
  }

  /**
   * Calculate order totals
   */
  static calculateOrderTotals(items: any[], taxRate: number = 0.1): OrderTotals {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      total
    };
  }

  /**
   * Validate order items availability
   */
  static async validateOrderItems(items: any[]): Promise<{
    valid: boolean;
    errors: string[];
    validatedItems: any[];
  }> {
    const errors: string[] = [];
    const validatedItems: any[] = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      
      if (!menuItem) {
        errors.push(`Menu item ${item.menuItemId} not found`);
        continue;
      }

      if (!menuItem.isAvailable) {
        errors.push(`${menuItem.name} is not available`);
        continue;
      }

      validatedItems.push({
        ...item,
        name: menuItem.name,
        price: menuItem.price,
        preparationTime: menuItem.preparationTime
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      validatedItems
    };
  }

  /**
   * Create order
   */
  static async createOrder(orderData: any): Promise<IOrder> {
    const orderNumber = this.generateOrderNumber();
    
    const order = new Order({
      ...orderData,
      orderNumber,
      status: orderData.status || 'pending',
      paymentStatus: orderData.paymentStatus || 'pending'
    });

    await order.save();
    
    // Populate references
    await order.populate([
      { path: 'items.menuItemId', select: 'name price' },
      { path: 'tableId', select: 'number section' },
      { path: 'customerId', select: 'firstName lastName email phone' }
    ]);

    return order;
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string,
    status: string,
    tenantId?: string,
    additionalUpdates?: any
  ): Promise<IOrder | null> {
    const query: any = { _id: new mongoose.Types.ObjectId(orderId) };
    
    if (tenantId) {
      query.tenantId = tenantId;
    }

    const updates: any = { 
      status,
      [`statusHistory.${status}At`]: new Date()
    };

    if (additionalUpdates) {
      Object.assign(updates, additionalUpdates);
    }

    // Special handling for completed orders
    if (status === 'completed' && !additionalUpdates?.completedAt) {
      updates.completedAt = new Date();
    }

    // Special handling for cancelled orders
    if (status === 'cancelled' && !additionalUpdates?.cancelledAt) {
      updates.cancelledAt = new Date();
    }

    return await Order.findOneAndUpdate(
      query,
      updates,
      { new: true }
    ).populate('items.menuItem', 'name price');
  }

  /**
   * Update table availability when order is created/completed
   */
  static async updateTableAvailability(
    tableId: string,
    isAvailable: boolean
  ): Promise<void> {
    if (tableId) {
      await Table.findByIdAndUpdate(tableId, {
        status: isAvailable ? 'available' : 'occupied',
        ...(isAvailable && { currentOrderId: null })
      });
    }
  }

  /**
   * Get kitchen orders
   */
  static async getKitchenOrders(tenantId: string): Promise<IOrder[]> {
    return await Order.find({
      tenantId,
      status: { $in: ['confirmed', 'preparing'] },
      'items.status': { $ne: 'ready' }
    })
    .populate('items.menuItem', 'name preparationTime')
    .populate('tableId', 'number section')
    .sort({ createdAt: 1 })
    .lean();
  }

  /**
   * Get delivery orders
   */
  static async getDeliveryOrders(tenantId: string): Promise<IOrder[]> {
    return await Order.find({
      tenantId,
      orderType: 'delivery',
      status: { $in: ['confirmed', 'preparing', 'ready'] }
    })
    .populate('items.menuItem', 'name')
    .populate('customerId', 'firstName lastName phone')
    .sort({ createdAt: 1 })
    .lean();
  }

  /**
   * Calculate order analytics
   */
  static async getOrderAnalytics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const query: any = { tenantId };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const [
      totalOrders,
      completedOrders,
      cancelledOrders,
      revenue,
      averageOrderValue,
      ordersByStatus,
      ordersByType,
      topItems
    ] = await Promise.all([
      Order.countDocuments(query),
      Order.countDocuments({ ...query, status: 'completed' }),
      Order.countDocuments({ ...query, status: 'cancelled' }),
      Order.aggregate([
        { $match: { ...query, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { ...query, status: 'completed' } },
        { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: query },
        { $group: { _id: '$orderType', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { ...query, status: 'completed' } },
        { $unwind: '$items' },
        { $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          count: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      revenue: revenue[0]?.total || 0,
      averageOrderValue: averageOrderValue[0]?.avg || 0,
      ordersByStatus,
      ordersByType,
      topItems,
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0
    };
  }
}