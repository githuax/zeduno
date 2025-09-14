import { Request, Response, NextFunction } from 'express';

import { Room } from '../models/Room';

export const getAllRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, minPrice, maxPrice, capacity } = req.query;
    
    const filter: any = {};
    if (type) filter.type = type;
    if (capacity) filter.capacity = { $gte: Number(capacity) };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const rooms = await Room.find(filter);
    res.json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
};

export const getRoomById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

export const getAvailableRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { checkIn, checkOut } = req.query;
    
    const rooms = await Room.find({ isAvailable: true });
    
    res.json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
};

export const createRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    next(error);
  }
};