import mongoose from 'mongoose';
import { User } from '../models/User';
import { SuperAdmin } from '../models/SuperAdmin';
import { Tenant } from '../models/Tenant';

const checkMigratedData = async (): Promise<void> => {
  try {
    // Connect to zeduno database
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('✅ Connected to zeduno database\n');

    // Check Users
    console.log('👤 USERS:');
    const users = await User.find({});
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, Role: ${user.role}, Active: ${user.isActive}`);
    });

    // Check SuperAdmins
    console.log('\n🔐 SUPER ADMINS:');
    const superAdmins = await SuperAdmin.find({});
    superAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. Email: ${admin.email}, Active: ${admin.isActive}`);
    });

    // Check Tenants
    console.log('\n🏢 TENANTS:');
    const tenants = await Tenant.find({});
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. Name: ${tenant.name}, Active: ${tenant.isActive}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Database check completed');

  } catch (error) {
    console.error('❌ Error checking migrated data:', error);
  }
};

// Run the check
if (require.main === module) {
  checkMigratedData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default checkMigratedData;