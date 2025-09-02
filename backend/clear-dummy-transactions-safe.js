const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('✅ Connected to zeduno database');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const clearDummyTransactionsSafe = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    
    console.log('🧹 CLEARING DUMMY TRANSACTIONS (SAFE MODE)');
    console.log('===========================================\n');
    
    // Only clear transaction-specific collections, NOT orders
    const collectionsToClean = [
      'paymenttransactions',
      'transactions', // if it exists
      'payments'      // if it exists
    ];
    
    let totalDeleted = 0;
    
    // First, let's check what's in the orders collection to confirm we're preserving real orders
    const ordersCollection = db.collection('orders');
    const orderCount = await ordersCollection.countDocuments();
    
    if (orderCount > 0) {
      console.log('📋 PRESERVING ORDERS:');
      const orders = await ordersCollection.find({}).toArray();
      orders.forEach((order, index) => {
        console.log(`   ${index + 1}. Order ID: ${order._id}`);
        console.log(`      Status: ${order.status}`);
        console.log(`      Created: ${order.createdAt}`);
        if (order.total) console.log(`      Total: ${order.total}`);
      });
      console.log('   ✅ Orders will be preserved\n');
    }
    
    // Clean transaction collections only
    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        
        // Check if collection exists and has data
        const count = await collection.countDocuments();
        
        if (count > 0) {
          console.log(`📁 Processing ${collectionName}:`);
          console.log(`   Found ${count} records`);
          
          // Show what we're about to delete
          const samples = await collection.find({}).limit(3).toArray();
          console.log('   Sample records to delete:');
          samples.forEach((record, index) => {
            console.log(`     ${index + 1}. ID: ${record._id}`);
            if (record.amount) console.log(`        Amount: ${record.amount}`);
            if (record.status) console.log(`        Status: ${record.status}`);
            if (record.type) console.log(`        Type: ${record.type}`);
            if (record.transactionType) console.log(`        Transaction Type: ${record.transactionType}`);
          });
          
          // Delete all records from transaction collections
          const deleteResult = await collection.deleteMany({});
          console.log(`   ✅ Deleted ${deleteResult.deletedCount} records\n`);
          totalDeleted += deleteResult.deletedCount;
          
        } else if (count === 0) {
          console.log(`📁 ${collectionName}: Already empty ✅\n`);
        }
        
      } catch (error) {
        if (error.message.includes('ns not found')) {
          console.log(`📁 ${collectionName}: Collection doesn't exist ✅\n`);
        } else {
          console.log(`❌ Error processing ${collectionName}:`, error.message);
        }
      }
    }
    
    console.log('🎉 SAFE CLEANUP COMPLETE!');
    console.log('==========================');
    console.log(`✨ Total transaction records deleted: ${totalDeleted}`);
    console.log(`📋 Orders preserved: ${orderCount}`);
    console.log('🧹 Dummy transactions cleared, real orders kept');
    console.log('📊 Admin page transactions should now be clean');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
};

clearDummyTransactionsSafe();
