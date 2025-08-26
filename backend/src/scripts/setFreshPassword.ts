import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

const setFreshPassword = async (): Promise<void> => {
  try {
    // Connect to zeduno database
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('✅ Connected to zeduno database');

    const email = 'irungumill@mail.com';
    const newPassword = 'Pass@12345';
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ User found: ${user.email}`);
    console.log(`   Old password hash: ${user.password.substring(0, 30)}...`);

    // Generate a fresh password hash manually
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    
    console.log(`   New password hash: ${newHash.substring(0, 30)}...`);

    // Test the new hash immediately
    const testResult = await bcrypt.compare(newPassword, newHash);
    console.log(`   Hash test result: ${testResult}`);

    // Update the user directly
    await User.updateOne(
      { email }, 
      { 
        $set: { 
          password: newHash,
          passwordLastChanged: new Date()
        } 
      }
    );

    console.log(`✅ Password updated successfully`);

    // Verify the update worked
    const updatedUser = await User.findOne({ email });
    const verifyResult = await updatedUser!.comparePassword(newPassword);
    console.log(`   Verification result: ${verifyResult}`);

    await mongoose.disconnect();
    console.log('✅ Fresh password set and verified');

  } catch (error) {
    console.error('❌ Error setting fresh password:', error);
  }
};

// Run the script
if (require.main === module) {
  setFreshPassword()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default setFreshPassword;