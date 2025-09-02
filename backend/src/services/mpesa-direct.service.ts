import axios from 'axios';
import { ITenant } from '../models/Tenant';

// Direct M-Pesa Configuration (Safaricom)
const MPESA_CONFIG = {
  sandbox: {
    baseUrl: 'https://sandbox.safaricom.co.ke',
    consumerKey: 'GkAMEQrqgXI0dmNKAXs0H5LJnJGGAooh',
    consumerSecret: 'nMGqqgqPuGrAGBJJ',
    passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    shortcode: '174379'
  },
  production: {
    baseUrl: 'https://api.safaricom.co.ke',
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    passkey: process.env.MPESA_PASSKEY || '',
    shortcode: process.env.MPESA_SHORTCODE || ''
  }
};

export interface MPesaDirectPaymentRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string;
}

export interface MPesaDirectPaymentResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export class MPesaDirectService {
  private static instance: MPesaDirectService;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  public static getInstance(): MPesaDirectService {
    if (!MPesaDirectService.instance) {
      MPesaDirectService.instance = new MPesaDirectService();
    }
    return MPesaDirectService.instance;
  }

  private constructor() {
    console.log('🔧 Direct M-Pesa Service initialized');
  }

  /**
   * Get OAuth access token from M-Pesa
   */
  private async getAccessToken(environment: 'sandbox' | 'production' = 'sandbox'): Promise<string> {
    try {
      // Check if we have a valid cached token
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return this.accessToken;
      }

      const config = MPESA_CONFIG[environment];
      const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

      const response = await axios.get(
        `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in 1 hour, we'll refresh after 50 minutes
      this.tokenExpiry = new Date(Date.now() + 50 * 60 * 1000);

      console.log('✅ M-Pesa access token obtained');
      return this.accessToken;
    } catch (error) {
      console.error('Error getting M-Pesa access token:', error);
      throw new Error('Failed to authenticate with M-Pesa');
    }
  }

  /**
   * Format phone number for M-Pesa (254XXXXXXXXX format)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Remove leading + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    // If doesn't start with 254, add it
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Initiate STK Push using direct M-Pesa API
   */
  public async initiateSTKPush(
    paymentRequest: MPesaDirectPaymentRequest,
    environment: 'sandbox' | 'production' = 'sandbox'
  ): Promise<MPesaDirectPaymentResponse> {
    try {
      console.log('🚀 Initiating Direct M-Pesa STK Push:', {
        phone: this.formatPhoneNumber(paymentRequest.phoneNumber),
        amount: paymentRequest.amount,
        reference: paymentRequest.accountReference,
        environment
      });

      const config = MPESA_CONFIG[environment];
      const accessToken = await this.getAccessToken(environment);
      const timestamp = this.getTimestamp();
      const password = Buffer.from(
        `${config.shortcode}${config.passkey}${timestamp}`
      ).toString('base64');

      const formattedPhone = this.formatPhoneNumber(paymentRequest.phoneNumber);

      const payload = {
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(paymentRequest.amount), // M-Pesa requires whole numbers
        PartyA: formattedPhone,
        PartyB: config.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: paymentRequest.callbackUrl,
        AccountReference: paymentRequest.accountReference,
        TransactionDesc: paymentRequest.transactionDesc
      };

      console.log('📡 Sending STK Push request to M-Pesa');

      const response = await axios.post(
        `${config.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ M-Pesa STK Push response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Error initiating M-Pesa STK Push:', error.response?.data || error.message);
      
      if (error.response?.data) {
        throw new Error(
          error.response.data.errorMessage || 
          error.response.data.ResponseDescription || 
          'M-Pesa request failed'
        );
      }
      
      throw new Error('Failed to initiate M-Pesa payment');
    }
  }

  /**
   * Query STK Push status
   */
  public async querySTKPushStatus(
    checkoutRequestId: string,
    environment: 'sandbox' | 'production' = 'sandbox'
  ): Promise<any> {
    try {
      const config = MPESA_CONFIG[environment];
      const accessToken = await this.getAccessToken(environment);
      const timestamp = this.getTimestamp();
      const password = Buffer.from(
        `${config.shortcode}${config.passkey}${timestamp}`
      ).toString('base64');

      const payload = {
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(
        `${config.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error querying M-Pesa status:', error.response?.data || error.message);
      throw new Error('Failed to query payment status');
    }
  }

  /**
   * Extract callback data from M-Pesa callback
   */
  public extractCallbackData(callbackBody: any): any {
    try {
      if (callbackBody?.Body?.stkCallback) {
        const callback = callbackBody.Body.stkCallback;
        const metadata = callback.CallbackMetadata?.Item || [];
        
        const extractMetadataValue = (name: string) => {
          const item = metadata.find((item: any) => item.Name === name);
          return item?.Value;
        };

        return {
          merchantRequestId: callback.MerchantRequestID,
          checkoutRequestId: callback.CheckoutRequestID,
          resultCode: callback.ResultCode,
          resultDesc: callback.ResultDesc,
          amount: extractMetadataValue('Amount'),
          mpesaReceiptNumber: extractMetadataValue('MpesaReceiptNumber'),
          transactionDate: extractMetadataValue('TransactionDate'),
          phoneNumber: extractMetadataValue('PhoneNumber')
        };
      }

      return callbackBody;
    } catch (error) {
      console.error('Error extracting callback data:', error);
      throw error;
    }
  }

  /**
   * Get timestamp in YYYYMMDDHHmmss format
   */
  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}

export default MPesaDirectService;