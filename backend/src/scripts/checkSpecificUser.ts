import mongoose from 'mongoose';
import { User } from '../models/User';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const checkUser = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user exists
    const user = await User.findOne({ email: 'userone@mail.com' });
    
    if (user) {
      console.log('User found:');
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Active:', user.isActive);
      console.log('TenantId:', user.tenantId);
      console.log('Password hash (first 20 chars):', user.password.substring(0, 20));
      
      // Test password comparison
      const isPasswordValid = await user.comparePassword('Pass@1234');
      console.log('Password "Pass@1234" is valid:', isPasswordValid);
    } else {
      console.log('User with email userone@mail.com not found');
      
      // List all users
      const allUsers = await User.find({});
      console.log('\nAll users in database:');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.role}) - Active: ${u.isActive}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

checkUser();
