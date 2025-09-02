import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { PaymentTransaction } from '../models/PaymentTransaction';
import mongoose from 'mongoose';

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

export class CallbackProcessor {
  /**
   * Enhanced callback handler with complete order status update logic
   */
  async handleCallback(req: Request, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    
    try {
      console.log('🔄 Enhanced M-Pesa KCB callback received from Zed Business:', JSON.stringify(req.body, null, 2));

      const callbackData: ZedBusinessCallbackData = req.body;
      
      // Extract order ID from various possible fields
      const orderId = this.extractOrderId(callbackData);
      const transactionId = this.extractTransactionId(callbackData);
      const isSuccessful = this.isPaymentSuccessful(callbackData);
      
      console.log('📋 Extracted callback details:', {
        orderId,
        transactionId,
        isSuccessful,
        amount: callbackData.Amount,
        phone: callbackData.PhoneNumber
      });

      if (!orderId) {
        console.warn('⚠️ No order ID found in callback data');
        res.status(200).json({ 
          success: true,
          message: 'Callback received but no order ID found',
          ResultCode: '0',
          ResultDesc: 'Accepted'
        });
        return;
      }

      // Start database transaction
      await session.startTransaction();
      
      if (isSuccessful) {
        await this.processSuccessfulPayment(callbackData, orderId, transactionId, session);
        console.log('✅ Payment successful - Order marked as paid');
      } else {
        await this.processFailedPayment(callbackData, orderId, transactionId, session);
        console.log('❌ Payment failed - Transaction recorded');
      }
      
      // Commit the transaction
      await session.commitTransaction();
      
      res.status(200).json({ 
        success: true,
        message: 'Callback processed successfully',
        ResultCode: '0',
        ResultDesc: 'Accepted'
      });
      
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      
      console.error('💥 Error handling M-Pesa KCB callback:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        ResultCode: '1',
        ResultDesc: 'Failed to process callback'
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Process successful payment callback
   */
  private async processSuccessfulPayment(
    callbackData: ZedBusinessCallbackData, 
    orderId: string, 
    transactionId: string,
    session: mongoose.mongo.ClientSession
  ): Promise<void> {
    // Find the order
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

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
    
    // Update order status based on current status
    if (order.status === 'pending') {
      await order.updateStatus('confirmed', undefined, 'Payment confirmed via M-Pesa');
    }
    
    await order.save({ session });

    // Create or update payment transaction record
    await this.createPaymentTransaction(callbackData, order, 'completed', session);
    
    console.log(`✅ Order ${order.orderNumber} marked as paid successfully`);
  }

  /**
   * Process failed payment callback
   */
  private async processFailedPayment(
    callbackData: ZedBusinessCallbackData, 
    orderId: string, 
    transactionId: string,
    session: mongoose.mongo.ClientSession
  ): Promise<void> {
    // Find the order
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    console.log(`❌ Processing failed payment for order: ${order.orderNumber}`);
    
    // Update order payment status to failed only if it was pending
    if (order.paymentStatus === 'pending') {
      order.paymentStatus = 'failed';
      await order.save({ session });
    }
    
    // Create payment transaction record with failed status
    await this.createPaymentTransaction(callbackData, order, 'failed', session);
    
    console.log(`❌ Order ${order.orderNumber} payment marked as failed`);
  }

  /**
   * Create payment transaction record
   */
  private async createPaymentTransaction(
    callbackData: ZedBusinessCallbackData,
    order: any,
    status: 'completed' | 'failed',
    session: mongoose.mongo.ClientSession
  ): Promise<void> {
    const transactionData = {
      tenantId: order.tenantId,
      orderId: order._id,
      paymentMethod: 'mpesa',
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
    }).session(session);

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
      
      await existingTransaction.save({ session });
      console.log(`💾 Updated existing payment transaction: ${existingTransaction._id}`);
    } else {
      // Create new transaction
      const transaction = new PaymentTransaction(transactionData);
      await transaction.save({ session });
      console.log(`💾 Created new payment transaction: ${transaction._id}`);
    }
  }

  /**
   * Extract order ID from callback data
   */
  private extractOrderId(callbackData: ZedBusinessCallbackData): string | null {
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
  private extractTransactionId(callbackData: ZedBusinessCallbackData): string {
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
  private isPaymentSuccessful(callbackData: ZedBusinessCallbackData): boolean {
    // Check multiple possible success indicators
    const resultCode = callbackData.resultCode || parseInt(callbackData.ResultCode || '1');
    const status = callbackData.status?.toLowerCase();
    
    // Zed Business typically uses ResultCode '0' for success
    return resultCode === 0 || 
           status === 'success' || 
           status === 'completed' ||
           (callbackData.MpesaReceiptNumber && callbackData.MpesaReceiptNumber.length > 0) ||
           (callbackData.mpesaReceiptNumber && callbackData.mpesaReceiptNumber.length > 0);
  }
}
