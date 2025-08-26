import mongoose from 'mongoose';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';

const checkAllUserTenants = async (): Promise<void> => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('✅ Connected to zeduno database\n');

    // Get all users
    const users = await User.find({}).populate('tenantId');
    console.log('👥 ALL USERS AND THEIR TENANT ASSIGNMENTS:');
    console.log('='.repeat(60));

    for (const user of users) {
      console.log(`📧 ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   User ID: ${user._id}`);
      
      if (user.role === 'superadmin') {
        console.log(`   🔐 SUPERADMIN (no tenant required)`);
      } else {
        console.log(`   TenantId: ${user.tenantId ? (typeof user.tenantId === 'object' ? (user.tenantId as any)._id : user.tenantId) : 'NONE'}`);
        
        if (user.tenantId && typeof user.tenantId === 'object' && 'name' in user.tenantId) {
          console.log(`   🏢 Tenant: "${(user.tenantId as any).name}"`);
          console.log(`   💰 Currency: ${(user.tenantId as any).settings?.currency || 'Not set'}`);
          console.log(`   📍 Status: ${(user.tenantId as any).status}`);
        } else if (user.tenantId) {
          // Handle case where tenantId is just an ID
          const tenant = await Tenant.findById(user.tenantId);
          if (tenant) {
            console.log(`   🏢 Tenant: "${tenant.name}"`);
            console.log(`   💰 Currency: ${tenant.settings?.currency || 'Not set'}`);
            console.log(`   📍 Status: ${tenant.status}`);
          } else {
            console.log(`   ❌ ORPHANED USER - Tenant not found!`);
          }
        } else {
          console.log(`   ❌ NO TENANT ASSIGNED!`);
        }
      }
      console.log('');
    }

    // Summary
    const totalUsers = users.length;
    const superadmins = users.filter(u => u.role === 'superadmin').length;
    const regularUsers = users.filter(u => u.role !== 'superadmin').length;
    const usersWithTenants = users.filter(u => u.role !== 'superadmin' && u.tenantId).length;
    const orphanedUsers = regularUsers - usersWithTenants;

    console.log('📊 SUMMARY:');
    console.log('='.repeat(30));
    console.log(`Total Users: ${totalUsers}`);
    console.log(`SuperAdmins: ${superadmins}`);
    console.log(`Regular Users: ${regularUsers}`);
    console.log(`Users with Tenants: ${usersWithTenants}`);
    console.log(`Orphaned Users: ${orphanedUsers}`);

    if (orphanedUsers > 0) {
      console.log(`\n⚠️  WARNING: ${orphanedUsers} users are missing tenant assignments!`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Check completed');

  } catch (error) {
    console.error('❌ Error checking users and tenants:', error);
  }
};

// Run the script
if (require.main === module) {
  checkAllUserTenants()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default checkAllUserTenants;