const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to the zeduno database
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
  role: { type: String, enum: ['admin', 'manager', 'staff', 'superadmin', 'customer'], default: 'customer' },
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

// Add comparePassword method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const createRegularUser = async () => {
  try {
    await connectDB();
    
    const User = mongoose.model('User', userSchema);
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: 'dama@mail.com' 
    });
    
    if (existingUser) {
      console.log('✅ User already exists!');
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      console.log('Active:', existingUser.isActive);
      return;
    }
    
    // Create new regular user
    const user = new User({
      email: 'dama@mail.com',
      firstName: 'Dama',
      lastName: 'User',
      password: 'password123', // This will be hashed by the pre-save hook
      role: 'customer',
      isActive: true,
      mustChangePassword: false,
      accountStatus: 'active'
    });
    
    await user.save();
    
    console.log('✅ Regular user created successfully!');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('📧 Email: dama@mail.com');
    console.log('🔑 Password: password123');
    console.log('👤 Role: customer');
    console.log('');
    console.log('🌐 Access URL: http://192.168.2.43:8080/login');
    console.log('');
    console.log('✨ You can now login with these credentials!');
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

createRegularUser();
