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

const checkTransactions = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    
    // Check for common transaction collection names
    const collections = await db.listCollections().toArray();
    const transactionCollections = collections.filter(col => 
      col.name.toLowerCase().includes('transaction') || 
      col.name.toLowerCase().includes('payment') ||
      col.name.toLowerCase().includes('order')
    );
    
    console.log('💳 TRANSACTION-RELATED COLLECTIONS:');
    console.log('===================================\n');
    
    if (transactionCollections.length === 0) {
      console.log('❌ No transaction-related collections found');
      
      // Show all collections for reference
      console.log('\n📊 ALL COLLECTIONS IN DATABASE:');
      collections.forEach((col, index) => {
        console.log(`${index + 1}. ${col.name}`);
      });
    } else {
      for (const col of transactionCollections) {
        const collection = db.collection(col.name);
        const count = await collection.countDocuments();
        
        console.log(`📁 Collection: ${col.name}`);
        console.log(`📊 Total records: ${count}`);
        
        if (count > 0) {
          // Show sample records
          const samples = await collection.find({}).limit(3).toArray();
          console.log('🔍 Sample records:');
          samples.forEach((record, index) => {
            console.log(`  ${index + 1}. ID: ${record._id}`);
            if (record.amount) console.log(`     Amount: ${record.amount}`);
            if (record.status) console.log(`     Status: ${record.status}`);
            if (record.type) console.log(`     Type: ${record.type}`);
            if (record.createdAt) console.log(`     Created: ${record.createdAt}`);
            console.log('     ---');
          });
        }
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
};

checkTransactions();
