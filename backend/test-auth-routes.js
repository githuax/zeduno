const jwt = require('jsonwebtoken');
const axios = require('axios');

// JWT Secret from .env
const JWT_SECRET = 'your-super-secure-jwt-secret-key-for-development-only';

// Generate token for mock user
const token = jwt.sign({ id: 'mock-user-id' }, JWT_SECRET, { expiresIn: '7d' });
console.log('Generated JWT Token:', token);

const testEndpoints = async () => {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('\n=== Testing Authentication & Routes ===\n');

  // Test 1: Orders endpoint
  try {
    console.log('1. Testing GET /api/orders...');
    const response = await axios.get('http://localhost:3009/api/orders', { headers });
    console.log('✅ Orders GET successful:', response.status);
  } catch (error) {
    console.log('❌ Orders GET failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }

  // Test 2: Tables endpoint  
  try {
    console.log('\n2. Testing GET /api/tables...');
    const response = await axios.get('http://localhost:3009/api/tables', { headers });
    console.log('✅ Tables GET successful:', response.status);
  } catch (error) {
    console.log('❌ Tables GET failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }

  // Test 3: Create table
  try {
    console.log('\n3. Testing POST /api/tables (Create table)...');
    const tableData = {
      tableNumber: 'T999',
      capacity: 4,
      floor: 1,
      status: 'available'
    };
    const response = await axios.post('http://localhost:3009/api/tables', tableData, { headers });
    console.log('✅ Table creation successful:', response.status);
    console.log('Created table:', response.data);
  } catch (error) {
    console.log('❌ Table creation failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }

  // Test 4: Create order
  try {
    console.log('\n4. Testing POST /api/orders (Create order)...');
    const orderData = {
      orderType: 'dine-in',
      customerName: 'Test Customer',
      customerPhone: '+1234567890',
      items: [
        {
          menuItem: '68a19f90ee7482cfe196500b',
          quantity: 1
        }
      ],
      notes: 'Test order'
    };
    const response = await axios.post('http://localhost:3009/api/orders', orderData, { headers });
    console.log('✅ Order creation successful:', response.status);
  } catch (error) {
    console.log('❌ Order creation failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }

  // Test 5: Test auth endpoint
  try {
    console.log('\n5. Testing GET /api/auth/profile...');
    const response = await axios.get('http://localhost:3009/api/auth/profile', { headers });
    console.log('✅ Profile GET successful:', response.status);
  } catch (error) {
    console.log('❌ Profile GET failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
};

// Wait for server to start, then run tests
setTimeout(() => {
  testEndpoints();
}, 3000);