import { Request, Response, NextFunction } from 'express';

import { Booking } from '../models/Booking';
import { Room } from '../models/Room';

interface AuthRequest extends Request {
  user?: any;
}

export const getAllBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'firstName lastName email')
      .populate('room', 'roomNumber type price');
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('room', 'roomNumber type price');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id && !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

export const getUserBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('room', 'roomNumber type price')
      .sort('-createdAt');
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { room, checkIn, checkOut, guests, specialRequests } = req.body;

    const roomData = await Room.findById(room);
    if (!roomData) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (!roomData.isAvailable) {
      return res.status(400).json({ success: false, message: 'Room is not available' });
    }

    if (guests > roomData.capacity) {
      return res.status(400).json({ success: false, message: 'Guest count exceeds room capacity' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * roomData.price;

    const booking = await Booking.create({
      user: req.user.id,
      room,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalPrice,
      specialRequests,
    });

    await booking.populate('room', 'roomNumber type price');

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id && !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('room', 'roomNumber type price');

    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id && !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    next(error);
  }
};