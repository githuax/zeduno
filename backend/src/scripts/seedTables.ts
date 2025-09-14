import { config } from 'dotenv';
import mongoose from 'mongoose';

import Table from '../models/Table';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelzed';

const seedTables = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing tables
    await Table.deleteMany({});
    console.log('Cleared existing tables');

    // Define table layout for a restaurant
    const tables = [
      // Main Hall - Floor 1
      { tableNumber: 'M01', capacity: 2, status: 'available', floor: 1, section: 'main', position: { x: 1, y: 1 } },
      { tableNumber: 'M02', capacity: 2, status: 'available', floor: 1, section: 'main', position: { x: 2, y: 1 } },
      { tableNumber: 'M03', capacity: 4, status: 'available', floor: 1, section: 'main', position: { x: 3, y: 1 } },
      { tableNumber: 'M04', capacity: 4, status: 'available', floor: 1, section: 'main', position: { x: 4, y: 1 } },
      { tableNumber: 'M05', capacity: 6, status: 'available', floor: 1, section: 'main', position: { x: 1, y: 2 } },
      { tableNumber: 'M06', capacity: 6, status: 'available', floor: 1, section: 'main', position: { x: 2, y: 2 } },
      { tableNumber: 'M07', capacity: 4, status: 'available', floor: 1, section: 'main', position: { x: 3, y: 2 } },
      { tableNumber: 'M08', capacity: 4, status: 'available', floor: 1, section: 'main', position: { x: 4, y: 2 } },
      { tableNumber: 'M09', capacity: 2, status: 'available', floor: 1, section: 'main', position: { x: 1, y: 3 } },
      { tableNumber: 'M10', capacity: 2, status: 'available', floor: 1, section: 'main', position: { x: 2, y: 3 } },
      { tableNumber: 'M11', capacity: 8, status: 'available', floor: 1, section: 'main', position: { x: 3, y: 3 } },
      { tableNumber: 'M12', capacity: 4, status: 'available', floor: 1, section: 'main', position: { x: 4, y: 3 } },

      // Patio - Floor 1
      { tableNumber: 'P01', capacity: 2, status: 'available', floor: 1, section: 'patio', position: { x: 1, y: 1 } },
      { tableNumber: 'P02', capacity: 2, status: 'available', floor: 1, section: 'patio', position: { x: 2, y: 1 } },
      { tableNumber: 'P03', capacity: 4, status: 'available', floor: 1, section: 'patio', position: { x: 3, y: 1 } },
      { tableNumber: 'P04', capacity: 4, status: 'available', floor: 1, section: 'patio', position: { x: 1, y: 2 } },
      { tableNumber: 'P05', capacity: 6, status: 'available', floor: 1, section: 'patio', position: { x: 2, y: 2 } },
      { tableNumber: 'P06', capacity: 2, status: 'available', floor: 1, section: 'patio', position: { x: 3, y: 2 } },

      // Bar Area - Floor 1
      { tableNumber: 'B01', capacity: 2, status: 'available', floor: 1, section: 'bar', position: { x: 1, y: 1 } },
      { tableNumber: 'B02', capacity: 2, status: 'available', floor: 1, section: 'bar', position: { x: 2, y: 1 } },
      { tableNumber: 'B03', capacity: 3, status: 'available', floor: 1, section: 'bar', position: { x: 3, y: 1 } },
      { tableNumber: 'B04', capacity: 4, status: 'available', floor: 1, section: 'bar', position: { x: 1, y: 2 } },

      // Private Dining - Floor 2
      { tableNumber: 'VIP01', capacity: 8, status: 'available', floor: 2, section: 'private', position: { x: 1, y: 1 } },
      { tableNumber: 'VIP02', capacity: 10, status: 'available', floor: 2, section: 'private', position: { x: 2, y: 1 } },
      { tableNumber: 'VIP03', capacity: 12, status: 'available', floor: 2, section: 'private', position: { x: 1, y: 2 } },
      { tableNumber: 'VIP04', capacity: 6, status: 'available', floor: 2, section: 'private', position: { x: 2, y: 2 } },
    ];

    // Insert all tables
    await Table.insertMany(tables);
    console.log(`Seeded ${tables.length} tables successfully`);

    // Set some tables to different statuses for demo
    await Table.updateOne({ tableNumber: 'M03' }, { status: 'occupied' });
    await Table.updateOne({ tableNumber: 'M05' }, { status: 'occupied' });
    await Table.updateOne({ tableNumber: 'P02' }, { status: 'reserved' });
    await Table.updateOne({ tableNumber: 'B01' }, { status: 'occupied' });
    await Table.updateOne({ tableNumber: 'M08' }, { status: 'maintenance' });

    console.log('Updated some table statuses for demo');

    console.log('Table seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding tables:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeding script
if (require.main === module) {
  seedTables();
}

export default seedTables;