const mongoose = require('mongoose');
require('dotenv').config();

async function verifyOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check which database we're connected to
    const dbName = mongoose.connection.db.databaseName;
    console.log(`Connected to database: ${dbName}`);

    // Define minimal Order schema
    const orderSchema = new mongoose.Schema({}, { strict: false });
    const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
    
    // Get all orders
    const orders = await Order.find().lean();
    console.log(`\nTotal orders in database: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log('\nOrder details:');
      orders.forEach((order, index) => {
        console.log(`\n--- Order ${index + 1} ---`);
        console.log(`ID: ${order._id}`);
        console.log(`Order Number: ${order.orderNumber}`);
        console.log(`Customer Name: ${order.customerName}`);
        console.log(`Status: ${order.status}`);
        console.log(`Staff ID: ${order.staffId}`);
        console.log(`Created At: ${order.createdAt}`);
        console.log(`Items: ${order.items ? order.items.length : 0} items`);
        
        if (order.items && order.items.length > 0) {
          console.log('Item details:');
          order.items.forEach(item => {
            console.log(`  - Quantity: ${item.quantity}, Price: ${item.price}`);
          });
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyOrders();