import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem';
import { Category } from '../models/Category';
import { User } from '../models/User';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotelzed');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createMenuItems = async () => {
  try {
    await connectDB();

    // Find or create a sample user (admin)
    let sampleUser = await User.findOne({ email: 'admin@hotelzed.com' });
    if (!sampleUser) {
      sampleUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@hotelzed.com',
        phone: '+254700000000',
        role: 'admin',
        password: 'hashedpassword',
        tenantId: new mongoose.Types.ObjectId(),
      });
    }

    // Delete existing sample categories and menu items to avoid duplicates
    await Category.deleteMany({ name: { $in: ['Appetizers', 'Main Course', 'Desserts', 'Beverages'] } });
    await MenuItem.deleteMany({ name: { $in: ['MAIN MEAL', 'SOUP OF CARROT', 'PIZZA MARGHERITA', 'CHICKEN CURRY', 'BEEF STEW', 'VEGETABLE SALAD', 'CHOCOLATE CAKE', 'FRESH JUICE', 'COFFEE'] } });

    // Create categories first
    const categories = await Category.create([
      {
        name: 'Appetizers',
        description: 'Delicious starters to begin your meal',
        displayOrder: 1,
        isActive: true,
        tenantId: sampleUser.tenantId
      },
      {
        name: 'Main Course',
        description: 'Hearty main dishes',
        displayOrder: 2,
        isActive: true,
        tenantId: sampleUser.tenantId
      },
      {
        name: 'Desserts',
        description: 'Sweet treats to end your meal',
        displayOrder: 3,
        isActive: true,
        tenantId: sampleUser.tenantId
      },
      {
        name: 'Beverages',
        description: 'Refreshing drinks',
        displayOrder: 4,
        isActive: true,
        tenantId: sampleUser.tenantId
      }
    ]);

    const [appetizers, mainCourse, desserts, beverages] = categories;

    // Create sample menu items
    const menuItems = [
      {
        name: 'MAIN MEAL',
        description: 'Delicious main course with rice and vegetables, served with your choice of protein',
        price: 500,
        categoryId: mainCourse._id,
        isAvailable: true,
        preparationTime: 15,
        tags: ['main', 'rice', 'vegetables'],
        customizations: [
          {
            name: 'Protein Choice',
            options: [
              { name: 'Chicken', price: 0 },
              { name: 'Beef', price: 50 },
              { name: 'Fish', price: 30 }
            ]
          },
          {
            name: 'Spice Level',
            options: [
              { name: 'Mild', price: 0 },
              { name: 'Medium', price: 0 },
              { name: 'Hot', price: 0 }
            ]
          }
        ],
        tenantId: sampleUser.tenantId,
        isVegetarian: false,
        isVegan: false,
        spiceLevel: 'medium'
      },
      {
        name: 'SOUP OF CARROT',
        description: 'Fresh carrot soup with herbs and a touch of cream',
        price: 280,
        categoryId: appetizers._id,
        isAvailable: true,
        preparationTime: 10,
        tags: ['soup', 'vegetarian', 'healthy'],
        customizations: [
          {
            name: 'Add-ons',
            options: [
              { name: 'Bread Roll', price: 50 },
              { name: 'Croutons', price: 30 }
            ]
          }
        ],
        tenantId: sampleUser.tenantId,
        isVegetarian: true,
        isVegan: false,
        spiceLevel: 'mild'
      },
      {
        name: 'PIZZA MARGHERITA',
        description: 'Classic Italian pizza with tomatoes, mozzarella, and fresh basil',
        price: 650,
        categoryId: mainCourse._id,
        isAvailable: true,
        preparationTime: 20,
        tags: ['pizza', 'italian', 'vegetarian'],
        customizations: [
          {
            name: 'Size',
            options: [
              { name: 'Small (8 inch)', price: -100 },
              { name: 'Medium (12 inch)', price: 0 },
              { name: 'Large (16 inch)', price: 200 }
            ]
          },
          {
            name: 'Extra Toppings',
            options: [
              { name: 'Extra Cheese', price: 100 },
              { name: 'Olives', price: 80 },
              { name: 'Mushrooms', price: 90 }
            ]
          }
        ],
        tenantId: sampleUser.tenantId,
        isVegetarian: true,
        isVegan: false,
        spiceLevel: 'mild'
      },
      {
        name: 'CHICKEN CURRY',
        description: 'Tender chicken pieces in aromatic curry sauce, served with rice',
        price: 750,
        categoryId: mainCourse._id,
        isAvailable: true,
        preparationTime: 25,
        tags: ['curry', 'chicken', 'spicy'],
        customizations: [
          {
            name: 'Rice Type',
            options: [
              { name: 'Plain Rice', price: 0 },
              { name: 'Basmati Rice', price: 50 },
              { name: 'Coconut Rice', price: 70 }
            ]
          }
        ],
        tenantId: sampleUser.tenantId,
        isVegetarian: false,
        isVegan: false,
        spiceLevel: 'hot'
      },
      {
        name: 'VEGETABLE SALAD',
        description: 'Fresh mixed vegetables with house dressing',
        price: 350,
        categoryId: appetizers._id,
        isAvailable: true,
        preparationTime: 5,
        tags: ['salad', 'healthy', 'vegan'],
        customizations: [
          {
            name: 'Dressing',
            options: [
              { name: 'Ranch', price: 0 },
              { name: 'Caesar', price: 0 },
              { name: 'Vinaigrette', price: 0 }
            ]
          }
        ],
        tenantId: sampleUser.tenantId,
        isVegetarian: true,
        isVegan: true,
        spiceLevel: 'mild'
      },
      {
        name: 'CHOCOLATE CAKE',
        description: 'Rich chocolate cake with chocolate frosting',
        price: 400,
        categoryId: desserts._id,
        isAvailable: true,
        preparationTime: 5,
        tags: ['dessert', 'chocolate', 'sweet'],
        customizations: [
          {
            name: 'Add-ons',
            options: [
              { name: 'Ice Cream Scoop', price: 80 },
              { name: 'Whipped Cream', price: 50 }
            ]
          }
        ],
        tenantId: sampleUser.tenantId,
        isVegetarian: true,
        isVegan: false,
        spiceLevel: 'mild'
      },
      {
        name: 'FRESH JUICE',
        description: 'Freshly squeezed fruit juice',
        price: 200,
        categoryId: beverages._id,
        isAvailable: true,
        preparationTime: 3,
        tags: ['juice', 'fresh', 'healthy'],
        customizations: [
          {
            name: 'Fruit Choice',
            options: [
              { name: 'Orange', price: 0 },
              { name: 'Apple', price: 0 },
              { name: 'Pineapple', price: 20 },
              { name: 'Mango', price: 30 }
            ]
          }
        ],
        tenantId: sampleUser.tenantId,
        isVegetarian: true,
        isVegan: true,
        spiceLevel: 'mild'
      },
      {
        name: 'COFFEE',
        description: 'Freshly brewed coffee',
        price: 150,
        categoryId: beverages._id,
        isAvailable: true,
        preparationTime: 2,
        tags: ['coffee', 'hot', 'caffeine'],
        customizations: [
          {
            name: 'Type',
            options: [
              { name: 'Americano', price: 0 },
              { name: 'Cappuccino', price: 50 },
              { name: 'Latte', price: 70 }
            ]
          },
          {
            name: 'Size',
            options: [
              { name: 'Small', price: 0 },
              { name: 'Medium', price: 30 },
              { name: 'Large', price: 60 }
            ]
          }
        ],
        tenantId: sampleUser.tenantId,
        isVegetarian: true,
        isVegan: false,
        spiceLevel: 'mild'
      }
    ];

    // Create the menu items
    const createdMenuItems = await MenuItem.create(menuItems);
    
    console.log(`✅ Created ${categories.length} categories:`);
    categories.forEach(category => {
      console.log(`- ${category.name}`);
    });

    console.log(`\n✅ Created ${createdMenuItems.length} menu items:`);
    createdMenuItems.forEach(item => {
      console.log(`- ${item.name} - KES ${item.price}`);
    });

    console.log('\n🎉 Menu data created successfully!');
    console.log('You can now use the CreateOrderDialog to add menu items to orders');
    
  } catch (error) {
    console.error('Error creating menu items:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createMenuItems();