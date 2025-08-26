const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const userSchema = new mongoose.Schema({
      email: String,
      firstName: String,
      lastName: String,
      role: String,
      isActive: Boolean
    });
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    const users = await User.find().select('email firstName lastName role isActive');
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`- ${user.email}: ${user.firstName} ${user.lastName} (Role: ${user.role}, Active: ${user.isActive})`);
    });
    
    console.log(`\nTotal users: ${users.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();