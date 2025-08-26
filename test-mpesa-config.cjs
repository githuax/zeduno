const axios = require('axios');

async function testMPesaConfiguration() {
  console.log('🔧 Testing M-Pesa Configuration...\n');
  
  try {
    // Login and get token
    const loginData = {
      email: 'irungumill@mail.com',
      password: 'Pass@12345'
    };
    
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', loginData);
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    const tenant = loginResponse.data.tenant;
    
    console.log('✅ Logged in as:', user.firstName, user.lastName);
    console.log('👤 Role:', user.role);
    console.log('🏢 Tenant ID:', user.tenantId || user.tenant || 'None');
    
    if (tenant) {
      console.log('🏢 Tenant Name:', tenant.name);
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const tenantId = user.tenantId || user.tenant;
    
    if (!tenantId) {
      console.log('❌ No tenant ID available for testing');
      return;
    }
    
    // Step 1: Get current payment configuration
    console.log('\n1️⃣ Getting current payment configuration...');
    try {
      const configResponse = await axios.get(`http://localhost:5001/api/payments/config/${tenantId}`, { headers });
      console.log('✅ Current config:', JSON.stringify(configResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Failed to get config:', error.response?.data || error.message);
    }
    
    // Step 2: Update M-Pesa configuration
    console.log('\n2️⃣ Updating M-Pesa configuration...');
    const mpesaConfig = {
      paymentConfig: {
        mpesa: {
          enabled: true,
          environment: 'sandbox',
          accountType: 'till',
          tillNumber: '123456',
          paybillNumber: '',
          businessShortCode: '174379',
          passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
          consumerKey: 'test-consumer-key-123',
          consumerSecret: 'test-consumer-secret-456'
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
    
    try {
      const updateResponse = await axios.put(`http://localhost:5001/api/payments/config/${tenantId}`, mpesaConfig, { headers });
      console.log('✅ M-Pesa configuration updated successfully');
    } catch (error) {
      console.log('❌ Failed to update config:', error.response?.data || error.message);
    }
    
    // Step 3: Verify the configuration was saved
    console.log('\n3️⃣ Verifying updated configuration...');
    try {
      const verifyResponse = await axios.get(`http://localhost:5001/api/payments/config/${tenantId}`, { headers });
      console.log('✅ Updated config:', JSON.stringify(verifyResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Failed to verify config:', error.response?.data || error.message);
    }
    
    // Step 4: Test available payment methods
    console.log('\n4️⃣ Testing available payment methods...');
    try {
      const methodsResponse = await axios.get(`http://localhost:5001/api/payments/methods/${tenantId}`, { headers });
      console.log('✅ Available payment methods:');
      console.log(JSON.stringify(methodsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Failed to get payment methods:', error.response?.data || error.message);
    }
    
    // Step 5: Test M-Pesa payment initiation (will fail but good to test endpoint)
    console.log('\n5️⃣ Testing M-Pesa payment initiation...');
    const paymentData = {
      orderId: '64a7b8c9d1e2f3g4h5i6j7k8',  // Dummy order ID
      phoneNumber: '254712345678',
      amount: 100
    };
    
    try {
      const paymentResponse = await axios.post('http://localhost:5001/api/payments/mpesa/initiate', paymentData, { headers });
      console.log('✅ M-Pesa payment initiated:', paymentResponse.data);
    } catch (error) {
      console.log('❌ M-Pesa payment initiation failed (expected):', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  testMPesaConfiguration();
}