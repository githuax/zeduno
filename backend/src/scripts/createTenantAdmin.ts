import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { connectDB } from '../config/database';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';

dotenv.config();

/**
 * Create or update a tenant admin user.
 * Usage:
 *   npm run create:tenant-admin -- <email> <tenantSlugOrId> [password]
 *
 * If password is omitted, a strong temporary password is generated and the user
 * will be required to change it on first login.
 */
async function run() {
  const email = process.argv[2];
  const tenantKey = process.argv[3];
  let password = process.argv[4];

  if (!email || !tenantKey) {
    console.log('Usage: npm run create:tenant-admin -- <email> <tenantSlugOrId> [password]');
    process.exit(1);
  }

  try {
    await connectDB();

    // Find tenant by id or slug
    let tenant = null as any;
    const isObjectId = /^[a-f\d]{24}$/i.test(tenantKey);
    if (isObjectId) {
      tenant = await Tenant.findById(new mongoose.Types.ObjectId(tenantKey));
    } else {
      tenant = await Tenant.findOne({ slug: tenantKey.toLowerCase() });
    }

    if (!tenant) {
      console.log(`❌ Tenant not found for key: ${tenantKey}`);
      process.exit(1);
    }

    // Generate a strong temp password if none provided
    let generatedPassword: string | undefined;
    if (!password) {
      const crypto = await import('crypto');
      generatedPassword = crypto.randomBytes(9).toString('base64')
        .replace(/[^a-zA-Z0-9@#]/g, '')
        .slice(0, 12);
      if (!/[A-Z]/.test(generatedPassword)) generatedPassword = 'A' + generatedPassword;
      if (!/[a-z]/.test(generatedPassword)) generatedPassword = 'a' + generatedPassword;
      if (!/[0-9]/.test(generatedPassword)) generatedPassword = generatedPassword + '1';
      if (!/[@#]/.test(generatedPassword)) generatedPassword = generatedPassword + '@';
      password = generatedPassword;
    }

    // Find existing user by email (global unique)
    let user = await User.findOne({ email });
    if (user) {
      console.log('ℹ️  User exists, updating role/tenant and password');
      user.role = 'admin';
      user.tenantId = tenant._id;
      user.isActive = true;
      user.accountStatus = 'active';
      user.password = password!; // pre-save hook will hash
      user.mustChangePassword = !!generatedPassword; // force change if generated
      await user.save();
    } else {
      user = new User({
        email,
        firstName: 'Tenant',
        lastName: 'Admin',
        role: 'admin',
        password,
        tenantId: tenant._id,
        isActive: true,
        accountStatus: 'active',
        mustChangePassword: !!generatedPassword,
      });
      await user.save();
    }

    console.log('✅ Tenant admin ready');
    console.log(`Tenant: ${tenant.name} (${tenant.slug})`);
    console.log(`Email: ${email}`);
    if (generatedPassword) {
      console.log(`Temporary Password: ${generatedPassword} (user must change on first login)`);
    } else {
      console.log(`Password: ${password}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tenant admin:', error);
    process.exit(1);
  }
}

run();

