import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import mongoose from 'mongoose';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/restaurant_db?authSource=admin';

interface SuperAdmin {
  _id?: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'system_admin';
  permissions: {
    platform: {
      tenantManagement: boolean;
      userManagement: boolean;
      systemSettings: boolean;
      analytics: boolean;
      billing: boolean;
    };
  };
  isActive: boolean;
  isSuperAdmin: boolean;
  mustChangePassword?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const resetSuperAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔌 Connected to MongoDB');

    const superAdminCollection = mongoose.connection.db.collection('superadmins');

    // Delete existing superadmin account
    const deleteResult = await superAdminCollection.deleteMany({ 
      email: 'superadmin@zeduno.com' 
    });
    
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing superadmin account(s)`);
    }

    // Hash the new password
    const newPassword = 'SuperAdmin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Create new superadmin user
    const superAdmin: SuperAdmin = {
      username: 'superadmin',
      email: 'superadmin@zeduno.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      permissions: {
        platform: {
          tenantManagement: true,
          userManagement: true,
          systemSettings: true,
          analytics: true,
          billing: true,
        },
      },
      isActive: true,
      isSuperAdmin: true,
      mustChangePassword: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create indexes if they don't exist
    try {
      await superAdminCollection.createIndex({ "email": 1 }, { unique: true });
      await superAdminCollection.createIndex({ "username": 1 }, { unique: true });
    } catch (error) {
      // Indexes might already exist
    }
    
    // Insert new superadmin
    await superAdminCollection.insertOne(superAdmin);

    console.log('✅ SuperAdmin account reset successfully!');
    console.log('');
    console.log('🔐 New Login Credentials:');
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`👤 Username: ${superAdmin.username}`);
    console.log(`🔑 Password: ${newPassword}`);
    console.log('');
    console.log('🌐 Access URL:');
    console.log(`🖥️  Frontend: http://localhost:8082/superadmin`);
    console.log('');
    console.log('✨ You can now login with the new credentials!');

  } catch (error) {
    console.error('❌ Error resetting SuperAdmin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the reset script
if (require.main === module) {
  resetSuperAdmin();
}

export default resetSuperAdmin;
