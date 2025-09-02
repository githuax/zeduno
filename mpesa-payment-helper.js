/**
 * M-Pesa Payment Helper - Frontend Integration
 * 
 * This helper ensures proper validation before sending M-Pesa payment requests
 */

class MPesaPaymentHelper {
  constructor(apiBaseUrl = '/api', authToken = null) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
  }

  /**
   * Validates Kenyan phone number format
   * @param {string} phoneNumber 
   * @returns {boolean}
   */
  validatePhoneNumber(phoneNumber) {
    const kenyanPhoneRegex = /^(?:\+?254|0)?[17]\d{8}$/;
    return kenyanPhoneRegex.test(phoneNumber);
  }

  /**
   * Formats phone number to M-Pesa expected format
   * @param {string} phoneNumber 
   * @returns {string}
   */
  formatPhoneNumber(phoneNumber) {
    let formatted = phoneNumber.replace(/\+/g, '');
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    } else if (!formatted.startsWith('254')) {
      formatted = '254' + formatted;
    }
    return formatted;
  }

  /**
   * Validates MongoDB ObjectId format
   * @param {string} orderId 
   * @returns {boolean}
   */
  validateOrderId(orderId) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(orderId);
  }

  /**
   * Initiates M-Pesa STK Push payment
   * @param {Object} paymentData 
   * @param {string} paymentData.orderId - Valid MongoDB ObjectId
   * @param {string} paymentData.phoneNumber - Kenyan phone number
   * @param {number} paymentData.amount - Payment amount (must be > 0)
   * @returns {Promise<Object>}
   */
  async initiatePayment({ orderId, phoneNumber, amount }) {
    // Validate inputs
    const errors = [];
    
    if (!orderId || !this.validateOrderId(orderId)) {
      errors.push('Valid order ID is required');
    }
    
    if (!phoneNumber || !this.validatePhoneNumber(phoneNumber)) {
      errors.push('Valid Kenyan phone number is required (format: 254712345678)');
    }
    
    if (!amount || amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Format phone number
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    // Prepare request
    const payload = {
      orderId,
      phoneNumber: formattedPhone,
      amount: Number(amount)
    };

    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/mpesa/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.errors) {
          const validationErrors = errorData.errors.map(err => `${err.path}: ${err.msg}`).join(', ');
          throw new Error(`Validation errors: ${validationErrors}`);
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('M-Pesa payment initiation failed:', error);
      throw error;
    }
  }

  /**
   * Checks payment status
   * @param {string} transactionId 
   * @returns {Promise<Object>}
   */
  async checkPaymentStatus(transactionId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/mpesa/status/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment status check failed:', error);
      throw error;
    }
  }

  /**
   * Complete payment flow with status polling
   * @param {Object} paymentData 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async processPayment(paymentData, options = {}) {
    const {
      pollInterval = 3000,
      maxPolls = 10,
      onStatusUpdate = null
    } = options;

    try {
      // Initiate payment
      console.log('Initiating M-Pesa payment...');
      const paymentResult = await this.initiatePayment(paymentData);
      
      if (!paymentResult.success) {
        throw new Error('Payment initiation failed');
      }

      console.log('Payment initiated:', paymentResult);

      // Poll for status updates
      let pollCount = 0;
      const transactionId = paymentResult.transactionId;
      
      return new Promise((resolve, reject) => {
        const pollStatus = async () => {
          try {
            pollCount++;
            const status = await this.checkPaymentStatus(transactionId);
            
            if (onStatusUpdate) {
              onStatusUpdate(status, pollCount);
            }

            // Check if payment is completed (success or failure)
            if (status.transactionStatus === 'completed') {
              resolve({ ...paymentResult, finalStatus: status });
              return;
            } else if (status.transactionStatus === 'failed') {
              reject(new Error(`Payment failed: ${status.mpesaStatus?.ResultDesc || 'Unknown error'}`));
              return;
            }

            // Continue polling if not max attempts
            if (pollCount < maxPolls) {
              setTimeout(pollStatus, pollInterval);
            } else {
              resolve({ ...paymentResult, finalStatus: status, timedOut: true });
            }
          } catch (error) {
            reject(error);
          }
        };

        // Start polling after a short delay
        setTimeout(pollStatus, 2000);
      });
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }
}

// Usage example:
/*
const mpesa = new MPesaPaymentHelper('/api', yourAuthToken);

// Simple payment
try {
  const result = await mpesa.initiatePayment({
    orderId: '68aed3394e7a378f7c6f19bb',
    phoneNumber: '0712345678',
    amount: 1000
  });
  console.log('Payment initiated:', result);
} catch (error) {
  console.error('Payment failed:', error.message);
}

// Complete payment with status tracking
mpesa.processPayment({
  orderId: '68aed3394e7a378f7c6f19bb',
  phoneNumber: '254712345678', 
  amount: 1000
}, {
  onStatusUpdate: (status, poll) => {
    console.log(`Poll ${poll}:`, status.transactionStatus);
  }
}).then(result => {
  console.log('Payment completed:', result);
}).catch(error => {
  console.error('Payment failed:', error.message);
});
*/

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MPesaPaymentHelper;
} else if (typeof window !== 'undefined') {
  window.MPesaPaymentHelper = MPesaPaymentHelper;
}
