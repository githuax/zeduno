import mongoose from 'mongoose';

import { MenuItem } from '../models/MenuItem';
import OrderModel from '../models/Order';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';

const cleanupTenants = async (): Promise<void> => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('✅ Connected to zeduno database\n');

    // Define which tenants to KEEP
    const tenantsToKeep = [
      'Irungu Mill Restaurant',
      "Joe's Pizza Palace"
    ];

    // Get all tenants
    const allTenants = await Tenant.find({});
    console.log(`Found ${allTenants.length} total tenants\n`);

    // Identify tenants to delete
    const tenantsToDelete = allTenants.filter(t => !tenantsToKeep.includes(t.name));
    const tenantIdsToDelete = tenantsToDelete.map(t => t._id);
    
    console.log('🗑️  TENANTS TO DELETE:');
    tenantsToDelete.forEach(t => console.log(`   - ${t.name} (${t._id})`));
    
    console.log('\n✅ TENANTS TO KEEP:');
    const tenantsKept = allTenants.filter(t => tenantsToKeep.includes(t.name));
    tenantsKept.forEach(t => console.log(`   - ${t.name} (${t._id})`));

    // Delete users associated with unwanted tenants (except superadmin)
    const deletedUsers = await User.deleteMany({
      tenantId: { $in: tenantIdsToDelete },
      role: { $ne: 'superadmin' }
    });
    console.log(`\n🗑️  Deleted ${deletedUsers.deletedCount} users from unwanted tenants`);

    // Delete menu items from unwanted tenants
    const deletedMenuItems = await MenuItem.deleteMany({
      tenantId: { $in: tenantIdsToDelete }
    });
    console.log(`🗑️  Deleted ${deletedMenuItems.deletedCount} menu items from unwanted tenants`);

    // Delete orders from unwanted tenants
    const deletedOrders = await OrderModel.deleteMany({
      tenantId: { $in: tenantIdsToDelete }
    });
    console.log(`🗑️  Deleted ${deletedOrders.deletedCount} orders from unwanted tenants`);

    // Delete the unwanted tenants
    const deletedTenants = await Tenant.deleteMany({
      _id: { $in: tenantIdsToDelete }
    });
    console.log(`🗑️  Deleted ${deletedTenants.deletedCount} tenants\n`);

    // Show remaining data
    const remainingTenants = await Tenant.find({});
    const remainingUsers = await User.find({}).populate('tenantId');
    
    console.log('📊 REMAINING DATA:');
    console.log('='.repeat(40));
    console.log('\n🏢 Tenants:');
    remainingTenants.forEach(t => {
      console.log(`   - ${t.name}`);
    });

    console.log('\n👥 Users:');
    remainingUsers.forEach(u => {
      const tenantName = u.tenantId && typeof u.tenantId === 'object' && 'name' in u.tenantId 
        ? (u.tenantId as any).name 
        : 'No tenant';
      console.log(`   - ${u.email} (${u.role}) → ${tenantName}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Cleanup completed successfully');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  console.log('⚠️  WARNING: This will permanently delete tenants and their data!');
  console.log('   Keeping only: Irungu Mill Restaurant & Joe\'s Pizza Palace\n');
  
  cleanupTenants()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default cleanupTenants;