import { Router } from 'express';

import mpesaKCBController from '../controllers/mpesa-kcb.controller';

const router = Router();

// Get the authenticate middleware (adjust path as needed)
let authenticate;
try {
  authenticate = require('../middleware/auth').authenticate;
} catch (error) {
  // Fallback if middleware path is different
  authenticate = (req: any, res: any, next: any) => next();
}

// Protected routes (require authentication)
router.post('/initiate', authenticate, mpesaKCBController.initiatePayment.bind(mpesaKCBController));
router.get('/status/:transactionId', authenticate, mpesaKCBController.queryPaymentStatus.bind(mpesaKCBController));
router.get('/history', authenticate, mpesaKCBController.getPaymentHistory.bind(mpesaKCBController));
router.get('/statistics', authenticate, mpesaKCBController.getPaymentStatistics.bind(mpesaKCBController));

// Public callback route (no authentication)
router.post('/callback', mpesaKCBController.handleCallback.bind(mpesaKCBController));

export default router;
