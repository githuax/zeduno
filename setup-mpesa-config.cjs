const axios = require('axios');

async function setupMPesaConfig() {
  console.log('🔧 SETTING UP M-PESA CONFIGURATION');
  console.log('==================================\n');
  
  try {
    // Authenticate
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@demo-restaurant.com',
      password: 'DemoAdmin@123'
    });
    
    const token = authResponse.data.token;
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Authentication successful');
    
    // Configure M-Pesa for testing (Safaricom sandbox credentials)
    const mpesaConfig = {
      mpesa: {
        enabled: true,
        environment: 'sandbox', // Use sandbox for testing
        businessShortCode: '174379', // Sandbox test short code
        consumerKey: 'SANDBOX_CONSUMER_KEY', // You need to replace with real sandbox key
        consumerSecret: 'SANDBOX_CONSUMER_SECRET', // You need to replace with real sandbox secret
        passkey: 'SANDBOX_PASSKEY', // You need to replace with real sandbox passkey
        accountType: 'paybill'
      }
    };
    
    console.log('🔧 Configuring M-Pesa settings...');
    console.log('Config payload:', JSON.stringify(mpesaConfig, null, 2));
    
    // Apply M-Pesa configuration
    const configResponse = await axios.post(
      'http://localhost:5000/api/payments/gateway-config', 
      mpesaConfig, 
      { headers }
    );
    
    console.log('✅ M-Pesa configuration applied successfully!');
    console.log('Response:', JSON.stringify(configResponse.data, null, 2));
    
    // Verify configuration
    console.log('\n🔍 Verifying configuration...');
    const verifyResponse = await axios.get('http://localhost:5000/api/payments/gateway-config', { headers });
    console.log('✅ Verified M-Pesa config:', verifyResponse.data.mpesa);
    
    console.log('\n📝 IMPORTANT NOTES:');
    console.log('==================');
    console.log('1. 🔑 Replace SANDBOX_* values with real Safaricom sandbox credentials');
    console.log('2. 🏪 Get sandbox credentials from: https://developer.safaricom.co.ke');
    console.log('3. 📱 Use test phone numbers: 254708374149, 254700000000');
    console.log('4. 💰 Test amounts: Any amount between 1-70000 KES');
    console.log('5. 🔄 After getting real credentials, run this script again');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data || error.message);
  }
}

setupMPesaConfig();
