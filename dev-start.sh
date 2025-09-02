#!/bin/bash

echo "Starting ZedUno Development Environment..."

# Create logs directory
mkdir -p backend/logs

# Start backend and frontend concurrently
npx concurrently \
    --names "BACKEND,FRONTEND" \
    --prefix-colors "green,blue" \
    "cd backend && npm run dev" \
    "npm run dev"
