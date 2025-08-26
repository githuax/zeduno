const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('MongoDB connected to zeduno database successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTipsyBearAdmin = async () => {
  try {
    await connectDB();
    
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
      timestamps: true,
      methods: {
        async comparePassword(candidatePassword) {
          return bcrypt.compare(candidatePassword, this.password);
        }
      }
    });
    
    // Hash password before saving
    userSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      this.password = await bcrypt.hash(this.password, 10);
      next();
    });
    
    const User = mongoose.model('User', userSchema);
    
    // Get TIPSY BEAR tenant
    const tenantSchema = new mongoose.Schema({}, { strict: false });
    const Tenant = mongoose.model('Tenant', tenantSchema);
    
    const tipsyBearTenant = await Tenant.findOne({
      name: 'TIPSY BEAR'
    });
    
    if (!tipsyBearTenant) {
      console.log('❌ TIPSY BEAR tenant not found');
      return;
    }
    
    console.log('✅ Found TIPSY BEAR tenant:', tipsyBearTenant.name);
    console.log('Tenant ID:', tipsyBearTenant._id);
    
    // Check if admin user already exists
    const existingUser = await User.findOne({ 
      email: 'admin@tipsybear.com' 
    });
    
    if (existingUser) {
      console.log('❌ User admin@tipsybear.com already exists');
      console.log('User details:', {
        email: existingUser.email,
        name: `${existingUser.firstName} ${existingUser.lastName}`,
        role: existingUser.role,
        active: existingUser.isActive,
        tenantId: existingUser.tenantId
      });
      return;
    }
    
    // Create admin user for TIPSY BEAR
    const adminUser = new User({
      email: 'admin@tipsybear.com',
      firstName: 'Tipsy',
      lastName: 'Admin',
      password: 'TipsyAdmin@123', // This will be hashed by the pre-save hook
      role: 'admin',
      isActive: true,
      tenantId: tipsyBearTenant._id,
      mustChangePassword: false,
      accountStatus: 'active'
    });
    
    await adminUser.save();
    
    console.log('✅ Admin user created successfully for TIPSY BEAR!');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('📧 Email: admin@tipsybear.com');
    console.log('🔑 Password: TipsyAdmin@123');
    console.log('🏢 Tenant: TIPSY BEAR');
    console.log('👤 Role: admin');
    console.log('');
    console.log('🌐 You can now login at: http://localhost:8081/login');
    
    // Update tenant user count
    const userCount = await User.countDocuments({ 
      tenantId: tipsyBearTenant._id, 
      isActive: true 
    });
    
    await Tenant.updateOne(
      { _id: tipsyBearTenant._id },
      { currentUsers: userCount }
    );
    
    console.log(`📊 Updated tenant user count to: ${userCount}`);
    
  } catch (error) {
    if (error.code === 11000) {
      console.log('❌ User with this email already exists');
    } else {
      console.error('❌ Error creating user:', error);
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

createTipsyBearAdmin();