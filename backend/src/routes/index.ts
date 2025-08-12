import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import roomRoutes from './room.routes';
import bookingRoutes from './booking.routes';
import menuRoutes from './menu.routes';
import orderRoutes from './order.routes';
import tableRoutes from './table.routes';
import superAdminRoutes from './superadmin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/tables', tableRoutes);
router.use('/superadmin', superAdminRoutes);

export default router;