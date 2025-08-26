import mongoose from 'mongoose';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotelzed');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createUser = async () => {
  try {
    await connectDB();

    const existingUser = await User.findOne({ email: 'test@admin.com' });
    if (existingUser) {
      console.log('User test@admin.com already exists');
    } else {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        email: 'test@admin.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin',
        tenantId: new mongoose.Types.ObjectId('68a3482a71c76229ad426408'),
        isActive: true
      });
      console.log('User created: test@admin.com / password123');
    }

    const allUsers = await User.find({});
    console.log('All users:');
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createUser();
