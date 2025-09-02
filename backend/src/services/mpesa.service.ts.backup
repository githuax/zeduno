import axios from 'axios';
import { ITenant } from '../models/Tenant';

export interface MPesaCredentials {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  businessShortCode: string;
  environment: 'sandbox' | 'production';
}

export interface MPesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string;
}

export interface MPesaPaymentResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MPesaCallbackResponse {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

export class MPesaService {
  private static instance: MPesaService;
  private accessTokenCache: Map<string, { token: string; expires: number }> = new Map();

  public static getInstance(): MPesaService {
    if (!MPesaService.instance) {
      MPesaService.instance = new MPesaService();
    }
    return MPesaService.instance;
  }

  private getBaseUrl(environment: 'sandbox' | 'production'): string {
    return environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  private async getAccessToken(credentials: MPesaCredentials): Promise<string> {
    const cacheKey = `${credentials.consumerKey}-${credentials.environment}`;
    const cached = this.accessTokenCache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.token;
    }

    try {
      const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
      const baseUrl = this.getBaseUrl(credentials.environment);

      const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      const { access_token, expires_in } = response.data;
      const expiresAt = Date.now() + (expires_in * 1000) - 60000; // Expire 1 minute early

      this.accessTokenCache.set(cacheKey, {
        token: access_token,
        expires: expiresAt,
      });

      return access_token;
    } catch (error) {
      console.error('Failed to get M-Pesa access token:', error);
      throw new Error('Failed to authenticate with M-Pesa API');
    }
  }

  public async initiateSTKPush(
    credentials: MPesaCredentials,
    paymentRequest: MPesaPaymentRequest
  ): Promise<MPesaPaymentResponse> {
    try {
      const accessToken = await this.getAccessToken(credentials);
      const baseUrl = this.getBaseUrl(credentials.environment);

      // Format phone number (remove + and ensure it starts with 254)
      let formattedPhone = paymentRequest.phoneNumber.replace(/\+/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }

      // Generate timestamp
      const timestamp = new Date().toISOString().replace(/[:\-T.]/g, '').substring(0, 14);
      
      // Generate password
      const password = Buffer.from(
        credentials.businessShortCode + credentials.passkey + timestamp
      ).toString('base64');

      const stkPushData = {
        BusinessShortCode: credentials.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(paymentRequest.amount),
        PartyA: formattedPhone,
        PartyB: credentials.businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: paymentRequest.callbackUrl,
        AccountReference: paymentRequest.accountReference,
        TransactionDesc: paymentRequest.transactionDesc,
      };

      const response = await axios.post(
        `${baseUrl}/mpesa/stkpush/v1/processrequest`,
        stkPushData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('STK Push failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`M-Pesa API Error: ${error.response?.data?.errorMessage || error.message}`);
      }
      throw new Error('Failed to initiate M-Pesa payment');
    }
  }

  public async queryPaymentStatus(
    credentials: MPesaCredentials,
    checkoutRequestId: string
  ): Promise<any> {
    try {
      const accessToken = await this.getAccessToken(credentials);
      const baseUrl = this.getBaseUrl(credentials.environment);

      const timestamp = new Date().toISOString().replace(/[:\-T.]/g, '').substring(0, 14);
      const password = Buffer.from(
        credentials.businessShortCode + credentials.passkey + timestamp
      ).toString('base64');

      const queryData = {
        BusinessShortCode: credentials.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await axios.post(
        `${baseUrl}/mpesa/stkpushquery/v1/query`,
        queryData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Payment status query failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`M-Pesa Query Error: ${error.response?.data?.errorMessage || error.message}`);
      }
      throw new Error('Failed to query payment status');
    }
  }

  public validateTenantMPesaConfig(tenant: ITenant): boolean {
    const { mpesa } = tenant.paymentConfig;
    
    if (!mpesa.enabled) {
      return false;
    }

    const requiredFields = [
      mpesa.businessShortCode,
      mpesa.passkey,
      mpesa.consumerKey,
      mpesa.consumerSecret
    ];

    return requiredFields.every(field => field && field.trim().length > 0);
  }

  public extractCallbackData(callbackResponse: MPesaCallbackResponse): {
    merchantRequestId: string;
    checkoutRequestId: string;
    resultCode: number;
    resultDesc: string;
    amount?: number;
    mpesaReceiptNumber?: string;
    transactionDate?: string;
    phoneNumber?: string;
  } {
    const callback = callbackResponse.Body.stkCallback;
    const result = {
      merchantRequestId: callback.MerchantRequestID,
      checkoutRequestId: callback.CheckoutRequestID,
      resultCode: callback.ResultCode,
      resultDesc: callback.ResultDesc,
    };

    if (callback.CallbackMetadata) {
      const metadata = callback.CallbackMetadata.Item;
      
      return {
        ...result,
        amount: metadata.find(item => item.Name === 'Amount')?.Value as number,
        mpesaReceiptNumber: metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value as string,
        transactionDate: metadata.find(item => item.Name === 'TransactionDate')?.Value as string,
        phoneNumber: metadata.find(item => item.Name === 'PhoneNumber')?.Value as string,
      };
    }

    return result;
  }
}

export default MPesaService;