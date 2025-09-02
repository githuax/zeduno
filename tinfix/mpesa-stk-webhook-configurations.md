# M-Pesa STK Push & Webhook Validation Configurations

## 🚀 **STK Push Configuration**

### **Zed Business API Integration**

The system integrates with Zed Business API for M-Pesa KCB STK Push payments.

#### **API Configuration**
```typescript
const ZED_BUSINESS_CONFIG = {
  apiKey: 'X-Authorization',
  baseUrl: 'https://api.dev.zed.business',
  externalOrigin: '9002742',  // Business ID
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // JWT Token
};
```

#### **STK Push Endpoint**
- **URL**: `/api/v1/payments/initiate_kcb_stk_push`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Authorization: [AUTH_TOKEN]`
  - `Accept: application/json`

#### **STK Push Payload Structure**
```typescript
{
  amount: number,                    // Payment amount
  phone: string,                     // Format: 254XXXXXXXXX (no + prefix)
  type: 'bookingTicket',             // Default payment type
  externalOrigin: '9002742',         // Business ID
  orderIds: [string],                // Array with order reference
  batchId: ''                        // Empty as per documentation
}
```

#### **Phone Number Validation**
Supports East African phone numbers:
- **Kenya**: `254[17]XXXXXXXX` (254 + 7/1 + 8 digits)
- **Uganda**: `256[37]XXXXXXXX` (256 + 7/3 + 8 digits)
- **Tanzania**: `255[67]XXXXXXXX` (255 + 6/7 + 8 digits)
- **Rwanda**: `250[78]XXXXXXXX` (250 + 7/8 + 8 digits)
- **Burundi**: `257[68]XXXXXXX` (257 + 6/8 + 7 digits)
- **Congo**: `243[89]XXXXXXXX` (243 + 8/9 + 8 digits)
- **South Sudan**: `211[19]XXXXXXXX` (211 + 1/9 + 8 digits)

#### **STK Push Response Format**
```typescript
{
  MerchantRequestID: string,         // Request reference ID
  CheckoutRequestID: string,         // Transaction ID
  ResponseCode: '0' | '1',           // 0 = success, 1 = failed
  ResponseDescription: string,        // Status message
  CustomerMessage: string            // User instruction message
}
```

---

## 🔔 **Webhook Callback Configuration**

### **Callback URL**
- **Production**: `https://zeduno.piskoe.com/api/mpesa-kcb/callback`
- **Development**: `http://localhost:5000/api/mpesa-kcb/callback`

### **Callback Data Structure**

#### **Zed Business Callback Interface**
```typescript
interface ZedBusinessCallbackData {
  // Payment status
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
}
```

### **Payment Status Validation Logic**

#### **Success Indicators**
Payment is considered successful when **ANY** of these conditions are met:
```typescript
// Result code validation
resultCode === 0 || parseInt(ResultCode) === 0

// Status validation
status?.toLowerCase() === 'success' ||
status?.toLowerCase() === 'completed'

// Description validation  
resultDesc?.toLowerCase().includes('processed successfully')

// Receipt validation
(MpesaReceiptNumber && MpesaReceiptNumber.length > 0) ||
(mpesaReceiptNumber && mpesaReceiptNumber.length > 0) ||
(transactionReference && transactionReference.length > 0)
```

### **Order ID Extraction Logic**
The system attempts to extract order ID from multiple possible fields:
```typescript
const orderId = callbackData.orderId || 
               (callbackData.orderIds && callbackData.orderIds[0]) ||
               callbackData.reference ||
               callbackData.accountReference ||
               null;
```

### **Transaction ID Extraction Logic**
```typescript
const transactionId = callbackData.transactionId ||
                     callbackData.CheckoutRequestID ||
                     callbackData.checkoutRequestId ||
                     callbackData.MpesaReceiptNumber ||
                     callbackData.mpesaReceiptNumber ||
                     `TXN_${Date.now()}`;
```

---

## 📊 **Database Integration**

### **Order Status Updates**
When payment is successful:
```typescript
order.paymentStatus = 'paid';
order.paymentMethod = 'mpesa';
order.paidAt = new Date();
order.paymentDetails = {
  transactionId: transactionId,
  gateway: 'zed-business',
  paidAt: new Date(),
  ...order.paymentDetails
};

// Auto-confirm pending orders
if (order.status === 'pending') {
  await order.updateStatus('confirmed', undefined, 'Payment confirmed via M-Pesa');
}
```

