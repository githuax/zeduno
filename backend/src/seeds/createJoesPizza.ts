import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { connectDB } from '../config/database';

dotenv.config();

const createJoesPizzaPalace = async () => {
  try {
    await connectDB();
    console.log('Connected to database');
    
    // Drop any existing validation rules that might conflict
    try {
      await mongoose.connection.db.command({
        collMod: 'users',
        validator: {},
        validationLevel: 'off'
      });
    } catch (err) {
      console.log('No validation to remove or error removing validation')
    }

    const superAdminEmail = 'superadmin@hotelzed.com';
    let superAdmin = await User.findOne({ email: superAdminEmail });
    
    if (!superAdmin) {
      console.log('Creating SuperAdmin user...');
      superAdmin = await User.create({
        email: superAdminEmail,
        password: 'SuperAdmin@123',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        isActive: true,
        mustChangePassword: false,
      });
      console.log('SuperAdmin created successfully');
    }

    const existingTenant = await Tenant.findOne({ 
      name: "Joe's Pizza Palace" 
    });

    if (existingTenant) {
      console.log("Joe's Pizza Palace already exists!");
      process.exit(0);
    }

    try {
      const tenant = new Tenant({
        name: "Joe's Pizza Palace",
        slug: 'joes-pizza-palace',
        email: 'info@joespizzapalace.com',
        description: 'The best pizza in town - serving authentic Italian pizzas since 1985',
        address: '123 Main Street, New York, NY 10001, USA',
        phone: '+1-555-PIZZA',
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
          businessType: 'restaurant',
        },
        subscription: {
          plan: 'premium',
          status: 'active',
          startDate: new Date(),
        },
        features: {
          dineIn: true,
          takeaway: true,
          delivery: true,
          roomService: false,
          hotelBooking: false,
        },
        isActive: true,
        createdBy: superAdmin._id,
      });

      const savedTenant = await tenant.save();
      console.log("✅ Joe's Pizza Palace tenant created");

      const adminUser = new User({
        email: 'admin@joespizzapalace.com',
        password: 'JoesPizza@2024',
        firstName: 'Joe',
        lastName: 'Marconi',
        role: 'admin',
        tenantId: savedTenant._id,
        isActive: true,
        mustChangePassword: true,
      });

      await adminUser.save();
      console.log('✅ Admin user created for Joe\'s Pizza Palace');

      const managerUser = new User({
        email: 'manager@joespizzapalace.com',
        password: 'Manager@2024',
        firstName: 'Maria',
        lastName: 'Rossi',
        role: 'manager',
        tenantId: savedTenant._id,
        isActive: true,
        mustChangePassword: true,
      });

      await managerUser.save();
      console.log('✅ Manager user created for Joe\'s Pizza Palace');
      
      console.log('\n========================================');
      console.log('🍕 Joe\'s Pizza Palace Setup Complete!');
      console.log('========================================');
      console.log('\nLogin Credentials:');
      console.log('\nSuperAdmin:');
      console.log('  Email: superadmin@hotelzed.com');
      console.log('  Password: SuperAdmin@123');
      console.log('\nTenant Admin (Joe):');
      console.log('  Email: admin@joespizzapalace.com');
      console.log('  Password: JoesPizza@2024');
      console.log('  Note: Will be prompted to change password on first login');
      console.log('\nTenant Manager (Maria):');
      console.log('  Email: manager@joespizzapalace.com');
      console.log('  Password: Manager@2024');
      console.log('  Note: Will be prompted to change password on first login');
      console.log('========================================\n');

    } catch (error) {
      throw error;
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating Joe\'s Pizza Palace:', error);
    process.exit(1);
  }
};

createJoesPizzaPalace();