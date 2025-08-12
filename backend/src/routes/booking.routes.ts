import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  getUserBookings
} from '../controllers/booking.controller';

const router = Router();

router.get('/', authenticate, authorize('admin', 'staff'), getAllBookings);
router.get('/my-bookings', authenticate, getUserBookings);
router.get('/:id', authenticate, getBookingById);

router.post('/', authenticate, createBooking);
router.put('/:id', authenticate, updateBooking);
router.patch('/:id/cancel', authenticate, cancelBooking);

export default router;