import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import mongoose from 'mongoose';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/restaurant_db?authSource=admin';

const resetDelegatedAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔌 Connected to MongoDB');

    const { User } = require('../models/User');
    const { SuperAdmin } = require('../models/SuperAdmin');
    
    // Find the root superadmin first
    const rootSuperAdmin = await mongoose.connection.db
      .collection('superadmins')
      .findOne({ email: 'superadmin@hotelzed.com' });
    
    if (!rootSuperAdmin) {
      console.log('❌ Root superadmin not found. Please run seedSuperAdmin.ts first.');
      return;
    }

    // Delete existing delegated admin
    const deleteResult = await User.deleteMany({ 
      email: 'admin@hotelzed.com' 
    });
    
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing admin account(s)`);
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
    console.log('  • Cannot delete or modify root superadmin tenants');
    console.log('');
    console.log('ℹ️  This admin was created by: superadmin@hotelzed.com');
    console.log('');
    console.log('🌐 To test the hierarchy:');
    console.log('  1. Login as admin@hotelzed.com');
    console.log('  2. Create a new tenant');
    console.log('  3. Login as superadmin@hotelzed.com');
    console.log('  4. You will see all tenants');
    console.log('  5. Login back as admin@hotelzed.com');
    console.log('  6. You will only see the tenant you created');

  } catch (error) {
    console.error('❌ Error creating delegated admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the script
if (require.main === module) {
  resetDelegatedAdmin();
}

export default resetDelegatedAdmin;