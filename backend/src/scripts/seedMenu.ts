import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const seedMenu = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing menu items
    await MenuItem.deleteMany({});
    console.log('Cleared existing menu items');

    const menuItems = [
      // Appetizers
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan',
        category: 'appetizers',
        price: 12.99,
        preparationTime: 10,
        isAvailable: true,
        allergens: ['dairy', 'gluten'],
        customizations: [
          {
            name: 'Protein',
            options: [
              { name: 'Grilled Chicken', price: 5 },
              { name: 'Grilled Shrimp', price: 7 },
              { name: 'Salmon', price: 8 }
            ]
          }
        ],
        tags: ['vegetarian', 'popular']
      },
      {
        name: 'Buffalo Wings',
        description: 'Crispy chicken wings tossed in buffalo sauce with blue cheese dip',
        category: 'appetizers',
        price: 14.99,
        preparationTime: 15,
        isAvailable: true,
        allergens: ['dairy'],
        customizations: [
          {
            name: 'Sauce Level',
            options: [
              { name: 'Mild', price: 0 },
              { name: 'Medium', price: 0 },
              { name: 'Hot', price: 0 },
              { name: 'Extra Hot', price: 1 }
            ]
          }
        ],
        tags: ['spicy', 'popular']
      },
      {
        name: 'Mozzarella Sticks',
        description: 'Golden fried mozzarella sticks served with marinara sauce',
        category: 'appetizers',
        price: 9.99,
        preparationTime: 8,
        isAvailable: true,
        allergens: ['dairy', 'gluten'],
        tags: ['vegetarian', 'kids-friendly']
      },

      // Main Courses
      {
        name: 'Grilled Ribeye Steak',
        description: 'Premium 12oz ribeye steak grilled to perfection with seasonal vegetables',
        category: 'mains',
        price: 32.99,
        preparationTime: 25,
        isAvailable: true,
        customizations: [
          {
            name: 'Cooking',
            options: [
              { name: 'Rare', price: 0 },
              { name: 'Medium Rare', price: 0 },
              { name: 'Medium', price: 0 },
              { name: 'Medium Well', price: 0 },
              { name: 'Well Done', price: 0 }
            ]
          },
          {
            name: 'Side',
            options: [
              { name: 'Mashed Potatoes', price: 0 },
              { name: 'French Fries', price: 0 },
              { name: 'Grilled Asparagus', price: 2 },
              { name: 'Truffle Mac & Cheese', price: 4 }
            ]
          }
        ],
        tags: ['premium', 'gluten-free']
      },
      {
        name: 'Chicken Parmesan',
        description: 'Breaded chicken breast topped with marinara and mozzarella, served with pasta',
        category: 'mains',
        price: 22.99,
        preparationTime: 20,
        isAvailable: true,
        allergens: ['dairy', 'gluten'],
        customizations: [
          {
            name: 'Pasta Type',
            options: [
              { name: 'Spaghetti', price: 0 },
              { name: 'Penne', price: 0 },
              { name: 'Fettuccine', price: 0 }
            ]
          }
        ],
        tags: ['popular', 'comfort-food']
      },
      {
        name: 'Grilled Salmon',
        description: 'Atlantic salmon fillet with lemon butter sauce and wild rice',
        category: 'mains',
        price: 26.99,
        preparationTime: 18,
        isAvailable: true,
        allergens: ['fish'],
        customizations: [
          {
            name: 'Preparation',
            options: [
              { name: 'Grilled', price: 0 },
              { name: 'Blackened', price: 0 },
              { name: 'Cedar Plank', price: 3 }
            ]
          }
        ],
        tags: ['healthy', 'gluten-free']
      },
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with fresh mozzarella, tomatoes, and basil',
        category: 'mains',
        price: 18.99,
        preparationTime: 15,
        isAvailable: true,
        allergens: ['dairy', 'gluten'],
        customizations: [
          {
            name: 'Size',
            options: [
              { name: '12 inch', price: 0 },
              { name: '16 inch', price: 6 }
            ]
          },
          {
            name: 'Extra Toppings',
            options: [
              { name: 'Pepperoni', price: 2 },
              { name: 'Mushrooms', price: 1.5 },
              { name: 'Bell Peppers', price: 1.5 },
              { name: 'Extra Cheese', price: 2 }
            ]
          }
        ],
        tags: ['vegetarian', 'popular']
      },

      // Desserts
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
        category: 'desserts',
        price: 8.99,
        preparationTime: 12,
        isAvailable: true,
        allergens: ['dairy', 'gluten', 'eggs'],
        tags: ['popular', 'decadent']
      },
      {
        name: 'Cheesecake',
        description: 'New York style cheesecake with berry compote',
        category: 'desserts',
        price: 7.99,
        preparationTime: 5,
        isAvailable: true,
        allergens: ['dairy', 'gluten', 'eggs'],
        customizations: [
          {
            name: 'Topping',
            options: [
              { name: 'Strawberry', price: 0 },
              { name: 'Blueberry', price: 0 },
              { name: 'Chocolate', price: 1 }
            ]
          }
        ],
        tags: ['vegetarian', 'classic']
      },

      // Beverages
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        category: 'beverages',
        price: 4.99,
        preparationTime: 3,
        isAvailable: true,
        tags: ['fresh', 'healthy', 'vegan']
      },
      {
        name: 'Craft Beer Selection',
        description: 'Ask your server about our rotating craft beer selection',
        category: 'beverages',
        price: 6.99,
        preparationTime: 2,
        isAvailable: true,
        customizations: [
          {
            name: 'Type',
            options: [
              { name: 'IPA', price: 0 },
              { name: 'Lager', price: 0 },
              { name: 'Stout', price: 1 },
              { name: 'Wheat Beer', price: 0 }
            ]
          }
        ],
        tags: ['craft', 'local']
      },
      {
        name: 'House Wine',
        description: 'Red or white wine by the glass',
        category: 'beverages',
        price: 8.99,
        preparationTime: 2,
        isAvailable: true,
        customizations: [
          {
            name: 'Type',
            options: [
              { name: 'Cabernet Sauvignon', price: 0 },
              { name: 'Merlot', price: 0 },
              { name: 'Chardonnay', price: 0 },
              { name: 'Pinot Grigio', price: 0 },
              { name: 'Premium Selection', price: 4 }
            ]
          }
        ],
        tags: ['wine']
      },

      // Specials
      {
        name: 'Chef\'s Special Risotto',
        description: 'Seasonal risotto created by our head chef with fresh local ingredients',
        category: 'specials',
        price: 24.99,
        preparationTime: 22,
        isAvailable: true,
        allergens: ['dairy'],
        tags: ['seasonal', 'chef-special', 'vegetarian']
      }
    ];

    await MenuItem.insertMany(menuItems);
    console.log(`Seeded ${menuItems.length} menu items successfully`);

    console.log('Menu seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding menu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeding script
if (require.main === module) {
  seedMenu();
}

export default seedMenu;