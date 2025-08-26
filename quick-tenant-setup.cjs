const axios = require('axios');

async function quickSetup() {
  console.log('🚀 Quick Tenant Setup with M-Pesa...\n');
  
  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'irungumill@mail.com',
      password: 'Pass@12345'
    });
    
    console.log('✅ Login successful');
    console.log('User role:', loginResponse.data.user.role);
    console.log('Token includes superadmin flag:', loginResponse.data.token.includes('isSuperAdmin'));
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Check current tenant and configure it
    const tenantId = loginResponse.data.user.tenantId || loginResponse.data.user.tenant;
    
    if (tenantId) {
      console.log('\n2️⃣ Configuring M-Pesa for existing tenant:', tenantId);
      
      // Configure M-Pesa for this tenant
      const mpesaConfig = {
        paymentConfig: {
          mpesa: {
            enabled: true,
            environment: 'sandbox',
            accountType: 'till',
            tillNumber: '456789',
            paybillNumber: '',
            businessShortCode: '174379',
            passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
            consumerKey: 'test-consumer-key-456',
            consumerSecret: 'test-consumer-secret-789'
          },
          stripe: {
            enabled: false,
            publicKey: '',
            secretKey: '',
            webhookSecret: ''
          },
          square: {
            enabled: false,
            applicationId: '',
            accessToken: ''
          },
          cash: {
            enabled: true
          }
        }
      };
      
      const configResponse = await axios.put(`http://localhost:5001/api/payments/config/${tenantId}`, mpesaConfig, { headers });
      console.log('✅ M-Pesa configuration updated');
      
      // Verify the configuration
      const verifyResponse = await axios.get(`http://localhost:5001/api/payments/config/${tenantId}`, { headers });
      console.log('✅ Configuration verified:');
      console.log('   M-Pesa Enabled:', verifyResponse.data.mpesa.enabled);
      console.log('   Till Number:', verifyResponse.data.mpesa.tillNumber);
      console.log('   Environment:', verifyResponse.data.mpesa.environment);
      
      // Test payment methods
      const methodsResponse = await axios.get(`http://localhost:5001/api/payments/methods/${tenantId}`, { headers });
      console.log('\n✅ Available payment methods:');
      methodsResponse.data.forEach(method => {
        console.log(`   - ${method.name} (${method.provider})`);
        if (method.accountInfo) {
          console.log(`     Account: ${method.accountInfo.type} ${method.accountInfo.number}`);
        }
      });
      
      console.log('\n🎉 Setup complete! Your tenant now has M-Pesa configured.');
      console.log('🆔 Tenant ID:', tenantId);
      console.log('💳 Payment Methods: M-Pesa + Cash');
      
    } else {
      console.log('❌ No tenant ID found for this user');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.log('Details:', error.response.data.errors);
    }
  }
}

quickSetup();