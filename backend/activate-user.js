const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find the user
    const user = await usersCollection.findOne({ email: 'irungumill@mail.com' });
    
    if (user) {
      console.log('Current user status:', {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        accountStatus: user.accountStatus
      });
      
      // Update user to be active
      const result = await usersCollection.updateOne(
        { email: 'irungumill@mail.com' },
        { 
          $set: { 
            isActive: true,
            accountStatus: 'active'
          }
        }
      );
      
      console.log('Update result:', result);
      
      // Verify the update
      const updatedUser = await usersCollection.findOne({ email: 'irungumill@mail.com' });
      console.log('Updated user status:', {
        email: updatedUser.email,
        isActive: updatedUser.isActive,
        accountStatus: updatedUser.accountStatus
      });
    } else {
      console.log('User not found with email: irungumill@mail.com');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });