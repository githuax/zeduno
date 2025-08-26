const axios = require('axios');

async function setupTestTenant() {
  console.log('🏢 Setting up Test Tenant with M-Pesa Configuration...\n');
  
  try {
    // Login and get token
    const loginData = {
      email: 'irungumill@mail.com',
      password: 'Pass@12345'
    };
    
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', loginData);
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Logged in as:', user.firstName, user.lastName, '- Role:', user.role);
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // First, let's get existing tenants
    console.log('\n📋 Getting existing tenants...');
    try {
      const tenantsResponse = await axios.get('http://localhost:5001/api/superadmin/tenants', { headers });
      const tenants = tenantsResponse.data.tenants || tenantsResponse.data || [];
      
      console.log(`Found ${tenants.length} tenants:`);
      tenants.forEach((tenant, index) => {
        console.log(`${index + 1}. ${tenant.name} (${tenant._id}) - Status: ${tenant.status}`);
      });
      
      if (tenants.length > 0) {
        const testTenant = tenants[0]; // Use the first tenant
        console.log(`\n🎯 Using tenant: ${testTenant.name} (${testTenant._id})`);
        
        // Configure M-Pesa for this tenant
        await configureMPesaForTenant(testTenant._id, token);
        
        // Test payment methods after configuration
        await testPaymentMethods(testTenant._id, token);
        
      } else {
        console.log('\n⚠️ No tenants found. Creating a test tenant...');
        await createTestTenant(token);
      }
      
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ Access denied - user may not be a superadmin');
        console.log('Let\'s check if they have a tenant assigned...');
        
        // Check if user has tenant access
        if (user.tenantId || user.tenant) {
          const tenantId = user.tenantId || user.tenant;
          console.log(`📌 User has tenant: ${tenantId}`);
          await testWithUserTenant(tenantId, token);
        } else {
          console.log('❌ No tenant access available');
        }
      } else {
        console.log('❌ Error getting tenants:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Setup failed:', error.response?.data || error.message);
  }
}

async function configureMPesaForTenant(tenantId, token) {
  console.log(`\n⚙️ Configuring M-Pesa for tenant ${tenantId}...`);
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
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
    const response = await axios.put(`http://localhost:5001/api/payments/config/${tenantId}`, mpesaConfig, { headers });
    console.log('✅ M-Pesa configuration saved successfully');
    
  } catch (error) {
    console.log('❌ M-Pesa configuration failed:', error.response?.data || error.message);
  }
}

async function testPaymentMethods(tenantId, token) {
  console.log(`\n🧪 Testing payment methods for tenant ${tenantId}...`);
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  try {
    const response = await axios.get(`http://localhost:5001/api/payments/methods/${tenantId}`, { headers });
    console.log('✅ Available payment methods:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Payment methods test failed:', error.response?.data || error.message);
  }
}

async function testWithUserTenant(tenantId, token) {
  console.log(`\n🧪 Testing with user's tenant: ${tenantId}`);
  
  // Try to get tenant payment config
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  try {
    const response = await axios.get(`http://localhost:5001/api/payments/config/${tenantId}`, { headers });
    console.log('✅ Current payment config:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Failed to get payment config:', error.response?.data || error.message);
  }
}

async function createTestTenant(token) {
  console.log('\n🏗️ Creating test tenant...');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const tenantData = {
    name: 'Test Restaurant',
    email: 'test@restaurant.com',
    slug: 'test-restaurant',
    plan: 'basic',
    maxUsers: 10,
    address: '123 Test Street, Test City',
    phone: '+254712345678',
    contactPerson: 'Test Manager',
    description: 'Test restaurant for M-Pesa integration',
    settings: {
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      language: 'en',
      businessType: 'restaurant'
    },
    features: {
      dineIn: true,
      takeaway: true,
      delivery: true,
      roomService: false,
      hotelBooking: false
    }
  };
  
  try {
    const response = await axios.post('http://localhost:5001/api/superadmin/tenants', tenantData, { headers });
    const newTenant = response.data;
    console.log('✅ Test tenant created:', newTenant.name, newTenant._id);
    
    // Configure M-Pesa for the new tenant
    await configureMPesaForTenant(newTenant._id, token);
    await testPaymentMethods(newTenant._id, token);
    
  } catch (error) {
    console.log('❌ Failed to create test tenant:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  setupTestTenant();
}