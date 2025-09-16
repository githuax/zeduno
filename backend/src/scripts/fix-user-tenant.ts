import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { User } from '../models/User';

dotenv.config();

const fixUserTenant = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    const mockTenantId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    
    // Find all users without tenantId and update them
    const usersWithoutTenant = await User.find({ 
      tenantId: { $in: [null, undefined] }
    });
    
    console.log(`Found ${usersWithoutTenant.length} users without tenant ID:`);
    usersWithoutTenant.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
    });
    
    if (usersWithoutTenant.length > 0) {
      // Update all users to have the mock tenant ID
      const updateResult = await User.updateMany(
        { tenantId: { $in: [null, undefined] } },
        { $set: { tenantId: mockTenantId } }
      );
      
      console.log(`\n✅ Updated ${updateResult.modifiedCount} users to use tenant ID: ${mockTenantId}`);
      
      // Verify the fix
      const updatedUsers = await User.find({ tenantId: mockTenantId }).select('email firstName lastName role tenantId');
      console.log(`\nVerification - Users with correct tenant ID:`);
      updatedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Tenant: ${user.tenantId}`);
      });
    } else {
      console.log('No users need tenant ID updates.');
    }

    console.log('\n✅ User tenant fix completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing user tenants:', error);
    process.exit(1);
  }
};

fixUserTenant();
