const { MongoClient } = require('mongodb');

async function checkOrders() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('hotelzed');
    const orders = await db.collection('orders').find({}).sort({createdAt: -1}).limit(5).toArray();
    
    console.log(`\nFound ${orders.length} recent orders:`);
    orders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log(`  Customer: ${order.customerName}`);
      console.log(`  Phone: ${order.customerPhone || 'N/A'}`);
      console.log(`  Type: ${order.orderType}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Items: ${order.items?.length || 0}`);
      console.log(`  Total: KES ${order.totalAmount?.toFixed(2) || 'N/A'}`);
      console.log(`  Created: ${order.createdAt}`);
      console.log(`  Notes: ${order.notes || 'None'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkOrders();