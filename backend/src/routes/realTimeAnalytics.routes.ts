import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { realTimeAnalyticsService } from '../services/realTimeAnalytics.service';

const router = express.Router();

/**
 * @swagger
 * /api/analytics/real-time/dashboard:
 *   get:
 *     summary: Get initial dashboard data for real-time analytics
 *     tags: [Real-time Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Initial dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         revenue:
 *                           type: object
 *                           properties:
 *                             current:
 *                               type: number
 *                             change:
 *                               type: number
 *                             changePercent:
 *                               type: number
 *                         orders:
 *                           type: object
 *                           properties:
 *                             current:
 *                               type: number
 *                             change:
 *                               type: number
 *                             changePercent:
 *                               type: number
 *                     chartData:
 *                       type: object
 *                       properties:
 *                         revenue:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               time:
 *                                 type: string
 *                               value:
 *                                 type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.user as any;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Trigger immediate update to get fresh data
    await realTimeAnalyticsService.triggerTenantUpdate(tenantId);

    res.json({
      success: true,
      message: 'Real-time analytics dashboard initialized. Connect to WebSocket for live updates.',
      data: {
        websocketEvents: [
          'analytics:update',
          'analytics:revenue', 
          'analytics:orders',
          'analytics:charts'
        ],
        roomToJoin: `analytics:${tenantId}`,
        updateInterval: '30 seconds'
      }
    });

  } catch (error) {
    console.error('Error initializing real-time dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize real-time dashboard'
    });
  }
});

/**
 * @swagger
 * /api/analytics/real-time/status:
 *   get:
 *     summary: Get real-time analytics service status
 *     tags: [Real-time Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service status retrieved successfully
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = realTimeAnalyticsService.getStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error getting real-time analytics status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status'
    });
  }
});

/**
 * @swagger
 * /api/analytics/real-time/trigger/{tenantId}:
 *   post:
 *     summary: Manually trigger analytics update for a tenant (admin only)
 *     tags: [Real-time Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tenantId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID to update metrics for
 *     responses:
 *       200:
 *         description: Analytics update triggered successfully
 */
router.post('/trigger/:tenantId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.params;
    const { role } = req.user as any;

    // Only allow admins or superadmins to manually trigger updates
    if (role !== 'admin' && role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    await realTimeAnalyticsService.triggerTenantUpdate(tenantId);

    res.json({
      success: true,
      message: `Analytics update triggered for tenant ${tenantId}`
    });

  } catch (error) {
    console.error('Error triggering analytics update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger analytics update'
    });
  }
});

export default router;