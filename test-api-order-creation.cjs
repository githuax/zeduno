const https = require('https');
const http = require('http');

// Test order creation via API endpoint to verify short order numbers
async function testOrderCreationAPI() {
  try {
    console.log('🚀 Testing order creation via API...');
    
    // First, let's check what port the backend is running on
    console.log('📋 Backend should be running on port 5000');
    
    const testOrder = {
      orderType: 'dine-in',
      customerName: 'Test Customer',
      customerPhone: '+254712345678',
      items: [{
        menuItem: '507f1f77bcf86cd799439011', // Sample ObjectId
        quantity: 1,
        price: 500,
        specialInstructions: 'Test order for invoice number length'
      }],
      subtotal: 500,
      tax: 0,
      serviceCharge: 0,
      total: 500,
      source: 'website',
      notes: 'Test order to verify short invoice numbers'
    };
    
    const postData = JSON.stringify(testOrder);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        // Add any required auth headers here if needed
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📊 API Response Status:', res.statusCode);
          
          if (res.statusCode === 201 || res.statusCode === 200) {
            if (response.order && response.order.orderNumber) {
              console.log(`🎯 Generated Order Number: ${response.order.orderNumber}`);
              console.log(`📏 Order Number Length: ${response.order.orderNumber.length} characters`);
              
              if (response.order.orderNumber.startsWith('ORD-') && response.order.orderNumber.length <= 8) {
                console.log('✅ SUCCESS: Order number format is now shorter!');
                console.log(`   Old format example: ORD-20250901-4979 (16 chars)`);
                console.log(`   New format: ${response.order.orderNumber} (${response.order.orderNumber.length} chars)`);
              } else {
                console.log('❌ ISSUE: Order number is still too long or has wrong format');
                console.log(`   Expected: ORD-XXXX (8 chars), Got: ${response.order.orderNumber} (${response.order.orderNumber.length} chars)`);
              }
            } else {
              console.log('❌ No order number found in response');
              console.log('Response:', JSON.stringify(response, null, 2));
            }
          } else {
            console.log('❌ API call failed');
            console.log('Response:', data);
          }
        } catch (parseError) {
          console.log('❌ Failed to parse response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      console.log('💡 Make sure the backend server is running on port 5000');
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Run the test
testOrderCreationAPI();
