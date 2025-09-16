import mongoose from 'mongoose';

import { Tenant } from '../models/Tenant';
import { User } from '../models/User';

const checkUserTenantMapping = async (): Promise<void> => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('✅ Connected to zeduno database\n');

    // Check specific users
    const usersToCheck = [
      'irungumill@mail.com',
      'manager@joespizzapalace.com'
    ];

    for (const email of usersToCheck) {
      const user = await User.findOne({ email }).populate('tenantId');
      if (user) {
        console.log(`👤 USER: ${email}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   TenantId (field): ${user.tenantId}`);
        if (user.tenantId && typeof user.tenantId === 'object' && 'name' in user.tenantId) {
          console.log(`   Tenant Name: ${(user.tenantId as any).name}`);
        }
        
        // Also check the tenantId field if it exists
        if ((user as any).tenant) {
          const tenantObj = await Tenant.findById((user as any).tenant);
          console.log(`   Tenant (field): ${(user as any).tenant}`);
          console.log(`   Tenant Name (from tenant field): ${tenantObj?.name}`);
        }
        console.log('');
      } else {
        console.log(`❌ User ${email} not found\n`);
      }
    }

    // Also check all tenants and their names
    console.log('🏢 ALL TENANTS:');
    const tenants = await Tenant.find({});
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (ID: ${tenant._id})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Check completed');

  } catch (error) {
    console.error('❌ Error checking user-tenant mapping:', error);
  }
};

// Run the script
if (require.main === module) {
  checkUserTenantMapping()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default checkUserTenantMapping;