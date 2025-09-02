# M-Pesa Payment Commands Guide

## 🚀 How to Make M-Pesa Payments

### Method 1: Frontend UI (Recommended)
1. **Login to your application:**
   - Open http://localhost:8080
   - Login with your credentials (dama@mail.com)

2. **Create an order and use the payment dialog:**
   - The `MPesaPaymentDialog` component handles everything
   - Just enter customer phone number
   - System handles STK push automatically

### Method 2: Direct API Calls

#### Step 1: Get Authentication Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "dama@mail.com", "password": "your_password"}'
```

#### Step 2: Initiate M-Pesa Payment
```bash
curl -X POST http://localhost:5000/api/payments/mpesa/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "orderId": "YOUR_ORDER_ID",
    "phoneNumber": "254712345678",
    "amount": 1000
  }'
```

#### Step 3: Check Payment Status
```bash
curl -X GET http://localhost:5000/api/payments/mpesa/status/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Method 3: JavaScript/Node.js Code

```javascript
// Complete payment flow example
async function processPayment(orderData) {
  try {
    // 1. Login
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dama@mail.com',
        password: 'your_password'
      })
    });
    
    const { token } = await loginResponse.json();
    
    // 2. Initiate payment
    const paymentResponse = await fetch('http://localhost:5000/api/payments/mpesa/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        orderId: orderData.id,
        phoneNumber: '254712345678', // Customer's phone
        amount: orderData.total
      })
    });
    
    const paymentResult = await paymentResponse.json();
    console.log('Payment initiated:', paymentResult);
    
    // 3. Monitor payment status (optional)
    if (paymentResult.success) {
      setTimeout(async () => {
        const statusResponse = await fetch(`http://localhost:5000/api/payments/mpesa/status/${paymentResult.transactionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const status = await statusResponse.json();
        console.log('Payment status:', status);
      }, 5000);
    }
    
  } catch (error) {
    console.error('Payment failed:', error);
  }
}
```