### **Payment Transaction Record**
```typescript
{
  tenantId: order.tenantId,
  orderId: order._id,
  paymentMethod: 'mpesa',
  amount: callbackData.Amount || order.total,
  currency: callbackData.currency || 'KES',
  status: 'completed' | 'failed',
  customerPhone: callbackData.PhoneNumber,
  customerName: callbackData.customerName || order.customerName,
  gatewayTransactionId: transactionId,
  gatewayResponse: callbackData,
  mpesaData: {
    merchantRequestId: callbackData.merchantRequestId,
    checkoutRequestId: callbackData.checkoutRequestId,
    mpesaReceiptNumber: callbackData.MpesaReceiptNumber,
    phoneNumber: callbackData.PhoneNumber,
    accountReference: callbackData.reference,
    transactionDesc: `Payment for Order #${order.orderNumber}`
  },
  initiatedAt: new Date(),
  completedAt: status === 'completed' ? new Date() : undefined,
  failedAt: status === 'failed' ? new Date() : undefined
}
```

---

## 🔄 **Real-time Updates**

### **WebSocket Integration**
The system emits real-time payment status updates via WebSocket:

#### **Payment Success Event**
```typescript
const paymentUpdate: PaymentStatusUpdate = {
  orderId: order._id.toString(),
  orderNumber: order.orderNumber,
  status: 'completed',
  transactionId: transactionId,
  transactionReference: callbackData.MpesaReceiptNumber,
  amount: parseFloat(callbackData.Amount?.toString() || '0'),
  currency: 'KES',
  timestamp: new Date(),
  message: 'Payment confirmed successfully'
};
websocketService.emitPaymentStatusUpdate(paymentUpdate);
```

#### **Payment Failed Event**
```typescript
const paymentUpdate: PaymentStatusUpdate = {
  orderId: order._id.toString(),
  orderNumber: order.orderNumber,
  status: 'failed',
  transactionId: transactionId,
  timestamp: new Date(),
  message: 'Payment failed or was cancelled'
};
websocketService.emitPaymentStatusUpdate(paymentUpdate);
```

---

## 🛠️ **API Routes**

### **Protected Routes** (Require Authentication)
- `POST /api/mpesa-kcb/initiate` - Initiate STK push
- `GET /api/mpesa-kcb/status/:transactionId` - Query payment status
- `GET /api/mpesa-kcb/history` - Get payment history
- `GET /api/mpesa-kcb/statistics` - Get payment statistics

### **Public Routes** (No Authentication)
- `POST /api/mpesa-kcb/callback` - Handle payment callbacks

---

## 🔒 **Security Features**

### **Input Validation**
- Phone number format validation
- Currency validation (KES, UGX, TZS, RWF, BIF, CDF, SSP)
- Amount validation
- Tenant ID validation

### **Callback Security**
- Callback data validation
- Duplicate transaction prevention
- Order existence validation
- Status transition validation

### **Error Handling**
- Comprehensive error logging
- Graceful failure handling
- Transaction rollback on failures
- Real-time error notifications

---

## 📈 **Payment Statistics**

### **Available Metrics**
- Total transactions count
- Successful transactions count
- Failed transactions count
- Pending transactions count
- Total amount processed
- Successful amount processed

### **Transaction History**
- Last 50 transactions per tenant
- Order details population
- Chronological sorting
- Payment method filtering

---

## 🧪 **Testing Configuration**

### **Test Phone Numbers** (Sandbox)
- Kenya: `254700000000` to `254799999999`
- Uganda: `256700000000` to `256799999999`

### **Test Amounts**
- Success: Any amount ending in `0` (e.g., 10, 100, 1000)
- Failure: Any amount ending in other digits

### **Callback Testing**
Use tools like Postman or cURL to test callback endpoints with sample payloads.

---

## 📝 **Implementation Notes**

1. **Order Number Handling**: System handles both `ORD-XXXX` and `BT-ORD-XXXX` formats
2. **Duplicate Prevention**: Checks existing transactions before creating new ones
3. **Status Transitions**: Only updates order status when appropriate
4. **Real-time Updates**: Ensures UI reflects payment status immediately
5. **Multi-tenant Support**: All operations are tenant-scoped
6. **Error Recovery**: Failed payments can be retried
7. **Audit Trail**: Complete transaction history maintained

---

**Last Updated**: September 2, 2025  
**Integration**: Zed Business M-Pesa KCB API  
**Environment**: Production & Development Ready