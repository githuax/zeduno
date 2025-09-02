const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function createTestOrderWithMpesa() {
  console.log('🛒 Creating Test Order and M-Pesa Payment');
  console.log('========================================');
  
  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dama@mail.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    console.log('✅ Login successful');
    console.log(`   User: ${loginData.user.firstName} ${loginData.user.lastName}`);
    console.log(`   Tenant: ${loginData.user.tenantName}`);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    };

    // Step 2: Create order
    console.log('\n2️⃣ Creating test order...');
    
    const orderData = {
      orderType: 'dine-in',
      customerName: 'Test Customer',
      customerPhone: '254712345678',
      items: [
        {
          menuItem: '68aed19d61f84cfaf9ddcf76', // Ugali & Beef Stew
          name: 'Ugali & Beef Stew',
          quantity: 2,
          customizations: []
        },
        {
          menuItem: '68aed19d61f84cfaf9ddcf77', // Chapati
          name: 'Chapati', 
          quantity: 4,
          customizations: []
        }
      ],
      notes: 'Test order for M-Pesa payment',
      paymentMethod: 'mpesa',
      paymentStatus: 'pending'
    };

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
    console.log(`   Total: KSh ${orderResult.total || orderResult.totalAmount || 'Unknown'}`);

    // Step 3: Initiate M-Pesa Payment
    console.log('\n3️⃣ Initiating M-Pesa payment...');
    
    const paymentData = {
      orderId: orderResult._id,
      phoneNumber: '254712345678',
      amount: orderResult.total || orderResult.totalAmount || 1200
    };

    console.log('Payment data:', JSON.stringify(paymentData, null, 2));

    const paymentResponse = await fetch(`${API_BASE}/payments/mpesa/initiate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentData)
    });

    const paymentResult = await paymentResponse.json();
    
    if (!paymentResponse.ok) {
      console.log('❌ M-Pesa payment initiation failed:', JSON.stringify(paymentResult, null, 2));
      return { order: orderResult, payment: null, error: paymentResult };
    } else {
      console.log('✅ M-Pesa STK Push initiated successfully!');
      console.log('   Response:', JSON.stringify(paymentResult, null, 2));
      return { order: orderResult, payment: paymentResult, error: null };
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Run the test
createTestOrderWithMpesa().then(result => {
  if (result && !result.error) {
    console.log('\n🎉 SUCCESS! Order created and M-Pesa payment initiated successfully!');
    console.log('✅ The M-Pesa integration is working correctly');
    console.log('📱 Check the phone 254712345678 for the M-Pesa payment prompt');
  } else if (result && result.error) {
    console.log('\n⚠️  Order created but M-Pesa payment failed');
    console.log('📋 Order was successfully created - payment integration needs work');
  } else {
    console.log('\n💥 Test failed completely');
  }
});
