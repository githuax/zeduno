const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define schemas
const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  role: String,
  tenantId: mongoose.Schema.Types.ObjectId,
  isActive: Boolean,
}, { timestamps: true });

const tenantSchema = new mongoose.Schema({
  name: String,
  email: String,
  slug: String,
  plan: String,
  isActive: Boolean,
  paymentConfig: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Tenant = mongoose.model('Tenant', tenantSchema);

async function checkExistingData() {
  await connectDB();

  try {
    console.log('🏢 EXISTING TENANTS:');
    console.log('===================');
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    
    if (tenants.length === 0) {
      console.log('No tenants found.');
    } else {
      tenants.forEach((tenant, index) => {
        console.log(`${index + 1}. ${tenant.name}`);
        console.log(`   ID: ${tenant._id}`);
        console.log(`   Email: ${tenant.email}`);
        console.log(`   Slug: ${tenant.slug}`);
        console.log(`   Plan: ${tenant.plan}`);
        console.log(`   Active: ${tenant.isActive}`);
        console.log(`   M-Pesa Enabled: ${tenant.paymentConfig?.mpesa?.enabled || false}`);
        console.log('');
      });
    }

    console.log('👥 EXISTING USERS:');
    console.log('==================');
    const users = await User.find().populate('tenantId').sort({ createdAt: -1 });
    
    if (users.length === 0) {
      console.log('No users found.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Tenant: ${user.tenantId?.name || 'No tenant'} (${user.tenantId?._id || 'N/A'})`);
        console.log('');
      });
    }

    // Find dama@mail.com specifically
    console.log('🔍 LOOKING FOR dama@mail.com:');
    console.log('=============================');
    const damaUser = await User.findOne({ email: 'dama@mail.com' }).populate('tenantId');
    
    if (damaUser) {
      console.log('✅ Found dama@mail.com user:');
      console.log(`   Name: ${damaUser.firstName} ${damaUser.lastName}`);
      console.log(`   Role: ${damaUser.role}`);
      console.log(`   Active: ${damaUser.isActive}`);
      console.log(`   Tenant: ${damaUser.tenantId?.name || 'No tenant assigned'}`);
      console.log(`   Tenant ID: ${damaUser.tenantId?._id || 'N/A'}`);
    } else {
      console.log('❌ dama@mail.com user not found');
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkExistingData();
