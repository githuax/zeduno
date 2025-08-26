// Test script to verify currency formatting
async function testCurrency() {
  try {
    // First, login to get token with updated tenant data
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'irungumill@mail.com',
        password: 'Pass@12345'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Currency in tenant data:', loginData.user?.tenant?.settings?.currency);
    
    if (loginData.success) {
      console.log('Login successful');
      console.log('Tenant settings:', JSON.stringify(loginData.user?.tenant?.settings, null, 2));
      
      // Simulate what frontend would store in localStorage
      console.log('\nWhat would be stored in localStorage:');
      const userForLocalStorage = {
        id: loginData.user._id,
        email: loginData.user.email,
        name: `${loginData.user.firstName} ${loginData.user.lastName}`,
        firstName: loginData.user.firstName,
        lastName: loginData.user.lastName,
        role: loginData.user.role,
        tenantId: loginData.user.tenantId,
        tenantName: loginData.user.tenantName,
        tenant: loginData.user.tenant // This should include settings with KES currency
      };
      console.log(JSON.stringify(userForLocalStorage, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCurrency();