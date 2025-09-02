const axios = require('axios');

async function debugMPesaSTKPush() {
  console.log('🔍 DEBUGGING M-PESA STK PUSH ISSUE (FIXED)');
  console.log('==========================================\n');
  
  try {
    // Step 1: Authentication
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@demo-restaurant.com',
      password: 'DemoAdmin@123'
    });
    
    const token = authResponse.data.token;
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Authentication successful');
    console.log('User:', authResponse.data.user.email, '- Role:', authResponse.data.user.role);
    console.log('Tenant ID:', authResponse.data.user.tenantId);
    
    const tenantId = authResponse.data.user.tenantId;
    
    // Step 2: Check tenant M-Pesa configuration (CORRECTED URL)
    console.log('\n📋 Checking M-Pesa Configuration...');
    try {
      const configResponse = await axios.get(`http://localhost:5000/api/payments/gateway-config`, { headers });
      console.log('✅ Payment config retrieved');
      
      const mpesaConfig = configResponse.data.mpesa;
      if (mpesaConfig) {
        console.log('M-Pesa Configuration:');
        console.log(`  - Enabled: ${mpesaConfig.enabled}`);
        console.log(`  - Environment: ${mpesaConfig.environment}`);
        console.log(`  - Business Short Code: ${mpesaConfig.businessShortCode ? '✅ Set' : '❌ Missing'}`);
        console.log(`  - Consumer Key: ${mpesaConfig.consumerKey ? '✅ Set' : '❌ Missing'}`);
        console.log(`  - Consumer Secret: ${mpesaConfig.consumerSecret ? '✅ Set' : '❌ Missing'}`);
        console.log(`  - Passkey: ${mpesaConfig.passkey ? '✅ Set' : '❌ Missing'}`);
        
        if (!mpesaConfig.enabled) {
          console.log('⚠️ M-Pesa is disabled for this tenant');
        }
        
        const requiredFields = [
          mpesaConfig.businessShortCode,
          mpesaConfig.consumerKey,
          mpesaConfig.consumerSecret,
          mpesaConfig.passkey
        ];
        
        const missingFields = requiredFields.filter(field => !field);
        if (missingFields.length > 0) {
          console.log(`❌ Missing required M-Pesa configuration fields: ${missingFields.length}`);
        }
      } else {
        console.log('❌ No M-Pesa configuration found');
      }
    } catch (error) {
      console.log('❌ Failed to get payment config:', error.response?.status, error.response?.data?.message);
      console.log('Full error:', error.response?.data);
    }
    
    // Step 3: Check payment methods (CORRECTED URL)
    console.log('\n💳 Checking available payment methods...');
    try {
      const methodsResponse = await axios.get('http://localhost:5000/api/payments/methods', { headers });
      console.log('✅ Available methods:', methodsResponse.data);
    } catch (error) {
      console.log('❌ Failed to get payment methods:', error.response?.status, error.response?.data);
    }
    
    // Step 4: Get available orders
    console.log('\n📦 Checking available orders...');
    try {
      const ordersResponse = await axios.get('http://localhost:5000/api/orders', { headers });
      const ordersData = ordersResponse.data;
      const orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
      
      console.log(`✅ Found ${orders.length} orders`);
      
      if (orders.length === 0) {
        console.log('⚠️ No orders found! Creating a test order first...');
        
        // Create a test order for M-Pesa testing
        try {
          const testOrderData = {
            customerName: 'M-Pesa Test Customer',
            customerPhone: '+254712345678',
            orderType: 'dine-in',
            items: [
              {
                menuItemId: 'test-item-id',
                name: 'Test Item',
                quantity: 1,
                price: 100
              }
            ],
            total: 100,
            paymentStatus: 'pending'
          };
          
          const createOrderResponse = await axios.post('http://localhost:5000/api/orders', testOrderData, { headers });
          console.log('✅ Test order created:', createOrderResponse.data._id);
          
          // Use the newly created order for STK push test
          const testOrder = createOrderResponse.data;
          console.log('\n🚀 Testing STK Push with new order...');
          
          const stkPayload = {
            orderId: testOrder._id,
            phoneNumber: '0712345678',
            amount: testOrder.total
          };
          
          console.log('STK Push payload:', JSON.stringify(stkPayload, null, 2));
          
          try {
            const stkResponse = await axios.post(
              'http://localhost:5000/api/payments/mpesa/initiate', // CORRECTED URL
              stkPayload,
              { headers }
            );
            
            console.log('✅ STK Push initiated successfully!');
            console.log('Response:', JSON.stringify(stkResponse.data, null, 2));
            
          } catch (stkError) {
            console.log('❌ STK Push failed!');
            console.log('Status:', stkError.response?.status);
            console.log('Error:', JSON.stringify(stkError.response?.data, null, 2));
            
            // Detailed error analysis
            if (stkError.response?.status === 400) {
              console.log('\n🔍 400 BAD REQUEST ANALYSIS:');
              const errorData = stkError.response.data;
              
              if (errorData.errors && Array.isArray(errorData.errors)) {
                console.log('❌ Validation errors:');
                errorData.errors.forEach(error => {
                  console.log(`  - ${error.msg} (Field: ${error.param}, Value: ${error.value})`);
                });
              } else if (errorData.error) {
                console.log('❌ Error message:', errorData.error);
                
                if (errorData.error.includes('Tenant ID is required')) {
                  console.log('💡 Solution: Check authentication and tenant context');
                } else if (errorData.error.includes('not properly configured')) {
                  console.log('💡 Solution: Complete M-Pesa configuration in settings');
                } else if (errorData.error.includes('Order not found')) {
                  console.log('💡 Solution: Verify order exists and belongs to your tenant');
                }
              }
            }
          }
          
        } catch (createOrderError) {
          console.log('❌ Failed to create test order:', createOrderError.response?.status);
          console.log('Error:', createOrderError.response?.data);
        }
        
      } else {
        const unpaidOrders = orders.filter(order => order.paymentStatus !== 'paid');
        console.log(`💰 Unpaid orders: ${unpaidOrders.length}`);
        
        if (unpaidOrders.length > 0) {
          const testOrder = unpaidOrders[0];
          console.log(`\n🎯 Test order selected:`);
          console.log(`   Order ID: ${testOrder._id}`);
          console.log(`   Order Number: ${testOrder.orderNumber}`);
          console.log(`   Amount: ${testOrder.total}`);
          
          // Test STK Push
          console.log('\n🚀 Testing STK Push...');
          
          const stkPayload = {
            orderId: testOrder._id,
            phoneNumber: '0712345678',
            amount: testOrder.total
          };
          
          try {
            const stkResponse = await axios.post(
              'http://localhost:5000/api/payments/mpesa/initiate', // CORRECTED URL
              stkPayload,
              { headers }
            );
            
            console.log('✅ STK Push initiated successfully!');
            console.log('Response:', JSON.stringify(stkResponse.data, null, 2));
            
          } catch (stkError) {
            console.log('❌ STK Push failed!');
            console.log('Status:', stkError.response?.status);
            console.log('Error:', JSON.stringify(stkError.response?.data, null, 2));
          }
        }
      }
      
    } catch (error) {
      console.log('❌ Failed to get orders:', error.response?.status, error.message);
    }
    
    console.log('\n💡 COMMON SOLUTIONS FOR 400 BAD REQUEST:');
    console.log('========================================');
    console.log('1. 🔧 Configure M-Pesa settings:');
    console.log('   - Go to Payment Gateway Settings');
    console.log('   - Enable M-Pesa');
    console.log('   - Add Consumer Key, Consumer Secret, Business Short Code, Passkey');
    console.log('2. 📱 Check phone number format: 07xxxxxxxx or 254xxxxxxx');
    console.log('3. 💰 Ensure amount is greater than 0');
    console.log('4. 🎯 Use correct API endpoints: /api/payments/ (not /api/payment-gateways/)');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugMPesaSTKPush();
