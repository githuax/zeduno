import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import menuRoutes from './menu.routes';
import publicMenuRoutes from './public-menu.routes';
import orderRoutes from './order.routes';
import publicOrderRoutes from './public-order.routes';
import tableRoutes from './table.routes';
import superAdminRoutes from './superadmin.routes';
import tenantRoutes from './tenant.routes';
import shiftRoutes from './shift.routes';
import attendanceRoutes from './attendance.routes';
import dashboardRoutes from './dashboard.routes';
import paymentGatewayRoutes, { callbackRouter } from './payment-gateway.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/users', userRoutes);
router.use('/menu', menuRoutes);
router.use('/public-menu', publicMenuRoutes);
router.use('/orders', orderRoutes);
router.use('/public-orders', publicOrderRoutes);
router.use('/tables', tableRoutes);
router.use('/superadmin', superAdminRoutes);
router.use('/tenants', tenantRoutes);
router.use('/shifts', shiftRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/payments', paymentGatewayRoutes);
router.use('/payments', callbackRouter);

export default router;