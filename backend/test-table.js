const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = 'your-super-secure-jwt-secret-key-for-development-only';

// Test with both mock users
const users = [
  { id: 'mock-user-id', name: 'Demo Admin' },
  { id: 'joe-pizza-admin-id', name: 'Joe Pizza Admin' }
];

const testTableCreation = async () => {
  for (const user of users) {
    console.log(`\n=== Testing with ${user.name} (${user.id}) ===`);
    
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    console.log('Token:', token.substring(0, 50) + '...');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test GET tables first
    try {
      console.log('\n1. Testing GET /api/tables...');
      const response = await axios.get('http://localhost:3008/api/tables', { headers });
      console.log('✅ GET tables successful:', response.status);
      console.log('Found tables:', response.data.length || 'No data returned');
    } catch (error) {
      console.log('❌ GET tables failed:');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      } else if (error.code === 'ECONNREFUSED') {
        console.log('❌ Server not running or wrong port');
        return;
      } else {
        console.log('Error:', error.message);
      }
    }

    // Test POST table
    try {
      console.log('\n2. Testing POST /api/tables...');
      const tableData = {
        tableNumber: `TEST-${Date.now()}`,
        capacity: 4,
        floor: 1,
        status: 'available'
      };
      console.log('Table data:', JSON.stringify(tableData, null, 2));
      
      const response = await axios.post('http://localhost:3008/api/tables', tableData, { headers });
      console.log('✅ POST table successful:', response.status);
      console.log('Created table:', response.data);
    } catch (error) {
      console.log('❌ POST table failed:');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      } else if (error.code === 'ECONNREFUSED') {
        console.log('❌ Server not running');
        return;
      } else {
        console.log('Error:', error.message);
      }
    }
  }
};

// Wait a moment for server startup, then run tests
console.log('Waiting for server to start...');
setTimeout(testTableCreation, 3000);