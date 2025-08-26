import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

const debugUserAuth = async (): Promise<void> => {
  try {
    // Connect to zeduno database
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('✅ Connected to zeduno database');

    const email = 'irungumill@mail.com';
    const testPassword = 'Pass@12345';
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ User found: ${user.email}`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Password Hash: ${user.password.substring(0, 30)}...`);

    // Test password comparison
    const isPasswordValid = await user.comparePassword(testPassword);
    console.log(`   Password Comparison Result: ${isPasswordValid}`);

    // Also test with bcrypt directly
    const directComparison = await bcrypt.compare(testPassword, user.password);
    console.log(`   Direct bcrypt comparison: ${directComparison}`);

    // Test with wrong password
    const wrongPasswordTest = await user.comparePassword('wrongpassword');
    console.log(`   Wrong password test: ${wrongPasswordTest}`);

    await mongoose.disconnect();
    console.log('✅ Debug completed');

  } catch (error) {
    console.error('❌ Error debugging user auth:', error);
  }
};

// Run the script
if (require.main === module) {
  debugUserAuth()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default debugUserAuth;