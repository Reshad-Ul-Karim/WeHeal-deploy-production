#!/bin/bash

echo "Starting weHeal Emergency Module"
echo "--------------------------------"

# Check if backend directory exists
if [ -d "Emergency/Backend" ]; then
  echo "Starting backend server..."
  cd Emergency/Backend
  
  # Check if node_modules exists, if not install dependencies
  if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
  fi
  
  # Start backend in background
  node server.js &
  BACKEND_PID=$!
  echo "Backend server started with PID: $BACKEND_PID"
  cd ../..
else
  echo "Error: Backend directory not found!"
  exit 1
fi

# Check if frontend directory exists
if [ -d "Emergency/frontend" ]; then
  echo "Starting frontend server..."
  cd Emergency/frontend
  
  # Check if node_modules exists, if not install dependencies
  if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
  fi
  
  # Start frontend
  npm run dev
  FE_EXIT_CODE=$?
  cd ../..
else
  echo "Error: Frontend directory not found!"
  exit 1
fi

# If we get here, frontend was stopped, kill backend
if [ -n "$BACKEND_PID" ]; then
  echo "Shutting down backend server..."
  kill $BACKEND_PID
fi

echo "Emergency module stopped."
exit $FE_EXIT_CODE 