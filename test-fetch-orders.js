import fetch from 'node-fetch';

async function testFetchOrders() {
  try {
    // First, let's get a token by logging in
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'irungumill@mail.com',
        password: 'Pass@12345'  // Password we just set
      })
    });

    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Login successful, token obtained');

    // Now fetch orders
    const ordersResponse = await fetch('http://localhost:5000/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!ordersResponse.ok) {
      console.error('Failed to fetch orders:', ordersResponse.status, await ordersResponse.text());
      return;
    }

    const ordersData = await ordersResponse.json();
    console.log('\nFetch Orders Response:');
    console.log('Success:', ordersData.success);
    console.log('Total orders:', ordersData.orders ? ordersData.orders.length : 0);
    
    if (ordersData.orders && ordersData.orders.length > 0) {
      console.log('\nFirst order details:');
      console.log(JSON.stringify(ordersData.orders[0], null, 2));
    }

    // Also check pagination info
    if (ordersData.pagination) {
      console.log('\nPagination info:');
      console.log(JSON.stringify(ordersData.pagination, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testFetchOrders();