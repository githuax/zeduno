const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['customer', 'staff', 'admin', 'superadmin'], default: 'customer' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  isActive: { type: Boolean, default: true },
  phoneNumber: String,
  dateOfBirth: Date,
  profileImage: String,
  preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  lastLogin: Date,
  twoFactorEnabled: { type: Boolean, default: false },
  accountStatus: { type: String, enum: ['active', 'locked', 'suspended'], default: 'active' },
}, {
  timestamps: true,
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Tenant Schema
const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  plan: { type: String, enum: ['basic', 'premium', 'enterprise'], default: 'basic' },
  maxUsers: { type: Number, default: 5 },
  address: String,
  phone: String,
  contactPerson: String,
  description: String,
  logo: String,
  website: String,
  isActive: { type: Boolean, default: true },
  settings: {
    currency: { type: String, default: 'KES' },
    timezone: { type: String, default: 'Africa/Nairobi' },
    language: { type: String, default: 'en' },
    businessType: { type: String, default: 'restaurant' }
  },
  features: {
    dineIn: { type: Boolean, default: true },
    takeaway: { type: Boolean, default: true },
    delivery: { type: Boolean, default: false },
    roomService: { type: Boolean, default: false },
    hotelBooking: { type: Boolean, default: false }
  },
  paymentConfig: {
    mpesa: {
      enabled: { type: Boolean, default: false },
      environment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
      accountType: { type: String, enum: ['till', 'paybill'], default: 'till' },
      tillNumber: String,
      paybillNumber: String,
      businessShortCode: String,
      passkey: String,
      consumerKey: String,
      consumerSecret: String
    },
    stripe: {
      enabled: { type: Boolean, default: false },
      publicKey: String,
      secretKey: String,
      webhookSecret: String
    },
    square: {
      enabled: { type: Boolean, default: false },
      applicationId: String,
      accessToken: String
    },
    cash: {
      enabled: { type: Boolean, default: true }
    }
  },
  subscriptionStatus: { type: String, enum: ['trial', 'active', 'expired', 'cancelled'], default: 'trial' },
  trialEndsAt: Date,
  subscriptionEndsAt: Date,
  billingInfo: {
    address: String,
    city: String,
    country: String,
    taxId: String
  }
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);
const Tenant = mongoose.model('Tenant', tenantSchema);

async function createTenantWithMpesa() {
  await connectDB();

  try {
    // Create the tenant
    const tenantData = {
      name: "Demo Restaurant",
      email: 'admin@demo-restaurant.com',
      slug: 'demo-restaurant',
      plan: 'premium',
      maxUsers: 20,
      address: '123 Demo Street, Nairobi, Kenya',
      phone: '+254712345678',
      contactPerson: 'Demo Admin',
      description: 'Demo restaurant for testing M-Pesa integration',
      settings: {
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        language: 'en',
        businessType: 'restaurant'
      },
      features: {
        dineIn: true,
        takeaway: true,
        delivery: true,
        roomService: false,
        hotelBooking: false
      },
      paymentConfig: {
        mpesa: {
          enabled: true,
          environment: 'sandbox',
          accountType: 'till',
          tillNumber: '174379',
          businessShortCode: '174379',
          passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
          consumerKey: 'YOUR_MPESA_CONSUMER_KEY',
          consumerSecret: 'YOUR_MPESA_CONSUMER_SECRET'
        },
        stripe: { enabled: false },
        square: { enabled: false },
        cash: { enabled: true }
      }
    };

    // Check if tenant already exists
    let tenant = await Tenant.findOne({ email: tenantData.email });
    if (!tenant) {
      tenant = new Tenant(tenantData);
      await tenant.save();
      console.log('✅ Demo tenant created successfully');
    } else {
      // Update existing tenant with M-Pesa config
      tenant.paymentConfig = tenantData.paymentConfig;
      await tenant.save();
      console.log('✅ Demo tenant M-Pesa configuration updated');
    }

    // Create admin user for this tenant
    const adminData = {
      email: 'admin@demo-restaurant.com',
      password: await bcrypt.hash('DemoAdmin@123', 10),
      firstName: 'Demo',
      lastName: 'Admin',
      role: 'admin',
      tenantId: tenant._id,
      isActive: true,
      phoneNumber: '+254712345678'
    };

    let adminUser = await User.findOne({ email: adminData.email });
    if (!adminUser) {
      adminUser = new User(adminData);
      await adminUser.save();
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('');
    console.log('🎉 SETUP COMPLETE! 🎉');
    console.log('========================');
    console.log('🏢 Tenant Name:', tenant.name);
    console.log('🆔 Tenant ID:', tenant._id);
    console.log('📧 Admin Email:', adminData.email);
    console.log('🔐 Admin Password: DemoAdmin@123');
    console.log('💳 M-Pesa Status: Enabled (Sandbox)');
    console.log('🏦 Account Type: Till');
    console.log('🔢 Till Number:', tenant.paymentConfig.mpesa.tillNumber);
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Update M-Pesa Consumer Key and Consumer Secret in the database');
    console.log('2. Login to the frontend with admin credentials');
    console.log('3. Go to Payment Settings to verify M-Pesa configuration');
    console.log('4. Test payment flow with a real phone number');
    
    return {
      tenant,
      adminCredentials: {
        email: adminData.email,
        password: 'DemoAdmin@123'
      }
    };

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTenantWithMpesa();
