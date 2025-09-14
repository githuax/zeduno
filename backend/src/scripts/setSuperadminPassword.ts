import dotenv from 'dotenv';

import { connectDB } from '../config/database';
import { User } from '../models/User';

// Load environment variables
dotenv.config();

/**
 * Set or reset the superadmin password.
 * Usage:
 *   npm run set:superadmin:password -- <email> <newPassword>
 *   or set env vars SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD
 */
const setSuperadminPassword = async () => {
  try {
    const email = process.argv[2] || process.env.SUPERADMIN_EMAIL || 'superadmin@zeduno.com';
    const newPassword = process.argv[3] || process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123';

    await connectDB();

    // Find the superadmin user
    const superadmin = await User.findOne({ email });

    if (!superadmin) {
      console.log(`Superadmin user not found for: ${email}`);
      process.exit(1);
    }

    // Set password (pre-save hook will hash it)
    superadmin.password = newPassword;
    await superadmin.save();

    console.log(`Superadmin password set successfully`);
    console.log(`Email: ${email}`);
    console.log(`New Password: ${newPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('Error setting superadmin password:', error);
    process.exit(1);
  }
};

setSuperadminPassword();
