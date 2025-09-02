const { MongoClient } = require('mongodb');

// MongoDB connection URL - adjust according to your setup
const MONGO_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno';

async function testShortOrderNumbers() {
  const client = new MongoClient(MONGO_URL);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db();
    
    // Get a sample tenant
    const tenant = await db.collection('tenants').findOne({});
    if (!tenant) {
      console.error('❌ No tenant found. Please create a tenant first.');
      return;
    }
    
    console.log(`✅ Found tenant: ${tenant.name} (${tenant._id})`);
    
    // Create test order with new short order number format
    const testOrder = {
      tenantId: tenant._id,
      orderType: 'dine-in',
      status: 'pending',
      customerName: 'Test Customer',
      customerPhone: '+254712345678',
      items: [{
        menuItem: '507f1f77bcf86cd799439011', // Sample ObjectId
        quantity: 1,
        price: 500,
        status: 'pending'
      }],
      subtotal: 500,
      tax: 0,
      total: 500,
      paymentStatus: 'pending',
      staffId: '507f1f77bcf86cd799439012', // Sample ObjectId
      source: 'website'
    };
    
    console.log('📝 Creating test order...');
    const result = await db.collection('orders').insertOne(testOrder);
    
    console.log(`✅ Created test order with ID: ${result.insertedId}`);
    
    // Fetch the order to see the generated orderNumber
    const createdOrder = await db.collection('orders').findOne({ _id: result.insertedId });
    
    if (createdOrder && createdOrder.orderNumber) {
      console.log(`🎯 Generated Order Number: ${createdOrder.orderNumber}`);
      console.log(`📏 Order Number Length: ${createdOrder.orderNumber.length} characters`);
      
      if (createdOrder.orderNumber.startsWith('ORD-') && createdOrder.orderNumber.length <= 8) {
        console.log('✅ SUCCESS: Order number format is now shorter!');
        console.log(`   Old format: ORD-20250901-4979 (16 chars)`);
        console.log(`   New format: ${createdOrder.orderNumber} (${createdOrder.orderNumber.length} chars)`);
      } else {
        console.log('❌ ISSUE: Order number is still too long or has wrong format');
      }
    } else {
      console.log('❌ Order number was not generated properly');
    }
    
    // Clean up test order
    await db.collection('orders').deleteOne({ _id: result.insertedId });
    console.log('🗑️ Cleaned up test order');
    
  } catch (error) {
    console.error('❌ Error testing order numbers:', error.message);
  } finally {
    await client.close();
  }
}

// Run the test
testShortOrderNumbers();
