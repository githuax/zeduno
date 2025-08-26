const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find and update the user back to admin role
    const result = await usersCollection.updateOne(
      { email: 'irungumill@mail.com' },
      { 
        $set: { 
          role: 'admin',  // Change back to admin from superadmin
          isActive: true
        }
      }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const updatedUser = await usersCollection.findOne({ email: 'irungumill@mail.com' });
    console.log('Updated user:', {
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      tenant: updatedUser.tenant || updatedUser.tenantId
    });
    
    console.log('\n✅ User role reverted to admin (from superadmin)');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });