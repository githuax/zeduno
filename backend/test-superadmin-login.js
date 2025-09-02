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

// User schema (matches your User model)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'staff', 'superadmin'], default: 'staff' },
  isActive: { type: Boolean, default: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  mustChangePassword: { type: Boolean, default: false },
  accountStatus: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended', 'pending'], 
    default: 'active' 
  },
  lastLogin: Date
}, { 
  timestamps: true
});

// Add comparePassword method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const testSuperAdminLogin = async () => {
  try {
    await connectDB();
    
    const User = mongoose.model('User', userSchema);
    
    // Find the superadmin user
    const superAdmin = await User.findOne({ 
      email: 'superadmin@zeduno.com',
      role: 'superadmin' 
    });
    
    if (!superAdmin) {
      console.log('❌ SuperAdmin user not found');
      return;
    }
    
    console.log('✅ SuperAdmin user found:', {
      email: superAdmin.email,
      role: superAdmin.role,
      isActive: superAdmin.isActive,
      hasPassword: !!superAdmin.password,
      passwordLength: superAdmin.password ? superAdmin.password.length : 0
    });
    
    // Test password comparison
    const testPassword = 'SuperAdmin@123';
    console.log('🔑 Testing password:', testPassword);
    
    try {
      const isPasswordValid = await superAdmin.comparePassword(testPassword);
      console.log('✅ Password comparison result:', isPasswordValid);
      
      // Also test manual bcrypt comparison
      const manualTest = await bcrypt.compare(testPassword, superAdmin.password);
      console.log('✅ Manual bcrypt test:', manualTest);
      
      // Show hashed password for debugging
      console.log('🔐 Stored password hash:', superAdmin.password.substring(0, 60) + '...');
      
      // Test if password is actually hashed
      console.log('🔍 Is password hashed?:', superAdmin.password.startsWith('$2'));
      
    } catch (passwordError) {
      console.error('❌ Password comparison error:', passwordError);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

testSuperAdminLogin();
