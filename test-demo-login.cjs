const axios = require('axios');

async function testDemoLogin() {
  try {
    console.log('Testing login with demo tenant admin credentials...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@demo-restaurant.com',
      password: 'DemoAdmin@123'
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

testDemoLogin();
