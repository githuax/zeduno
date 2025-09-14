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
  role: 'superadmin';
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

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔌 Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperAdmin = await mongoose.connection.db
      .collection('superadmins')
      .findOne({ role: 'superadmin' });

    if (existingSuperAdmin) {
      console.log('⚠️  SuperAdmin already exists!');
      console.log(`📧 Email: ${existingSuperAdmin.email}`);
      console.log(`👤 Username: ${existingSuperAdmin.username}`);
      return;
    }

    // Hash the default password
    const defaultPassword = 'SuperAdmin123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create superadmin user
    const superAdmin: SuperAdmin = {
      username: 'superadmin',
      email: 'superadmin@zeduno.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
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

    // Create superadmins collection if it doesn't exist
    const superAdminCollection = mongoose.connection.db.collection('superadmins');
    
    // Create indexes first
    try {
      await superAdminCollection.createIndex({ "email": 1 }, { unique: true });
      await superAdminCollection.createIndex({ "username": 1 }, { unique: true });
    } catch (error) {
      // Indexes might already exist
    }
    
    // Insert superadmin
    await superAdminCollection.insertOne(superAdmin);

    console.log('✅ SuperAdmin created successfully!');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`👤 Username: ${superAdmin.username}`);
    console.log(`🔑 Password: ${defaultPassword}`);
    console.log('');
    console.log('🌐 Access URLs:');
    console.log(`🖥️  Frontend: http://localhost:8082`);
    console.log(`🔧 Backend API: http://localhost:5001`);
    console.log(`📚 API Docs: http://localhost:5001/api-docs`);
    console.log(`🗄️  Mongo Express: http://localhost:8081 (admin:admin123)`);
    console.log('');
    console.log('🚀 SuperAdmin Features:');
    console.log('  • Access TenantSwitcher for multi-tenant management');
    console.log('  • Create and manage tenant accounts');
    console.log('  • Platform-level analytics and billing');
    console.log('  • System configuration and monitoring');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');

  } catch (error) {
    console.error('❌ Error creating SuperAdmin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding script
if (require.main === module) {
  seedSuperAdmin();
}

export default seedSuperAdmin;
