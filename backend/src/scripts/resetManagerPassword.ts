import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

const resetManagerPassword = async (): Promise<void> => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('✅ Connected to zeduno database');

    const email = 'manager@joespizzapalace.com';
    const newPassword = 'JoesPizza@2024';
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ User found: ${email}`);

    // Generate a fresh password hash
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    
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

    console.log(`✅ Password updated for ${email}`);
    console.log(`   Password: ${newPassword}`);

    // Verify the update worked
    const updatedUser = await User.findOne({ email });
    const verifyResult = await updatedUser!.comparePassword(newPassword);
    console.log(`   Verification result: ${verifyResult}`);

    await mongoose.disconnect();
    console.log('✅ Password reset completed');

  } catch (error) {
    console.error('❌ Error setting password:', error);
  }
};

if (require.main === module) {
  resetManagerPassword()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}