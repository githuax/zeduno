const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const mongoUri = 'mongodb://localhost:27017/zeduno';

async function resetPassword() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find the user
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'dailyhotel@mail.com' });
    
    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('Found user:', user.firstName, user.lastName);

    // Hash new password
    const newPassword = 'dailyhotel123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      passwordLastChanged: new Date(),
      updatedAt: new Date()
    });

    console.log('Password reset successfully!');
    console.log('New password:', newPassword);
    console.log('Email:', user.email);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetPassword();
