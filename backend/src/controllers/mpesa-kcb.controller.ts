import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { PaymentTransaction } from '../models/PaymentTransaction';
import mongoose from 'mongoose';
import { websocketService, PaymentStatusUpdate } from '../services/websocket.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId?: string;
  };
}

// Zed Business API Configuration
const ZED_BUSINESS_CONFIG = {
  apiKey: 'X-Authorization',
  baseUrl: 'https://api.dev.zed.business',
  externalOrigin: '9002742',
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub2IiOnsidmFsdWUiOjUwLCJzdGF0ZSI6ZmFsc2V9LCJ2b2NiIjpmYWxzZSwidXNlcklkIjoiNjQ5ZDJlMTc2MmFlMjJkZjg2ZjAxNjk3IiwiaWQiOiI2NDlkMmUxNzYyYWUyMmRmODZmMDE2OTciLCJlbWFpbCI6ImtpbWF0aGljaHJpczEzK2RhaWx5aG90ZWxAZ21haWwuY29tIiwidXNlck5hbWUiOiJCcmlhbkdpdGh1YSIsImdyb3VwIjoiTWVyY2hhbnQiLCJiaWQiOiI5MDAyNzQyIiwiYmlkU3RyaW5nIjoiNjhiMTQ4MjM4MDRlNWRmNzA5ZGU2MWM3IiwiY3VzdG9tZXJJZCI6IjY2MjY1ZmYzZDg5Njc1YTk3NTY1ZGRkYSIsImJ1c2luZXNzTmFtZSI6IkRhaWx5IEhvdGVsIiwiYnVzaW5lc3NPd25lclBob25lIjoiKzI1NDU0NTQ1NDU0NCIsImJ1c2luZXNzT3duZXJBZGRyZXNzIjoiTmFpcm9iaSwgS2VueWEiLCJidWxrVGVybWluYWxzIjpbXSwic2Vzc2lvbkV4cGlyeSI6IjIwMjUtMDgtMzBUMDY6MjY6NDUuMjM5WiIsIlRpbGwiOiIiLCJQYXliaWxsIjoiIiwiVm9vbWEiOiIiLCJFcXVpdGVsIjoiIiwic3RvcmVOYW1lIjoibnVsbCIsImxvY2FsQ3VycmVuY3kiOiJLRVMiLCJ4ZXJvQWNjb3VudGluZ0VuYWJsZWQiOiJmYWxzZSIsInF1aWNrYm9va3NBY2NvdW50aW5nRW5hYmxlZCI6ImZhbHNlIiwiem9ob0FjY291bnRpbmdFbmFibGVkIjoiZmFsc2UiLCJpYXQiOjE3NTY0NDg4MDUsImV4cCI6MTc1NjUzNTIwNX0.4LrMoetiZiTSc7HzeCGuAaxnEk1tP7e3F05ccxxxtwc'
};

// Type definitions for Zed Business API responses
interface ZedBusinessApiResponse {
  success?: boolean;
  status?: string;
  message?: string;
  errorMessage?: string;
  ResponseCode?: string;
  CheckoutRequestID?: string;
  transactionId?: string;
  [key: string]: any;
}

// Enhanced callback data interface
interface ZedBusinessCallbackData {
  // Standard Zed Business callback fields
  resultCode?: number;
  ResultCode?: string;
  status?: string;
  message?: string;
  errorMessage?: string;
  
  // Transaction details
  transactionId?: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  CheckoutRequestID?: string;
  MpesaReceiptNumber?: string;
  mpesaReceiptNumber?: string;
  TransactionDate?: string;
  PhoneNumber?: string;
  Amount?: number;
  
  // Order reference
  orderId?: string;
  orderIds?: string[];
  reference?: string;
  accountReference?: string;
  
  // Payment metadata
  currency?: string;
  customerName?: string;
  description?: string;
  
  // Any additional data from Zed Business
  [key: string]: any;
}

class CallbackProcessor {
  /**
   * Extract order ID from callback data
   */
  extractOrderId(callbackData: ZedBusinessCallbackData): string | null {
    // Try multiple possible fields for order ID
    return callbackData.orderId || 
           (callbackData.orderIds && callbackData.orderIds[0]) ||
           callbackData.reference ||
           callbackData.accountReference ||
           null;
  }

  /**
   * Extract transaction ID from callback data
   */
  extractTransactionId(callbackData: ZedBusinessCallbackData): string {
    return callbackData.transactionId ||
           callbackData.CheckoutRequestID ||
           callbackData.checkoutRequestId ||
           callbackData.MpesaReceiptNumber ||
           callbackData.mpesaReceiptNumber ||
           `TXN_${Date.now()}`;
  }

  /**
   * Determine if payment was successful
   */
  isPaymentSuccessful(callbackData: ZedBusinessCallbackData): boolean {
    // Check multiple possible success indicators
    const resultCode = callbackData.resultCode || parseInt(callbackData.ResultCode || '1');
    const status = callbackData.status?.toLowerCase();
    const resultDesc = callbackData.resultDesc?.toLowerCase();
    
    // Zed Business typically uses ResultCode '0' for success
    return resultCode === 0 || 
           status === 'success' || 
           status === 'completed' ||
           (resultDesc && resultDesc.includes('processed successfully')) ||
           (callbackData.MpesaReceiptNumber && callbackData.MpesaReceiptNumber.length > 0) ||
           (callbackData.mpesaReceiptNumber && callbackData.mpesaReceiptNumber.length > 0) ||
           (callbackData.transactionReference && callbackData.transactionReference.length > 0);
  }

  /**
   * Update order and create payment transaction
   */
  async processPaymentCallback(callbackData: ZedBusinessCallbackData): Promise<void> {
    try {
      
      const orderId = this.extractOrderId(callbackData);
      const transactionId = this.extractTransactionId(callbackData);
      const isSuccessful = this.isPaymentSuccessful(callbackData);
      
      console.log('📋 Processing callback details:', {
        orderId,
        transactionId,
        isSuccessful,
        amount: callbackData.Amount,
        phone: callbackData.PhoneNumber
      });

      if (!orderId) {
        console.warn('⚠️ No order ID found in callback data');
        return;
      }

      // Find the order by orderNumber (handle both "ORD-XXXX" and "BT-ORD-XXXX" formats)
      const cleanOrderId = orderId.startsWith('BT-') ? orderId.substring(3) : orderId;
      const order = await Order.findOne({ orderNumber: cleanOrderId });
      if (!order) {
        throw new Error(`Order not found with orderNumber: ${cleanOrderId} (original: ${orderId})`);
      }

      if (isSuccessful) {
        console.log(`💰 Processing successful payment for order: ${order.orderNumber}`);
        
        // Update order payment status
        order.paymentStatus = 'paid';
        order.paymentMethod = 'mpesa';
        order.paidAt = new Date();
        
        // Update payment details
        order.paymentDetails = {
          transactionId: transactionId,
          gateway: 'zed-business',
          paidAt: new Date(),
          ...order.paymentDetails
        };
        
        // Update order status if pending
        if (order.status === 'pending') {
          await order.updateStatus('confirmed', undefined, 'Payment confirmed via M-Pesa');
        }
        
        await order.save();
        console.log(`✅ Order ${order.orderNumber} marked as paid successfully`);

        // 🔥 EMIT REAL-TIME PAYMENT SUCCESS UPDATE
        const paymentUpdate: PaymentStatusUpdate = {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          status: 'completed',
          transactionId: transactionId,
          transactionReference: callbackData.transactionReference || callbackData.MpesaReceiptNumber,
          amount: parseFloat(callbackData.amount?.toString() || callbackData.Amount?.toString() || '0'),
          currency: 'KES',
          timestamp: new Date(),
          message: 'Payment confirmed successfully'
        };
        websocketService.emitPaymentStatusUpdate(paymentUpdate);
        
      } else {
        console.log(`❌ Processing failed payment for order: ${order.orderNumber}`);
        
        // Update order payment status to failed only if it was pending
        if (order.paymentStatus === 'pending') {
          order.paymentStatus = 'failed';
          await order.save();
        }

        // 🔥 EMIT REAL-TIME PAYMENT FAILED UPDATE
        const paymentUpdate: PaymentStatusUpdate = {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          status: 'failed',
          transactionId: transactionId,
          timestamp: new Date(),
          message: 'Payment failed or was cancelled'
        };
        websocketService.emitPaymentStatusUpdate(paymentUpdate);
      }
      
      // Create payment transaction record
      await this.createPaymentTransaction(callbackData, order, isSuccessful ? 'completed' : 'failed');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create payment transaction record
   */
  private async createPaymentTransaction(
    callbackData: ZedBusinessCallbackData,
    order: any,
    status: 'completed' | 'failed'
  ): Promise<void> {
    const transactionData = {
      tenantId: order.tenantId,
      orderId: order._id,
      paymentMethod: 'mpesa' as const,
      amount: callbackData.Amount || order.total,
      currency: callbackData.currency || 'KES',
      status,
      customerPhone: callbackData.PhoneNumber || order.customerPhone,
      customerName: callbackData.customerName || order.customerName,
      gatewayTransactionId: this.extractTransactionId(callbackData),
      gatewayResponse: callbackData,
      mpesaData: {
        merchantRequestId: callbackData.merchantRequestId,
        checkoutRequestId: callbackData.checkoutRequestId || callbackData.CheckoutRequestID,
        mpesaReceiptNumber: callbackData.MpesaReceiptNumber || callbackData.mpesaReceiptNumber,
        phoneNumber: callbackData.PhoneNumber,
        accountReference: callbackData.reference || callbackData.accountReference,
        transactionDesc: callbackData.description || `Payment for Order #${order.orderNumber}`
      },
      initiatedAt: new Date(),
      completedAt: status === 'completed' ? new Date() : undefined,
      failedAt: status === 'failed' ? new Date() : undefined
    };

    // Check if transaction already exists
    const existingTransaction = await PaymentTransaction.findOne({
      orderId: order._id,
      'mpesaData.checkoutRequestId': transactionData.mpesaData.checkoutRequestId
    });

    if (existingTransaction) {
      // Update existing transaction
      existingTransaction.status = status;
      existingTransaction.gatewayResponse = callbackData;
      existingTransaction.mpesaData = { ...existingTransaction.mpesaData, ...transactionData.mpesaData };
      
      if (status === 'completed') {
        existingTransaction.completedAt = new Date();
      } else if (status === 'failed') {
        existingTransaction.failedAt = new Date();
      }
      
      await existingTransaction.save();
      console.log(`💾 Updated existing payment transaction: ${existingTransaction._id}`);
    } else {
      // Create new transaction
      const transaction = new PaymentTransaction(transactionData);
      await transaction.save();
      console.log(`💾 Created new payment transaction: ${transaction._id}`);
    }
  }
}

export class MPesaKCBController {
  private callbackProcessor = new CallbackProcessor();

  /**
   * Initiate MPESA KCB STK Push payment via Zed Business API
   */
  async initiatePayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        amount, 
        phoneNumber, 
        phone, 
        currency = 'KES', 
        orderId, 
        customerName, 
        description, 
        type = 'deposit' 
      } = req.body;
      
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ 
          success: false, 
          error: 'Tenant ID is required' 
        });
        return;
      }

      // Use phoneNumber if provided (from frontend), otherwise fall back to phone
      const inputPhone = phoneNumber || phone;
      
      if (!inputPhone) {
        res.status(400).json({ 
          success: false, 
          error: 'Phone number is required' 
        });
        return;
      }

      // Validate phone number format for East African countries
      if (!this.validateEastAfricanPhoneNumber(inputPhone)) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid East African phone number format. Please use format: +254XXXXXXXXX, +256XXXXXXXXX, +255XXXXXXXXX, +250XXXXXXXXX, +257XXXXXXXXX, +243XXXXXXXXX, or +211XXXXXXXXX' 
        });
        return;
      }

      // Validate currency
      const supportedCurrencies = ['KES', 'UGX', 'TZS', 'RWF', 'BIF', 'CDF', 'SSP'];
      if (!supportedCurrencies.includes(currency)) {
        res.status(400).json({ 
          success: false, 
          error: 'Unsupported currency. Supported currencies: ' + supportedCurrencies.join(', ') 
        });
        return;
      }

      // Format phone number for Zed Business API
      const formattedPhone = this.formatPhoneNumberForZedBusiness(inputPhone);

      // Generate unique transaction reference using ZedUno format
      const invoiceNumber = Math.floor(Math.random() * 100000); // Generate 5-digit random number
      const transactionRef = `ZDU_${invoiceNumber}`;

      console.log('🚀 Initiating M-Pesa KCB payment via Zed Business:', {
        phone: formattedPhone,
        amount,
        currency,
        reference: transactionRef,
        orderId
      });

      // Use MPesaService which will try multiple endpoints
      const { MPesaService } = await import('../services/mpesa.service');
      const mpesaService = MPesaService.getInstance();
      
      // Convert to MPesa service format
      const mpesaRequest = {
        phoneNumber: formattedPhone,
        amount: parseFloat(amount.toString()),
        accountReference: orderId || transactionRef, // Use orderId as reference for callback matching
        transactionDesc: description || `Payment for Order #${orderId}`,
        callbackUrl: 'https://zeduno.piskoe.com/api/mpesa-kcb/callback'
      };
      
      console.log('🚀 Initiating M-Pesa payment via service:', {
        phone: formattedPhone,
        amount: parseFloat(amount.toString()),
        reference: mpesaRequest.accountReference
      });

      // Use the service which will try multiple endpoints
      const zedResult = await mpesaService.initiateSTKPush(
        {} as any, // credentials not used for Zed Business
        mpesaRequest
      );
      
      console.log('✅ Zed Business API response:', zedResult);

      // Check if the STK push was successful
      if (zedResult.ResponseCode === '0') {
        // Real STK push initiated successfully
        res.json({
          success: true,
          message: 'M-Pesa STK push sent to your phone successfully. Please complete the payment.',
          data: {
            transactionId: zedResult.CheckoutRequestID || zedResult.MerchantRequestID || transactionRef,
            checkoutRequestId: zedResult.CheckoutRequestID,
            orderId: orderId,
            amount: amount,
            currency: currency,
            phone: formattedPhone,
            customerName: customerName,
            description: description,
            status: 'pending'
          },
          reference: transactionRef,
          paymentStatus: 'initiated',
          requiresUserAction: true,
          zedBusinessResponse: zedResult
        });
      } else {
        // STK push failed
        throw new Error(zedResult.ResponseDescription || 'Failed to initiate M-Pesa payment');
      }

    } catch (error) {
      console.error('Error initiating MPESA KCB payment:', error);
      
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Payment initiation failed',
        details: 'Failed to connect to Zed Business M-Pesa API'
      });
    }
  }

  /**
   * Enhanced callback handler with complete order status update logic
   */
  async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔄 Enhanced M-Pesa KCB callback received from Zed Business:', JSON.stringify(req.body, null, 2));

      const callbackData: ZedBusinessCallbackData = req.body;
      
      // Process the callback using the enhanced processor
      await this.callbackProcessor.processPaymentCallback(callbackData);
      
      res.status(200).json({ 
        success: true,
        message: 'Callback processed successfully',
        ResultCode: '0',
        ResultDesc: 'Accepted'
      });
    } catch (error) {
      console.error('Error handling MPESA KCB callback:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        ResultCode: '1',
        ResultDesc: 'Failed to process callback'
      });
    }
  }

  /**
   * Query payment status via Zed Business API
   */
  async queryPaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;

      try {
        // Query Zed Business API for payment status
        const statusResponse = await fetch(`${ZED_BUSINESS_CONFIG.baseUrl}/api/mpesa/query/${transactionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ZED_BUSINESS_CONFIG.authToken}`,
            [ZED_BUSINESS_CONFIG.apiKey]: ZED_BUSINESS_CONFIG.authToken,
            'Accept': 'application/json'
          }
        });

        if (statusResponse.ok) {
          const statusResult = await statusResponse.json() as ZedBusinessApiResponse;
          
          res.json({
            success: true,
            data: {
              transactionId,
              status: statusResult.status || 'pending',
              message: statusResult.message || 'Transaction is being processed'
            },
          });
          return;
        }
      } catch (queryError) {
        console.log('Status query failed, returning default pending status');
      }

      // Fallback for status query
      res.json({
        success: true,
        data: {
          transactionId,
          status: 'pending',
          message: 'Transaction is being processed'
        },
      });

    } catch (error) {
      console.error('Error querying payment status:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to query payment status' 
      });
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ 
          success: false, 
          error: 'Tenant ID is required' 
        });
        return;
      }

      // Get payment transactions for this tenant
      const transactions = await PaymentTransaction.find({ tenantId })
        .populate('orderId', 'orderNumber customerName total status')
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({
        success: true,
        data: {
          transactions,
          totalCount: transactions.length,
          totalPages: 1,
          currentPage: 1,
        },
      });
    } catch (error) {
      console.error('Error getting payment history:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get payment history' 
      });
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ 
          success: false, 
          error: 'Tenant ID is required' 
        });
        return;
      }

      // Calculate payment statistics
      const totalTransactions = await PaymentTransaction.countDocuments({ tenantId });
      const successfulTransactions = await PaymentTransaction.countDocuments({ tenantId, status: 'completed' });
      const failedTransactions = await PaymentTransaction.countDocuments({ tenantId, status: 'failed' });
      const pendingTransactions = await PaymentTransaction.countDocuments({ tenantId, status: 'pending' });

      // Calculate total amounts
      const totalAmountResult = await PaymentTransaction.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const successfulAmountResult = await PaymentTransaction.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const totalAmount = totalAmountResult[0]?.total || 0;
      const successfulAmount = successfulAmountResult[0]?.total || 0;

      res.json({
        success: true,
        data: {
          summary: {
            totalTransactions,
            totalAmount,
            successfulTransactions,
            successfulAmount,
            failedTransactions,
            pendingTransactions,
          },
          breakdown: [],
        },
      });
    } catch (error) {
      console.error('Error getting payment statistics:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get payment statistics' 
      });
    }
  }

  /**
   * Validate East African phone number format
   */
  private validateEastAfricanPhoneNumber(phoneNumber: string): boolean {
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Check for valid East African country codes and proper length
    const validPatterns = [
      /^254[17]\d{8}$/,    // Kenya: 254 + 7/1 + 8 digits
      /^256[37]\d{8}$/,    // Uganda: 256 + 7/3 + 8 digits  
      /^255[67]\d{8}$/,    // Tanzania: 255 + 6/7 + 8 digits
      /^250[78]\d{8}$/,    // Rwanda: 250 + 7/8 + 8 digits
      /^257[68]\d{7}$/,    // Burundi: 257 + 6/8 + 7 digits
      /^243[89]\d{8}$/,    // Congo: 243 + 8/9 + 8 digits
      /^211[19]\d{8}$/     // South Sudan: 211 + 1/9 + 8 digits
    ];
    
    return validPatterns.some(pattern => pattern.test(digits));
  }

  /**
   * Format phone number for Zed Business API
   */
  private formatPhoneNumberForZedBusiness(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Remove leading + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // Convert local format (0) to international format
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
      // Default to Kenya if no country code provided
      cleaned = `254${cleaned}`;
    }
    
    // Zed Business expects format: 254XXXXXXXXX (no + prefix)
    return cleaned;
  }
}

const mpesaKCBController = new MPesaKCBController();
export default mpesaKCBController;
