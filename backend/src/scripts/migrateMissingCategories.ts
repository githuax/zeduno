import mongoose from 'mongoose';

const HOTELZED_URI = 'mongodb://localhost:27017/hotelzed';
const ZEDUNO_URI = 'mongodb://localhost:27017/zeduno';

const migrateMissingCategories = async (): Promise<void> => {
  try {
    console.log('🚀 Starting categories migration from hotelzed to zeduno database...\n');

    // Connect to both databases
    const sourceConnection = mongoose.createConnection(HOTELZED_URI);
    const targetConnection = mongoose.createConnection(ZEDUNO_URI);

    // Wait for connections to be ready
    await sourceConnection.asPromise();
    await targetConnection.asPromise();

    console.log('✅ Connected to both databases');

    // Migrate categories
    const sourceCollection = sourceConnection.db.collection('categories');
    const targetCollection = targetConnection.db.collection('categories');
    
    const categories = await sourceCollection.find({}).toArray();
    
    if (categories.length > 0) {
      // Clear existing data in target collection
      await targetCollection.deleteMany({});
      // Insert all documents
      await targetCollection.insertMany(categories);
    }
    
    console.log(`✅ Migrated ${categories.length} categories`);
    
    // Also check for other missing collections
    const missingCollections = ['rooms', 'bookings', 'auditlogs'];
    
    for (const collectionName of missingCollections) {
      const sourceCol = sourceConnection.db.collection(collectionName);
      const targetCol = targetConnection.db.collection(collectionName);
      
      const documents = await sourceCol.find({}).toArray();
      
      if (documents.length > 0) {
        await targetCol.deleteMany({});
        await targetCol.insertMany(documents);
        console.log(`✅ Migrated ${documents.length} ${collectionName}`);
      } else {
        console.log(`ℹ️  No ${collectionName} to migrate`);
      }
    }

    // Close connections
    await sourceConnection.close();
    await targetConnection.close();

    console.log('\n🎉 Missing collections migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
if (require.main === module) {
  migrateMissingCategories()
    .then(() => {
      console.log('\n✅ Missing collections migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateMissingCategories;