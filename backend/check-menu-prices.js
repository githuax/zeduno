const mongoose = require('mongoose');
require('dotenv').config();

async function checkMenuPrices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Define MenuItem schema
    const menuItemSchema = new mongoose.Schema({
      name: String,
      price: Number,
      tenantId: mongoose.Schema.Types.ObjectId
    }, { strict: false });
    
    const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
    
    // Get all menu items
    const menuItems = await MenuItem.find({}).limit(10);
    console.log(`\nFound ${menuItems.length} menu items (showing first 10):\n`);
    
    // USD to KES conversion rate (approximate)
    const USD_TO_KES = 150; // 1 USD = ~150 KES
    
    menuItems.forEach(item => {
      console.log(`Item: ${item.name}`);
      console.log(`  Current Price: ${item.price}`);
      console.log(`  Tenant ID: ${item.tenantId}`);
      
      // Check if price looks like USD (small numbers like 5, 10, 15)
      if (item.price && item.price < 50) {
        const kesPrice = item.price * USD_TO_KES;
        console.log(`  🔄 Suggested KES price: ${kesPrice} (${item.price} USD x ${USD_TO_KES})`);
      } else {
        console.log(`  ✅ Price already looks like KES`);
      }
      console.log('');
    });
    
    // Check total count
    const totalCount = await MenuItem.countDocuments();
    console.log(`Total menu items in database: ${totalCount}`);
    
    // Check items with low prices (likely USD)
    const lowPriceItems = await MenuItem.countDocuments({ price: { $lt: 50 } });
    console.log(`Items with price < 50 (likely USD): ${lowPriceItems}`);
    
    // Check items with high prices (likely KES)
    const highPriceItems = await MenuItem.countDocuments({ price: { $gte: 50 } });
    console.log(`Items with price >= 50 (likely KES): ${highPriceItems}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkMenuPrices();