import path from 'path';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Migration script to apply branch-related schema updates to MongoDB
 * Run this to make the changes visible in your MongoDB database
 */

async function applyBranchSchemaUpdates() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-serve-hub';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // 1. Check and create Branch collection if it doesn't exist
    console.log('\n📊 Checking collections...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('branches')) {
      console.log('📝 Creating branches collection...');
      await db.createCollection('branches');
      console.log('✅ Branches collection created');
    } else {
      console.log('✅ Branches collection exists');
    }

    // 2. Update Order collection - Add branch fields to existing orders
    console.log('\n🔄 Updating Order schema...');
    const ordersCollection = db.collection('orders');
    
    // Check if orders are missing branchId
    const ordersWithoutBranch = await ordersCollection.countDocuments({
      branchId: { $exists: false }
    });
    
    if (ordersWithoutBranch > 0) {
      console.log(`Found ${ordersWithoutBranch} orders without branchId`);
      
      // For existing orders, we'll need to assign them to a default branch
      // First, let's create a default branch for each tenant
      const tenants = await db.collection('tenants').find({}).toArray();
      
      for (const tenant of tenants) {
        // Check if tenant has a main branch
        const mainBranch = await db.collection('branches').findOne({
          tenantId: tenant._id,
          type: 'main'
        });
        
        if (!mainBranch) {
          // Create a default main branch for this tenant
          const defaultBranch = {
            tenantId: tenant._id,
            name: `${tenant.name} - Main Branch`,
            code: `${tenant.slug?.toUpperCase() || 'MAIN'}-BR001`,
            type: 'main',
            status: 'active',
            address: {
              street: tenant.address || '123 Main St',
              city: 'Default City',
              state: 'Default State',
              postalCode: '00000',
              country: 'Default Country'
            },
            contact: {
              phone: tenant.phone || '000-000-0000',
              email: tenant.email
            },
            operations: {
              openTime: '09:00',
              closeTime: '22:00',
              timezone: 'UTC',
              daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            },
            financial: {
              currency: tenant.settings?.currency || 'USD',
              taxRate: 0,
              tipEnabled: true,
              paymentMethods: ['cash']
            },
            settings: {
              orderPrefix: `${tenant.slug?.toUpperCase() || 'ORD'}`,
              orderNumberSequence: 1
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const insertedBranch = await db.collection('branches').insertOne(defaultBranch);
          console.log(`✅ Created default branch for tenant: ${tenant.name}`);
          
          // Update orders for this tenant
          await ordersCollection.updateMany(
            { 
              tenantId: tenant._id,
              branchId: { $exists: false }
            },
            { 
              $set: { 
                branchId: insertedBranch.insertedId,
                branchCode: defaultBranch.code,
                branchOrderNumber: 'MIGRATED-001'
              }
            }
          );
        } else {
          // Use existing main branch
          await ordersCollection.updateMany(
            { 
              tenantId: tenant._id,
              branchId: { $exists: false }
            },
            { 
              $set: { 
                branchId: mainBranch._id,
                branchCode: mainBranch.code,
                branchOrderNumber: 'MIGRATED-001'
              }
            }
          );
        }
      }
      
      console.log('✅ Updated orders with branch information');
    } else {
      console.log('✅ All orders have branch information');
    }

    // 3. Update User collection - Add branch fields
    console.log('\n🔄 Updating User schema...');
    const usersCollection = db.collection('users');
    
    // Add branch fields to users that don't have them
    const usersWithoutBranchFields = await usersCollection.countDocuments({
      assignedBranches: { $exists: false }
    });
    
    if (usersWithoutBranchFields > 0) {
      console.log(`Found ${usersWithoutBranchFields} users without branch fields`);
      
      // Update all users to have branch fields
      await usersCollection.updateMany(
        { assignedBranches: { $exists: false } },
        { 
          $set: { 
            assignedBranches: [],
            currentBranch: null,
            defaultBranch: null,
            canSwitchBranches: false,
            branchRole: 'branch_staff'
          }
        }
      );
      
      console.log('✅ Added branch fields to users');
    } else {
      console.log('✅ All users have branch fields');
    }

    // 4. Update Tenant collection - Add hierarchical fields
    console.log('\n🔄 Updating Tenant schema...');
    const tenantsCollection = db.collection('tenants');
    
    const tenantsWithoutHierarchy = await tenantsCollection.countDocuments({
      tenantType: { $exists: false }
    });
    
    if (tenantsWithoutHierarchy > 0) {
      console.log(`Found ${tenantsWithoutHierarchy} tenants without hierarchy fields`);
      
      await tenantsCollection.updateMany(
        { tenantType: { $exists: false } },
        { 
          $set: { 
            tenantType: 'root',
            parentTenantId: null,
            branchQuota: {
              maxBranches: 50,
              currentBranches: 0
            },
            inheritance: {
              menu: 'full',
              settings: 'full',
              users: 'isolated',
              pricing: 'inherit'
            }
          }
        }
      );
      
      console.log('✅ Added hierarchy fields to tenants');
    } else {
      console.log('✅ All tenants have hierarchy fields');
    }

    // 5. Create indexes
    console.log('\n🔧 Creating indexes...');
    
    // Branch indexes
    await db.collection('branches').createIndexes([
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, code: 1 }, unique: true },
      { key: { 'address.coordinates': '2dsphere' } },
      { key: { parentBranchId: 1 } }
    ]);
    console.log('✅ Branch indexes created');
    
    // Order indexes for branch queries
    await ordersCollection.createIndexes([
      { key: { tenantId: 1, branchId: 1, status: 1 } },
      { key: { tenantId: 1, branchId: 1, createdAt: -1 } },
      { key: { branchId: 1, orderType: 1 } },
      { key: { branchId: 1, paymentStatus: 1 } },
      { key: { branchOrderNumber: 1, branchId: 1 }, unique: true }
    ]);
    console.log('✅ Order indexes created');
    
    // User indexes for branch queries
    await usersCollection.createIndexes([
      { key: { assignedBranches: 1 } },
      { key: { currentBranch: 1 } },
      { key: { tenantId: 1, branchRole: 1 } }
    ]);
    console.log('✅ User indexes created');
    
    // Tenant indexes
    await tenantsCollection.createIndexes([
      { key: { parentTenantId: 1 } },
      { key: { tenantType: 1, status: 1 } }
    ]);
    console.log('✅ Tenant indexes created');

    // 6. Verify the updates
    console.log('\n📊 Verification:');
    
    const branchCount = await db.collection('branches').countDocuments();
    const ordersWithBranch = await ordersCollection.countDocuments({ branchId: { $exists: true } });
    const usersWithBranch = await usersCollection.countDocuments({ assignedBranches: { $exists: true } });
    const tenantsWithType = await tenantsCollection.countDocuments({ tenantType: { $exists: true } });
    
    console.log(`✅ Branches: ${branchCount}`);
    console.log(`✅ Orders with branch: ${ordersWithBranch}`);
    console.log(`✅ Users with branch fields: ${usersWithBranch}`);
    console.log(`✅ Tenants with hierarchy: ${tenantsWithType}`);

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  applyBranchSchemaUpdates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default applyBranchSchemaUpdates;