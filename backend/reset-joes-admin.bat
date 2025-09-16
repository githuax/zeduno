@echo off
REM Script to reset Joe's Pizza Palace admin password (Windows version)
REM This is a wrapper around the TypeScript script for easy execution

echo 🍕 Joe's Pizza Palace Admin Password Reset
echo ==========================================

REM Check if we're in the backend directory
if not exist "package.json" (
    echo ❌ Error: This script must be run from the backend directory
    echo 💡 Tip: cd backend && reset-joes-admin.bat
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo ❌ Error: node_modules not found. Please install dependencies first:
    echo 💡 Run: npm install
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  Warning: .env file not found
    echo 💡 Make sure your MONGODB_URI environment variable is set
    echo.
)

echo 🚀 Running password reset script...
echo.

REM Run the TypeScript script using ts-node
call npx ts-node src/scripts/reset-joes-admin-password.ts

REM Check the error level
if %errorlevel% equ 0 (
    echo.
    echo ✅ Script completed successfully!
    echo 🍕 You can now login to Joe's Pizza Palace with the reset password
) else (
    echo.
    echo ❌ Script failed. Check the error messages above.
    echo.
    echo 🔧 Common solutions:
    echo    1. Make sure MongoDB is running
    echo    2. Check your .env file has MONGODB_URI set
    echo    3. Try running: npm run seed:joes-pizza first
    echo    4. Ensure you're in the backend directory
)

echo.
echo Press any key to continue...
pause > nul