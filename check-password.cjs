const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function checkPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    
    const user = await mongoose.connection.db.collection('users').findOne({
      email: 'marks@mark.com'
    });
    
    if (user) {
      console.log('👤 Found user:', user.email);
      console.log('🔐 Password hash (first 20 chars):', user.password.substring(0, 20) + '...');
      
      // Test the password
      const testPassword = 'restaurant123';
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('🧪 Password test result for "restaurant123":', isValid);
      
      if (!isValid) {
        console.log('❌ Password mismatch! Testing variations...');
        
        // Test common variations
        const variations = ['restaurant123', 'Restaurant123', 'password123', 'admin123'];
        for (const pwd of variations) {
          const testResult = await bcrypt.compare(pwd, user.password);
          if (testResult) {
            console.log('✅ FOUND WORKING PASSWORD:', pwd);
            break;
          } else {
            console.log('❌', pwd, '- No match');
          }
        }
      }
    } else {
      console.log('❌ User not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

checkPassword();
