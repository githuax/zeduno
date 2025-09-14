import { ITenant } from '../models/Tenant';

// Zed Business API Configuration (externalized)
const ZED_BUSINESS_CONFIG = {
  apiKeyHeader: process.env.ZED_API_KEY_HEADER || 'X-Authorization',
  baseUrl: process.env.ZED_API_BASE_URL || '',
  externalOrigin: process.env.ZED_EXTERNAL_ORIGIN || '',
  authToken: process.env.ZED_AUTH_TOKEN || ''
};

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

// Zed Business API response interfaces
interface ZedBusinessPaymentResponse {
  success?: boolean;
  status?: string;
  message?: string;
  errorMessage?: string;
  ResponseCode?: string;
  CheckoutRequestID?: string;
  MerchantRequestID?: string;
  CustomerMessage?: string;
  transactionId?: string;
  [key: string]: any;
}

export class MPesaService {
  private static instance: MPesaService;

  public static getInstance(): MPesaService {
    if (!MPesaService.instance) {
      MPesaService.instance = new MPesaService();
    }
    return MPesaService.instance;
  }

  private constructor() {
    console.log('🔧 MPesa Service initialized with Zed Business integration');
  }

  /**
   * Validate tenant M-Pesa configuration
   * For Zed Business integration, we just need to check if M-Pesa is enabled
   */
  public validateTenantMPesaConfig(tenant: ITenant): boolean {
    try {
      // For Zed Business, we use centralized credentials
      // Just check if M-Pesa is enabled for the tenant
      return tenant.paymentConfig?.mpesa?.enabled === true;
    } catch (error) {
      console.error('Error validating tenant MPesa config:', error);
      return false;
    }
  }

  /**
   * Format phone number for Zed Business API
   */
  private formatPhoneNumber(phoneNumber: string): string {
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
    
    return cleaned;
  }

  /**
   * Initiate STK Push via Zed Business API
   */
  public async initiateSTKPush(
    credentials: MPesaCredentials,
    paymentRequest: MPesaPaymentRequest
  ): Promise<MPesaPaymentResponse> {
    try {
      console.log('🚀 Initiating M-Pesa STK Push via Zed Business:', {
        phone: this.formatPhoneNumber(paymentRequest.phoneNumber),
        amount: paymentRequest.amount,
        reference: paymentRequest.accountReference
      });

      // Format phone number for Zed Business
      const formattedPhone = this.formatPhoneNumber(paymentRequest.phoneNumber);

      // Generate unique transaction reference
      const transactionRef = `${paymentRequest.accountReference}_${Date.now()}`;

      // Prepare payload for Zed Business M-Pesa API
      // Based on the API v1 structure from documentation
      // Use the exact payload format from the API documentation
      const zedPayload = {
        amount: parseFloat(paymentRequest.amount.toString()),
        phone: formattedPhone, // Use 'phone' as per docs
        type: 'bookingTicket', // Default type as per docs
        externalOrigin: ZED_BUSINESS_CONFIG.externalOrigin, // Business ID
        orderIds: [paymentRequest.accountReference], // Order/Invoice number array
        batchId: '' // Empty as per docs
      };

      // Use the exact endpoint from the official API documentation
      const endpoint = '/api/v1/payments/initiate_kcb_stk_push';

      console.log(`🚀 Initiating M-Pesa payment via Zed Business:`, zedPayload);
      console.log(`📡 Using endpoint: ${endpoint}`);
      
      const response = await fetch(`${ZED_BUSINESS_CONFIG.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [ZED_BUSINESS_CONFIG.apiKeyHeader]: ZED_BUSINESS_CONFIG.authToken,
          'Accept': 'application/json'
        },
        body: JSON.stringify(zedPayload)
      });

      console.log(`📡 Response status:`, response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Zed Business API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Zed Business API error: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      const zedResult = await response.json() as any;
      console.log('✅ Zed Business API response:', zedResult);

      // Convert Zed Business response to MPesa format based on the documentation
      return {
        MerchantRequestID: zedResult.data?.requestReferenceId || transactionRef,
        CheckoutRequestID: zedResult.data?.id || transactionRef,
        ResponseCode: zedResult.data?.status === 200 ? '0' : '1',
        ResponseDescription: zedResult.data?.status === 200 ? 'Request processed successfully' : 'Request failed',
        CustomerMessage: 'Please check your phone and enter your M-Pesa PIN to complete the transaction'
      };

    } catch (error) {
      console.error('Error initiating STK Push via Zed Business:', error);
      
      // Return error response in MPesa format
      throw new Error(`Zed Business M-Pesa integration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract callback data from M-Pesa callback request
   */
  public extractCallbackData(callbackBody: any): any {
    try {
      // Handle standard M-Pesa callback format
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
      
      // Handle Zed Business callback format
      if (callbackBody?.checkoutRequestId || callbackBody?.CheckoutRequestID) {
        return {
          merchantRequestId: callbackBody.merchantRequestId || callbackBody.MerchantRequestID,
          checkoutRequestId: callbackBody.checkoutRequestId || callbackBody.CheckoutRequestID,
          resultCode: callbackBody.resultCode || callbackBody.ResultCode || 0,
          resultDesc: callbackBody.resultDesc || callbackBody.ResultDesc || 'Success',
          amount: callbackBody.amount || callbackBody.Amount,
          mpesaReceiptNumber: callbackBody.transactionId || callbackBody.MpesaReceiptNumber,
          transactionDate: callbackBody.transactionDate || new Date().toISOString(),
          phoneNumber: callbackBody.phoneNumber || callbackBody.PhoneNumber
        };
      }

      // If format is not recognized, return raw data
      console.warn('Unrecognized callback format:', callbackBody);
      return callbackBody;
    } catch (error) {
      console.error('Error extracting callback data:', error);
      throw error;
    }
  }

  /**
   * Query payment status via Zed Business API
   */
  public async queryPaymentStatus(
    credentials: MPesaCredentials,
    checkoutRequestId: string
  ): Promise<any> {
    try {
      console.log('🔍 Querying payment status via Zed Business:', checkoutRequestId);

      // Try to query status from Zed Business
      const statusResponse = await fetch(`${ZED_BUSINESS_CONFIG.baseUrl}/api/mpesa/query/${checkoutRequestId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ZED_BUSINESS_CONFIG.authToken}`,
          [ZED_BUSINESS_CONFIG.apiKeyHeader]: ZED_BUSINESS_CONFIG.authToken,
          'Accept': 'application/json'
        }
      });

      if (statusResponse.ok) {
        const result = await statusResponse.json();
        console.log('✅ Zed Business status query result:', result);
        return result;
      } else {
        console.log('❌ Status query failed, returning pending status');
      }
    } catch (error) {
      console.log('❌ Error querying payment status:', error);
    }

    // Return default pending status
    return {
      ResultCode: '1',
      ResultDesc: 'Transaction is being processed',
      status: 'pending'
    };
  }

  /**
   * Legacy method - not used with Zed Business integration
   */
  private async getAccessToken(credentials: MPesaCredentials): Promise<string> {
    // Not needed for Zed Business integration since we use their token
    return ZED_BUSINESS_CONFIG.authToken;
  }
}

export default MPesaService;
