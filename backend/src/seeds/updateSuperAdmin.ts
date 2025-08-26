import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const updateSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Check if superadmin exists
    let superadmin = await User.findOne({ email: 'superadmin@zeduno.com' });
    
    if (!superadmin) {
      // Create new superadmin
      superadmin = await User.create({
        email: 'superadmin@zeduno.com',
        password: 'SuperAdmin@123',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        isActive: true,
        mustChangePassword: false,
      });
      console.log('✅ Superadmin account created successfully!');
    } else {
      // Update existing superadmin password
      superadmin.password = 'SuperAdmin@123';
      superadmin.isActive = true;
      superadmin.mustChangePassword = false;
      await superadmin.save();
      console.log('✅ Superadmin password updated successfully!');
    }

    console.log('\n🔐 SUPERADMIN CREDENTIALS:');
    console.log('   Email: superadmin@zeduno.com');
    console.log('   Password: SuperAdmin@123');
    console.log('\n✅ You can now login with these credentials at http://localhost:8080/login');
    
  } catch (error) {
    console.error('❌ Error updating superadmin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the update function
updateSuperAdmin();