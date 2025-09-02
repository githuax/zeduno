const axios = require('axios');

async function debugMPesaPayment() {
  console.log('🔍 Debugging M-Pesa Payment Initiation');
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

    // Step 2: Test payment initiation with different scenarios
    console.log('\n2️⃣ Testing M-Pesa Payment Initiation...');
    
    const testCases = [
      {
        name: 'Missing Order ID',
        payload: {
          phoneNumber: '254712345678',
          amount: 1000
        }
      },
      {
        name: 'Invalid Order ID',
        payload: {
          orderId: 'invalid-order-id',
          phoneNumber: '254712345678',
          amount: 1000
        }
      },
      {
        name: 'Valid MongoDB Order ID',
        payload: {
          orderId: '507f1f77bcf86cd799439011', // Valid MongoDB ObjectId format
          phoneNumber: '254712345678',
          amount: 1000
        }
      },
      {
        name: 'Invalid Phone Number',
        payload: {
          orderId: '507f1f77bcf86cd799439011',
          phoneNumber: '123456789',
          amount: 1000
        }
      },
      {
        name: 'Invalid Amount',
        payload: {
          orderId: '507f1f77bcf86cd799439011',
          phoneNumber: '254712345678',
          amount: -100
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.name}`);
      console.log('   Payload:', JSON.stringify(testCase.payload, null, 2));
      
      try {
        const response = await axios.post('http://localhost:5000/api/payments/mpesa/initiate', testCase.payload, { headers });
        console.log('✅ Success:', response.data);
      } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
        
        if (error.response?.data?.errors) {
          console.log('   Validation Errors:');
          error.response.data.errors.forEach(err => {
            console.log(`     - ${err.path}: ${err.msg}`);
          });
        }
      }
    }

    // Step 3: Check if we need to create a real order first
    console.log('\n3️⃣ Checking orders in system...');
    try {
      const ordersResponse = await axios.get('http://localhost:5000/api/orders', { headers });
      console.log('📦 Available orders:', ordersResponse.data.length);
      
      if (ordersResponse.data.length > 0) {
        const firstOrder = ordersResponse.data[0];
        console.log('   First order ID:', firstOrder._id);
        console.log('   Order status:', firstOrder.status);
        console.log('   Order total:', firstOrder.totalAmount);
        
        // Try payment with real order ID
        console.log('\n4️⃣ Testing with real order ID...');
        try {
          const realPaymentResponse = await axios.post('http://localhost:5000/api/payments/mpesa/initiate', {
            orderId: firstOrder._id,
            phoneNumber: '254712345678',
            amount: firstOrder.totalAmount || 1000
          }, { headers });
          
          console.log('✅ Success with real order:', realPaymentResponse.data);
        } catch (realError) {
          console.log('❌ Failed with real order:', realError.response?.data || realError.message);
        }
      } else {
        console.log('   No orders found. You may need to create an order first.');
      }
    } catch (ordersError) {
      console.log('❌ Could not fetch orders:', ordersError.response?.data || ordersError.message);
    }

  } catch (error) {
    console.log('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugMPesaPayment();
