import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Order from '../models/Order';
import Table from '../models/Table';

interface AuthRequest extends Request {
  user?: {
    id?: string;
    _id?: string;
    tenantId: string;
    role: string;
  };
}

export const getTables = async (req: AuthRequest, res: Response) => {
  try {
    const { status, floor, section } = req.query;
    
    const query: any = {};
    if (status) query.status = status;
    if (floor) query.floor = parseInt(floor as string);
    if (section) query.section = section;
    
    const tables = await Table.find(query)
      .populate('currentOrderId')
      .sort({ floor: 1, section: 1, tableNumber: 1 });
    
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tables', error });
  }
};

export const getTable = async (req: AuthRequest, res: Response) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate('currentOrderId');
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching table', error });
  }
};

export const createTable = async (req: AuthRequest, res: Response) => {
  try {
    const tableData = req.body;
    
    // Set tenantId from authenticated user
    const tenantId = req.user?.tenantId;
    if (typeof tenantId === 'string') {
      tableData.tenantId = new mongoose.Types.ObjectId(tenantId);
    } else {
      tableData.tenantId = tenantId;
    }
    
    // Set default section if not provided
    if (!tableData.section) {
      tableData.section = 'Main';
    }
    
    console.log('Creating table with data:', JSON.stringify(tableData, null, 2));
    console.log('User info:', JSON.stringify(req.user, null, 2));
    
    const table = new Table(tableData);
    await table.save();
    res.status(201).json(table);
  } catch (error) {
    console.error('Create table error:', error);
    res.status(400).json({ message: 'Error creating table', error });
  }
};

export const updateTable = async (req: AuthRequest, res: Response) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    res.status(400).json({ message: 'Error updating table', error });
  }
};

export const updateTableStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Find the current table
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // If trying to change status to 'available' (release table), check for incomplete orders
    if (status === 'available' && table.status === 'occupied') {
      // Find any incomplete orders for this table
      const incompleteOrder = await Order.findOne({
        tableId: id,
        status: { $nin: ['completed', 'cancelled', 'refunded'] }
      });
      
      if (incompleteOrder) {
        return res.status(400).json({
          message: 'Cannot release table. There are incomplete orders for this table.',
          details: {
            orderNumber: incompleteOrder.orderNumber,
            customerName: incompleteOrder.customerName,
            status: incompleteOrder.status,
            orderId: incompleteOrder._id
          }
        });
      }
      
      // Clear currentOrderId when releasing table
      table.currentOrderId = undefined;
    }
    
    // Update the table status
    table.status = status;
    await table.save();
    
    res.json(table);
  } catch (error) {
    res.status(400).json({ message: 'Error updating table status', error });
  }
};

export const deleteTable = async (req: AuthRequest, res: Response) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting table', error });
  }
};