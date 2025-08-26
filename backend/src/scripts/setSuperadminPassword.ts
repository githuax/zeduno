import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { User } from '../models/User';

// Load environment variables
dotenv.config();

const setSuperadminPassword = async () => {
  try {
    await connectDB();
    
    // Find the superadmin user
    const superadmin = await User.findOne({ email: 'superadmin@hotelzed.com' });
    
    if (!superadmin) {
      console.log('Superadmin user not found');
      process.exit(1);
    }
    
    // Set a known password
    superadmin.password = 'superadmin123';
    await superadmin.save();
    
    console.log('Superadmin password set to: superadmin123');
    console.log('Email: superadmin@hotelzed.com');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting superadmin password:', error);
    process.exit(1);
  }
};

setSuperadminPassword();