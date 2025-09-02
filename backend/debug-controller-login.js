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

// Exact User schema from the backend
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'staff', 'customer'],
    default: 'customer',
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  mustChangePassword: {
    type: Boolean,
    default: false,
  },
  passwordLastChanged: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  accountStatus: {
    type: String,
    enum: ['active', 'locked', 'suspended'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Pre-save middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordLastChanged = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const testControllerLogin = async () => {
  try {
    await connectDB();
    
    const User = mongoose.model('User', userSchema);
    
    const email = 'superadmin@zeduno.com';
    const password = 'SuperAdmin@123';
    
    console.log('🔍 Testing controller logic...');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    
    // First check SuperAdmin model (will fail)
    let superAdmin = null;
    try {
      console.log('🔍 Trying SuperAdmin model...');
      // This will fail as expected
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
      isActive: superAdmin.isActive,
      hasComparePasswordMethod: typeof superAdmin.comparePassword === 'function'
    });

    // Verify password
    console.log('🔑 Testing password comparison...');
    const isPasswordValid = await superAdmin.comparePassword(password);
    console.log('✅ Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password validation failed');
      return;
    }

    if (!superAdmin.isActive) {
      console.log('❌ Account is inactive');
      return;
    }

    console.log('🎉 Login would be successful!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

testControllerLogin();
