const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to the correct database that the backend uses
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('MongoDB connected successfully to zeduno database');
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const createSuperAdmin = async () => {
  try {
    await connectDB();
    
    const User = mongoose.model('User', userSchema);
    
    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ 
      email: 'superadmin@zeduno.com' 
    });
    
    if (existingSuperAdmin) {
      console.log('✅ SuperAdmin already exists in zeduno database!');
      console.log('Email:', existingSuperAdmin.email);
      console.log('Role:', existingSuperAdmin.role);
      console.log('Active:', existingSuperAdmin.isActive);
      return;
    }
    
    // Create new superadmin
    const superAdmin = new User({
      email: 'superadmin@zeduno.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: 'SuperAdmin@123', // This will be hashed by the pre-save hook
      role: 'superadmin',
      isActive: true,
      mustChangePassword: false,
      accountStatus: 'active'
    });
    
    await superAdmin.save();
    
    console.log('✅ SuperAdmin created successfully in zeduno database!');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('📧 Email: superadmin@zeduno.com');
    console.log('🔑 Password: SuperAdmin@123');
    console.log('');
    console.log('🌐 Access URL: http://192.168.2.43:8080/login');
    console.log('');
    console.log('✨ You can now login with these credentials!');
    
  } catch (error) {
    console.error('❌ Error creating SuperAdmin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

createSuperAdmin();
