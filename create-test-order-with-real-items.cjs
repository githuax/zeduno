const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function createTestOrderWithRealItems() {
  console.log('🛒 Creating Test Order with Real Menu Items');
  console.log('==========================================');
  
  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dama@mail.com',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    console.log('✅ Login successful');
    console.log(`   User: ${loginData.user.firstName} ${loginData.user.lastName}`);
    console.log(`   Tenant ID: ${loginData.user.tenantId}`);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    };

    // Step 2: Create order with real menu item IDs
    console.log('\n2️⃣ Creating test order with real menu items...');
    
    const orderData = {
      orderType: 'dine-in',
      customerName: 'Test Customer',
      customerPhone: '254712345678',
      items: [
        {
          menuItemId: '68aed19d61f84cfaf9ddcf76', // Ugali & Beef Stew
          name: 'Ugali & Beef Stew',
          price: 500,
          quantity: 2,
          customizations: [],
          specialInstructions: ''
        },
        {
          menuItemId: '68aed19d61f84cfaf9ddcf77', // Chapati
          name: 'Chapati', 
          price: 50,
          quantity: 4,
          customizations: [],
          specialInstructions: ''
        }
      ],
      totalAmount: 1200, // (500 * 2) + (50 * 4) = 1000 + 200 = 1200
      tableId: null,
      deliveryAddress: null,
      notes: 'Test order for M-Pesa payment with real menu items',
      paymentMethod: 'mpesa',
      paymentStatus: 'pending'
    };

    console.log('Order data:', JSON.stringify(orderData, null, 2));

    const orderResponse = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData)
    });

    const orderResult = await orderResponse.json();
    
    if (!orderResponse.ok) {
      throw new Error(`Order creation failed: ${JSON.stringify(orderResult)}`);
    }

    console.log('✅ Order created successfully!');
    console.log(`   Order ID: ${orderResult._id}`);
    console.log(`   Total: KSh ${orderResult.totalAmount}`);
    console.log(`   Status: ${orderResult.status}`);
    console.log(`   Payment Status: ${orderResult.paymentStatus}`);

    // Step 3: Initiate M-Pesa Payment
    console.log('\n3️⃣ Initiating M-Pesa payment...');
    
    const paymentData = {
      orderId: orderResult._id,
      phoneNumber: '254712345678',
      amount: orderResult.totalAmount
    };

    console.log('Payment data:', JSON.stringify(paymentData, null, 2));

    const paymentResponse = await fetch(`${API_BASE}/payments/mpesa/stk-push`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentData)
    });

    const paymentResult = await paymentResponse.json();
    
    if (!paymentResponse.ok) {
      console.log('❌ M-Pesa payment initiation failed:', JSON.stringify(paymentResult, null, 2));
    } else {
      console.log('✅ M-Pesa STK Push initiated successfully!');
      console.log('   Response:', JSON.stringify(paymentResult, null, 2));
    }

    return {
      order: orderResult,
      payment: paymentResult
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Run the test
createTestOrderWithRealItems().then(result => {
  if (result) {
    console.log('\n🎉 Test completed successfully!');
    console.log('   Order created and M-Pesa payment initiated');
  } else {
    console.log('\n💥 Test failed - check the errors above');
  }
});
