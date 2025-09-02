import fetch from 'node-fetch';

async function testPhilLogin() {
  try {
    console.log('Testing Phil Foods admin login...\n');
    
    // Login as Phil
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'phil@mail.com',
        password: 'restaurant123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ Successfully logged in as Phil!');
      console.log('\nUser Details:');
      console.log('  Email:', loginData.user.email);
      console.log('  Name:', loginData.user.firstName, loginData.user.lastName);
      console.log('  Role:', loginData.user.role);
      console.log('  Tenant ID:', loginData.user.tenantId);
      console.log('  Tenant Name:', loginData.user.tenantName);
      console.log('  Must Change Password:', loginData.user.mustChangePassword || loginData.mustChangePassword);
      console.log('  Active:', loginData.user.isActive);
      
      if (loginData.user.mustChangePassword || loginData.mustChangePassword) {
        console.log('\n✅ CORRECT: Password change modal will appear!');
        console.log('Phil will be forced to change the password from "restaurant123" to a new secure password.');
      } else {
        console.log('\n⚠️  Note: mustChangePassword flag is not set, user won\'t see password change modal');
      }
    } else {
      console.log('❌ Login failed:', loginData.message);
      console.log('\nTroubleshooting:');
      console.log('1. Make sure the backend is running (pm2 status)');
      console.log('2. Default password should be: restaurant123');
      console.log('3. Run the fix script again: node check-and-fix-phil-user.js');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure the backend is running on port 5000');
  }
}

testPhilLogin();