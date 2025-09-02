const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('✅ Connected to zeduno database');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const deleteOrphanedUser = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // First, find the user to confirm it exists
    const userToDelete = await usersCollection.findOne({ email: 'marks@mark.com' });
    
    if (!userToDelete) {
      console.log('❌ User marks@mark.com not found in database');
      return;
    }
    
    console.log('🔍 FOUND USER TO DELETE:');
    console.log('📧 Email:', userToDelete.email);
    console.log('👤 Name:', userToDelete.firstName, userToDelete.lastName);
    console.log('🔑 Role:', userToDelete.role);
    console.log('🏢 Tenant ID:', userToDelete.tenantId);
    console.log('📅 Created:', userToDelete.createdAt);
    console.log('');
    
    // Delete the user
    const deleteResult = await usersCollection.deleteOne({ email: 'marks@mark.com' });
    
    if (deleteResult.deletedCount === 1) {
      console.log('✅ SUCCESS! Orphaned user marks@mark.com has been deleted');
      console.log('🗑️  User removed from database');
      
      // Show remaining users
      console.log('\n👥 REMAINING USERS IN DATABASE:');
      const remainingUsers = await usersCollection.find({}).toArray();
      remainingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - Role: ${user.role}`);
      });
      
    } else {
      console.log('❌ Failed to delete user');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
};

deleteOrphanedUser();
