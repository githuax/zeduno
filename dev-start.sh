#!/bin/bash
echo "🚀 Starting ZedUno Development Environment..."

# Start backend
echo "[BACKEND] Starting backend..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend
echo "[FRONTEND] Starting frontend..."
npm run dev:frontend &
FRONTEND_PID=$!

# Wait for both to exit
wait $BACKEND_PID $FRONTEND_PID
