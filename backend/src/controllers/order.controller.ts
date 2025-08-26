import { Request, Response, NextFunction } from 'express';
import Order, { IOrder } from '../models/Order';
import Table from '../models/Table';
import { MenuItem } from '../models/MenuItem';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { OrderService } from '../services/order.service';

interface AuthRequest extends Request {
  user?: {
    id?: string;
    _id?: string;
    tenantId: string;
    role: string;
  };
}

// Get all orders with advanced filtering
export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      orderType,
      paymentStatus,
      date,
      startDate,
      endDate,
      customerId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const tenantId = req.user?.tenantId || req.body.tenantId;

    const result = await OrderService.getOrders({
      status: status as string | string[],
      orderType: orderType as string,
      paymentStatus: paymentStatus as string,
      date: date as string,
      startDate: startDate as string,
      endDate: endDate as string,
      customerId: customerId as string,
      tenantId,
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder as string
    });
    
    res.json({
      success: true,
      orders: result.orders,
      pagination: {
        page: result.currentPage,
        limit: Number(limit),
        total: result.total,
        pages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    next(error);
  }
};

// Get single order by ID with tenant validation
export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const order = await OrderService.getOrderById(id, tenantId, true);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    next(error);
  }
};

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('Creating order with data:', JSON.stringify(req.body, null, 2));
    console.log('User info:', JSON.stringify(req.user, null, 2));
    
    const orderData = req.body;
    const userId = req.user?.id || req.user?._id;
    // Convert staffId to ObjectId format if it's a mock user
    if (userId === 'mock-user-id' || userId === 'joe-pizza-admin-id') {
      orderData.staffId = new mongoose.Types.ObjectId();
    } else {
      orderData.staffId = userId;
    }
    
    // Convert tenantId to ObjectId if it's a string
    const tenantId = req.user?.tenantId;
    if (typeof tenantId === 'string') {
      orderData.tenantId = new mongoose.Types.ObjectId(tenantId);
    } else {
      orderData.tenantId = tenantId;
    }
    
    // Generate orderNumber if not provided (usually handled by pre-save hook)
    if (!orderData.orderNumber) {
      const date = new Date();
      const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      orderData.orderNumber = `ORD-${dateStr}-${random}`;
    }
    
    // Calculate totals
    let subtotal = 0;
    for (const item of orderData.items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(400).json({ message: `Menu item ${item.menuItem} not found` });
      }
      item.price = menuItem.price;
      
      // Add customization prices
      if (item.customizations) {
        for (const custom of item.customizations) {
          item.price += custom.price;
        }
      }
      
      subtotal += item.price * item.quantity;
    }
    
    orderData.subtotal = subtotal;
    orderData.tax = subtotal * 0.18; // 18% tax
    orderData.serviceCharge = orderData.orderType === 'dine-in' ? subtotal * 0.1 : 0; // 10% service charge for dine-in
    orderData.total = subtotal + orderData.tax + orderData.serviceCharge - (orderData.discount || 0);
    
    const order = new Order(orderData);
    await order.save();
    
    // Update table status if dine-in
    if (orderData.orderType === 'dine-in' && orderData.tableId) {
      await Table.findByIdAndUpdate(orderData.tableId, {
        status: 'occupied',
        currentOrderId: order._id
      });
    }
    
    const populatedOrder = await Order.findById(order._id)
      .populate('tableId')
      .populate('items.menuItem')
      .populate('staffId', 'firstName lastName');
    
    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Create order error:', error);
    next(error);
  }
};

export const updateOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Recalculate totals if items are updated
    if (updates.items) {
      // Get the existing order to check its orderType
      const existingOrder = await Order.findById(id);
      if (!existingOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      let subtotal = 0;
      for (const item of updates.items) {
        subtotal += item.price * item.quantity;
      }
      
      // Use the orderType from updates if provided, otherwise use existing order's orderType
      const orderType = updates.orderType || existingOrder.orderType;
      
      updates.subtotal = subtotal;
      updates.tax = subtotal * 0.18;
      updates.serviceCharge = orderType === 'dine-in' ? subtotal * 0.1 : 0;
      updates.total = subtotal + updates.tax + updates.serviceCharge - (updates.discount || 0);
    }
    
    const order = await Order.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    })
      .populate('tableId')
      .populate('items.menuItem')
      .populate('staffId', 'name');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update table status if order is completed
    if (updates.status === 'completed' && order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, {
        status: 'available',
        currentOrderId: null
      });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    next(error);
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.user?.tenantId;
    
    const order = await OrderService.updateOrderStatus(id, status, tenantId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update table status
    if (status === 'completed' && order.tableId) {
      await OrderService.updateTableAvailability(order.tableId.toString(), true);
    }
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Error updating order status', error });
  }
};

export const updateItemStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, itemId } = req.params;
    const { status } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const item = order.items.find(i => i._id?.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in order' });
    }
    
    item.status = status;
    await order.save();
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Error updating item status', error });
  }
};

export const splitOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { splits } = req.body; // Array of { items: [itemIds], customerId? }
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const splitBills = [];
    for (let i = 0; i < splits.length; i++) {
      const splitItems = order.items.filter(item => 
        splits[i].items.includes(item._id?.toString())
      );
      
      const splitTotal = splitItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      splitBills.push({
        billNumber: i + 1,
        items: splitItems,
        total: splitTotal + (splitTotal * 0.18), // Add tax
        paymentStatus: 'pending'
      });
    }
    
    order.splitBills = splitBills as any;
    await order.save();
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Error splitting order', error });
  }
};

export const mergeOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderIds, tableId } = req.body;
    
    const orders = await Order.find({ _id: { $in: orderIds } });
    if (orders.length !== orderIds.length) {
      return res.status(404).json({ message: 'One or more orders not found' });
    }
    
    // Combine all items from all orders
    const mergedItems = orders.flatMap(order => order.items);
    const mergedSubtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);
    
    // Create new merged order
    const mergedOrder = new Order({
      orderType: orders[0].orderType,
      tableId: tableId || orders[0].tableId,
      customerName: orders[0].customerName,
      items: mergedItems,
      subtotal: mergedSubtotal,
      tax: mergedSubtotal * 0.18,
      serviceCharge: orders[0].orderType === 'dine-in' ? mergedSubtotal * 0.1 : 0,
      total: mergedSubtotal + (mergedSubtotal * 0.18) + (orders[0].orderType === 'dine-in' ? mergedSubtotal * 0.1 : 0),
      mergedFromOrders: orderIds,
      staffId: (req as any).user._id,
      notes: `Merged from orders: ${orders.map(o => o.orderNumber).join(', ')}`
    });
    
    await mergedOrder.save();
    
    // Cancel original orders
    await Order.updateMany(
      { _id: { $in: orderIds } },
      { status: 'cancelled', notes: `Merged into order ${mergedOrder.orderNumber}` }
    );
    
    const populatedOrder = await Order.findById(mergedOrder._id)
      .populate('tableId')
      .populate('items.menuItem')
      .populate('staffId', 'name');
    
    res.json(populatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error merging orders', error });
  }
};

export const printKitchenOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate('tableId')
      .populate('items.menuItem');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update kitchen printed timestamp
    order.kitchenPrintedAt = new Date();
    await order.save();
    
    // Format order for kitchen
    const kitchenOrder = {
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      table: order.orderType === 'dine-in' ? (order.tableId as any)?.tableNumber : null,
      timestamp: new Date().toLocaleString(),
      items: order.items.map(item => ({
        name: (item.menuItem as any).name,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
        status: item.status
      })),
      notes: order.notes,
      priority: order.orderType === 'dine-in' ? 'HIGH' : 'NORMAL'
    };
    
    res.json({
      message: 'Kitchen order prepared for printing',
      kitchenOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Error printing kitchen order', error });
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update table status if applicable
    if (order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, {
        status: 'available',
        currentOrderId: null
      });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error });
  }
};

// Enhanced Order Management Functions

// Cancel order with reason
export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    const order = await Order.findOne({ _id: id, tenantId });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check if order can be cancelled
    const nonCancellableStatuses = ['delivered', 'completed', 'cancelled', 'refunded'];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    // Use the model method to update status
    await order.updateStatus('cancelled', new mongoose.Types.ObjectId(userId), reason);
    order.cancelReason = reason;
    order.cancelledBy = new mongoose.Types.ObjectId(userId);
    await order.save();

    res.json({
      success: true,
      order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    next(error);
  }
};

