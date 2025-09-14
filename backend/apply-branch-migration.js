const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * Migration script to apply branch-related schema updates to MongoDB
 * 
 * Run this script with: node backend/apply-branch-migration.js
 */

async function applyBranchSchemaUpdates() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-serve-hub';
    
    console.log('🔄 Connecting to MongoDB...');
    console.log('   URI:', mongoUri.replace(/:[^:]*@/, ':****@')); // Hide password
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // 1. Check current state
    console.log('\n📊 Checking current database state...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('Existing collections:', collectionNames.join(', '));

    // 2. Create branches collection if needed
    if (!collectionNames.includes('branches')) {
      console.log('\n📝 Creating branches collection...');
      await db.createCollection('branches');
      console.log('✅ Branches collection created');
    }

    // 3. Check and update Orders
    console.log('\n🔍 Checking Orders collection...');
    const ordersCollection = db.collection('orders');
    const totalOrders = await ordersCollection.countDocuments({});
    const ordersWithoutBranch = await ordersCollection.countDocuments({
      branchId: { $exists: false }
    });
    
    console.log(`Total orders: ${totalOrders}`);
    console.log(`Orders without branchId: ${ordersWithoutBranch}`);

    if (ordersWithoutBranch > 0) {
      console.log('\n🔄 Updating orders with branch information...');
      
      // Get all unique tenants from orders
      const tenantIds = await ordersCollection.distinct('tenantId');
      
      for (const tenantId of tenantIds) {
        // Find or create a default branch for this tenant
        let branch = await db.collection('branches').findOne({
          tenantId: tenantId
        });
        
        if (!branch) {
          // Get tenant info
          const tenant = await db.collection('tenants').findOne({ _id: tenantId });
          
          if (tenant) {
            // Create default branch
            const defaultBranch = {
              _id: new mongoose.Types.ObjectId(),
              tenantId: tenantId,
              name: `${tenant.name} - Main Branch`,
              code: `${(tenant.slug || 'MAIN').toUpperCase()}-BR001`,
              type: 'main',
              status: 'active',
              address: {
                street: tenant.address || '123 Main St',
                city: 'City',
                state: 'State',
                postalCode: '00000',
                country: 'Country'
              },
              contact: {
                phone: tenant.phone || '000-000-0000',
                email: tenant.email
              },
              operations: {
                openTime: '09:00',
                closeTime: '22:00',
                timezone: tenant.settings?.timezone || 'UTC',
                daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
              },
              financial: {
                currency: tenant.settings?.currency || 'USD',
                taxRate: 0,
                tipEnabled: true,
                paymentMethods: ['cash']
              },
              inventory: {
                trackInventory: true,
                lowStockAlertEnabled: true,
                autoReorderEnabled: false
              },
              menuConfig: {
                inheritFromParent: false,
                priceMultiplier: 1,
                customPricing: false
              },
              staffing: {
                maxStaff: 50,
                currentStaff: 0,
                roles: ['manager', 'cashier', 'waiter', 'chef', 'delivery']
              },
              metrics: {
                avgOrderValue: 0,
                totalOrders: 0,
                totalRevenue: 0,
                lastUpdated: new Date()
              },
              settings: {
                orderPrefix: (tenant.slug || 'ORD').toUpperCase(),
                orderNumberSequence: 1
              },
              isActive: true,
              createdBy: tenant.createdBy || tenantId,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await db.collection('branches').insertOne(defaultBranch);
            console.log(`✅ Created default branch for tenant: ${tenant.name}`);
            branch = defaultBranch;
          }
        }
        
        if (branch) {
          // Update orders for this tenant
          const result = await ordersCollection.updateMany(
            { 
              tenantId: tenantId,
              branchId: { $exists: false }
            },
            { 
              $set: { 
                branchId: branch._id,
                branchCode: branch.code,
                branchOrderNumber: `${branch.code}-001`
              }
            }
          );
          
          if (result.modifiedCount > 0) {
            console.log(`  Updated ${result.modifiedCount} orders for tenant ${tenantId}`);
          }
        }
      }
    }

    // 4. Check and update Users
    console.log('\n🔍 Checking Users collection...');
    const usersCollection = db.collection('users');
    const totalUsers = await usersCollection.countDocuments({});
    const usersWithoutBranchFields = await usersCollection.countDocuments({
      assignedBranches: { $exists: false }
    });
    
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users without branch fields: ${usersWithoutBranchFields}`);

    if (usersWithoutBranchFields > 0) {
      const result = await usersCollection.updateMany(
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
      console.log(`✅ Added branch fields to ${result.modifiedCount} users`);
    }

    // 5. Check and update Tenants
    console.log('\n🔍 Checking Tenants collection...');
    const tenantsCollection = db.collection('tenants');
    const totalTenants = await tenantsCollection.countDocuments({});
    const tenantsWithoutHierarchy = await tenantsCollection.countDocuments({
      tenantType: { $exists: false }
    });
    
    console.log(`Total tenants: ${totalTenants}`);
    console.log(`Tenants without hierarchy fields: ${tenantsWithoutHierarchy}`);

    if (tenantsWithoutHierarchy > 0) {
      const result = await tenantsCollection.updateMany(
        { tenantType: { $exists: false } },
        { 
          $set: { 
            tenantType: 'root',
            parentTenantId: null,
            branchQuota: {
              maxBranches: 50,
              currentBranches: 1 // Since we created one default branch
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
      console.log(`✅ Added hierarchy fields to ${result.modifiedCount} tenants`);
    }

    // 6. Create indexes
    console.log('\n🔧 Creating indexes...');
    
    try {
      // Branch indexes
      await db.collection('branches').createIndex({ tenantId: 1, status: 1 });
      await db.collection('branches').createIndex({ tenantId: 1, code: 1 }, { unique: true });
      await db.collection('branches').createIndex({ parentBranchId: 1 });
      console.log('✅ Branch indexes created');
    } catch (e) {
      console.log('⚠️ Some branch indexes may already exist');
    }
    
    try {
      // Order indexes
      await ordersCollection.createIndex({ tenantId: 1, branchId: 1, status: 1 });
      await ordersCollection.createIndex({ branchId: 1, orderType: 1 });
      await ordersCollection.createIndex({ branchId: 1, paymentStatus: 1 });
      console.log('✅ Order branch indexes created');
    } catch (e) {
      console.log('⚠️ Some order indexes may already exist');
    }
    
    try {
      // User indexes
      await usersCollection.createIndex({ assignedBranches: 1 });
      await usersCollection.createIndex({ currentBranch: 1 });
      await usersCollection.createIndex({ tenantId: 1, branchRole: 1 });
      console.log('✅ User branch indexes created');
    } catch (e) {
      console.log('⚠️ Some user indexes may already exist');
    }

    // 7. Final verification
    console.log('\n📊 Final Verification:');
    
    const branchCount = await db.collection('branches').countDocuments();
    const ordersWithBranch = await ordersCollection.countDocuments({ branchId: { $exists: true } });
    const usersWithBranch = await usersCollection.countDocuments({ assignedBranches: { $exists: true } });
    const tenantsWithType = await tenantsCollection.countDocuments({ tenantType: { $exists: true } });
    
    console.log(`✅ Total branches: ${branchCount}`);
    console.log(`✅ Orders with branchId: ${ordersWithBranch}/${totalOrders}`);
    console.log(`✅ Users with branch fields: ${usersWithBranch}/${totalUsers}`);
    console.log(`✅ Tenants with hierarchy: ${tenantsWithType}/${totalTenants}`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('Your MongoDB database now has the branch structure applied.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the migration
console.log('🚀 Starting Branch Schema Migration...');
console.log('=====================================\n');

applyBranchSchemaUpdates()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script error:', error);
    process.exit(1);
  });