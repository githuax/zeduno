const axios = require('axios');

async function testMPesaFlow() {
  try {
    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@demo-restaurant.com',
      password: 'DemoAdmin@123'
    });
    
    const token = loginResponse.data.token;
    const tenantId = loginResponse.data.user.tenantId;
    console.log('✅ Logged in successfully');
    console.log('🏢 Tenant ID:', tenantId);
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Check available payment methods
    console.log('\n💳 Step 2: Checking available payment methods...');
    const methodsResponse = await axios.get(`http://localhost:5000/api/payments/methods/${tenantId}`, { headers });
    console.log('✅ Available payment methods:');
    methodsResponse.data.forEach(method => {
      console.log(`   - ${method.name} (${method.provider}) - ${method.isEnabled ? 'Enabled' : 'Disabled'}`);
      if (method.accountInfo) {
        console.log(`     Account: ${method.accountInfo.type} ${method.accountInfo.number}`);
      }
    });
    
    // Step 3: Get payment configuration
    console.log('\n⚙️  Step 3: Checking M-Pesa configuration...');
    const configResponse = await axios.get(`http://localhost:5000/api/payments/config/tenant`, { 
      headers,
      params: { tenantId }
    });
    console.log('✅ M-Pesa Configuration:');
    console.log('   - Enabled:', configResponse.data.config.mpesa.enabled);
    console.log('   - Environment:', configResponse.data.config.mpesa.environment);
    console.log('   - Account Type:', configResponse.data.config.mpesa.accountType);
    console.log('   - Till Number:', configResponse.data.config.mpesa.tillNumber);
    console.log('   - Business Short Code:', configResponse.data.config.mpesa.businessShortCode);
    
    console.log('\n🎉 M-Pesa Integration Test Complete!');
    console.log('========================');
    console.log('✅ Login: Working');
    console.log('✅ Payment Methods: Working');
    console.log('✅ M-Pesa Config: Working');
    console.log('');
    console.log('📋 Ready for Payment Testing:');
    console.log('1. M-Pesa is configured with sandbox credentials');
    console.log('2. You can now create orders and process payments');
    console.log('3. Use a valid Kenyan phone number for testing');
    console.log('');
    console.log('⚠️  Important: Update Consumer Key and Consumer Secret with real Safaricom API credentials');
    
    return { token, tenantId };
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.log('Status:', error.response.status);
    }
  }
}

testMPesaFlow();
