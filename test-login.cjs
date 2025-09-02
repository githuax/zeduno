const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with superadmin credentials...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'superadmin@zeduno.com',
      password: 'SuperAdmin@123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    console.log('Token:', response.data.token);
    
    return response.data.token;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
    
    // Try with alternative passwords
    const altPasswords = ['SuperAdmin123!', 'superadmin123', 'SuperAdmin@123', 'admin'];
    
    for (const pwd of altPasswords) {
      try {
        console.log(`\nTrying password: ${pwd}`);
        const altResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: 'superadmin@zeduno.com',
          password: pwd
        });
        console.log('✅ Success with password:', pwd);
        return altResponse.data.token;
      } catch (altError) {
        console.log('❌ Failed with:', pwd);
      }
    }
  }
}

testLogin();
