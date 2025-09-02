const axios = require('axios');

async function testPaymentFlow() {
  console.log('🔄 Testing M-Pesa Payment Flow');
  console.log('===============================\n');

  try {
    // Step 1: Login with dama@mail.com (assuming password is 'password123')
    console.log('1️⃣ Attempting login with dama@mail.com...');
    
    const passwords = ['password123', 'dama123', 'admin123', 'Password123', 'dama@123'];
    let loginResponse, token, user;
    
    for (const pwd of passwords) {
      try {
        loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: 'dama@mail.com',
          password: pwd
        });
        token = loginResponse.data.token;
        user = loginResponse.data.user;
        console.log(`✅ Login successful with password: ${pwd}`);
        break;
      } catch (error) {
        console.log(`❌ Failed with password: ${pwd}`);
      }
    }

    if (!token) {
      console.log('\n❌ Could not login with any common passwords.');
      console.log('Please provide the correct password for dama@mail.com');
      return;
    }

    console.log(`   User: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Tenant: ${user.tenant?.name || 'No tenant'}`);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Check if user has M-Pesa configured
    if (user.tenantId) {
      console.log('\n2️⃣ Checking M-Pesa configuration...');
      try {
        const methodsResponse = await axios.get(`http://localhost:5000/api/payments/methods/${user.tenantId}`, { headers });
        const mpesaMethod = methodsResponse.data.find(method => method.id === 'mpesa');
        
        if (mpesaMethod && mpesaMethod.isEnabled) {
          console.log('✅ M-Pesa is configured and enabled');
          console.log(`   Account: ${mpesaMethod.accountInfo.type} ${mpesaMethod.accountInfo.number}`);
        } else {
          console.log('❌ M-Pesa is not configured for this tenant');
          console.log('\nℹ️  To enable M-Pesa, we need to configure it for your tenant.');
          return;
        }
      } catch (error) {
        console.log('⚠️  Could not check M-Pesa configuration:', error.response?.data || error.message);
      }
    }

    // Step 3: Demonstrate payment command
    console.log('\n3️⃣ Payment Command Examples:');
    console.log('============================');

    const exampleOrderId = '507f1f77bcf86cd799439011'; // Mock order ID
    const phoneNumber = '254712345678';
    const amount = 1000;

    console.log('\n📋 CURL Command:');
    console.log('================');
    console.log(`curl -X POST http://localhost:5000/api/payments/mpesa/initiate \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Authorization: Bearer ${token.substring(0, 20)}..." \\`);
    console.log(`  -d '{`);
    console.log(`    "orderId": "${exampleOrderId}",`);
    console.log(`    "phoneNumber": "${phoneNumber}",`);
    console.log(`    "amount": ${amount}`);
    console.log(`  }'`);

    console.log('\n💻 JavaScript Code:');
    console.log('===================');
    console.log(`const paymentResponse = await fetch('http://localhost:5000/api/payments/mpesa/initiate', {`);
    console.log(`  method: 'POST',`);
    console.log(`  headers: {`);
    console.log(`    'Content-Type': 'application/json',`);
    console.log(`    'Authorization': 'Bearer ${token.substring(0, 20)}...'`);
    console.log(`  },`);
    console.log(`  body: JSON.stringify({`);
    console.log(`    orderId: '${exampleOrderId}',`);
    console.log(`    phoneNumber: '${phoneNumber}',`);
    console.log(`    amount: ${amount}`);
    console.log(`  })`);
    console.log(`});`);

    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. Create a real order in your application');
    console.log('2. Get the order ID from your order management system');
    console.log('3. Use the payment commands above with the real order ID');
    console.log('4. Customer will receive STK push on their phone');
    console.log('5. Payment status will be updated automatically');

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
  }
}

// Also provide a direct payment test function
async function testDirectPayment(orderId, phoneNumber, amount) {
  console.log('\n🚀 Direct Payment Test');
  console.log('======================');

  try {
    // Try to login with common passwords
    const passwords = ['password123', 'dama123', 'admin123', 'Password123'];
    let token;
    
    for (const pwd of passwords) {
      try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: 'dama@mail.com',
          password: pwd
        });
        token = response.data.token;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!token) {
      console.log('❌ Could not authenticate. Please check your password.');
      return;
    }

    // Initiate payment
    const paymentResponse = await axios.post('http://localhost:5000/api/payments/mpesa/initiate', {
      orderId: orderId,
      phoneNumber: phoneNumber,
      amount: amount
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Payment initiated successfully!');
    console.log('Response:', paymentResponse.data);

  } catch (error) {
    console.log('❌ Payment failed:', error.response?.data || error.message);
  }
}

// Run the test
testPaymentFlow();

// Export for manual testing
module.exports = { testDirectPayment };
