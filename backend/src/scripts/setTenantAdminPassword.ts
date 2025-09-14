import dotenv from 'dotenv';

import { connectDB } from '../config/database';
import { User } from '../models/User';

dotenv.config();

/**
 * Set or reset a tenant admin's password by email.
 * Usage:
 *   npm run set:tenant-admin:password -- <email> <newPassword>
 *   or set env vars TENANT_ADMIN_EMAIL / TENANT_ADMIN_PASSWORD
 */
async function run() {
  try {
    const email = process.argv[2] || process.env.TENANT_ADMIN_EMAIL;
    const newPassword = process.argv[3] || process.env.TENANT_ADMIN_PASSWORD;

    if (!email || !newPassword) {
      console.log('Usage: npm run set:tenant-admin:password -- <email> <newPassword>');
      process.exit(1);
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found for email: ${email}`);
      process.exit(1);
    }

    if (user.role !== 'admin') {
      console.warn(`⚠️  User role is '${user.role}', not 'admin'. Proceeding to set password.`);
    }

    user.password = newPassword; // pre-save hook will hash
    user.isActive = true;
    user.accountStatus = 'active';
    await user.save();

    console.log('✅ Tenant admin password set successfully');
    console.log(`Email: ${email}`);
    console.log(`New Password: ${newPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting tenant admin password:', error);
    process.exit(1);
  }
}

run();

