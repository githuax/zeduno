import mongoose from 'mongoose';

const HOTELZED_URI = 'mongodb://localhost:27017/hotelzed';
const ZEDUNO_URI = 'mongodb://localhost:27017/zeduno';

interface MigrationStats {
  users: number;
  tenants: number;
  menuItems: number;
  orders: number;
  tables: number;
  superAdmins: number;
}

const migrateCollection = async (
  sourceDb: mongoose.Connection,
  targetDb: mongoose.Connection,
  collectionName: string
): Promise<number> => {
  const sourceCollection = sourceDb.db.collection(collectionName);
  const targetCollection = targetDb.db.collection(collectionName);
  
  const documents = await sourceCollection.find({}).toArray();
  
  if (documents.length > 0) {
    // Clear existing data in target collection
    await targetCollection.deleteMany({});
    // Insert all documents
    await targetCollection.insertMany(documents);
  }
  
  console.log(`✅ Migrated ${documents.length} documents to ${collectionName}`);
  return documents.length;
};

const migrateToZeduno = async (): Promise<void> => {
  try {
    console.log('🚀 Starting migration from hotelzed to zeduno database...\n');

    // Connect to both databases
    const sourceConnection = mongoose.createConnection(HOTELZED_URI);
    const targetConnection = mongoose.createConnection(ZEDUNO_URI);

    // Wait for connections to be ready
    await sourceConnection.asPromise();
    await targetConnection.asPromise();

    console.log('✅ Connected to both databases');

    const stats: MigrationStats = {
      users: 0,
      tenants: 0,
      menuItems: 0,
      orders: 0,
      tables: 0,
      superAdmins: 0
    };

    // Migrate each collection
    stats.users = await migrateCollection(sourceConnection, targetConnection, 'users');
    stats.tenants = await migrateCollection(sourceConnection, targetConnection, 'tenants');
    stats.menuItems = await migrateCollection(sourceConnection, targetConnection, 'menuitems');
    stats.orders = await migrateCollection(sourceConnection, targetConnection, 'orders');
    stats.tables = await migrateCollection(sourceConnection, targetConnection, 'tables');
    stats.superAdmins = await migrateCollection(sourceConnection, targetConnection, 'superadmins');

    // Close connections
    await sourceConnection.close();
    await targetConnection.close();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Migration Statistics:');
    console.log(`   • Users: ${stats.users}`);
    console.log(`   • Tenants: ${stats.tenants}`);
    console.log(`   • Menu Items: ${stats.menuItems}`);
    console.log(`   • Orders: ${stats.orders}`);
    console.log(`   • Tables: ${stats.tables}`);
    console.log(`   • Super Admins: ${stats.superAdmins}`);
    console.log(`   • Total Documents: ${Object.values(stats).reduce((a, b) => a + b, 0)}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
if (require.main === module) {
  migrateToZeduno()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateToZeduno;