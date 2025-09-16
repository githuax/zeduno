import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { Category } from '../models/Category';
import { MenuItem } from '../models/MenuItem';
import Order from '../models/Order';

dotenv.config();

const createSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed');
    console.log('Connected to MongoDB');

    const tenantId = new mongoose.Types.ObjectId('689f425d9b6610e56b7830e8'); // Joe's Pizza Palace
    const userId = new mongoose.Types.ObjectId('689f425d9b6610e56b7830ea'); // Admin user

    // Create categories
    const pizzaCategory = await Category.create({
      name: 'Pizza',
      description: 'Our signature pizzas',
      displayOrder: 1,
      tenantId
    });

    const pastaCategory = await Category.create({
      name: 'Pasta',
      description: 'Italian pasta dishes',
      displayOrder: 2,
      tenantId
    });

    const beverageCategory = await Category.create({
      name: 'Beverages',
      description: 'Drinks and beverages',
      displayOrder: 3,
      tenantId
    });

    console.log('Categories created');

    // Create menu items
    const margherita = await MenuItem.create({
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce, mozzarella, and basil',
      price: 1200,
      categoryId: pizzaCategory._id,
      tenantId,
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002',
      isAvailable: true,
      preparationTime: 15,
      tags: ['vegetarian', 'popular'],
      isVegetarian: true
    });

    const pepperoni = await MenuItem.create({
      name: 'Pepperoni Pizza',
      description: 'Pizza with tomato sauce, mozzarella, and pepperoni',
      price: 1400,
      categoryId: pizzaCategory._id,
      tenantId,
      imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e',
      isAvailable: true,
      preparationTime: 15,
      tags: ['popular', 'spicy'],
      spiceLevel: 'mild'
    });

    const carbonara = await MenuItem.create({
      name: 'Spaghetti Carbonara',
      description: 'Traditional Italian pasta with egg, bacon, and parmesan',
      price: 1100,
      categoryId: pastaCategory._id,
      tenantId,
      imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3',
      isAvailable: true,
      preparationTime: 20,
      tags: ['traditional']
    });

    const coke = await MenuItem.create({
      name: 'Coca Cola',
      description: 'Refreshing soft drink',
      price: 250,
      categoryId: beverageCategory._id,
      tenantId,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97',
      isAvailable: true,
      preparationTime: 0,
      tags: ['cold']
    });

    console.log('Menu items created');

    // Create sample orders
    const order1 = await Order.create({
      orderNumber: `ORD-${Date.now()}-001`,
      orderType: 'dine-in',
      tenantId,
      staffId: userId,
      customerName: 'John Doe',
      customerPhone: '+254712345678',
      items: [
        {
          menuItem: margherita._id,
          quantity: 2,
          price: 1200,
          status: 'pending'
        },
        {
          menuItem: coke._id,
          quantity: 2,
          price: 250,
          status: 'pending'
        }
      ],
      subtotal: 2900,
      tax: 522,
      serviceCharge: 290,
      total: 3712,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'cash'
    });

    const order2 = await Order.create({
      orderNumber: `ORD-${Date.now()}-002`,
      orderType: 'takeaway',
      tenantId,
      staffId: userId,
      customerName: 'Jane Smith',
      customerPhone: '+254798765432',
      items: [
        {
          menuItem: pepperoni._id,
          quantity: 1,
          price: 1400,
          status: 'preparing'
        },
        {
          menuItem: carbonara._id,
          quantity: 1,
          price: 1100,
          status: 'preparing'
        }
      ],
      subtotal: 2500,
      tax: 450,
      serviceCharge: 0,
      total: 2950,
      status: 'preparing',
      paymentStatus: 'paid',
      paymentMethod: 'card'
    });

    console.log('Sample orders created');
    console.log('Sample data creation completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  }
};

createSampleData();