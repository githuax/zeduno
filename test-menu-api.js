// Test script to verify menu overview API
async function testMenuAPI() {
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

    if (loginData.success && loginData.token) {
      // Test menu overview API
      console.log('Testing menu overview API...');
      const overviewResponse = await fetch('http://localhost:5000/api/menu/overview', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Overview response status:', overviewResponse.status);
      const overviewData = await overviewResponse.json();
      console.log('Menu overview data:', JSON.stringify(overviewData, null, 2));

      // Test menu items API
      console.log('\nTesting menu items API...');
      const itemsResponse = await fetch('http://localhost:5000/api/menu/items', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Items response status:', itemsResponse.status);
      const itemsData = await itemsResponse.json();
      console.log('Menu items data:', JSON.stringify(itemsData, null, 2));
    } else {
      console.error('Login failed:', loginData);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMenuAPI();