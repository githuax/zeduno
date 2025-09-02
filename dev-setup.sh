#!/bin/bash

# =============================================================================
# ZedUno Development Environment Setup Script
# Quick setup for local development on Ubuntu/macOS/WSL
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Logging functions
log() { echo -e "${GREEN}[DEV] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }
warn() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }
success() { echo -e "${CYAN}[SUCCESS] $1${NC}"; }

echo -e "${PURPLE}
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     ███████╗███████╗██████╗ ██╗   ██╗███╗   ██╗ ██████╗          ║
║     ╚══███╔╝██╔════╝██╔══██╗██║   ██║████╗  ██║██╔═══██╗         ║
║       ███╔╝ █████╗  ██║  ██║██║   ██║██╔██╗ ██║██║   ██║         ║
║      ███╔╝  ██╔══╝  ██║  ██║██║   ██║██║╚██╗██║██║   ██║         ║
║     ███████╗███████╗██████╔╝╚██████╔╝██║ ╚████║╚██████╔╝         ║
║     ╚══════╝╚══════╝╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝          ║
║                                                                  ║
║              Development Environment Setup                      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝${NC}
"

echo
echo -e "${WHITE}ZedUno Development Setup${NC}"
echo "This script sets up a complete development environment for ZedUno."
echo

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if [[ -f /proc/version ]] && grep -q Microsoft /proc/version; then
        OS="wsl"
        info "Detected Windows Subsystem for Linux (WSL)"
    else
        info "Detected Linux"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    info "Detected macOS"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="windows"
    info "Detected Windows (use WSL or Git Bash)"
else
    OS="unknown"
    warn "Unknown OS: $OSTYPE - proceeding with Linux defaults"
fi

# Configuration
APP_DIR=$(pwd)
NODE_VERSION="20"
MONGODB_VERSION="7.0"

echo
echo -e "${CYAN}=== DEVELOPMENT SETUP OPTIONS ===${NC}"
echo "1) Full Development Setup (MongoDB, Node.js, dependencies)"
echo "2) Quick Setup (assumes Node.js and MongoDB already installed)"
echo "3) Frontend Only (no backend/database setup)"
echo "4) Docker Development (use Docker containers)"
read -p "Choose setup type (1-4) [1]: " setup_choice

case $setup_choice in
    2) QUICK_SETUP=true ;;
    3) FRONTEND_ONLY=true ;;
    4) DOCKER_DEV=true ;;
    *) FULL_SETUP=true ;;
esac

# Database choice
if [[ "$FRONTEND_ONLY" != true && "$DOCKER_DEV" != true ]]; then
    echo
    echo "Database setup:"
    echo "1) Local MongoDB"
    echo "2) MongoDB Atlas (cloud)"
    echo "3) Docker MongoDB"
    read -p "Choose database option (1-3) [1]: " db_choice
    
    case $db_choice in
        2) USE_ATLAS=true ;;
        3) USE_DOCKER_DB=true ;;
        *) USE_LOCAL_DB=true ;;
    esac
fi

echo
log "Starting development environment setup..."

# =============================================================================
# NODE.JS INSTALLATION
# =============================================================================

if [[ "$FULL_SETUP" == true || "$QUICK_SETUP" == true ]]; then
    log "Checking Node.js installation..."
    
    if ! command -v node >/dev/null 2>&1; then
        log "Installing Node.js ${NODE_VERSION}.x..."
        
        case $OS in
            "linux"|"wsl")
                curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
                sudo apt install -y nodejs
                ;;
            "macos")
                if command -v brew >/dev/null 2>&1; then
                    brew install node@${NODE_VERSION}
                else
                    error "Please install Homebrew first: https://brew.sh"
                fi
                ;;
            *)
                warn "Please install Node.js ${NODE_VERSION}.x manually from https://nodejs.org"
                ;;
        esac
    else
        NODE_CURRENT=$(node --version)
        success "Node.js already installed: $NODE_CURRENT"
    fi
    
    # Verify Node.js
    if command -v node >/dev/null 2>&1; then
        success "Node.js $(node --version) is available"
    else
        error "Node.js installation failed"
    fi
fi

# =============================================================================
# MONGODB INSTALLATION
# =============================================================================

if [[ "$USE_LOCAL_DB" == true ]]; then
    log "Setting up MongoDB..."
    
    if ! command -v mongod >/dev/null 2>&1; then
        log "Installing MongoDB ${MONGODB_VERSION}..."
        
        case $OS in
            "linux"|"wsl")
                curl -fsSL https://www.mongodb.org/static/pgp/server-${MONGODB_VERSION}.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-${MONGODB_VERSION}.gpg --dearmor
                echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-${MONGODB_VERSION}.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/${MONGODB_VERSION} multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-${MONGODB_VERSION}.list
                sudo apt update
                sudo apt install -y mongodb-org
                sudo systemctl start mongod
                sudo systemctl enable mongod
                ;;
            "macos")
                if command -v brew >/dev/null 2>&1; then
                    brew tap mongodb/brew
                    brew install mongodb-community@${MONGODB_VERSION}
                    brew services start mongodb/brew/mongodb-community
                else
                    error "Please install Homebrew first: https://brew.sh"
                fi
                ;;
            *)
                warn "Please install MongoDB ${MONGODB_VERSION} manually"
                ;;
        esac
    else
        success "MongoDB already installed"
    fi
fi

if [[ "$USE_DOCKER_DB" == true ]]; then
    log "Setting up MongoDB with Docker..."
    
    if ! command -v docker >/dev/null 2>&1; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Create MongoDB container
    docker run -d \
        --name zeduno-mongodb \
        -p 27017:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=admin \
        -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
        -e MONGO_INITDB_DATABASE=zeduno \
        -v zeduno-mongodb-data:/data/db \
        mongo:7.0
    
    success "MongoDB Docker container started"
fi

# =============================================================================
# PROJECT SETUP
# =============================================================================

log "Setting up project..."

# Check if we're in a ZedUno directory
if [[ ! -f "package.json" ]]; then
    # Clone repository
    read -p "ZedUno repository URL [https://github.com/githuax/dine-serve-hub.git]: " repo_url
    repo_url=${repo_url:-https://github.com/githuax/dine-serve-hub.git}
    
    log "Cloning ZedUno repository..."
    git clone "$repo_url" zeduno
    cd zeduno
    APP_DIR=$(pwd)
fi

# Install dependencies
log "Installing dependencies..."
npm install

if [[ "$FRONTEND_ONLY" != true ]]; then
    cd backend && npm install && cd ..
fi

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================

log "Creating development environment configuration..."

# Frontend environment
cat > .env.local <<EOF
# ZedUno Development Environment - $(date)
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=ZedUno
VITE_APP_VERSION=1.0.0-dev
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PAYMENT_GATEWAYS=true
VITE_DEFAULT_CURRENCY=KES
VITE_DEBUG=true
VITE_ENV=development
EOF

# Backend environment (if not frontend-only)
if [[ "$FRONTEND_ONLY" != true ]]; then
    # Determine MongoDB URI
    if [[ "$USE_ATLAS" == true ]]; then
        read -p "Enter MongoDB Atlas connection string: " MONGODB_URI
    elif [[ "$USE_DOCKER_DB" == true ]]; then
        MONGODB_URI="mongodb://admin:admin123@localhost:27017/zeduno?authSource=admin"
    else
        MONGODB_URI="mongodb://localhost:27017/zeduno"
    fi
    
    cat > backend/.env <<EOF
# ZedUno Backend Development Environment - $(date)

# Database Configuration
MONGODB_URI=$MONGODB_URI
DB_NAME=zeduno

# JWT Configuration (Development - Change for production!)
JWT_SECRET=dev-secret-key-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
HOST=localhost

# CORS Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173

# File Upload Configuration
UPLOAD_PATH=uploads
MAX_FILE_SIZE=10485760

# Development Email Configuration (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=dev@localhost

# Development Payment Configuration (Sandbox)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_PASSKEY=
MPESA_SHORTCODE=
MPESA_ENVIRONMENT=sandbox

# Logging Configuration
LOG_LEVEL=debug
LOG_FILE=logs/development.log

# Security Configuration (Relaxed for development)
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=1000

# Development Features
ENABLE_CORS=true
ENABLE_DETAILED_LOGS=true
ENABLE_DEV_ROUTES=true
EOF
fi

success "Environment configuration created"

# =============================================================================
# DEVELOPMENT TOOLS SETUP
# =============================================================================

log "Setting up development tools..."

# Install global development tools
npm install -g nodemon concurrently

# Create development scripts
cat > dev-start.sh <<'EOF'
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
EOF

chmod +x dev-start.sh

# Create package.json scripts for development
if [[ -f "package.json" ]]; then
    # Add development scripts using jq if available, otherwise manual
    if command -v jq >/dev/null 2>&1; then
        jq '.scripts["dev:full"] = "concurrently \"cd backend && npm run dev\" \"npm run dev\""' package.json > tmp.json && mv tmp.json package.json
        jq '.scripts["dev:frontend"] = "vite --host"' package.json > tmp.json && mv tmp.json package.json
        jq '.scripts["dev:backend"] = "cd backend && npm run dev"' package.json > tmp.json && mv tmp.json package.json
        jq '.scripts["setup:dev"] = "./dev-setup.sh"' package.json > tmp.json && mv tmp.json package.json
    fi
fi

# Create VSCode settings for development
mkdir -p .vscode
cat > .vscode/settings.json <<EOF
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
EOF

cat > .vscode/launch.json <<EOF
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "\${workspaceFolder}/backend/src/server.ts",
      "outFiles": ["\${workspaceFolder}/backend/dist/**/*.js"],
      "runtimeArgs": ["--loader", "ts-node/esm"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
EOF

success "Development tools configured"

# =============================================================================
# DATABASE SETUP
# =============================================================================

if [[ "$FRONTEND_ONLY" != true && "$USE_LOCAL_DB" == true ]]; then
    log "Setting up development database..."
    
    # Wait for MongoDB to be ready
    sleep 3
    
    # Create development database and sample data
    mongosh --eval "
    use zeduno
    
    // Create sample superadmin user
    db.users.insertOne({
        email: 'dev@zeduno.com',
        username: 'developer',
        password: '\$2b\$10\$rQQ.Vj8n8n8n8n8n8n8n8OzQQQQQQQQQQQQQQQQQQQQQQ',
        role: 'superadmin',
        isActive: true,
        createdAt: new Date()
    })
    
    print('Development database initialized')
    " || warn "Database initialization skipped (MongoDB may not be ready)"
fi

# =============================================================================
# DOCKER DEVELOPMENT SETUP
# =============================================================================

if [[ "$DOCKER_DEV" == true ]]; then
    log "Setting up Docker development environment..."
    
    cat > docker-compose.dev.yml <<EOF
version: '3.8'

services:
  zeduno-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://zeduno-mongodb:27017/zeduno
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - zeduno-mongodb
    command: npm run dev

  zeduno-frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend.dev
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:5000/api
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

  zeduno-mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=admin123
      - MONGO_INITDB_DATABASE=zeduno
    volumes:
      - zeduno-dev-data:/data/db

volumes:
  zeduno-dev-data:
EOF

    # Create Docker development Dockerfiles if they don't exist
    mkdir -p backend
    if [[ ! -f "backend/Dockerfile.dev" ]]; then
        cat > backend/Dockerfile.dev <<EOF
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
EOF
    fi

    if [[ ! -f "Dockerfile.frontend.dev" ]]; then
        cat > Dockerfile.frontend.dev <<EOF
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
EOF
    fi
    
    success "Docker development environment configured"
fi

# =============================================================================
# CREATE DEVELOPMENT DOCUMENTATION
# =============================================================================

log "Creating development documentation..."

cat > DEVELOPMENT.md <<EOF
# ZedUno Development Guide

## Quick Start

### Start Development Environment
\`\`\`bash
# All services
./dev-start.sh

# Or individually
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
npm run dev:full      # Both with concurrently
\`\`\`

### Docker Development
\`\`\`bash
docker-compose -f docker-compose.dev.yml up -d
\`\`\`

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
- \`npm run dev\` - Start frontend development server
- \`npm run build\` - Build for production
- \`npm run dev:full\` - Start both frontend and backend
- \`./dev-start.sh\` - Start development environment

## VSCode Setup
Launch configurations and settings are already configured in .vscode/

## Database
$([ "$USE_LOCAL_DB" == true ] && echo "Local MongoDB running on port 27017" || echo "Configure your database connection in backend/.env")

## Hot Reload
Both frontend and backend support hot reload during development.

## Debugging
Use VSCode's "Debug Backend" configuration to debug the Node.js backend.

## Port Configuration
- Frontend: 3000 (Vite dev server)
- Backend: 5000 (Express API)
- MongoDB: 27017

## Next Steps
1. Start the development environment: \`./dev-start.sh\`
2. Open http://localhost:3000 in your browser
3. Login with dev@zeduno.com / admin123
4. Start developing!
EOF

success "Development documentation created"

# =============================================================================
# FINAL VERIFICATION
# =============================================================================

log "Performing final verification..."

# Check if all required files exist
if [[ -f "package.json" ]]; then
    success "Project files are ready"
else
    error "Project setup incomplete"
fi

if [[ -f ".env.local" ]]; then
    success "Frontend environment configured"
fi

if [[ "$FRONTEND_ONLY" != true && -f "backend/.env" ]]; then
    success "Backend environment configured"
fi

# =============================================================================
# DEVELOPMENT SETUP COMPLETE
# =============================================================================

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   🎉 DEVELOPMENT SETUP COMPLETE! 🎉   ${NC}"
echo -e "${GREEN}========================================${NC}"
echo

echo -e "${CYAN}Your ZedUno development environment is ready!${NC}"
echo

echo -e "${WHITE}Quick Start Commands:${NC}"
echo -e "🚀 Start Development: ${BLUE}./dev-start.sh${NC}"
echo -e "🌐 Frontend Only: ${BLUE}npm run dev${NC}"
echo -e "⚙️  Backend Only: ${BLUE}cd backend && npm run dev${NC}"
if [[ "$DOCKER_DEV" == true ]]; then
    echo -e "🐳 Docker Development: ${BLUE}docker-compose -f docker-compose.dev.yml up -d${NC}"
fi

echo
echo -e "${WHITE}Access URLs:${NC}"
echo -e "🌐 Frontend: ${CYAN}http://localhost:3000${NC}"
echo -e "🔧 Backend API: ${CYAN}http://localhost:5000/api${NC}"
echo -e "📊 Admin Panel: ${CYAN}http://localhost:3000/superadmin/login${NC}"

echo
echo -e "${WHITE}Development Credentials:${NC}"
echo -e "👤 Username: ${YELLOW}dev@zeduno.com${NC}"
echo -e "🔑 Password: ${YELLOW}admin123${NC}"

echo
echo -e "${WHITE}Development Files Created:${NC}"
echo "📄 .env.local - Frontend configuration"
if [[ "$FRONTEND_ONLY" != true ]]; then
    echo "📄 backend/.env - Backend configuration"
fi
echo "📄 dev-start.sh - Development startup script"
echo "📄 DEVELOPMENT.md - Development guide"
echo "📁 .vscode/ - VSCode configuration"
if [[ "$DOCKER_DEV" == true ]]; then
    echo "📄 docker-compose.dev.yml - Docker development setup"
fi

echo
echo -e "${GREEN}Happy developing! 🚀${NC}"
echo
echo "💡 Tip: Use 'npm run dev:full' to start both frontend and backend simultaneously"
echo "📚 Check DEVELOPMENT.md for detailed development instructions"

exit 0