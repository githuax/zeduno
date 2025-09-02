import fetch from 'node-fetch';

async function testSuperAdminUsersAPI() {
  try {
    // First login as superadmin
    const loginResponse = await fetch('http://localhost:5000/api/superadmin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'superadmin@zeduno.com',
        password: 'admin@123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('Login failed:', loginData.message);
      return;
    }
    
    console.log('✅ Logged in as superadmin');
    const token = loginData.token;
    
    // Now fetch users
    const usersResponse = await fetch('http://localhost:5000/api/superadmin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const usersData = await usersResponse.json();
    
    if (usersData.success) {
      console.log(`\n✅ Successfully fetched ${usersData.users.length} users\n`);
      
      // Find Chris user
      const chrisUser = usersData.users.find(u => u.email === 'chris@mail.com');
      
      if (chrisUser) {
        console.log('✅ Found Chris user:');
        console.log('  Email:', chrisUser.email);
        console.log('  Name:', chrisUser.firstName, chrisUser.lastName);
        console.log('  Role:', chrisUser.role);
        console.log('  Tenant Name:', chrisUser.tenantName);
        console.log('  Tenant ID:', chrisUser.tenantId);
        console.log('  Active:', chrisUser.isActive);
      } else {
        console.log('❌ Chris user not found in API response');
      }
      
      // Show all users with their tenants
      console.log('\n📋 All users with tenants:');
      usersData.users.forEach(u => {
        console.log(`- ${u.email} | ${u.firstName} ${u.lastName} | Role: ${u.role} | Tenant: ${u.tenantName || 'None'}`);
      });
      
    } else {
      console.error('Failed to fetch users:', usersData.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSuperAdminUsersAPI();