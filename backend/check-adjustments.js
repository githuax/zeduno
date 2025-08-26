const mongoose = require('mongoose');
require('dotenv').config();

async function checkAdjustments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Direct database check
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    
    // Get the specific order
    const order = await ordersCollection.findOne({ orderNumber: 'ORD-20250821-1719' });
    
    if (order) {
      console.log('\n=== ORDER ADJUSTMENTS CHECK ===');
      console.log(`Order: ${order.orderNumber}`);
      console.log(`Last Updated: ${order.updatedAt}`);
      console.log('');
      
      console.log('ADJUSTMENTS FIELD:');
      console.log('Type:', typeof order.adjustments);
      console.log('Value:', order.adjustments);
      console.log('Is Array:', Array.isArray(order.adjustments));
      console.log('Length:', order.adjustments ? order.adjustments.length : 'undefined');
      console.log('');
      
      if (order.adjustments && Array.isArray(order.adjustments) && order.adjustments.length > 0) {
        console.log('ADJUSTMENTS DETAILS:');
        order.adjustments.forEach((adj, index) => {
          console.log(`  ${index + 1}. Type: ${adj.type}`);
          console.log(`     Reason: ${adj.reason}`);
          console.log(`     Timestamp: ${adj.timestamp}`);
          if (adj.details) console.log(`     Details: ${adj.details}`);
          console.log('');
        });
      } else {
        console.log('❌ NO ADJUSTMENTS FOUND');
        console.log('This could mean:');
        console.log('1. Adjustments are not being sent from frontend');
        console.log('2. Backend is not saving the adjustments field');
        console.log('3. The order has not been edited yet');
      }
      
      console.log('ADJUSTMENT NOTES:');
      console.log('Value:', order.adjustmentNotes);
      console.log('Type:', typeof order.adjustmentNotes);
      
      console.log('\n=== ALL FIELDS IN ORDER ===');
      const fieldsWithAdjust = Object.keys(order).filter(key => 
        key.toLowerCase().includes('adjust') || 
        key === 'statusHistory' || 
        key === 'notes'
      );
      
      fieldsWithAdjust.forEach(field => {
        console.log(`${field}:`, order[field]);
      });
      
    } else {
      console.log('Order not found');
    }
    
    // Also check if there are any orders WITH adjustments
    console.log('\n=== ORDERS WITH ADJUSTMENTS ===');
    const ordersWithAdjustments = await ordersCollection.find({
      adjustments: { $exists: true, $ne: null, $not: { $size: 0 } }
    }).toArray();
    
    console.log(`Found ${ordersWithAdjustments.length} orders with adjustments`);
    
    if (ordersWithAdjustments.length > 0) {
      ordersWithAdjustments.forEach(order => {
        console.log(`- ${order.orderNumber}: ${order.adjustments.length} adjustments`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAdjustments();