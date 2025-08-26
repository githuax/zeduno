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

const testSuperAdminLogin = async () => {
  try {
    await connectDB();
    
    // Use the same schema as in your User model
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      role: { type: String, enum: ['superadmin', 'admin', 'manager', 'staff', 'customer'], default: 'customer' },
      tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
      isActive: { type: Boolean, default: true },
      mustChangePassword: { type: Boolean, default: false },
      accountStatus: { type: String, enum: ['active', 'locked', 'suspended'], default: 'active' }
    }, { timestamps: true });
    
    // Add comparePassword method
    userSchema.methods.comparePassword = async function(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };
    
    const User = mongoose.model('User', userSchema);
    
    // Find the superadmin user
    const superAdmin = await User.findOne({ 
      email: 'superadmin@zeduno.com',
      role: 'superadmin' 
    });
    
    if (!superAdmin) {
      console.log('❌ SuperAdmin not found!');
      return;
    }
    
    console.log('✅ SuperAdmin found:');
    console.log('Email:', superAdmin.email);
    console.log('Role:', superAdmin.role);
    console.log('Active:', superAdmin.isActive);
    console.log('Password hash (first 20 chars):', superAdmin.password.substring(0, 20) + '...');
    
    // Test password comparison
    const testPassword = 'SuperAdmin@123';
    const isPasswordValid = await superAdmin.comparePassword(testPassword);
    
    console.log('');
    console.log('🔐 Password Test:');
    console.log('Test password:', testPassword);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('');
      console.log('🔧 Testing direct bcrypt comparison:');
      const directCompare = await bcrypt.compare(testPassword, superAdmin.password);
      console.log('Direct bcrypt compare:', directCompare);
      
      // Let's test with a known hash
      console.log('');
      console.log('🧪 Creating test hash:');
      const testHash = await bcrypt.hash(testPassword, 10);
      console.log('Test hash:', testHash);
      const testCompare = await bcrypt.compare(testPassword, testHash);
      console.log('Test hash comparison:', testCompare);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

testSuperAdminLogin();