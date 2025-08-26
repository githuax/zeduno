// Test script to verify dashboard stats API

async function testStatsAPI() {
  try {
    // First, login to get token
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
    console.log('Login response:', JSON.stringify(loginData, null, 2));

    if (loginData.success && loginData.token) {
      // Test dashboard stats API
      const statsResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        },
      });

      const statsData = await statsResponse.json();
      console.log('\nStats API response:', JSON.stringify(statsData, null, 2));
    } else {
      console.error('Login failed:', loginData);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testStatsAPI();