const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// MenuItem Schema (simplified)
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  categoryId: mongoose.Schema.Types.ObjectId,
  isAvailable: { type: Boolean, default: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

async function createMenuItems() {
  await connectDB();
  
  // Use the tenant ID from our test user
  const tenantId = '68aea29a35e54afb735f483d';
  
  const menuItems = [
    {
      name: 'Ugali & Beef Stew',
      description: 'Traditional Kenyan meal with ugali and tender beef stew',
      price: 500,
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isAvailable: true
    },
    {
      name: 'Chapati',
      description: 'Soft and fluffy chapati bread',
      price: 50,
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isAvailable: true
    },
    {
      name: 'Rice & Chicken',
      description: 'Steamed rice with grilled chicken',
      price: 650,
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isAvailable: true
    }
  ];
  
  console.log('🍽️  Creating Menu Items...');
  console.log('========================');
  
  try {
    // Clear existing menu items for this tenant
    await MenuItem.deleteMany({ tenantId: new mongoose.Types.ObjectId(tenantId) });
    console.log('✅ Cleared existing menu items');
    
    // Create new menu items
    const createdItems = await MenuItem.insertMany(menuItems);
    console.log(`✅ Created ${createdItems.length} menu items:`);
    
    createdItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} - KSh ${item.price}`);
      console.log(`      ID: ${item._id}`);
    });
    
    console.log('\n📋 Menu items are now available for creating orders!');
    
  } catch (error) {
    console.error('❌ Error creating menu items:', error);
  } finally {
    mongoose.disconnect();
  }
}

createMenuItems();
