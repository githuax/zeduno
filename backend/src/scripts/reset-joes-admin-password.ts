import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { connectDB } from '../config/database';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';

dotenv.config();

/**
 * Script to reset the password for admin@joespizzapalace.com
 * This script can be run multiple times safely
 */
const resetJoesAdminPassword = async (): Promise<void> => {
  try {
    console.log('🍕 Starting Joe\'s Pizza Palace Admin Password Reset...');
    console.log('========================================');

    // Connect to database using the config setup
    await connectDB();
    console.log('✅ Connected to database');

    // Configuration
    const targetEmail = 'admin@joespizzapalace.com';
    const newPassword = 'JoesPizza@2024'; // Using the original seed password
    const alternativePassword = 'Admin@123'; // Backup password option

    console.log(`📧 Looking for user: ${targetEmail}`);

    // Step 1: Find the user
    const user = await User.findOne({ email: targetEmail });
    
    if (!user) {
      console.log(`❌ User with email ${targetEmail} not found`);
      console.log('💡 Tip: Make sure the Joe\'s Pizza Palace tenant has been created');
      console.log('💡 Run: npm run seed:joes-pizza to create the tenant and users');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ User found!');
    console.log(`   👤 Name: ${user.firstName} ${user.lastName}`);
    console.log(`   🏢 Role: ${user.role}`);
    console.log(`   📅 Created: ${user.createdAt?.toLocaleDateString()}`);
    console.log(`   🔓 Active: ${user.isActive ? 'Yes' : 'No'}`);
    console.log(`   🔐 Must Change Password: ${user.mustChangePassword ? 'Yes' : 'No'}`);

    // Step 2: Find the tenant to verify relationship
    if (user.tenantId) {
      const tenant = await Tenant.findById(user.tenantId);
      if (tenant) {
        console.log(`   🏪 Tenant: ${tenant.name} (${tenant.slug})`);
      }
    }

    console.log('\n🔐 Preparing to reset password...');

    // Step 3: Test current password first
    let currentPasswordWorks = false;
    const testPasswords = [newPassword, alternativePassword, 'admin123', 'password123'];
    
    for (const testPassword of testPasswords) {
      try {
        const isMatch = await user.comparePassword(testPassword);
        if (isMatch) {
          console.log(`ℹ️  Current password already works: ${testPassword}`);
          currentPasswordWorks = true;
          break;
        }
      } catch (error) {
        // Continue testing other passwords
      }
    }

    if (currentPasswordWorks) {
      console.log('✅ Password is already working! No reset needed.');
      console.log('\n🍕 Password Reset Complete - No Action Needed');
      console.log('========================================');
      await mongoose.disconnect();
      return;
    }

    // Step 4: Hash the new password manually (not relying on pre-save hook)
    console.log('🔨 Generating new password hash...');
    const saltRounds = process.env.NODE_ENV === 'production' ? 10 : 8;
    const salt = await bcrypt.genSalt(saltRounds);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log(`   Salt rounds: ${saltRounds}`);
    console.log(`   New hash preview: ${newHashedPassword.substring(0, 30)}...`);

    // Step 5: Test the hash before updating
    const hashTest = await bcrypt.compare(newPassword, newHashedPassword);
    console.log(`   Hash test result: ${hashTest ? '✅ Pass' : '❌ Fail'}`);
    
    if (!hashTest) {
      throw new Error('Hash generation failed - password hash does not match');
    }

    // Step 6: Update the user record directly
    console.log('💾 Updating user record...');
    const updateResult = await User.updateOne(
      { email: targetEmail },
      {
        $set: {
          password: newHashedPassword,
          passwordLastChanged: new Date(),
          mustChangePassword: true, // Force password change on next login
          accountStatus: 'active',
          isActive: true,
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error('User update failed - no documents were modified');
    }

    console.log('✅ User record updated successfully');

    // Step 7: Verify the update worked
    console.log('🔍 Verifying password update...');
    const updatedUser = await User.findOne({ email: targetEmail });
    
    if (!updatedUser) {
      throw new Error('Could not find user after update');
    }

    // Test the new password
    const verifyNewPassword = await updatedUser.comparePassword(newPassword);
    console.log(`   New password verification: ${verifyNewPassword ? '✅ Pass' : '❌ Fail'}`);
    
    if (!verifyNewPassword) {
      throw new Error('Password verification failed after update');
    }

    // Step 8: Final verification with fresh database query
    console.log('🔄 Final verification with fresh query...');
    const freshUser = await User.findOne({ email: targetEmail }).lean();
    const finalTest = await bcrypt.compare(newPassword, freshUser!.password);
    console.log(`   Final verification: ${finalTest ? '✅ Pass' : '❌ Fail'}`);

    if (!finalTest) {
      throw new Error('Final verification failed');
    }

    // Success!
    console.log('\n🍕 Password Reset Complete!');
    console.log('========================================');
    console.log('\n📋 Login Details:');
    console.log(`   Email: ${targetEmail}`);
    console.log(`   Password: ${newPassword}`);
    console.log('   Note: User will be prompted to change password on first login');
    console.log('\n💡 Next Steps:');
    console.log('   1. Try logging in with the new password');
    console.log('   2. Change the password when prompted');
    console.log('   3. If issues persist, check the application logs');
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error resetting Joe\'s admin password:', error);
    
    // Provide helpful troubleshooting info
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Make sure the database is running');
    console.log('2. Check your MONGODB_URI environment variable');
    console.log('3. Ensure the Joe\'s Pizza Palace tenant exists');
    console.log('4. Try running: npm run seed:joes-pizza first');
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    
    process.exit(1);
  }
};

// Run the script when called directly
if (require.main === module) {
  resetJoesAdminPassword()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export default resetJoesAdminPassword;