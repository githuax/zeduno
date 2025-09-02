import fetch from 'node-fetch';

async function testFrankLogin() {
  try {
    console.log('Testing Frank Foods admin login...\n');
    
    // Login as Frank
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'frank@mail.com',
        password: 'restaurant123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ Successfully logged in as Frank!');
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
        console.log('Frank will be forced to change the password from "restaurant123" to a new secure password.');
      } else {
        console.log('\n⚠️  Note: mustChangePassword flag is not set, user won\'t see password change modal');
      }
      
      console.log('\n🎉 Frank can now successfully:');
      console.log('  1. Login with frank@mail.com / restaurant123');
      console.log('  2. See the password change modal');
      console.log('  3. Change to a secure password');  
      console.log('  4. Access the Frank Foods dashboard');
      
    } else {
      console.log('❌ Login failed:', loginData.message);
      console.log('\nTroubleshooting steps:');
      console.log('1. Make sure the backend is running (pm2 status)');
      console.log('2. Verify password is: restaurant123');
      console.log('3. Check if user was created properly');
      console.log('4. Run the fix script again if needed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure the backend is running on port 5000');
    console.log('You can check with: pm2 status');
  }
}

testFrankLogin();