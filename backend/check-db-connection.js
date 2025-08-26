const mongoose = require('mongoose');

const checkDBs = async () => {
  try {
    // Check both databases
    const databases = [
      'mongodb://localhost:27017/zeduno',
      'mongodb://localhost:27017/hotelzed_dev'
    ];
    
    for (const dbUri of databases) {
      console.log(`\n=== Checking ${dbUri} ===`);
      await mongoose.connect(dbUri);
      
      const userSchema = new mongoose.Schema({
        email: String,
        role: String,
        firstName: String,
        lastName: String,
        isActive: Boolean
      });
      
      const User = mongoose.model('User', userSchema);
      const users = await User.find({}, 'email role firstName lastName isActive').limit(5);
      
      console.log(`Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - Active: ${user.isActive}`);
      });
      
      // Look specifically for superadmin
      const superadmin = await User.findOne({ email: 'superadmin@zeduno.com' });
      console.log('Superadmin found:', superadmin ? 'YES' : 'NO');
      
      await mongoose.connection.close();
      
      // Clear the model cache
      delete mongoose.models.User;
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

checkDBs();