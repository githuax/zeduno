import mongoose from 'mongoose';

import { MenuItem } from '../models/MenuItem';
import Order from '../models/Order';
import Table from '../models/Table';
import { User } from '../models/User';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zeduno');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createSampleOrders = async () => {
  try {
    await connectDB();

    // Find or create a sample user (admin)
    let sampleUser = await User.findOne({ email: 'admin@zeduno.com' });
    if (!sampleUser) {
      sampleUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@zeduno.com',
        phone: '+254700000000',
        role: 'admin',
        password: 'hashedpassword',
        tenantId: new mongoose.Types.ObjectId(),
      });
    }

    // Find or create sample menu items
    let menuItems = await MenuItem.find().limit(3);
    if (menuItems.length === 0) {
      // Create sample menu items if none exist
      menuItems = await MenuItem.create([
        {
          name: 'MAIN MEAL',
          description: 'Delicious main course with rice and vegetables',
          price: 500,
          category: 'main course',
          isAvailable: true,
          preparationTime: 15,
          tags: ['main'],
          customizations: [],
          tenantId: sampleUser.tenantId
        },
        {
          name: 'SOUP OF CARROT',
          description: 'Fresh carrot soup with herbs',
          price: 280,
          category: 'appetizers',
          isAvailable: true,
          preparationTime: 10,
          tags: ['soup'],
          customizations: [],
          tenantId: sampleUser.tenantId
        },
        {
          name: 'PIZZA MARGHERITA',
          description: 'Classic pizza with tomatoes and mozzarella',
          price: 650,
          category: 'main course',
          isAvailable: true,
          preparationTime: 20,
          tags: ['pizza'],
          customizations: [],
          tenantId: sampleUser.tenantId
        }
      ]);
    }

    // Find or create sample tables
    let tables = await Table.find().limit(5);
    if (tables.length === 0) {
      tables = await Table.create([
        {
          tableNumber: 'T001',
          capacity: 4,
          status: 'available',
          tenantId: sampleUser.tenantId
        },
        {
          tableNumber: 'T002',
          capacity: 2,
          status: 'available',
          tenantId: sampleUser.tenantId
        },
        {
          tableNumber: 'T003',
          capacity: 6,
          status: 'occupied',
          tenantId: sampleUser.tenantId
        }
      ]);
    }

    // Delete existing sample orders to avoid duplicates
    await Order.deleteMany({ 
      customerName: { $in: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'] }
    });

    // Create sample orders
    const sampleOrders = [
      {
        orderNumber: `ORD-${Date.now()}-001`,
        orderType: 'dine-in',
        customerName: 'John Doe',
        customerPhone: '+254711000001',
        tableId: tables[0]._id,
        items: [
          {
            menuItem: menuItems[0]._id,
            quantity: 2,
            price: menuItems[0].price,
            customizations: [],
            specialInstructions: '',
            status: 'pending'
          },
          {
            menuItem: menuItems[1]._id,
            quantity: 1,
            price: menuItems[1].price,
            customizations: [],
            specialInstructions: 'Extra herbs please',
            status: 'pending'
          }
        ],
        subtotal: (menuItems[0].price * 2) + menuItems[1].price,
        tax: ((menuItems[0].price * 2) + menuItems[1].price) * 0.16,
        serviceCharge: ((menuItems[0].price * 2) + menuItems[1].price) * 0.10,
        total: ((menuItems[0].price * 2) + menuItems[1].price) * 1.26,
        status: 'confirmed',
        paymentStatus: 'pending',
        staffId: sampleUser._id,
        tenantId: sampleUser.tenantId,
        notes: 'Customer prefers well-done',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        orderNumber: `ORD-${Date.now()}-002`,
        orderType: 'takeaway',
        customerName: 'Jane Smith',
        customerPhone: '+254722000002',
        items: [
          {
            menuItem: menuItems[2]._id,
            quantity: 1,
            price: menuItems[2].price,
            customizations: [],
            specialInstructions: '',
            status: 'preparing'
          }
        ],
        subtotal: menuItems[2].price,
        tax: menuItems[2].price * 0.16,
        serviceCharge: 0,
        total: menuItems[2].price * 1.16,
        status: 'preparing',
        paymentStatus: 'paid',
        staffId: sampleUser._id,
        tenantId: sampleUser.tenantId,
        notes: 'Ready for pickup at 3 PM',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        orderNumber: `ORD-${Date.now()}-003`,
        orderType: 'delivery',
        customerName: 'Mike Johnson',
        customerPhone: '+254733000003',
        items: [
          {
            menuItem: menuItems[0]._id,
            quantity: 1,
            price: menuItems[0].price,
            customizations: [],
            specialInstructions: '',
            status: 'ready'
          },
          {
            menuItem: menuItems[1]._id,
            quantity: 2,
            price: menuItems[1].price,
            customizations: [],
            specialInstructions: '',
            status: 'ready'
          }
        ],
        subtotal: menuItems[0].price + (menuItems[1].price * 2),
        tax: (menuItems[0].price + (menuItems[1].price * 2)) * 0.16,
        serviceCharge: 0,
        total: (menuItems[0].price + (menuItems[1].price * 2)) * 1.16,
        status: 'ready',
        paymentStatus: 'paid',
        staffId: sampleUser._id,
        tenantId: sampleUser.tenantId,
        deliveryAddress: {
          street: '123 Nairobi Street',
          city: 'Nairobi',
          zipCode: '00100',
          instructions: 'Call when arrived'
        },
        notes: 'Deliver before 4 PM',
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
      {
        orderNumber: `ORD-${Date.now()}-004`,
        orderType: 'dine-in',
        customerName: 'Sarah Wilson',
        customerPhone: '+254744000004',
        tableId: tables[2]._id,
        items: [
          {
            menuItem: menuItems[1]._id,
            quantity: 1,
            price: menuItems[1].price,
            customizations: [],
            specialInstructions: '',
            status: 'served'
          }
        ],
        subtotal: menuItems[1].price,
        tax: menuItems[1].price * 0.16,
        serviceCharge: menuItems[1].price * 0.10,
        total: menuItems[1].price * 1.26,
        status: 'completed',
        paymentStatus: 'paid',
        staffId: sampleUser._id,
        tenantId: sampleUser.tenantId,
        notes: '',
        completedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      },
      {
        orderNumber: `ORD-${Date.now()}-005`,
        orderType: 'takeaway',
        customerName: 'David Brown',
        customerPhone: '+254755000005',
        items: [
          {
            menuItem: menuItems[0]._id,
            quantity: 1,
            price: menuItems[0].price,
            customizations: [],
            specialInstructions: 'Extra spicy',
            status: 'pending'
          },
          {
            menuItem: menuItems[2]._id,
            quantity: 1,
            price: menuItems[2].price,
            customizations: [],
            specialInstructions: '',
            status: 'pending'
          }
        ],
        subtotal: menuItems[0].price + menuItems[2].price,
        tax: (menuItems[0].price + menuItems[2].price) * 0.16,
        serviceCharge: 0,
        total: (menuItems[0].price + menuItems[2].price) * 1.16,
        status: 'pending',
        paymentStatus: 'pending',
        staffId: sampleUser._id,
        tenantId: sampleUser.tenantId,
        notes: 'Customer will pay on pickup',
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      }
    ];

    // Create the sample orders
    const createdOrders = await Order.create(sampleOrders);
    
    console.log(`✅ Created ${createdOrders.length} sample orders:`);
    createdOrders.forEach(order => {
      console.log(`- ${order.orderNumber} (${order.orderType}) - ${order.customerName} - Status: ${order.status}`);
    });

    console.log('\n🎉 Sample data created successfully!');
    console.log('You can now visit http://localhost:8080/orders to see the orders');
    
  } catch (error) {
    console.error('Error creating sample orders:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createSampleOrders();