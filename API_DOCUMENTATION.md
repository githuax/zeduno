# ZedUno API Documentation

## Overview
Complete API documentation for the ZedUno Restaurant Management System. This system provides endpoints for managing users, rooms, bookings, menu items, orders, and tables.

## API Access Methods

### 1. Swagger UI (Interactive Documentation)
Access the interactive API documentation at:
- **Local Development**: http://localhost:5000/api-docs
- **Docker**: http://localhost:5000/api-docs (through backend container)

Features:
- Interactive API testing
- Schema definitions
- Request/Response examples
- Authentication support

### 2. Postman Collection
Import the provided Postman collection and environment files:

#### Files:
- `ZedUno_API.postman_collection.json` - Complete API collection
- `ZedUno_API.postman_environment.json` - Local development environment
- `ZedUno_API_Docker.postman_environment.json` - Docker environment

#### How to Import:
1. Open Postman
2. Click "Import" button
3. Select the collection JSON file
4. Import the appropriate environment file
5. Select the environment from the dropdown

## Base URLs
- **Local Development**: `http://localhost:5000/api`
- **Docker**: `http://localhost/api` (through nginx proxy)
- **Production**: `https://api.hotelzed.com/api`

## Authentication
The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token

### Users
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update current user profile
- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID (Admin only)
- `PUT /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

### Rooms
- `GET /rooms` - Get all rooms
- `GET /rooms/available` - Get available rooms
- `GET /rooms/:id` - Get room by ID
- `POST /rooms` - Create room (Admin/Staff)
- `PUT /rooms/:id` - Update room (Admin/Staff)
- `DELETE /rooms/:id` - Delete room (Admin only)

### Bookings
- `GET /bookings` - Get all bookings (Admin/Staff)
- `GET /bookings/my-bookings` - Get user's bookings
- `GET /bookings/:id` - Get booking by ID
- `POST /bookings` - Create booking
- `PUT /bookings/:id` - Update booking
- `PATCH /bookings/:id/cancel` - Cancel booking

### Menu
- `GET /menu` - Get menu items
- `GET /menu/:id` - Get menu item by ID
- `POST /menu` - Create menu item (Admin/Staff)
- `PUT /menu/:id` - Update menu item (Admin/Staff)
- `PATCH /menu/:id/toggle-availability` - Toggle availability (Admin/Staff)
- `DELETE /menu/:id` - Delete menu item (Admin only)

### Orders
- `GET /orders` - Get orders
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create order (Admin/Staff)
- `PUT /orders/:id` - Update order (Admin/Staff)
- `PATCH /orders/:id/status` - Update order status (Admin/Staff)
- `PATCH /orders/:id/items/:itemId/status` - Update item status (Admin/Staff)
- `POST /orders/:id/split` - Split order (Admin/Staff)
- `POST /orders/merge` - Merge orders (Admin/Staff)
- `POST /orders/:id/print-kitchen` - Print kitchen order (Admin/Staff)
- `DELETE /orders/:id` - Delete order (Admin only)

### Tables
- `GET /tables` - Get tables
- `GET /tables/:id` - Get table by ID
- `POST /tables` - Create table (Admin only)
- `PUT /tables/:id` - Update table (Admin only)
- `PATCH /tables/:id/status` - Update table status (Admin/Staff)
- `DELETE /tables/:id` - Delete table (Admin only)

### Health Check
- `GET /health` - System health check

## User Roles
The system supports three user roles with different access levels:

1. **Customer**: Basic access to bookings and orders
2. **Staff**: Can manage orders, menu items, and tables
3. **Admin**: Full system access including user management

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Rate Limiting
The API implements rate limiting to prevent abuse:
- Default: 100 requests per 15 minutes per IP
- Applies to all `/api` endpoints

## Testing

### Using Swagger UI
1. Navigate to http://localhost:5000/api-docs
2. Click on any endpoint to expand
3. Click "Try it out"
4. Fill in required parameters
5. Click "Execute"

### Using Postman
1. Import the collection and environment
2. Set environment variables (userId, roomId, etc.)
3. Run the "Login" request first to get authentication token
4. The token will be automatically saved to environment
5. Run other requests as needed

## MongoDB Access
Access MongoDB data through Mongo Express:
- URL: http://localhost:8081
- Username: `admin`
- Password: `admin123`

## Development Setup

### Install Dependencies
```bash
cd backend
npm install
```

### Run Development Server
```bash
npm run dev
```

### Run with Docker
```bash
docker-compose up
```

## Security Considerations
- All sensitive endpoints require authentication
- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- CORS is configured for specific origins
- Rate limiting prevents API abuse
- Input validation on all endpoints

## Support
For issues or questions, please contact the development team or create an issue in the project repository.