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

const checkUser = async () => {
  try {
    await connectDB();
    
    // Get the User collection directly
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    console.log('🔍 Searching for kimathichris15@gmail.com in zeduno database...\n');
    
    // Search for exact email match
    const exactUser = await usersCollection.findOne({ email: 'kimathichris15@gmail.com' });
    
    if (exactUser) {
      console.log('✅ FOUND USER (exact match):');
      console.log('📧 Email:', exactUser.email);
      console.log('👤 Name:', exactUser.firstName, exactUser.lastName);
      console.log('🔑 Role:', exactUser.role);
      console.log('🟢 Active:', exactUser.isActive);
      console.log('📅 Created:', exactUser.createdAt);
      console.log('🔐 Password Hash:', exactUser.password ? 'Present' : 'Missing');
      console.log('📊 Account Status:', exactUser.accountStatus);
    } else {
      console.log('❌ No exact match found');
      
      // Try case-insensitive search
      const caseInsensitiveUser = await usersCollection.findOne({ 
        email: { $regex: new RegExp('^kimathichris15@gmail.com$', 'i') } 
      });
      
      if (caseInsensitiveUser) {
        console.log('✅ FOUND USER (case-insensitive match):');
        console.log('📧 Email:', caseInsensitiveUser.email);
        console.log('👤 Name:', caseInsensitiveUser.firstName, caseInsensitiveUser.lastName);
      } else {
        // Show all users for debugging
        console.log('🔍 Let me show all users in the database:');
        const allUsers = await usersCollection.find({}).limit(10).toArray();
        console.log(`📊 Total users found: ${allUsers.length}`);
        allUsers.forEach((user, index) => {
          console.log(`${index + 1}. Email: ${user.email}, Name: ${user.firstName} ${user.lastName}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
};

checkUser();
