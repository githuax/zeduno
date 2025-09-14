import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

import { OrderService } from '../services/order.service';

export const createPublicOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    console.log('Received order data:', JSON.stringify(req.body, null, 2));

    const {
      items,
      customer,
      deliveryType,
      deliveryInfo,
      payment,
      totals,
      specialInstructions
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    if (!customer || !customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer information is required'
      });
    }

    if (!deliveryType || !['delivery', 'pickup'].includes(deliveryType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid delivery type is required (delivery or pickup)'
      });
    }

    if (deliveryType === 'delivery' && (!deliveryInfo || !deliveryInfo.address || !deliveryInfo.city)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required for delivery orders'
      });
    }

    // Validate items availability
    const itemValidation = await OrderService.validateOrderItems(items);
    if (!itemValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Some items are not available',
        errors: itemValidation.errors
      });
    }

    // Create order data matching the Order schema
    const orderData = {
      orderType: deliveryType === 'delivery' ? 'delivery' : 'takeaway',
      status: 'pending',
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      
      items: itemValidation.validatedItems.map((item: any) => ({
        menuItem: new mongoose.Types.ObjectId(item.menuItemId),
        menuItemId: new mongoose.Types.ObjectId(item.menuItemId),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customizations: item.customizations || [],
        specialInstructions: item.specialInstructions || '',
        status: 'pending'
      })),
      
      // Add delivery address if delivery
      deliveryAddress: deliveryType === 'delivery' ? {
        street: deliveryInfo.address,
        city: deliveryInfo.city,
        zipCode: deliveryInfo.zipCode,
        instructions: deliveryInfo.instructions || ''
      } : undefined,
      
      subtotal: totals?.subtotal || 0,
      tax: totals?.tax || 0,
      totalAmount: totals?.total || 0,
      
      paymentStatus: 'pending',
      paymentMethod: payment?.method || 'cash',
      
      source: 'website',
      priority: 'normal',
      preparationTime: 30,
      specialInstructions: specialInstructions || '',
      
      // Use a default staff ID for public orders (you might want to create a system user)
      staffId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
      tenantId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011')
    };

    // Create the order using the service
    const order = await OrderService.createOrder(orderData);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('Error creating public order:', error);
    next(error);
  }
};

export const getPublicOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    const order = await OrderService.getOrderById(id, undefined, true);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching public order:', error);
    next(error);
  }
};

export const getPublicOrderByNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { orderNumber } = req.params;

    const order = await OrderService.getOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching public order by number:', error);
    next(error);
  }
};