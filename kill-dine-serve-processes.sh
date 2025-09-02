#!/bin/bash

echo "Killing dine-serve-hub related processes..."

# Kill processes by project path
pkill -f "dine-serve-hub.*node"
pkill -f "dine-serve-hub.*npm"
pkill -f "dine-serve-hub.*ts-node"
pkill -f "dine-serve-hub.*nodemon"

# Kill processes by user and project directory
ps aux | grep osbui | grep -E "dine-serve-hub" | awk '{print $2}' | xargs -r kill -9

echo "Done!"
