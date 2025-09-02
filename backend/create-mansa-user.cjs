const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
    
    // Get MANSA HOTEL tenant
    const tenant = await Tenant.findOne({ email: 'charlesmutai@mail.com' });
    if (!tenant) {
      console.log('Tenant not found!');
      return;
    }

    // Create user for this tenant
    const userData = {
      email: 'charlesmutai@mail.com',
      password: await bcrypt.hash('charles123', 10),
      firstName: 'Charles',
      lastName: 'Mutai',
      role: 'admin',
      tenantId: tenant._id,
      isActive: true,
      mustChangePassword: false,
      twoFactorEnabled: false,
      accountStatus: 'active',
      passwordLastChanged: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const user = new User(userData);
    await user.save();

    // Update tenant user count
    await Tenant.findByIdAndUpdate(tenant._id, {
      currentUsers: tenant.currentUsers + 1
    });

    console.log('✅ User created successfully!');
    console.log('Email: charlesmutai@mail.com');
    console.log('Password: charles123');
    console.log('Tenant: MANSA HOTEL');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createUser();
