import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

const resetUserPassword = async (): Promise<void> => {
  try {
    // Connect to zeduno database
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('✅ Connected to zeduno database');

    // Find and update the user password
    const email = 'irungumill@mail.com';
    const newPassword = 'Pass@12345';
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      await mongoose.disconnect();
      return;
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    user.password = hashedPassword;
    user.passwordLastChanged = new Date();
    await user.save();

    console.log(`✅ Password reset successfully for user: ${email}`);
    console.log(`   New password: ${newPassword}`);

    await mongoose.disconnect();
    console.log('✅ Password reset completed');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  }
};

// Run the script
if (require.main === module) {
  resetUserPassword()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default resetUserPassword;