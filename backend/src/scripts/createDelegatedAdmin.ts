import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/restaurant_db?authSource=admin';

const createDelegatedAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔌 Connected to MongoDB');

    const { User } = require('../models/User');
    const { SuperAdmin } = require('../models/SuperAdmin');
    
    // Find the root superadmin first
    const rootSuperAdmin = await mongoose.connection.db
      .collection('superadmins')
      .findOne({ email: 'superadmin@zeduno.com' });
    
    if (!rootSuperAdmin) {
      console.log('❌ Root superadmin not found. Please run seedSuperAdmin.ts first.');
      return;
    }

    // Check if delegated admin already exists
    const existingAdmin = await User.findOne({ 
      email: 'admin@hotelzed.com' 
    });

    if (existingAdmin) {
      console.log('⚠️  Delegated admin already exists!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      return;
    }

    // Hash the password
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create delegated admin user in User collection (not SuperAdmin)
    const delegatedAdmin = new User({
      email: 'admin@hotelzed.com',
      password: hashedPassword,
      firstName: 'Delegated',
      lastName: 'Admin',
      role: 'superadmin', // Give superadmin role for tenant management
      isActive: true,
      mustChangePassword: false,
      accountStatus: 'active',
      createdBy: rootSuperAdmin._id, // Track who created this admin
      // Note: No tenantId as this is a cross-tenant admin
    });

    await delegatedAdmin.save();

    console.log('✅ Delegated Admin created successfully!');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log(`📧 Email: ${delegatedAdmin.email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('');
    console.log('📝 Permissions:');
    console.log('  • Can create and manage tenants');
    console.log('  • Can only see tenants they created');
    console.log('  • Cannot see tenants created by root superadmin');
    console.log('  • Cannot modify other admins');
    console.log('');
    console.log('ℹ️  This admin was created by: superadmin@hotelzed.com');
    console.log('');
    console.log('🌐 Access URL:');
    console.log(`🖥️  Frontend: http://localhost:8082/superadmin`);

  } catch (error) {
    console.error('❌ Error creating delegated admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the script
if (require.main === module) {
  createDelegatedAdmin();
}

export default createDelegatedAdmin;