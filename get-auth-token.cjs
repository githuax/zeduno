const axios = require('axios');

async function getAuthToken() {
  console.log('🔑 Getting Authentication Token...\n');
  
  try {
    // First, let's try to login with the user we activated earlier
    const loginData = {
      email: 'irungumill@mail.com',
      password: 'Pass@12345'
    };
    
    console.log('🔐 Attempting login...');
    const response = await axios.post('http://localhost:5001/api/auth/login', loginData);
    
    if (response.data.token) {
      console.log('✅ Login successful!');
      console.log('📋 Token:', response.data.token);
      console.log('👤 User:', response.data.user.firstName, response.data.user.lastName);
      console.log('🏢 Tenant:', response.data.tenant?.name || 'No tenant');
      
      // Test a protected endpoint with the token
      await testProtectedEndpoint(response.data.token, response.data.tenant?._id);
      
    } else {
      console.log('❌ Login failed - no token received');
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
  }
}

async function testProtectedEndpoint(token, tenantId) {
  console.log('\n🧪 Testing Protected Endpoint...');
  
  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test getting payment methods
    console.log('📡 Testing payment methods endpoint...');
    const response = await axios.get('http://localhost:5001/api/payments/methods', { headers });
    
    console.log('✅ Payment methods retrieved successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (tenantId) {
      // Test getting payment config
      console.log('\n📡 Testing payment config endpoint...');
      try {
        const configResponse = await axios.get(`http://localhost:5001/api/payments/config/${tenantId}`, { headers });
        console.log('✅ Payment config retrieved successfully:');
        console.log(JSON.stringify(configResponse.data, null, 2));
      } catch (configError) {
        console.log('❌ Payment config failed:', configError.response?.data || configError.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Protected endpoint test failed:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  getAuthToken();
}