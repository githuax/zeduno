import fetch from 'node-fetch';

async function testIrunguOrders() {
  try {
    // First login with irungumill credentials
    console.log('Attempting to login with irungumill@mail.com...');
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

    const loginText = await loginResponse.text();
    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginText);
      return;
    }

    const loginData = JSON.parse(loginText);
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log('User:', loginData.user?.firstName, loginData.user?.lastName);
    console.log('Tenant ID:', loginData.user?.tenantId);

    // Now fetch orders
    console.log('\nFetching orders...');
    const ordersResponse = await fetch('http://localhost:5000/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const ordersText = await ordersResponse.text();
    console.log('Orders API status:', ordersResponse.status);

    if (!ordersResponse.ok) {
      console.error('Failed to fetch orders:', ordersText);
      return;
    }

    const ordersData = JSON.parse(ordersText);
    console.log('✅ Orders fetched successfully');
    console.log('Total orders:', ordersData.orders ? ordersData.orders.length : 0);
    
    if (ordersData.orders && ordersData.orders.length > 0) {
      console.log('\nOrder details:');
      ordersData.orders.forEach((order, index) => {
        console.log(`\nOrder ${index + 1}:`);
        console.log('  Number:', order.orderNumber);
        console.log('  Customer:', order.customerName);
        console.log('  Status:', order.status);
        console.log('  Total:', order.total);
        console.log('  Created:', new Date(order.createdAt).toLocaleString());
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testIrunguOrders();