// Get orders for kitchen display system
export const getKitchenOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const orders = await OrderService.getKitchenOrders(tenantId);

    // Transform for kitchen display
    const kitchenOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      status: order.status,
      priority: order.priority,
      tableNumber: order.tableId ? (order.tableId as any).number : null,
      customerName: order.customerName,
      items: order.items.map(item => ({
        name: (item.menuItem as any)?.name || (item as any).name,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
        status: item.status
      })),
      kitchenNotes: order.kitchenNotes,
      estimatedTime: order.estimatedTime,
      preparationTime: order.preparationTime,
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      orders: kitchenOrders
    });
  } catch (error) {
    console.error('Get kitchen orders error:', error);
    next(error);
  }
};

// Get delivery orders
export const getDeliveryOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const orders = await OrderService.getDeliveryOrders(tenantId);

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get delivery orders error:', error);
    next(error);
  }
};

// Assign driver to delivery order
export const assignDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { driverId, driverName, driverPhone } = req.body;
    const tenantId = req.user?.tenantId;

    const order = await Order.findOne({ 
      _id: id, 
      tenantId,
      orderType: 'delivery'
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery order not found' 
      });
    }

    if (!order.deliveryInfo) {
      order.deliveryInfo = {} as any;
    }

    order.deliveryInfo.driverId = driverId;
    order.deliveryInfo.driverName = driverName;
    order.deliveryInfo.driverPhone = driverPhone;
    order.deliveryInfo.trackingUrl = `/track/${order.orderNumber}`;

    await order.save();

    res.json({
      success: true,
      order,
      message: 'Driver assigned successfully'
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    next(error);
  }
};

// Submit customer feedback
export const submitFeedback = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check if order is completed
    if (!['delivered', 'completed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for completed orders'
      });
    }

    order.rating = rating;
    order.review = review;
    order.feedbackSubmittedAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    next(error);
  }
};

// Get order analytics
export const getOrderAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { startDate, endDate } = req.query;

    const analytics = await OrderService.getOrderAnalytics(
      tenantId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get order analytics error:', error);
    next(error);
  }
};

// Legacy analytics implementation (keeping for reference)
const legacyAnalytics = async (tenantId: string, startDate?: string, endDate?: string) => {
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const pipeline = [
      { 
        $match: { 
          tenantId: new mongoose.Types.ObjectId(tenantId as string),
          ...(startDate || endDate ? { createdAt: dateFilter } : {})
        } 
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          ordersByType: { $push: '$orderType' },
          ordersByStatus: { $push: '$status' },
          ratings: { $push: '$rating' }
        }
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          averageOrderValue: { $round: ['$averageOrderValue', 2] },
          ordersByType: {
            dineIn: {
              $size: {
                $filter: {
                  input: '$ordersByType',
                  cond: { $eq: ['$$this', 'dine-in'] }
                }
              }
            },
            takeaway: {
              $size: {
                $filter: {
                  input: '$ordersByType',
                  cond: { $eq: ['$$this', 'takeaway'] }
                }
              }
            },
            delivery: {
              $size: {
                $filter: {
                  input: '$ordersByType',
                  cond: { $eq: ['$$this', 'delivery'] }
                }
              }
            }
          },
          completedOrders: {
            $size: {
              $filter: {
                input: '$ordersByStatus',
                cond: { $in: ['$$this', ['completed', 'delivered']] }
              }
            }
          },
          cancelledOrders: {
            $size: {
              $filter: {
                input: '$ordersByStatus',
                cond: { $eq: ['$$this', 'cancelled'] }
              }
            }
          },
          averageRating: {
            $avg: {
              $filter: {
                input: '$ratings',
                cond: { $ne: ['$$this', null] }
              }
            }
          }
        }
      }
    ];

    const [analytics] = await Order.aggregate(pipeline);

    return analytics || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      ordersByType: { dineIn: 0, takeaway: 0, delivery: 0 },
      completedOrders: 0,
      cancelledOrders: 0,
      averageRating: 0
    };
};

// Get real-time order stats for dashboard
export const getRealtimeStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const [
      newOrders,
      preparingOrders,
      readyOrders,
      recentCompleted
    ] = await Promise.all([
      Order.countDocuments({ tenantId, status: 'pending' }),
      Order.countDocuments({ tenantId, status: 'preparing' }),
      Order.countDocuments({ tenantId, status: 'ready' }),
      Order.countDocuments({ 
        tenantId, 
        status: { $in: ['completed', 'delivered'] },
        completedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      })
    ]);

    res.json({
      success: true,
      stats: {
        newOrders,
        preparingOrders,
        readyOrders,
        recentCompleted
      }
    });
  } catch (error) {
    console.error('Get realtime stats error:', error);
    next(error);
  }
};