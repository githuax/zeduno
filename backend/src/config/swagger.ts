import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HotelZed Restaurant Management API',
      version: '1.0.0',
      description: 'Complete API documentation for HotelZed Restaurant Management System',
      contact: {
        name: 'API Support',
        email: 'support@hotelzed.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'http://localhost/api',
        description: 'Docker server'
      },
      {
        url: 'https://api.hotelzed.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['admin', 'staff', 'customer'], example: 'customer' },
            phone: { type: 'string', example: '+1234567890' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Room: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            roomNumber: { type: 'string', example: '101' },
            type: { type: 'string', enum: ['single', 'double', 'suite', 'deluxe'], example: 'double' },
            floor: { type: 'number', example: 1 },
            price: { type: 'number', example: 150.00 },
            status: { type: 'string', enum: ['available', 'occupied', 'maintenance', 'reserved'], example: 'available' },
            amenities: { type: 'array', items: { type: 'string' }, example: ['WiFi', 'TV', 'Mini Bar'] },
            maxOccupancy: { type: 'number', example: 2 },
            description: { type: 'string', example: 'Spacious room with ocean view' },
            images: { type: 'array', items: { type: 'string' }, example: ['room1.jpg', 'room2.jpg'] }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            roomId: { type: 'string', example: '507f1f77bcf86cd799439013' },
            checkIn: { type: 'string', format: 'date', example: '2024-12-20' },
            checkOut: { type: 'string', format: 'date', example: '2024-12-25' },
            guests: { type: 'number', example: 2 },
            totalAmount: { type: 'number', example: 750.00 },
            status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'], example: 'confirmed' },
            paymentStatus: { type: 'string', enum: ['pending', 'partial', 'paid', 'refunded'], example: 'paid' },
            specialRequests: { type: 'string', example: 'Late check-in requested' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        MenuItem: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Grilled Salmon' },
            category: { type: 'string', enum: ['appetizer', 'main', 'dessert', 'beverage', 'sides'], example: 'main' },
            description: { type: 'string', example: 'Fresh Atlantic salmon with herbs' },
            price: { type: 'number', example: 24.99 },
            available: { type: 'boolean', example: true },
            preparationTime: { type: 'number', example: 20, description: 'Time in minutes' },
            ingredients: { type: 'array', items: { type: 'string' }, example: ['Salmon', 'Herbs', 'Lemon'] },
            allergens: { type: 'array', items: { type: 'string' }, example: ['Fish'] },
            nutritionalInfo: {
              type: 'object',
              properties: {
                calories: { type: 'number', example: 350 },
                protein: { type: 'number', example: 35 },
                carbs: { type: 'number', example: 10 },
                fat: { type: 'number', example: 20 }
              }
            },
            image: { type: 'string', example: 'salmon.jpg' },
            spicyLevel: { type: 'number', minimum: 0, maximum: 5, example: 0 },
            vegetarian: { type: 'boolean', example: false },
            vegan: { type: 'boolean', example: false },
            glutenFree: { type: 'boolean', example: true }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            orderNumber: { type: 'string', example: 'ORD-2024-001' },
            tableId: { type: 'string', example: '507f1f77bcf86cd799439014' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  menuItemId: { type: 'string', example: '507f1f77bcf86cd799439015' },
                  quantity: { type: 'number', example: 2 },
                  price: { type: 'number', example: 24.99 },
                  notes: { type: 'string', example: 'No salt' },
                  status: { type: 'string', enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'], example: 'pending' }
                }
              }
            },
            type: { type: 'string', enum: ['dine-in', 'takeaway', 'delivery'], example: 'dine-in' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'], example: 'pending' },
            subtotal: { type: 'number', example: 49.98 },
            tax: { type: 'number', example: 4.50 },
            discount: { type: 'number', example: 0 },
            total: { type: 'number', example: 54.48 },
            paymentMethod: { type: 'string', enum: ['cash', 'card', 'online'], example: 'card' },
            paymentStatus: { type: 'string', enum: ['pending', 'paid', 'refunded'], example: 'pending' },
            notes: { type: 'string', example: 'Birthday celebration' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Table: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            tableNumber: { type: 'string', example: 'T01' },
            capacity: { type: 'number', example: 4 },
            location: { type: 'string', enum: ['indoor', 'outdoor', 'terrace', 'private'], example: 'indoor' },
            status: { type: 'string', enum: ['available', 'occupied', 'reserved', 'cleaning'], example: 'available' },
            floor: { type: 'number', example: 1 },
            section: { type: 'string', example: 'Main Hall' },
            isActive: { type: 'boolean', example: true }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string', example: 'Detailed error description' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Rooms', description: 'Room management endpoints' },
      { name: 'Bookings', description: 'Booking management endpoints' },
      { name: 'Menu', description: 'Menu management endpoints' },
      { name: 'Orders', description: 'Order management endpoints' },
      { name: 'Tables', description: 'Table management endpoints' }
    ]
  },
  apis: ['./src/routes/*.ts', './src/swagger/*.yaml']
};

export const swaggerSpec = swaggerJsdoc(options);