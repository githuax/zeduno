const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const mongoUri = 'mongodb://localhost:27017/zeduno';

async function createUser() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get the DAILY HOTEL tenant
    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
    const tenant = await Tenant.findOne({ email: 'dailyhotel@mail.com' });
    
    if (!tenant) {
      console.log('Tenant not found!');
      return;
    }

    console.log('Found tenant:', tenant.name);

    // Create new user
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const userData = {
      email: 'sarah@dailyhotel.com',
      password: await bcrypt.hash('sarah123', 10),
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'staff',  // or 'admin' if you want admin privileges
      tenantId: tenant._id,
      isActive: true,
      mustChangePassword: false,
      twoFactorEnabled: false,
      accountStatus: 'active',
      passwordLastChanged: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newUser = new User(userData);
    await newUser.save();

    // Update tenant user count
    await Tenant.findByIdAndUpdate(tenant._id, {
      currentUsers: tenant.currentUsers + 1,
      updatedAt: new Date()
    });

    console.log('New user created successfully!');
    console.log('Email:', userData.email);
    console.log('Password: sarah123');
    console.log('Role:', userData.role);
    console.log('Tenant:', tenant.name);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createUser();
