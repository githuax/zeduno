import { Request, Response } from 'express';
import Table from '../models/Table';

export const getTables = async (req: Request, res: Response) => {
  try {
    const { status, floor, section } = req.query;
    
    let query: any = {};
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

export const getTable = async (req: Request, res: Response) => {
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

export const createTable = async (req: Request, res: Response) => {
  try {
    const table = new Table(req.body);
    await table.save();
    res.status(201).json(table);
  } catch (error) {
    res.status(400).json({ message: 'Error creating table', error });
  }
};

export const updateTable = async (req: Request, res: Response) => {
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

export const updateTableStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const table = await Table.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    res.status(400).json({ message: 'Error updating table status', error });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
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