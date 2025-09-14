import { config } from 'dotenv';
import mongoose from 'mongoose';

import { User } from '../models/User';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const resetPassword = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'userone@mail.com' });
    
    if (user) {
      console.log('User found, resetting password...');
      
      // Update password - this will trigger the pre-save hook that hashes the password
      user.password = 'Pass@1234';
      await user.save();
      
      console.log('Password reset successfully!');
      
      // Test the password
      const isPasswordValid = await user.comparePassword('Pass@1234');
      console.log('Password "Pass@1234" is valid:', isPasswordValid);
      
    } else {
      console.log('User with email userone@mail.com not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

resetPassword();
