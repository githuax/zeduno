import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { User } from '../models/User';

dotenv.config();

const fixSuperAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    const superAdmin = await User.findOne({ email: 'superadmin@zeduno.com' });
    
    if (superAdmin) {
      superAdmin.password = 'password123';
      await superAdmin.save();
      console.log('✅ SuperAdmin password set to: password123');
    } else {
      console.log('❌ SuperAdmin not found');
    }

    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixSuperAdminPassword();
