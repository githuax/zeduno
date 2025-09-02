import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const enableSuperAdminAccess = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    // Find the superadmin user
    const superAdmin = await User.findOne({ email: 'superadmin@zeduno.com' });
    
    if (superAdmin) {
      // Set superadmin to have no specific tenant (null) so they can see all data
      await User.findOneAndUpdate(
        { email: 'superadmin@zeduno.com' },
        { $unset: { tenantId: 1 } } // Remove tenantId completely
      );
      
      console.log('✅ SuperAdmin can now view all tenant data');
      console.log('📧 SuperAdmin login: superadmin@zeduno.com / password123');
      console.log('🔍 SuperAdmin will see data from all tenants');
    } else {
      console.log('❌ SuperAdmin user not found');
    }

    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

enableSuperAdminAccess();
