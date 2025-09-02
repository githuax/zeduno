const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotelzed_dev');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// User schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String,
  isActive: Boolean
}, { timestamps: true });

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const testPasswords = async () => {
  try {
    await connectDB();
    
    const User = mongoose.model('User', userSchema);
    
    const user = await User.findOne({ 
      email: 'superadmin@zeduno.com',
      role: 'superadmin'
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 Found user:', user.email);
    console.log('🔐 Password hash (first 20 chars):', user.password.substring(0, 20) + '...');
    
    // Test common passwords
    const testPasswords = [
      'SuperAdmin@123',
      'superadmin@123',
      'SuperAdmin123',
      'superadmin',
      'password',
      'admin',
      '123456',
      'SuperAdmin@2024',
      'SuperAdmin@2025'
    ];
    
    console.log('\\n🔍 Testing common passwords...');
    
    for (const pwd of testPasswords) {
      const isValid = await user.comparePassword(pwd);
      if (isValid) {
        console.log(`✅ FOUND CORRECT PASSWORD: "${pwd}"`);
        return pwd;
      } else {
        console.log(`❌ "${pwd}" - No match`);
      }
    }
    
    console.log('\\n❌ None of the test passwords matched');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

testPasswords();
