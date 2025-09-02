import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function optimizeDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-serve-hub';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Create indexes for User collection
    console.log('Creating indexes for User collection...');
    const userCollection = db.collection('users');
    
    // Index for email (unique, used in login)
    await userCollection.createIndex({ email: 1 }, { unique: true, background: true });
    console.log('✓ Created email index');
    
    // Compound index for tenantId and isActive (used in queries)
    await userCollection.createIndex({ tenantId: 1, isActive: 1 }, { background: true });
    console.log('✓ Created tenantId-isActive compound index');
    
    // Index for role
    await userCollection.createIndex({ role: 1 }, { background: true });
    console.log('✓ Created role index');

    // Create indexes for Tenant collection
    console.log('\nCreating indexes for Tenant collection...');
    const tenantCollection = db.collection('tenants');
    
    // Index for name
    await tenantCollection.createIndex({ name: 1 }, { background: true });
    console.log('✓ Created tenant name index');
    
    // Index for isActive
    await tenantCollection.createIndex({ isActive: 1 }, { background: true });
    console.log('✓ Created tenant isActive index');

    // Create indexes for Order collection
    console.log('\nCreating indexes for Order collection...');
    const orderCollection = db.collection('orders');
    
    // Compound index for tenantId and status
    await orderCollection.createIndex({ tenantId: 1, status: 1 }, { background: true });
    console.log('✓ Created order tenantId-status compound index');
    
    // Index for createdAt (for sorting)
    await orderCollection.createIndex({ createdAt: -1 }, { background: true });
    console.log('✓ Created order createdAt index');
    
    // Compound index for tenantId and createdAt
    await orderCollection.createIndex({ tenantId: 1, createdAt: -1 }, { background: true });
    console.log('✓ Created order tenantId-createdAt compound index');

    // Create indexes for MenuItem collection
    console.log('\nCreating indexes for MenuItem collection...');
    const menuItemCollection = db.collection('menuitems');
    
    // Compound index for tenantId and category
    await menuItemCollection.createIndex({ tenantId: 1, category: 1 }, { background: true });
    console.log('✓ Created menuItem tenantId-category compound index');
    
    // Compound index for tenantId and isAvailable
    await menuItemCollection.createIndex({ tenantId: 1, isAvailable: 1 }, { background: true });
    console.log('✓ Created menuItem tenantId-isAvailable compound index');

    // Get index statistics
    console.log('\n=== Index Statistics ===');
    const collections = ['users', 'tenants', 'orders', 'menuitems'];
    
    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      console.log(`\n${collName} collection indexes:`);
      indexes.forEach(index => {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      });
    }

    console.log('\n✅ Database optimization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error optimizing database:', error);
    process.exit(1);
  }
}

// Run the optimization
optimizeDatabase();