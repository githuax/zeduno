# ZedUno Development Guide

## Quick Start

### Start Development Environment
```bash
# All services
./dev-start.sh

# Or individually
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
npm run dev:full      # Both with concurrently
```

### Docker Development
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MongoDB**: mongodb://localhost:27017/zeduno

## Development Credentials
- **Admin**: dev@zeduno.com / admin123
- **MongoDB**: admin / admin123 (if using Docker)

## Environment Files
- **.env.local** - Frontend configuration
- **backend/.env** - Backend configuration

## Available Scripts
- `npm run dev` - Start frontend development server
- `npm run build` - Build for production
- `npm run dev:full` - Start both frontend and backend
- `./dev-start.sh` - Start development environment

## VSCode Setup
Launch configurations and settings are already configured in .vscode/

## Database
Local MongoDB running on port 27017

## Hot Reload
Both frontend and backend support hot reload during development.

## Debugging
Use VSCode's "Debug Backend" configuration to debug the Node.js backend.

## Port Configuration
- Frontend: 3000 (Vite dev server)
- Backend: 5000 (Express API)
- MongoDB: 27017

## Next Steps
1. Start the development environment: `./dev-start.sh`
2. Open http://localhost:3000 in your browser
3. Login with dev@zeduno.com / admin123
4. Start developing!
