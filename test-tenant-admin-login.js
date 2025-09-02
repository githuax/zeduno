import fetch from 'node-fetch';

async function testTenantAdminLogin() {
  try {
    console.log('Testing Chris Foods admin login...\n');
    
    // Login as the tenant admin
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'chris@mail.com',
        password: 'restaurant123'  // Default password
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ Successfully logged in as tenant admin!');
      console.log('\nUser Details:');
      console.log('- Email:', loginData.user.email);
      console.log('- Name:', loginData.user.firstName, loginData.user.lastName);
      console.log('- Role:', loginData.user.role);
      console.log('- Tenant ID:', loginData.user.tenantId);
      console.log('- Tenant Name:', loginData.user.tenantName);
      console.log('- Must Change Password:', loginData.user.mustChangePassword);
      console.log('\nThis user has admin access to manage the Chris Foods restaurant!');
      
      if (loginData.user.mustChangePassword) {
        console.log('\n⚠️  Note: User will be prompted to change password on first login in the web interface');
      }
    } else {
      console.log('❌ Login failed:', loginData.message);
      console.log('\nNote: The default password is "restaurant123"');
      console.log('If this doesn\'t work, the password may have been changed.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTenantAdminLogin();