const mongoose = require('mongoose');
require('dotenv').config();

async function testOrderEndpoint() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Import the order controller and service
    console.log('\nTesting OrderService.getOrders directly...');
    
    // Simple test query
    const testParams = {
      tenantId: '689ef2ca096c875583b4f82f', // irungumill's tenant ID
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    try {
      // Load the compiled JS version of OrderService
      const { OrderService } = require('./dist/services/order.service.js');
      
      const result = await OrderService.getOrders(testParams);
      console.log('✅ OrderService.getOrders succeeded');
      console.log('Total orders:', result.total);
      console.log('Orders returned:', result.orders.length);
      
    } catch (serviceError) {
      console.error('❌ OrderService error:', serviceError.message);
      
      // Try direct MongoDB query
      console.log('\nTrying direct MongoDB query...');
      const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
      
      const orders = await Order.find({ tenantId: testParams.tenantId })
        .limit(testParams.limit)
        .sort({ createdAt: -1 });
        
      console.log('Direct query found:', orders.length, 'orders');
      
      if (orders.length > 0) {
        console.log('First order:', {
          orderNumber: orders[0].orderNumber,
          customerName: orders[0].customerName,
          tenantId: orders[0].tenantId
        });
      }
    }
    
  } catch (error) {
    console.error('Main error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testOrderEndpoint();