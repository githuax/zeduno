const axios = require('axios');

async function testMPesaPaymentFixed() {
  console.log('🔧 Testing Fixed M-Pesa Payment System');
  console.log('=====================================');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'dama@mail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Login successful');
    console.log('   User:', user.firstName, user.lastName);
    console.log('   Tenant ID:', user.tenantId);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Get available orders
    console.log('\n2️⃣ Fetching available orders...');
    const ordersResponse = await axios.get('http://localhost:5000/api/orders', { headers });
    const orders = ordersResponse.data.orders || [];
    
    if (orders.length === 0) {
      console.log('❌ No orders found. Creating a test order first...');
      
      // Create a test order
      const testOrder = {
        items: [
          {
            name: 'Test Item',
            price: 1000,
            quantity: 1
          }
        ],
        totalAmount: 1000,
        customerInfo: {
          name: 'Test Customer',
          phone: '254712345678'
        }
      };
      
      const createOrderResponse = await axios.post('http://localhost:5000/api/orders', testOrder, { headers });
      console.log('✅ Test order created:', createOrderResponse.data._id);
      
      // Refresh orders list
      const refreshedOrders = await axios.get('http://localhost:5000/api/orders', { headers });
      orders.push(...(refreshedOrders.data.orders || []));
    }

    const order = orders[0];
    console.log('📦 Using order:', order._id);
    console.log('   Status:', order.status);
    console.log('   Payment Status:', order.paymentStatus);
    console.log('   Amount:', order.totalAmount || 1000);

    // Step 3: Verify payment methods available
    console.log('\n3️⃣ Checking payment methods...');
    const methodsResponse = await axios.get('http://localhost:5000/api/payments/methods', { headers });
    console.log('💳 Available payment methods:');
    methodsResponse.data.forEach(method => {
      console.log(`   - ${method.id}: ${method.name} (enabled: ${method.isEnabled})`);
    });

    const mpesaEnabled = methodsResponse.data.some(m => m.id === 'mpesa' && m.isEnabled);
    if (!mpesaEnabled) {
      console.log('❌ M-Pesa is not enabled for this tenant');
      return;
    }

    // Step 4: Test M-Pesa payment with proper validation
    console.log('\n4️⃣ Initiating M-Pesa payment...');
    
    const paymentPayload = {
      orderId: order._id,                    // Valid MongoDB ObjectId
      phoneNumber: '254712345678',           // Valid Kenyan phone number  
      amount: order.totalAmount || 1000      // Positive amount
    };

    console.log('📋 Payment payload:');
    console.log(JSON.stringify(paymentPayload, null, 2));

    try {
      const paymentResponse = await axios.post(
        'http://localhost:5000/api/payments/mpesa/initiate', 
        paymentPayload, 
        { headers }
      );
      
      console.log('✅ M-Pesa payment initiated successfully!');
      console.log('📱 Response:', paymentResponse.data);
      
      if (paymentResponse.data.checkoutRequestId) {
        console.log('\n5️⃣ Payment status polling...');
        
        // Poll for payment status (since we're using a test callback)
        setTimeout(async () => {
          try {
            const statusResponse = await axios.get(
              `http://localhost:5000/api/payments/mpesa/status/${paymentResponse.data.transactionId}`,
              { headers }
            );
            console.log('📊 Payment status:', statusResponse.data);
          } catch (statusError) {
            console.log('⚠️  Status check:', statusError.response?.data || statusError.message);
          }
        }, 5000);
      }
      
    } catch (paymentError) {
      console.log('❌ Payment initiation failed:');
      console.log('   Status:', paymentError.response?.status);
      console.log('   Error:', paymentError.response?.data || paymentError.message);
      
      if (paymentError.response?.data?.errors) {
        console.log('   Validation errors:');
        paymentError.response.data.errors.forEach(err => {
          console.log(`     - ${err.path}: ${err.msg}`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMPesaPaymentFixed().then(() => {
  console.log('\n✨ Test completed!');
}).catch(console.error);
