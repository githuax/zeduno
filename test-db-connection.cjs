const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const testConnection = async () => {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    if (!process.env.MONGODB_URI) {
      console.log('Error: MONGODB_URI not set in environment');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connection successful');
    
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String,
      role: String,
      isActive: Boolean,
      firstName: String,
      lastName: String,
      tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }
    }));
    
    const count = await User.countDocuments();
    console.log('Total users in database:', count);
    
    // Test specific users
    const adminUser = await User.findOne({ email: 'admin@demo.com' });
    console.log('admin@demo.com found:', adminUser ? 'Yes' : 'No');
    
    const oneUser = await User.findOne({ email: 'one@gmail.com' });
    console.log('one@gmail.com found:', oneUser ? 'Yes' : 'No');
    if (oneUser) {
      console.log('User details:', {
        email: oneUser.email,
        role: oneUser.role,
        isActive: oneUser.isActive,
        hasPassword: !!oneUser.password
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

testConnection();