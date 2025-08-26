const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotelzed_dev', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  password: String,
  role: String,
  isActive: Boolean,
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }
}, { timestamps: true });

// SuperAdmin schema (if exists)
const superAdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String, 
  password: String,
  isActive: Boolean,
  permissions: [String]
}, { timestamps: true });

const checkSuperAdmin = async () => {
  try {
    await connectDB();
    
    const User = mongoose.model('User', userSchema);
    
    // Check for superadmin in User collection
    const superAdminUser = await User.findOne({ 
      email: 'superadmin@zeduno.com',
      role: 'superadmin' 
    });
    
    console.log('SuperAdmin user in User collection:', superAdminUser ? 'Found' : 'Not found');
    if (superAdminUser) {
      console.log('SuperAdmin details:', {
        email: superAdminUser.email,
        firstName: superAdminUser.firstName,
        lastName: superAdminUser.lastName,
        role: superAdminUser.role,
        isActive: superAdminUser.isActive,
        id: superAdminUser._id
      });
    }
    
    // Try SuperAdmin collection
    try {
      const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);
      const superAdmin = await SuperAdmin.findOne({ email: 'superadmin@zeduno.com' });
      console.log('SuperAdmin in SuperAdmin collection:', superAdmin ? 'Found' : 'Not found');
      if (superAdmin) {
        console.log('SuperAdmin details:', {
          email: superAdmin.email,
          firstName: superAdmin.firstName,
          lastName: superAdmin.lastName,
          isActive: superAdmin.isActive,
          id: superAdmin._id
        });
      }
    } catch (error) {
      console.log('SuperAdmin collection does not exist or error accessing it');
    }
    
    // List all users to see what's available
    const allUsers = await User.find({}, 'email firstName lastName role isActive').limit(10);
    console.log('\nAll users (first 10):');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.role} - Active: ${user.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

checkSuperAdmin();