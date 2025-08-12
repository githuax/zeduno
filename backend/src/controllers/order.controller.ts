import { Request, Response } from 'express';
import Order, { IOrder } from '../models/Order';
import Table from '../models/Table';
import MenuItem from '../models/Menu';

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { status, orderType, paymentStatus, date } = req.query;
    
    let query: any = {};
    
    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(date as string);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }
    
    const orders = await Order.find(query)
      .populate('tableId')
      .populate('items.menuItem')
      .populate('staffId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('tableId')
      .populate('items.menuItem')
      .populate('staffId', 'name');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    orderData.staffId = (req as any).user._id;
    
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
      .populate('staffId', 'name');
    
    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error creating order', error });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Recalculate totals if items are updated
    if (updates.items) {
      let subtotal = 0;
      for (const item of updates.items) {
        subtotal += item.price * item.quantity;
      }
      updates.subtotal = subtotal;
      updates.tax = subtotal * 0.18;
      updates.serviceCharge = updates.orderType === 'dine-in' ? subtotal * 0.1 : 0;
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
    res.status(400).json({ message: 'Error updating order', error });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      id,
      { status, ...(status === 'completed' ? { completedAt: new Date() } : {}) },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update table status
    if (status === 'completed' && order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, {
        status: 'available',
        currentOrderId: null
      });
    }
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Error updating order status', error });
  }
};

export const updateItemStatus = async (req: Request, res: Response) => {
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

export const splitOrder = async (req: Request, res: Response) => {
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

export const mergeOrders = async (req: Request, res: Response) => {
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

export const printKitchenOrder = async (req: Request, res: Response) => {
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

export const deleteOrder = async (req: Request, res: Response) => {
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