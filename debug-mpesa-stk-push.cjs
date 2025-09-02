const axios = require('axios');

async function debugMPesaSTKPush() {
  console.log('🔍 DEBUGGING M-PESA STK PUSH ISSUE');
  console.log('=====================================\n');
  
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
    
    // Step 2: Check tenant M-Pesa configuration
    console.log('\n📋 Checking M-Pesa Configuration...');
    try {
      const configResponse = await axios.get(`http://localhost:5000/api/payment-gateways/gateway-config`, { headers });
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
    }
    
    // Step 3: Get available orders
    console.log('\n📦 Checking available orders...');
    try {
      const ordersResponse = await axios.get('http://localhost:5000/api/orders', { headers });
      const ordersData = ordersResponse.data;
      const orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
      
      console.log(`✅ Found ${orders.length} orders`);
      
      const unpaidOrders = orders.filter(order => order.paymentStatus !== 'paid');
      console.log(`💰 Unpaid orders: ${unpaidOrders.length}`);
      
      if (unpaidOrders.length > 0) {
        const testOrder = unpaidOrders[0];
        console.log(`\n🎯 Test order selected:`);
        console.log(`   Order ID: ${testOrder._id}`);
        console.log(`   Order Number: ${testOrder.orderNumber}`);
        console.log(`   Amount: ${testOrder.total}`);
        console.log(`   Payment Status: ${testOrder.paymentStatus}`);
        console.log(`   Customer: ${testOrder.customerName}`);
        
        // Step 4: Test STK Push initiation
        console.log('\n🚀 Testing STK Push initiation...');
        
        const stkPayload = {
          orderId: testOrder._id,
          phoneNumber: '0712345678', // Test phone number
          amount: testOrder.total
        };
        
        console.log('STK Push payload:', JSON.stringify(stkPayload, null, 2));
        
        try {
          const stkResponse = await axios.post(
            'http://localhost:5000/api/payment-gateways/mpesa/initiate',
            stkPayload,
            { headers }
          );
          
          console.log('✅ STK Push initiated successfully!');
          console.log('Response:', JSON.stringify(stkResponse.data, null, 2));
          
        } catch (stkError) {
          console.log('❌ STK Push failed!');
          console.log('Status:', stkError.response?.status);
          console.log('Error:', JSON.stringify(stkError.response?.data, null, 2));
          
          // Analyze the specific error
          if (stkError.response?.status === 400) {
            console.log('\n🔍 400 BAD REQUEST ANALYSIS:');
            const errorData = stkError.response.data;
            
            if (errorData.errors && Array.isArray(errorData.errors)) {
              console.log('Validation errors:');
              errorData.errors.forEach(error => {
                console.log(`  - ${error.msg} (Field: ${error.param}, Value: ${error.value})`);
              });
            } else if (errorData.error) {
              console.log('Error message:', errorData.error);
              
              if (errorData.error.includes('Tenant ID is required')) {
                console.log('💡 Solution: Ensure you are authenticated and have a valid tenant');
              } else if (errorData.error.includes('not properly configured')) {
                console.log('💡 Solution: Configure M-Pesa settings in Payment Gateway Settings');
              } else if (errorData.error.includes('Order not found')) {
                console.log('💡 Solution: Use a valid order ID from your tenant');
              }
            }
          }
        }
        
      } else {
        console.log('⚠️ No unpaid orders found to test with');
      }
      
    } catch (error) {
      console.log('❌ Failed to get orders:', error.response?.status, error.message);
    }
    
    // Step 5: Check payment methods
    console.log('\n💳 Available payment methods:');
    try {
      const methodsResponse = await axios.get('http://localhost:5000/api/payment-gateways/methods', { headers });
      console.log('Available methods:', methodsResponse.data);
    } catch (error) {
      console.log('❌ Failed to get payment methods:', error.response?.status);
    }
    
    console.log('\n💡 TROUBLESHOOTING GUIDE:');
    console.log('========================');
    console.log('If you get 400 Bad Request when trying STK Push:');
    console.log('1. ✅ Check M-Pesa configuration is complete');
    console.log('2. ✅ Ensure phone number format is correct (07xxxxxxxx or 254xxxxxxx)');
    console.log('3. ✅ Verify order ID exists and belongs to your tenant');
    console.log('4. ✅ Check amount is greater than 0');
    console.log('5. ✅ Make sure M-Pesa is enabled in tenant settings');
    console.log('6. ✅ Verify you have proper authentication token');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugMPesaSTKPush();
