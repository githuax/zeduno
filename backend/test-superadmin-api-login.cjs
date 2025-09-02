const axios = require('axios');

async function testSuperAdminAPILogin() {
  console.log('🔐 TESTING SUPERADMIN API LOGIN');
  console.log('===============================\n');
  
  const credentials = [
    { email: 'superadmin@zeduno.com', password: 'SuperAdmin@123', name: 'Primary Credentials' },
    { email: 'superadmin@zeduno.com', password: 'SuperAdmin123!', name: 'Alternative Password 1' },
    { email: 'superadmin@zeduno.com', password: 'password123', name: 'Alternative Password 2' },
    { email: 'superadmin@hotelzed.com', password: 'SuperAdmin@123', name: 'Alternative Email' },
  ];
  
  for (const cred of credentials) {
    try {
      console.log(`🧪 Testing ${cred.name}:`);
      console.log(`   Email: ${cred.email}`);
      console.log(`   Password: ${cred.password}`);
      
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: cred.email,
        password: cred.password
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      if (response.status === 200) {
        console.log('✅ SUCCESS! Login working');
        console.log('   User:', response.data.user.email);
        console.log('   Role:', response.data.user.role);
        console.log('   Token:', response.data.token ? 'Generated' : 'Missing');
        console.log('');
        
        // Found working credentials
        console.log('🎉 WORKING SUPERADMIN CREDENTIALS:');
        console.log('================================');
        console.log(`📧 Email: ${cred.email}`);
        console.log(`🔑 Password: ${cred.password}`);
        console.log('');
        break;
      }
      
    } catch (error) {
      console.log('❌ Failed');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.message || error.response.statusText}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
      console.log('');
    }
  }
  
  console.log('🌐 Login URLs:');
  console.log('Frontend: http://localhost:8080');
  console.log('Backend: http://localhost:5000');
}

testSuperAdminAPILogin();
