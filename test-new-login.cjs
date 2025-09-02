const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with new superadmin credentials...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'superadmin@hotelzed.com',
      password: 'SuperAdmin@2024!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('User:', response.data.user);
    console.log('Token starts with:', response.data.token.substring(0, 20) + '...');
    
    return response.data.token;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
  }
}

testLogin();
