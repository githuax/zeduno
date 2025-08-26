# ZedUno Development Environment Guide

This guide covers all development environment setups for ZedUno, from local development to Docker-based development.

## 🚀 Quick Start Options

### Option 1: Automated Development Setup (Recommended)
```bash
# Run the development setup script
chmod +x dev-setup.sh
./dev-setup.sh
```

### Option 2: Manual Local Development
```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Create environment files (see Configuration section)
# Start development servers
npm run dev:full
```

### Option 3: Docker Development
```bash
# Start full development environment
docker-compose -f docker-compose.dev.yml up -d

# With MongoDB Admin UI
docker-compose -f docker-compose.dev.yml --profile debug up -d
```

## 📋 Development Environment Types

### 1. Native Development
- **Best for**: Local development, debugging, IDE integration
- **Requirements**: Node.js 20.x, MongoDB 7.x (optional)
- **Setup**: Use `dev-setup.sh` script

### 2. Docker Development  
- **Best for**: Consistent environment, easy database setup
- **Requirements**: Docker, Docker Compose
- **Setup**: Use `docker-compose.dev.yml`

### 3. Hybrid Development
- **Best for**: Frontend development with external backend
- **Requirements**: Node.js for frontend, external backend API
- **Setup**: Frontend-only development mode

## ⚙️ Configuration

### Frontend Environment (`.env.local`)
```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api
# For remote access
# VITE_API_URL=http://192.168.x.x:5000/api

# Development Settings
VITE_APP_NAME=ZedUno
VITE_APP_VERSION=1.0.0-dev
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PAYMENT_GATEWAYS=true
VITE_DEFAULT_CURRENCY=KES
VITE_DEBUG=true
VITE_ENV=development
```

### Backend Environment (`backend/.env`)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/zeduno
# For Docker: mongodb://zeduno-mongodb:27017/zeduno

# Development JWT (NOT for production!)
JWT_SECRET=dev-secret-key-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-key

# Server Configuration
PORT=5000
NODE_ENV=development
HOST=localhost  # Use 0.0.0.0 for Docker

# CORS (Allow all for development)
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000

