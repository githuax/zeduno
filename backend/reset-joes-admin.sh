#!/bin/bash

# Script to reset Joe's Pizza Palace admin password
# This is a wrapper around the TypeScript script for easy execution

echo "🍕 Joe's Pizza Palace Admin Password Reset"
echo "=========================================="

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the backend directory"
    echo "💡 Tip: cd backend && ./reset-joes-admin.sh"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Error: node_modules not found. Please install dependencies first:"
    echo "💡 Run: npm install"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "💡 Make sure your MONGODB_URI environment variable is set"
    echo ""
fi

echo "🚀 Running password reset script..."
echo ""

# Run the TypeScript script using ts-node
npx ts-node src/scripts/reset-joes-admin-password.ts

# Check the exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script completed successfully!"
    echo "🍕 You can now login to Joe's Pizza Palace with the reset password"
else
    echo ""
    echo "❌ Script failed. Check the error messages above."
    echo ""
    echo "🔧 Common solutions:"
    echo "   1. Make sure MongoDB is running"
    echo "   2. Check your .env file has MONGODB_URI set"
    echo "   3. Try running: npm run seed:joes-pizza first"
    echo "   4. Ensure you're in the backend directory"
fi