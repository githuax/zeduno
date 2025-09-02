const axios = require('axios');

async function testOrderProtection() {
  try {
    // Authenticate
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@demo-restaurant.com',
      password: 'DemoAdmin@123'
    });
    
    const token = authResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('🛡️ Testing Order Protection Logic...\n');
    
    // Get orders
    const ordersResponse = await axios.get('http://localhost:5000/api/orders', { headers });
    console.log(`📊 Found ${ordersResponse.data.length} total orders`);
    
    // Find incomplete orders
    const incompleteOrders = ordersResponse.data.filter(order => 
      !['completed', 'cancelled', 'refunded'].includes(order.status)
    );
    
    console.log(`📊 Found ${incompleteOrders.length} incomplete orders`);
    
    if (incompleteOrders.length > 0) {
      const orderWithTable = incompleteOrders.find(order => order.tableId);
      if (orderWithTable) {
        console.log(`\n🎯 Testing with order ${orderWithTable.orderNumber} on table ${orderWithTable.tableId}`);
        console.log(`   Order Status: ${orderWithTable.status}`);
        console.log(`   Payment Status: ${orderWithTable.paymentStatus}`);
        
        try {
          await axios.patch(
            `http://localhost:5000/api/tables/${orderWithTable.tableId}/status`,
            { status: 'available' },
            { headers }
          );
          console.log('❌ PROTECTION FAILED - table was released despite incomplete order!');
        } catch (error) {
          if (error.response?.status === 400) {
            console.log('✅ PROTECTION WORKING - table release properly blocked');
            console.log('✅ Error message:', error.response.data.message);
            console.log('✅ Order details:', error.response.data.details);
          } else {
            console.log(`⚠️ Unexpected error: ${error.response?.status} - ${error.message}`);
          }
        }
      } else {
        console.log('ℹ️ No incomplete orders have associated tables');
      }
    } else {
      console.log('ℹ️ No incomplete orders found - cannot test protection');
      
      // Create a test scenario
      console.log('\n🧪 Creating test scenario...');
      try {
        // Get an available table
        const tablesResponse = await axios.get('http://localhost:5000/api/tables', { headers });
        const availableTable = tablesResponse.data.find(t => t.status === 'available');
        
        if (availableTable) {
          // First set table to occupied  
          await axios.patch(
            `http://localhost:5000/api/tables/${availableTable._id}/status`,
            { status: 'occupied' },
            { headers }
          );
          console.log(`✅ Set table ${availableTable.tableNumber} to occupied`);
          
          // Try to release it (should work since no orders)
          await axios.patch(
            `http://localhost:5000/api/tables/${availableTable._id}/status`,
            { status: 'available' },
            { headers }
          );
          console.log('✅ Released table successfully (no orders blocking)');
        }
      } catch (error) {
        console.log('⚠️ Could not create test scenario:', error.message);
      }
    }
    
    console.log('\n✅ Order protection test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testOrderProtection();
