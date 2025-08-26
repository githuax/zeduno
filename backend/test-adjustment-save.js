const fetch = require('node-fetch');

async function testAdjustmentSave() {
  try {
    console.log('Testing adjustment save...');
    
    // First get a valid token
    console.log('Getting authentication token...');
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

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('Login failed:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Get the order ID first
    console.log('Getting order...');
    const ordersResponse = await fetch('http://localhost:5000/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!ordersResponse.ok) {
      console.error('Failed to get orders');
      return;
    }

    const ordersData = await ordersResponse.json();
    const order = ordersData.orders ? ordersData.orders[0] : ordersData[0];
    
    if (!order) {
      console.error('No orders found');
      return;
    }

    console.log(`Found order: ${order.orderNumber} (ID: ${order._id})`);
    console.log(`Current items: ${order.items.length}`);

    // Create test adjustment data
    const updateData = {
      items: order.items.map(item => ({
        menuItem: item.menuItem._id || item.menuItem,
        quantity: item.quantity,
        customizations: item.customizations || [],
        specialInstructions: item.specialInstructions || '',
        price: item.price
      })),
      adjustments: [
        {
          type: 'modify',
          reason: 'Customer Request',
          timestamp: new Date().toISOString(),
          details: 'Test adjustment from script'
        }
      ],
      adjustmentNotes: 'This is a test adjustment to verify the backend saves adjustments correctly'
    };

    console.log('\nSending update with adjustments...');
    console.log('Adjustments to send:', updateData.adjustments);

    // Send the update
    const updateResponse = await fetch(`http://localhost:5000/api/orders/${order._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    const responseText = await updateResponse.text();
    
    if (updateResponse.ok) {
      console.log('✅ Update request successful');
      console.log('Response status:', updateResponse.status);
      
      // Wait a moment for the update to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Now check if adjustments were saved
      console.log('\nChecking if adjustments were saved...');
      
    } else {
      console.error('❌ Update failed');
      console.error('Status:', updateResponse.status);
      console.error('Response:', responseText);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Add a small delay to avoid rate limiting
setTimeout(testAdjustmentSave, 2000);