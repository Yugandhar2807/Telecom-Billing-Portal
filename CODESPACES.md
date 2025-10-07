# Codespaces Setup Instructions

## Quick Start for GitHub Codespaces

When running this project in GitHub Codespaces, follow these steps:

### 1. Install Dependencies
```bash
npm run install-deps
```

### 2. Start the Application
```bash
npm run dev
```

### 3. Open Ports
GitHub Codespaces will automatically detect the ports, but make sure these are open:
- **Port 3000**: Frontend React application
- **Port 8000**: Backend API server

### 4. Access the Application
- Frontend: Click on the port 3000 popup or go to the Ports tab
- Backend API: Available on port 8000

### Environment Differences in Codespaces

1. **Database**: Uses in-memory SQLite fallback (no setup required)
2. **CORS**: Automatically configured for Codespaces URLs
3. **API URLs**: Auto-detected based on Codespaces hostname

### Demo Login Credentials
- **Email**: `demo@example.com`
- **Password**: `password123`

### Troubleshooting

#### If backend API calls fail (500 errors):
```bash
# Check if backend is running
cd backend
npm run dev
```

#### If CORS errors occur:
The application is pre-configured for Codespaces, but if issues persist:
1. Check the backend logs
2. Ensure both servers are running
3. Verify ports are publicly accessible

#### If database connection fails:
The app will automatically use SQLite fallback in Codespaces environment.

### Available Scripts
```bash
# Start both servers
npm run dev

# Start only backend
npm run server

# Start only frontend  
npm run client

# Build for production
npm run build
```