# Development Features
LOG_LEVEL=debug
ENABLE_DEV_ROUTES=true
ENABLE_DETAILED_LOGS=true
```

### Vite Configuration (`vite.config.ts`)
Updated to support multiple hosts:
```typescript
server: {
  host: "::",
  port: 8080,
  allowedHosts: [
    'localhost',
    '127.0.0.1',
    'zeduno.piskoe.com',
    '.piskoe.com',
    'all'
  ],
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

## 🛠️ Development Scripts

### Package.json Scripts
```bash
# Frontend Development
npm run dev                 # Start Vite dev server
npm run dev:frontend        # Start frontend with host binding

# Backend Development  
npm run dev:backend         # Start backend in development mode
cd backend && npm run dev   # Alternative backend start

# Full Stack Development
npm run dev:full           # Start both frontend and backend
./dev-start.sh            # Alternative full stack start

# Building
npm run build             # Build frontend for production
npm run build:frontend    # Build frontend only

# Docker Development
docker-compose -f docker-compose.dev.yml up -d    # Start all services
docker-compose -f docker-compose.dev.yml down     # Stop all services
```

### Custom Development Scripts

#### `dev-start.sh` - Full Stack Development
```bash
#!/bin/bash
echo "Starting ZedUno Development Environment..."
mkdir -p backend/logs
npx concurrently \
    --names "BACKEND,FRONTEND" \
    --prefix-colors "green,blue" \
    "cd backend && npm run dev" \
    "npm run dev"
```

## 🐳 Docker Development

### Standard Development Stack
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Services included:
# - Frontend (port 3000)
# - Backend (port 5000) 
# - MongoDB (port 27017)
```

### With Additional Tools
```bash
# Include MongoDB Admin UI
docker-compose -f docker-compose.dev.yml --profile debug up -d

# Include Redis cache
docker-compose -f docker-compose.dev.yml --profile cache up -d

# All development tools
docker-compose -f docker-compose.dev.yml --profile debug --profile cache up -d
```

### Development Services
| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000, 8080 | React dev server |
| Backend | 5000, 9229 | Express API + Debug |
| MongoDB | 27017 | Database |
| Mongo Express | 8081 | DB Admin UI |
| Redis | 6379 | Caching (optional) |

## 🌐 Access URLs

### Local Development
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api  
- **Admin Panel**: http://localhost:3000/superadmin/login
- **API Health**: http://localhost:5000/api/health

### Docker Development
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MongoDB Admin**: http://localhost:8081 (with debug profile)
- **Redis**: redis://localhost:6379 (with cache profile)

### Remote Access (Network Development)
- **Frontend**: http://your-ip:3000
- **Backend API**: http://your-ip:5000/api
- **Update VITE_API_URL**: `http://your-ip:5000/api`

## 🔧 IDE Configuration

### VSCode Configuration
The development setup includes VSCode configuration:

#### `.vscode/settings.json`
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

#### `.vscode/launch.json`  
```json
{
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/server.ts",
      "runtimeArgs": ["--loader", "ts-node/esm"]
    }
  ]
}
```

## 🐛 Debugging

### Backend Debugging

#### Local Debugging
```bash
# Start backend in debug mode
cd backend
npm run dev:debug

# Or with VSCode
# Use "Debug Backend" launch configuration
```

#### Docker Debugging
```bash
# Backend container exposes port 9229 for debugging
# Connect your debugger to localhost:9229
```

### Frontend Debugging
- Use browser dev tools
- React Developer Tools extension
- Redux DevTools (if using Redux)

### Database Debugging
```bash
# Local MongoDB
mongosh mongodb://localhost:27017/zeduno

# Docker MongoDB  
docker exec -it zeduno-mongodb mongosh -u admin -p admin123

# MongoDB Admin UI (Docker with debug profile)
# Visit http://localhost:8081
```

## 📊 Development Tools

### Global Development Tools
```bash
# Installed automatically by dev-setup.sh
npm install -g nodemon concurrently ts-node typescript
```

### Development Dependencies
```bash
# Frontend development
- @vitejs/plugin-react-swc
- vite
- typescript

# Backend development  
- nodemon
- ts-node
- @types/node
```

### Recommended Browser Extensions
- React Developer Tools
- Redux DevTools  
- Vue.js devtools (if using Vue)
- JSON Formatter

## 🔄 Hot Reload Configuration

### Frontend Hot Reload
- **Vite**: Automatic hot reload for React components
- **Port**: 3000 (dev server) or 8080 (alternative)
- **Network Access**: Enabled with `host: "::"`

### Backend Hot Reload
- **Nodemon**: Watches for TypeScript changes
- **Port**: 5000
- **Debug Port**: 9229 (Docker)

### Environment File Watching
Both frontend and backend automatically reload when environment files change:
- `.env.local` (frontend)
- `backend/.env` (backend)

## 🗄️ Database Development

### Local MongoDB
```bash
# Start MongoDB
sudo systemctl start mongod

# Connect
mongosh mongodb://localhost:27017/zeduno

# Create development user
use zeduno
db.createUser({
  user: "dev",
  pwd: "devpass", 
  roles: ["readWrite"]
})
```

### Docker MongoDB
```bash
# Included in docker-compose.dev.yml
# Access: mongodb://admin:admin123@localhost:27017/zeduno
# Admin UI: http://localhost:8081
```

### Database Seeding
```bash
# Run database seeds (if available)
cd backend
npm run seed:dev

# Or manually create test data
npm run create:test-data
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :5000

# Kill process
kill -9 PID

# Or use different ports
VITE_PORT=3001 npm run dev
PORT=5001 npm run dev:backend
```

#### 2. Host Not Allowed (Vite)
```bash
# Already fixed in vite.config.ts
# If you get host errors, add your host to allowedHosts array
```

#### 3. MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check Docker MongoDB
docker logs zeduno-mongodb

# Restart MongoDB
sudo systemctl restart mongod
```

#### 4. API Not Accessible from Network
```bash
# Update backend host to 0.0.0.0
HOST=0.0.0.0 npm run dev:backend

# Update frontend API URL
VITE_API_URL=http://your-ip:5000/api npm run dev
```

#### 5. Docker Issues
```bash
# Rebuild containers
docker-compose -f docker-compose.dev.yml build --no-cache

# Check container logs
docker-compose -f docker-compose.dev.yml logs -f

# Reset Docker environment
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Debug Information
```bash
# System information
node --version
npm --version
docker --version
docker-compose --version

# Check ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# Check environment
cat .env.local
cat backend/.env
```

## 🔐 Development Security

### Development Credentials
- **Admin**: dev@zeduno.com / admin123
- **MongoDB**: admin / admin123 (Docker)
- **JWT Secret**: Use development secrets (NOT in production!)

### CORS Configuration
Development mode allows all origins for convenience:
```javascript
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,*
```

### Security Considerations
- Never use development credentials in production
- Development JWT secrets are weak - change for production
- CORS is open - restrict in production
- Detailed logging enabled - disable in production

## 📈 Performance in Development

### Development Optimizations
- Hot reload for instant feedback
- Source maps for debugging
- Detailed error messages
- Development-specific logging

### Memory Usage
- Frontend dev server: ~150-300MB
- Backend dev server: ~100-200MB  
- MongoDB: ~100-500MB
- Total development environment: ~500MB-1GB

### Build Performance
```bash
# Fast development builds
npm run dev          # No build, direct serving

# Production builds (slower)
npm run build        # Optimized production build
```

## 🌍 Network Development

### Local Network Access
```bash
# Find your local IP
ip addr show          # Linux
ifconfig             # macOS
ipconfig             # Windows

# Update environment for network access
VITE_API_URL=http://192.168.x.x:5000/api
HOST=0.0.0.0
```

### Remote Development
```bash
# For accessing from remote machines
# Update both frontend and backend configuration
```

### Domain Development
```bash
# If using local domain (like zeduno.piskoe.com)
# Already configured in vite.config.ts allowedHosts
```

## 📚 Additional Resources

### Documentation
- [Vite Documentation](https://vitejs.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Docker Documentation](https://docs.docker.com/)

### Development Tools
- [Postman](https://www.postman.com/) - API testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - MongoDB GUI
- [Redis Desktop Manager](https://rdm.dev/) - Redis GUI

### VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
- Thunder Client (Postman alternative)

---

## 🎯 Development Workflow

### Typical Development Session
1. **Start Environment**
   ```bash
   ./dev-start.sh
   # or
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Open Browser**
   - Frontend: http://localhost:3000
   - Admin: http://localhost:3000/superadmin/login
   - API Docs: http://localhost:5000/api/docs (if available)

3. **Start Coding**
   - Frontend: `src/` directory
   - Backend: `backend/src/` directory
   - Hot reload handles the rest!

4. **Testing**
   ```bash
   npm test              # Run frontend tests
   cd backend && npm test # Run backend tests
   ```

5. **Before Committing**
   ```bash
   npm run lint          # Check code style
   npm run type-check    # TypeScript checking
   npm run build         # Ensure production build works
   ```

### Development Best Practices
- ✅ Use TypeScript for type safety
- ✅ Follow ESLint rules for consistent code style
- ✅ Test your changes on multiple devices/browsers
- ✅ Check both development and production builds
- ✅ Use meaningful commit messages
- ✅ Keep environment files updated
- ✅ Document new features and APIs

---

**Happy developing! 🚀**

For questions or issues, check the main README.md or create an issue in the repository.