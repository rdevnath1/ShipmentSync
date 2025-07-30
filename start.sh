#!/bin/bash

# Kill any existing processes on port 3002
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 2

# Set environment variables
export DATABASE_URL=postgresql://rdevnath@localhost:5432/quikpik_prod
export NODE_ENV=development
export PORT=3002
export SESSION_SECRET=quikpik_local_dev_secret_12345
export SHIPSTATION_API_KEY=58422b16196741d7bb3c32d7e6e43827
export SHIPSTATION_API_SECRET=4cd58d5f1e90467aa87268abbb5eeb3b
export JIAYOU_API_KEY=d370d0ee7e704117bfca9184bc03f590
export JIAYOU_CLIENT_ID=769908

echo "Starting Quikpik server with database..."
echo "Database: $DATABASE_URL"
echo "Mode: $NODE_ENV"
echo "Port: $PORT"

# Start the server in background and keep running
nohup npx tsx server/index.ts > server.log 2>&1 &
SERVER_PID=$!

echo "Server started with PID: $SERVER_PID"
echo "Waiting for server to start..."

# Wait for server to be ready
for i in {1..30}; do
    if curl -f http://:3002 >/dev/null 2>&1; then
        echo "✅ Server is ready at http://localhost:3002"
        exit 0
    fi
    echo -n "."
    sleep 1
done

echo "❌ Server failed to start"
exit 1