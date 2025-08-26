const axios = require('axios');

// Test script to validate M-Pesa integration endpoints
const BASE_URL = 'http://localhost:5001/api';
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with actual token

async function testMPesaEndpoints() {
  console.log('🧪 Testing M-Pesa Integration Endpoints...\n');

  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Get available payment methods
    console.log('1️⃣ Testing: GET /api/payments/methods');
    try {
      const response = await axios.get(`${BASE_URL}/payments/methods`, { headers });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 2: Get payment configuration (requires tenant ID)
    console.log('2️⃣ Testing: GET /api/payments/config/{tenantId}');
    const dummyTenantId = '507f1f77bcf86cd799439011';
    try {
      const response = await axios.get(`${BASE_URL}/payments/config/${dummyTenantId}`, { headers });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 3: Test M-Pesa payment initiation (requires valid order and phone)
    console.log('3️⃣ Testing: POST /api/payments/mpesa/initiate');
    const paymentData = {
      orderId: '507f1f77bcf86cd799439011',
      phoneNumber: '254712345678',
      amount: 100
    };
    try {
      const response = await axios.post(`${BASE_URL}/payments/mpesa/initiate`, paymentData, { headers });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 4: Update payment configuration (superadmin only)
    console.log('4️⃣ Testing: PUT /api/payments/config/{tenantId}');
    const configData = {
      paymentConfig: {
        mpesa: {
          enabled: true,
          environment: 'sandbox',
          accountType: 'till',
          tillNumber: '123456',
          paybillNumber: '',
          businessShortCode: '174379',
          passkey: 'test-passkey',
          consumerKey: 'test-consumer-key',
          consumerSecret: 'test-consumer-secret'
        },
        cash: {
          enabled: true
        }
      }
    };
    try {
      const response = await axios.put(`${BASE_URL}/payments/config/${dummyTenantId}`, configData, { headers });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data || error.message);
    }
    console.log('');

  } catch (error) {
    console.error('🔥 General Error:', error.message);
  }
}

// Test M-Pesa Service directly
async function testMPesaService() {
  console.log('🔧 Testing M-Pesa Service Logic...\n');

  // Test phone number formatting
  const phoneNumbers = [
    '0712345678',
    '+254712345678',
    '254712345678',
    '712345678'
  ];

  console.log('📱 Phone Number Formatting Test:');
  phoneNumbers.forEach(phone => {
    const formatted = formatPhoneNumber(phone);
    console.log(`${phone} -> ${formatted}`);
  });
  console.log('');
}

function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('254')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  return `254${cleaned}`;
}

// Test database connection
async function testDatabaseConnection() {
  console.log('🗄️ Testing Database Connection...\n');
  try {
    const response = await axios.get(`${BASE_URL}/dashboard/health`);
    console.log('✅ Database connection successful');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
  console.log('');
}

// Main test function
async function runTests() {
  console.log('🚀 M-Pesa Integration Test Suite\n');
  console.log('=====================================\n');
  
  await testDatabaseConnection();
  await testMPesaService();
  
  console.log('📡 API Endpoint Tests:');
  console.log('Note: These require a valid JWT token and running server\n');
  
  if (AUTH_TOKEN === 'your-jwt-token-here') {
    console.log('⚠️ Please update AUTH_TOKEN in this script with a valid JWT token');
    console.log('⚠️ You can get one by logging in through the frontend or API\n');
  } else {
    await testMPesaEndpoints();
  }
  
  console.log('🏁 Test Suite Complete');
}

if (require.main === module) {
  runTests();
}