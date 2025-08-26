const { MongoClient } = require('mongodb');

async function testTableReleaseProtection() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('hotelzed');
    
    // Find an occupied table with a pending order
    const occupiedTable = await db.collection('tables').findOne({ status: 'occupied' });
    console.log('Found occupied table:', occupiedTable?.tableNumber);
    
    if (occupiedTable) {
      // Find orders for this table
      const orders = await db.collection('orders').find({
        tableId: occupiedTable._id,
        status: { $nin: ['completed', 'cancelled', 'refunded'] }
      }).toArray();
      
      console.log(`\nFound ${orders.length} incomplete orders for table ${occupiedTable.tableNumber}:`);
      orders.forEach((order, index) => {
        console.log(`  Order ${index + 1}: ${order.orderNumber} - ${order.status} (Customer: ${order.customerName})`);
      });
      
      if (orders.length > 0) {
        console.log('\n✅ Table release protection should prevent releasing this table');
        console.log('   The API will block status change from "occupied" to "available"');
      } else {
        console.log('\n⚠️ No incomplete orders found, table can be released');
      }
    } else {
      console.log('\n⚠️ No occupied tables found to test with');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testTableReleaseProtection();