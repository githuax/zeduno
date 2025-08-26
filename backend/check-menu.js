const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    // Import MenuItem model
    const MenuItemSchema = new mongoose.Schema({
      name: String,
      category: String,
      price: Number,
      tenantId: mongoose.Schema.Types.ObjectId
    }, { collection: 'menuitems' });
    
    const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
    
    // Find menu items
    const menuItems = await MenuItem.find({}).limit(5);
    console.log('\nFound menu items:');
    menuItems.forEach(item => {
      console.log(`ID: ${item._id}, Name: ${item.name}, Price: $${item.price}`);
    });

    if (menuItems.length === 0) {
      console.log('No menu items found. Creating a test menu item...');
      
      const testMenuItem = new MenuItem({
        name: 'Test Pizza',
        category: 'Main Course',
        price: 12.99,
        tenantId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012')
      });
      
      await testMenuItem.save();
      console.log(`Created test menu item with ID: ${testMenuItem._id}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
};

connectDB();