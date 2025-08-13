#!/bin/bash

# HotelZed SuperAdmin Setup Script
# This script sets up the complete environment and creates a superadmin user

echo "🏨 HotelZed SuperAdmin Setup"
echo "=============================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is required but not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Step 1: Start MongoDB
echo ""
echo "📦 Step 1: Starting MongoDB..."
docker-compose up -d mongodb
if [ $? -eq 0 ]; then
    echo "✅ MongoDB started successfully"
else
    echo "❌ Failed to start MongoDB"
    exit 1
fi

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Step 2: Initialize Database Schema
echo ""
echo "🗄️  Step 2: Initializing database schema..."
docker cp database/mongodb-schema.js hotelzed-mongodb:/tmp/schema.js
docker exec hotelzed-mongodb mongosh "mongodb://admin:password123@localhost:27017/restaurant_db?authSource=admin" --eval "load('/tmp/schema.js')"

if [ $? -eq 0 ]; then
    echo "✅ Database schema initialized successfully"
else
    echo "❌ Failed to initialize database schema"
    exit 1
fi

# Step 3: Create Backend Environment
echo ""
echo "⚙️  Step 3: Setting up backend environment..."
cat > backend/.env << EOL
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://admin:password123@localhost:27017/restaurant_db?authSource=admin
JWT_SECRET=your-super-secure-jwt-secret-key-for-development-only
CORS_ORIGIN=http://localhost:3000
EOL

if [ $? -eq 0 ]; then
    echo "✅ Backend environment configured"
else
    echo "❌ Failed to configure backend environment"
    exit 1
fi

# Step 4: Install Dependencies
echo ""
echo "📦 Step 4: Installing dependencies..."
cd backend
npm install --silent
cd ..
npm install --silent

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Step 5: Create SuperAdmin
echo ""
echo "👑 Step 5: Creating SuperAdmin user..."
cd backend
npx ts-node src/scripts/seedSuperAdmin.ts

if [ $? -eq 0 ]; then
    echo "✅ SuperAdmin created successfully"
else
    echo "❌ Failed to create SuperAdmin"
    exit 1
fi

cd ..

# Step 6: Add npm scripts for easy management
echo ""
echo "📝 Step 6: Adding management scripts..."

# Update package.json with useful scripts
cat > package.json << 'EOL'
{
  "name": "hotelzed-monorepo",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "vite",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "vite build",
    "build:backend": "cd backend && npm run build",
    "start": "concurrently \"npm run start:frontend\" \"npm run start:backend\"",
    "start:frontend": "vite preview",
    "start:backend": "cd backend && npm run start",
    "setup:superadmin": "cd backend && npx ts-node src/scripts/seedSuperAdmin.ts",
    "setup:db": "docker exec hotelzed-mongodb mongosh \"mongodb://admin:password123@localhost:27017/restaurant_db?authSource=admin\" --eval \"load('/tmp/schema.js')\"",
    "mongodb:start": "docker-compose up -d mongodb",
    "mongodb:stop": "docker-compose stop mongodb",
    "mongodb:logs": "docker logs hotelzed-mongodb -f",
    "mongo-express": "docker-compose up -d mongo-express"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "@types/node": "^20.14.10",
    "typescript": "^5.5.3",
    "vite": "^5.4.19"
  }
}
EOL

npm install --silent

echo "✅ Management scripts added"

# Final Summary
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "🔐 SuperAdmin Credentials:"
echo "📧 Email: superadmin@hotelzed.com"
echo "👤 Username: superadmin"
echo "🔑 Password: SuperAdmin123!"
echo ""
echo "🌐 Access URLs:"
echo "🖥️  Frontend: http://localhost:8082"
echo "🔧 Backend API: http://localhost:5001"
echo "📚 API Docs: http://localhost:5001/api-docs"
echo "🗄️  Mongo Express: http://localhost:8081 (admin:admin123)"
echo ""
echo "🚀 Quick Commands:"
echo "npm run dev                 # Start frontend & backend"
echo "npm run setup:superadmin    # Recreate superadmin user"
echo "npm run mongodb:start       # Start MongoDB"
echo "npm run mongodb:stop        # Stop MongoDB"
echo "npm run mongo-express       # Start Mongo Express"
echo ""
echo "⚠️  IMPORTANT: Change the default password after first login!"
echo ""
echo "🎯 Next Steps:"
echo "1. Run 'npm run dev' to start the development servers"
echo "2. Open http://localhost:8082 in your browser"
echo "3. Use TenantSwitcher component for multi-tenant management"
echo "4. Access tenant onboarding at /tenant-onboarding to create new restaurants"