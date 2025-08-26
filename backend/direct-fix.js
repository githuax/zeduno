const mongoose = require('mongoose');
require('dotenv').config();

async function directFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Use MongoDB's direct update operation
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    
    // Find the order first
    const order = await ordersCollection.findOne({ orderNumber: 'ORD-20250821-1719' });
    
    if (order) {
      console.log('\n=== BEFORE UPDATE ===');
      console.log(`Order: ${order.orderNumber}`);
      console.log(`Order Type: ${order.orderType}`);
      console.log(`Subtotal: ${order.subtotal}`);
      console.log(`Service Charge: ${order.serviceCharge}`);
      console.log(`Total: ${order.total}`);
      
      // Calculate correct values
      const correctServiceCharge = order.orderType === 'dine-in' ? order.subtotal * 0.1 : 0;
      const correctTotal = order.subtotal + order.tax + correctServiceCharge;
      
      // Direct MongoDB update
      const updateResult = await ordersCollection.updateOne(
        { orderNumber: 'ORD-20250821-1719' },
        { 
          $set: { 
            serviceCharge: correctServiceCharge,
            total: correctTotal,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('\nUpdate Result:', updateResult);
      
      // Verify the update
      const updatedOrder = await ordersCollection.findOne({ orderNumber: 'ORD-20250821-1719' });
      
      console.log('\n=== AFTER UPDATE ===');
      console.log(`Service Charge: ${updatedOrder.serviceCharge}`);
      console.log(`Total: ${updatedOrder.total}`);
      console.log(`Updated At: ${updatedOrder.updatedAt}`);
      
      if (updatedOrder.serviceCharge === correctServiceCharge && updatedOrder.total === correctTotal) {
        console.log('\n✅ DIRECT FIX SUCCESSFUL!');
      } else {
        console.log('\n❌ Direct fix failed');
      }
      
    } else {
      console.log('Order not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

directFix();