const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Find Charles Mutai's user
    const user = await User.findOne({ email: 'charlesmutai@mail.com' });
    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('Found user:', user.firstName, user.lastName);

    // Hash the correct password: Pass@1234
    const correctPassword = 'Pass@1234';
    const hashedPassword = await bcrypt.hash(correctPassword, 10);

    // Update password
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      passwordLastChanged: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Password updated successfully!');
    console.log('Email:', user.email);
    console.log('Password: Pass@1234');
    console.log('Tenant: MANSA HOTEL');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixPassword();
