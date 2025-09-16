import { Router } from 'express';

import attendanceRoutes from './attendance.routes';
import authRoutes from './auth.routes';
import branchRoutes from './branch.routes';
import dashboardRoutes from './dashboard.routes';
import emailRoutes from './email.routes';
import inventoryRoutes from './inventory.routes';
import menuRoutes from './menu.routes';
import mpesaKCBRoutes from './mpesa-kcb.routes';
import orderRoutes from './order.routes';
import publicMenuRoutes from './public-menu.routes';
import publicOrderRoutes from './public-order.routes';
import reportRoutes from './report.routes';
import schedulerRoutes from './scheduler.routes';
import realTimeAnalyticsRoutes from './realTimeAnalytics.routes';
import superAdminRoutes from './superadmin.routes';
import tableRoutes from './table.routes';
import tenantRoutes from './tenant.routes';
import shiftRoutes from './shift.routes';
import paymentGatewayRoutes, { callbackRouter } from './payment-gateway.routes';
import userRoutes from './user.routes';

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
router.use('/mpesa-kcb', mpesaKCBRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/branches', branchRoutes);
router.use('/email', emailRoutes);
router.use('/reports', reportRoutes);
router.use('/scheduler', schedulerRoutes);
router.use('/analytics/real-time', realTimeAnalyticsRoutes);

export default router;
