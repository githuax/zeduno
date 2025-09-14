import { config } from 'dotenv';
import mongoose from 'mongoose';

import { User } from '../models/User';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const resetTest1Password = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the test1@mail.com user
    const user = await User.findOne({ email: 'test1@mail.com' });
    
    if (!user) {
      console.log('❌ User test1@mail.com not found');
      return;
    }

    console.log('Found user:', user.email);
    console.log('Current role:', user.role);
    console.log('Current active:', user.isActive);
    console.log('Current mustChangePassword:', user.mustChangePassword);
    console.log('Current tenant:', user.tenantId);
    
    // Set the password using the model method (will be hashed automatically)
    user.password = 'admin123';
    user.mustChangePassword = false;
    user.isActive = true;
    
    await user.save();
    
    console.log('✅ Password reset successful!');
    console.log('🔑 Credentials: test1@mail.com / admin123');
    
    // Test the password
    const isPasswordValid = await user.comparePassword('admin123');
    console.log('✅ Password verification:', isPasswordValid ? 'PASS' : 'FAIL');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

console.log('Resetting test1@mail.com password...');
resetTest1Password();