const mongoose = require('mongoose');
const path = require('path');

// Import the Order model
const { Order } = require('./dist/models/Order.js');

// Connect to MongoDB
const MONGO_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno';

async function testShortOrderNumbers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');
    
    // Create a test order using the Order model (this will trigger pre-save hook)
    const testOrderData = {
      tenantId: new mongoose.Types.ObjectId('68b02973ae068641d5bf4a1c'), // Use the test tenant
      orderType: 'dine-in',
      status: 'pending',
      customerName: 'Test Customer',
      customerPhone: '+254712345678',
      items: [{
        menuItem: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        quantity: 1,
        price: 500,
        status: 'pending'
      }],
      subtotal: 500,
      tax: 0,
      total: 500,
      paymentStatus: 'pending',
      staffId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      source: 'website'
    };
    
    console.log('📝 Creating test order using Mongoose model...');
    const testOrder = new Order(testOrderData);
    await testOrder.save();
    
    console.log(`✅ Created order with ID: ${testOrder._id}`);
    console.log(`🎯 Generated Order Number: ${testOrder.orderNumber}`);
    console.log(`📏 Order Number Length: ${testOrder.orderNumber.length} characters`);
    
    if (testOrder.orderNumber.startsWith('ORD-') && testOrder.orderNumber.length === 8) {
      console.log('✅ SUCCESS: Order number format is now shorter!');
      console.log(`   Old format example: BT-ORD-20250901-4979 (17 chars)`);
      console.log(`   New format: ${testOrder.orderNumber} (${testOrder.orderNumber.length} chars)`);
      console.log('💡 Invoice numbers are now much more user-friendly!');
    } else {
      console.log('❌ ISSUE: Order number format needs adjustment');
      console.log(`   Expected: ORD-XXXX (8 chars), Got: ${testOrder.orderNumber} (${testOrder.orderNumber.length} chars)`);
    }
    
    // Clean up
    await Order.findByIdAndDelete(testOrder._id);
    console.log('🗑️ Cleaned up test order');
    
  } catch (error) {
    console.error('❌ Error testing order numbers:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testShortOrderNumbers();
