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
  console.log('🔍 comparePassword called with:', candidatePassword);
  console.log('🔐 Stored hash:', this.password);
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log('🎯 Comparison result:', result);
  return result;
};

const testLoginFlow = async () => {
  try {
    await connectDB();
    
    const User = mongoose.model('User', userSchema);
    
    // Simulate the exact controller logic
    const email = 'superadmin@zeduno.com';
    const password = 'SuperAdmin@123'; // Try with correct password
    
    console.log('🔍 SuperAdmin login attempt for:', email);
    console.log('🔑 Password being tested:', password);

    // First check SuperAdmin model (will fail as expected)
    let superAdmin = null;
    try {
      console.log('🔍 Trying SuperAdmin model...');
      // This will fail as expected - no SuperAdmin collection
      const SuperAdmin = mongoose.model('SuperAdmin', new mongoose.Schema({}));
      superAdmin = await SuperAdmin.findOne({ 
        $or: [
          { email: email },
          { username: email }
        ]
      });
      console.log('SuperAdmin model search result:', superAdmin ? 'Found' : 'Not found');
    } catch (error) {
      console.log('SuperAdmin model error (expected):', error.message);
    }

    // Check User model with superadmin role
    if (!superAdmin) {
      console.log('🔍 Trying User model...');
      superAdmin = await User.findOne({ 
        email: email,
        role: 'superadmin'
      });
      console.log('User model search result:', superAdmin ? 'Found' : 'Not found');
    }

    if (!superAdmin) {
      console.log('❌ No superadmin user found for email:', email);
      return;
    }

    console.log('✅ Found superadmin:', {
      email: superAdmin.email,
      role: superAdmin.role,
      isActive: superAdmin.isActive
    });

    // Verify password - this is the critical step
    console.log('\\n🔑 Testing password validation...');
    const isPasswordValid = await superAdmin.comparePassword(password);
    console.log('✅ Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ PASSWORD VALIDATION FAILED - Invalid credentials would be returned');
      return;
    }

    if (!superAdmin.isActive) {
      console.log('❌ Account is inactive');
      return;
    }

    console.log('🎉 Login should succeed!');
    
  } catch (error) {
    console.error('❌ Error in login flow:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Test with wrong password too
const testWithWrongPassword = async () => {
  try {
    await connectDB();
    
    const User = mongoose.model('User', userSchema);
    
    const email = 'superadmin@zeduno.com';
    const wrongPassword = 'WrongPassword123';
    
    console.log('\\n\\n🔍 Testing with WRONG password...');
    console.log('📧 Email:', email);
    console.log('❌ Wrong password:', wrongPassword);
    
    const superAdmin = await User.findOne({ 
      email: email,
      role: 'superadmin'
    });
    
    if (superAdmin) {
      const isPasswordValid = await superAdmin.comparePassword(wrongPassword);
      console.log('❌ Password validation result (should be false):', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('✅ Correctly rejected wrong password');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run tests
console.log('=== Testing with CORRECT password ===');
testLoginFlow().then(() => {
  console.log('\\n=== Testing with WRONG password ===');
  return testWithWrongPassword();
});
