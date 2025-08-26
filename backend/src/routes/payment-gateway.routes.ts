import { Router } from 'express';
import paymentGatewayController, { 
  validateMPesaPayment, 
  validatePaymentConfig 
} from '../controllers/payment-gateway.controller';
import { authenticate as protect } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Payment configuration routes (Superadmin only)
router.get('/config/:tenantId', paymentGatewayController.getPaymentConfig);
router.put('/config/:tenantId', validatePaymentConfig, paymentGatewayController.updatePaymentConfig);

// Available payment methods for a tenant
router.get('/methods/:tenantId?', paymentGatewayController.getAvailablePaymentMethods);

// M-Pesa payment routes
router.post('/mpesa/initiate', validateMPesaPayment, paymentGatewayController.initiateMPesaPayment);
router.get('/mpesa/status/:transactionId', paymentGatewayController.queryMPesaPaymentStatus);

// Payment transactions
router.get('/transactions/:tenantId?', paymentGatewayController.getPaymentTransactions);
router.get('/statistics/:tenantId?', paymentGatewayController.getPaymentStatistics);

export default router;

// Separate router for webhook callbacks (no authentication needed)
export const callbackRouter = Router();

// M-Pesa callback (webhook from Safaricom)
callbackRouter.post('/mpesa-callback', paymentGatewayController.handleMPesaCallback);