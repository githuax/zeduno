const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Define User schema
    const userSchema = new mongoose.Schema({
      email: String,
      password: String,
      firstName: String,
      lastName: String,
      passwordLastChanged: Date
    });
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    const email = 'irungumill@mail.com';
    const newPassword = 'Pass@12345';
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User ${email} not found`);
      return;
    }
    
    console.log(`Found user: ${user.firstName} ${user.lastName}`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    user.password = hashedPassword;
    user.passwordLastChanged = new Date();
    await user.save();
    
    console.log(`✅ Password updated successfully for ${email}`);
    console.log(`New password: ${newPassword}`);
    
    // Test the password
    const isMatch = await bcrypt.compare(newPassword, user.password);
    console.log(`Password verification: ${isMatch ? '✅ Success' : '❌ Failed'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetPassword();