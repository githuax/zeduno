const jwt = require('jsonwebtoken');
const axios = require('axios');

// JWT Secret from .env
const JWT_SECRET = 'your-super-secure-jwt-secret-key-for-development-only';

// Generate token for mock user
const token = jwt.sign({ id: 'mock-user-id' }, JWT_SECRET, { expiresIn: '7d' });
console.log('Generated JWT Token:', token);

// Test order creation
const testOrder = async () => {
  try {
    const orderData = {
      orderType: 'dine-in',
      customerName: 'Test Customer',
      customerPhone: '+1234567890',
      items: [
        {
          menuItem: '68a19f90ee7482cfe196500b', // Valid menu item ID (MAIN MEAL)
          quantity: 2
        }
      ],
      notes: 'Test order creation'
    };

    console.log('\nTesting order creation...');
    console.log('Request data:', JSON.stringify(orderData, null, 2));

    const response = await axios.post('http://localhost:3008/api/orders', orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\nSuccess! Order created:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\nError creating order:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

// Run test
testOrder();