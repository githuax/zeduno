const fetch = require('node-fetch');

async function testMenuAPI() {
  // First, let's login to get a token
  console.log('1. Testing login...');
  const loginResponse = await fetch('http://localhost:3008/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@hotelzed.com',
      password: 'password123'
    })
  });

  const loginData = await loginResponse.json();
  console.log('Login response:', loginData);

  if (!loginData.token) {
    console.log('No token received. Trying with different credentials...');
    
    // Try with a different user
    const login2 = await fetch('http://localhost:3008/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'pint@mail.com',
        password: 'password'
      })
    });
    
    const login2Data = await login2.json();
    console.log('Second login attempt:', login2Data);
    
    if (!login2Data.token) {
      console.log('Still no token. Cannot proceed with API tests.');
      return;
    }
    
    loginData.token = login2Data.token;
  }

  const token = loginData.token;
  console.log('Token received:', token ? 'Yes' : 'No');

  // Test menu items endpoint
  console.log('\n2. Testing /api/menu/items...');
  const menuResponse = await fetch('http://localhost:3008/api/menu/items', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('Menu items status:', menuResponse.status);
  const menuData = await menuResponse.json();
  console.log('Menu items response:', JSON.stringify(menuData, null, 2));

  // Test categories endpoint
  console.log('\n3. Testing /api/menu/categories...');
  const catResponse = await fetch('http://localhost:3008/api/menu/categories', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('Categories status:', catResponse.status);
  const catData = await catResponse.json();
  console.log('Categories response:', JSON.stringify(catData, null, 2));
}

testMenuAPI().catch(console.error);