# Railway/Render Build Script
#!/bin/bash

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && npm run build && cd ..

# Start the application
cd backend && npm start