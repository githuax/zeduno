const { exec } = require('child_process');

// Create a test using ts-node to test the updated TypeScript models directly
const testScript = `
import mongoose from 'mongoose';
import { Order } from './backend/src/models/Order.js';

const MONGO_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno';

async function testShortOrderNumbers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');
    
    const testOrderData = {
      tenantId: new mongoose.Types.ObjectId('68b02973ae068641d5bf4a1c'),
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
    
    console.log('📝 Creating test order...');
    const testOrder = new Order(testOrderData);
    const savedOrder = await testOrder.save();
    
    console.log('✅ Order saved successfully!');
    console.log('🎯 Generated Order Number:', savedOrder.orderNumber);
    console.log('📏 Order Number Length:', savedOrder.orderNumber.length, 'characters');
    
    if (savedOrder.orderNumber.startsWith('ORD-') && savedOrder.orderNumber.length === 8) {
      console.log('✅ SUCCESS: Order number format is shorter!');
      console.log('   Old format: BT-ORD-20250901-4979 (17 chars)');
      console.log('   New format:', savedOrder.orderNumber, '(' + savedOrder.orderNumber.length + ' chars)');
    } else {
      console.log('❌ Order number format needs adjustment');
    }
    
    await Order.findByIdAndDelete(savedOrder._id);
    console.log('🗑️ Test order cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testShortOrderNumbers();
`;

// Write the test script to a temporary file and run it with ts-node
const fs = require('fs');
fs.writeFileSync('/tmp/test-orders.mjs', testScript);

console.log('🚀 Running order number test...');

exec('cd /home/osbui/applications/zeduno/dine-serve-hub && npx ts-node --esm /tmp/test-orders.mjs', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Execution error:', error.message);
  }
  if (stderr) {
    console.error('❌ stderr:', stderr);
  }
  if (stdout) {
    console.log(stdout);
  }
});
