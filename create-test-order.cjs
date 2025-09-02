const axios = require('axios');

async function createTestOrder() {
  console.log('🛒 Creating Test Order for M-Pesa Payment');
  console.log('=========================================');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'dama@mail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Login successful');
    console.log('   User:', user.firstName, user.lastName);
    console.log('   Tenant ID:', user.tenantId);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Create a test order
    console.log('\n2️⃣ Creating test order...');
    
    const orderData = {
      orderType: 'dine-in',
      customerName: 'Test Customer',
      customerPhone: '254712345678',
      items: [
        {
          menuItemId: '507f1f77bcf86cd799439012', // Mock menu item ID
          name: 'Ugali & Beef Stew',
          price: 500,
          quantity: 2,
          customizations: [],
          specialInstructions: ''
        },
        {
          menuItemId: '507f1f77bcf86cd799439013', // Mock menu item ID  
          name: 'Chapati',
          price: 50,
          quantity: 4,
          customizations: [],
          specialInstructions: ''
        }
      ],
      tableId: null, // For takeaway/delivery
      deliveryAddress: null,
      notes: 'Test order for M-Pesa payment',
      paymentMethod: 'mpesa',
      paymentStatus: 'pending'
    };

    console.log('Order data:', JSON.stringify(orderData, null, 2));

    try {
      const orderResponse = await axios.post('http://localhost:5000/api/orders', orderData, { headers });
      console.log('✅ Order created successfully!');
      console.log('   Order ID:', orderResponse.data._id);
      console.log('   Order Number:', orderResponse.data.orderNumber);
      console.log('   Total Amount:', orderResponse.data.totalAmount);
      console.log('   Status:', orderResponse.data.status);

      // Step 3: Now test M-Pesa payment with the created order
      console.log('\n3️⃣ Testing M-Pesa payment with created order...');
      
      const paymentData = {
        orderId: orderResponse.data._id,
        phoneNumber: '254712345678',
        amount: orderResponse.data.totalAmount
      };

      try {
        const paymentResponse = await axios.post('http://localhost:5000/api/payments/mpesa/initiate', paymentData, { headers });
        console.log('✅ M-Pesa payment initiated successfully!');
        console.log('   Transaction ID:', paymentResponse.data.transactionId);
        console.log('   Checkout Request ID:', paymentResponse.data.checkoutRequestId);
        console.log('   Message:', paymentResponse.data.message);
      } catch (paymentError) {
        console.log('❌ M-Pesa payment failed:', paymentError.response?.data || paymentError.message);
      }

      return orderResponse.data;
      
    } catch (orderError) {
      console.log('❌ Order creation failed:', orderError.response?.data || orderError.message);
      
      if (orderError.response?.status === 400) {
        console.log('\n💡 This might be due to missing menu items or validation issues.');
        console.log('   Let\'s try a simpler order structure...');
        
        // Try with minimal order data
        const simpleOrderData = {
          orderType: 'takeaway',
          customerName: 'Test Customer',
          customerPhone: '254712345678',
          items: [
            {
              name: 'Test Item',
              price: 1000,
              quantity: 1
            }
          ],
          totalAmount: 1000,
          paymentStatus: 'pending'
        };

        try {
          const simpleOrderResponse = await axios.post('http://localhost:5000/api/orders', simpleOrderData, { headers });
          console.log('✅ Simple order created!');
          console.log('   Order ID:', simpleOrderResponse.data._id);
          console.log('   Total Amount:', simpleOrderResponse.data.totalAmount);
          
          return simpleOrderResponse.data;
        } catch (simpleError) {
          console.log('❌ Simple order also failed:', simpleError.response?.data || simpleError.message);
        }
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
  }
}

createTestOrder();
