import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Tenant } from '../models/Tenant';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { Order, IOrder } from '../models/Order';
import MPesaService from '../services/mpesa.service';
import { body, param, validationResult } from 'express-validator';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId?: string;
  };
}

export class PaymentGatewayController {
  // Get payment configuration for a tenant
  async getPaymentConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      
      // Check if user is superadmin or belongs to the tenant
      if (req.user?.role !== 'superadmin' && req.user?.tenantId !== tenantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const tenant = await Tenant.findById(tenantId).select('paymentConfig');
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      // Don't send sensitive data to frontend
      const sanitizedConfig = {
        mpesa: {
          enabled: tenant.paymentConfig.mpesa.enabled,
          environment: tenant.paymentConfig.mpesa.environment,
          accountType: tenant.paymentConfig.mpesa.accountType,
          tillNumber: tenant.paymentConfig.mpesa.tillNumber,
          paybillNumber: tenant.paymentConfig.mpesa.paybillNumber,
          businessShortCode: tenant.paymentConfig.mpesa.businessShortCode,
          // Don't send keys/secrets to frontend
        },
        stripe: {
          enabled: tenant.paymentConfig.stripe.enabled,
          publicKey: tenant.paymentConfig.stripe.publicKey,
          // Don't send secret keys
        },
        square: {
          enabled: tenant.paymentConfig.square.enabled,
          applicationId: tenant.paymentConfig.square.applicationId,
          // Don't send access tokens
        },
        cash: {
          enabled: tenant.paymentConfig.cash.enabled,
        },
      };

      res.json(sanitizedConfig);
    } catch (error) {
      console.error('Error getting payment config:', error);
      res.status(500).json({ error: 'Failed to get payment configuration' });
    }
  }

  // Update payment configuration (Superadmin only)
  async updatePaymentConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only superadmin can update payment config
      if (req.user?.role !== 'superadmin') {
        res.status(403).json({ error: 'Only superadmin can update payment configuration' });
        return;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { tenantId } = req.params;
      const { paymentConfig } = req.body;

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      // Validate M-Pesa configuration if enabled
      if (paymentConfig.mpesa?.enabled) {
        const requiredFields = ['businessShortCode', 'passkey', 'consumerKey', 'consumerSecret'];
        for (const field of requiredFields) {
          if (!paymentConfig.mpesa[field]) {
            res.status(400).json({ error: `M-Pesa ${field} is required when M-Pesa is enabled` });
            return;
          }
        }
      }

      // Update payment configuration
      tenant.paymentConfig = {
        ...tenant.paymentConfig,
        ...paymentConfig,
      };

      await tenant.save();

      res.json({ message: 'Payment configuration updated successfully' });
    } catch (error) {
      console.error('Error updating payment config:', error);
      res.status(500).json({ error: 'Failed to update payment configuration' });
    }
  }

  // Get available payment methods for a tenant
  async getAvailablePaymentMethods(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || req.params.tenantId;
      
      const tenant = await Tenant.findById(tenantId).select('paymentConfig');
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      const availableMethods = [];

      // Check M-Pesa
      if (tenant.paymentConfig.mpesa.enabled) {
        const mpesaService = MPesaService.getInstance();
        if (mpesaService.validateTenantMPesaConfig(tenant)) {
          availableMethods.push({
            id: 'mpesa',
            name: 'M-Pesa',
            type: 'digital_wallet',
            provider: 'Safaricom',
            isEnabled: true,
            processingFee: 0,
            description: 'Pay using M-Pesa mobile money',
            accountInfo: {
              type: tenant.paymentConfig.mpesa.accountType,
              number: tenant.paymentConfig.mpesa.accountType === 'till' 
                ? tenant.paymentConfig.mpesa.tillNumber 
                : tenant.paymentConfig.mpesa.paybillNumber,
            },
          });
        }
      }

      // Check Stripe
      if (tenant.paymentConfig.stripe.enabled && tenant.paymentConfig.stripe.publicKey) {
        availableMethods.push({
          id: 'stripe',
          name: 'Credit/Debit Card',
          type: 'credit_card',
          provider: 'Stripe',
          isEnabled: true,
          processingFee: 2.9, // Default Stripe fee
          description: 'Pay with credit or debit card',
        });
      }

      // Check Square
      if (tenant.paymentConfig.square.enabled && tenant.paymentConfig.square.applicationId) {
        availableMethods.push({
          id: 'square',
          name: 'Square Payment',
          type: 'credit_card',
          provider: 'Square',
          isEnabled: true,
          processingFee: 2.6, // Default Square fee
          description: 'Pay with Square',
        });
      }

      // Cash is always available if enabled
      if (tenant.paymentConfig.cash.enabled) {
        availableMethods.push({
          id: 'cash',
          name: 'Cash Payment',
          type: 'cash',
          provider: 'Manual',
          isEnabled: true,
          processingFee: 0,
          description: 'Cash payment at the counter',
        });
      }

      res.json(availableMethods);
    } catch (error) {
      console.error('Error getting payment methods:', error);
      res.status(500).json({ error: 'Failed to get payment methods' });
    }
  }

  // Initiate M-Pesa payment
  async initiateMPesaPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { orderId, phoneNumber, amount } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      // Get tenant and validate M-Pesa config
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      const mpesaService = MPesaService.getInstance();
      if (!mpesaService.validateTenantMPesaConfig(tenant)) {
        res.status(400).json({ error: 'M-Pesa is not properly configured for this tenant' });
        return;
      }

      // Get order
      const order = await Order.findOne({ _id: orderId, tenant: tenantId });
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Create payment transaction record
      const paymentTransaction = new PaymentTransaction({
        tenantId,
        orderId,
        paymentMethod: 'mpesa',
        amount,
        currency: tenant.settings.currency || 'KES',
        customerPhone: phoneNumber,
        status: 'pending',
        metadata: {
          processedBy: req.user?.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });

      await paymentTransaction.save();

      // Prepare M-Pesa request
      const mpesaCredentials = {
        consumerKey: tenant.paymentConfig.mpesa.consumerKey!,
        consumerSecret: tenant.paymentConfig.mpesa.consumerSecret!,
        passkey: tenant.paymentConfig.mpesa.passkey,
        businessShortCode: tenant.paymentConfig.mpesa.businessShortCode,
        environment: tenant.paymentConfig.mpesa.environment,
      };

      const callbackUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/mpesa-callback`;
      
      const paymentRequest = {
        phoneNumber,
        amount,
        accountReference: `ORDER-${order._id}`,
        transactionDesc: `Payment for Order ${order._id}`,
        callbackUrl,
      };

      // Initiate STK push
      const stkResponse = await mpesaService.initiateSTKPush(mpesaCredentials, paymentRequest);

      // Update payment transaction with M-Pesa data
      paymentTransaction.status = 'processing';
      paymentTransaction.mpesaData = {
        merchantRequestId: stkResponse.MerchantRequestID,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        accountReference: paymentRequest.accountReference,
        transactionDesc: paymentRequest.transactionDesc,
        phoneNumber,
      };
      paymentTransaction.gatewayResponse = stkResponse;

      await paymentTransaction.save();

      res.json({
        success: true,
        message: stkResponse.CustomerMessage,
        transactionId: paymentTransaction._id,
        checkoutRequestId: stkResponse.CheckoutRequestID,
      });
    } catch (error) {
      console.error('Error initiating M-Pesa payment:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Payment initiation failed' });
    }
  }

  // M-Pesa callback handler
  async handleMPesaCallback(req: Request, res: Response): Promise<void> {
    try {
      console.log('M-Pesa callback received:', JSON.stringify(req.body, null, 2));

      const mpesaService = MPesaService.getInstance();
      const callbackData = mpesaService.extractCallbackData(req.body);

      // Find the payment transaction
      const paymentTransaction = await PaymentTransaction.findOne({
        'mpesaData.checkoutRequestId': callbackData.checkoutRequestId,
      }).populate('orderId');

      if (!paymentTransaction) {
        console.error('Payment transaction not found for checkout request ID:', callbackData.checkoutRequestId);
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      // Update payment transaction based on result
      if (callbackData.resultCode === 0) {
        // Success
        paymentTransaction.status = 'completed';
        paymentTransaction.completedAt = new Date();
        paymentTransaction.gatewayResponse = callbackData;
        
        // Update M-Pesa specific data
        paymentTransaction.mpesaData!.mpesaReceiptNumber = callbackData.mpesaReceiptNumber;
        paymentTransaction.gatewayTransactionId = callbackData.mpesaReceiptNumber;
        
        // Update order status to paid
        if (paymentTransaction.orderId) {
          const order = await Order.findById(paymentTransaction.orderId);
          if (order) {
            order.paymentStatus = 'paid';
            order.paymentMethod = 'mpesa';
            order.paidAt = new Date();
            await order.save();
          }
        }

        console.log('M-Pesa payment completed successfully:', callbackData.mpesaReceiptNumber);
      } else {
        // Failed
        paymentTransaction.status = 'failed';
        paymentTransaction.failedAt = new Date();
        paymentTransaction.gatewayResponse = callbackData;
        if (callbackData.resultDesc) {
          paymentTransaction.metadata = { ...paymentTransaction.metadata, notes: callbackData.resultDesc };
        }
        console.log('M-Pesa payment failed:', callbackData.resultDesc);
      }

      await paymentTransaction.save();

      // Always respond with success to M-Pesa
      res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
      console.error('Error handling M-Pesa callback:', error);
      res.status(500).json({ ResultCode: 1, ResultDesc: 'Internal server error' });
    }
  }

  // Query M-Pesa payment status
  async queryMPesaPaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const tenantId = req.user?.tenantId;

      const paymentTransaction = await PaymentTransaction.findOne({
        _id: transactionId,
        tenantId,
        paymentMethod: 'mpesa',
      });

      if (!paymentTransaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      const mpesaService = MPesaService.getInstance();
      const mpesaCredentials = {
        consumerKey: tenant.paymentConfig.mpesa.consumerKey!,
        consumerSecret: tenant.paymentConfig.mpesa.consumerSecret!,
        passkey: tenant.paymentConfig.mpesa.passkey,
        businessShortCode: tenant.paymentConfig.mpesa.businessShortCode,
        environment: tenant.paymentConfig.mpesa.environment,
      };

      const statusResponse = await mpesaService.queryPaymentStatus(
        mpesaCredentials,
        paymentTransaction.mpesaData!.checkoutRequestId!
      );

      res.json({
        transactionStatus: paymentTransaction.status,
        mpesaStatus: statusResponse,
      });
    } catch (error) {
      console.error('Error querying payment status:', error);
      res.status(500).json({ error: 'Failed to query payment status' });
    }
  }

  // Get payment transactions for a tenant
  async getPaymentTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || req.params.tenantId;
      const { page = 1, limit = 20, status, paymentMethod, startDate, endDate } = req.query;

      const filters: any = { tenantId };
      
      if (status) filters.status = status;
      if (paymentMethod) filters.paymentMethod = paymentMethod;
      
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate as string);
        if (endDate) filters.createdAt.$lte = new Date(endDate as string);
      }

      const transactions = await PaymentTransaction.find(filters)
        .populate('orderId', 'orderNumber totalAmount')
        .populate('metadata.processedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const totalCount = await PaymentTransaction.countDocuments(filters);

      res.json({
        transactions,
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
        currentPage: Number(page),
      });
    } catch (error) {
      console.error('Error getting payment transactions:', error);
      res.status(500).json({ error: 'Failed to get payment transactions' });
    }
  }

  // Get payment statistics
  async getPaymentStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || req.params.tenantId;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const matchStage: any = { tenantId: new mongoose.Types.ObjectId(tenantId) };
      
      if (start || end) {
        matchStage.createdAt = {};
        if (start) matchStage.createdAt.$gte = start;
        if (end) matchStage.createdAt.$lte = end;
      }
      
      const stats = await PaymentTransaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              status: '$status',
              paymentMethod: '$paymentMethod',
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $group: {
            _id: '$_id.paymentMethod',
            stats: {
              $push: {
                status: '$_id.status',
                count: '$count',
                totalAmount: '$totalAmount',
              },
            },
            totalTransactions: { $sum: '$count' },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]);

      res.json(stats);
    } catch (error) {
      console.error('Error getting payment statistics:', error);
      res.status(500).json({ error: 'Failed to get payment statistics' });
    }
  }
}

// Validation middleware
export const validateMPesaPayment = [
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('phoneNumber')
    .matches(/^(?:\+?254|0)?[17]\d{8}$/)
    .withMessage('Valid Kenyan phone number is required'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
];

export const validatePaymentConfig = [
  param('tenantId').isMongoId().withMessage('Valid tenant ID is required'),
  body('paymentConfig').isObject().withMessage('Payment configuration is required'),
];

const paymentGatewayController = new PaymentGatewayController();
export default paymentGatewayController;