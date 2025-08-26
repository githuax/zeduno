# ZedUno Ubuntu Server Deployment Guide

This guide provides comprehensive instructions for deploying ZedUno on Ubuntu servers (18.04, 20.04, 22.04, or 24.04).

## 🚀 Quick Start

### One-Command Deployment
```bash
curl -fsSL https://raw.githubusercontent.com/githuax/dine-serve-hub/main/deploy-ubuntu.sh | sudo bash
```

### Manual Deployment
Follow the step-by-step guide below for more control over the installation process.

---

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 18.04+ (Recommended: Ubuntu 22.04 LTS or 24.04 LTS)
- **RAM**: Minimum 2GB (Recommended: 4GB+)
- **Storage**: Minimum 10GB free space
- **CPU**: 1 core minimum (Recommended: 2+ cores)
- **Network**: Internet connectivity for package downloads

### Required Privileges
- Root access or sudo privileges
- SSH access to the server

---

## 🛠️ Installation Methods

### Method 1: Automated Script (Recommended)

The automated deployment script handles everything for you:

```bash
# Download and run the deployment script
wget https://raw.githubusercontent.com/githuax/dine-serve-hub/main/deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

**What the script does:**
- ✅ Updates system packages
- ✅ Installs Node.js 20.x LTS
- ✅ Installs MongoDB 7.x with authentication
- ✅ Installs PM2 for process management
- ✅ Configures firewall (UFW)
- ✅ Sets up SSL certificates with Let's Encrypt
- ✅ Creates service user and directories
- ✅ Clones and builds the application
- ✅ Configures environment variables
- ✅ Starts services with PM2
- ✅ Sets up automatic startup

### Method 2: Docker Deployment

For containerized deployment:

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and deploy
git clone https://github.com/githuax/dine-serve-hub.git
cd dine-serve-hub
sudo docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 Manual Installation Steps

### Step 1: System Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common
```

### Step 2: Install Node.js 20.x LTS

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 3: Install MongoDB 7.x

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list and install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Secure MongoDB installation
sudo systemctl status mongod  # Verify it's running
```

### Step 4: Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Configure PM2 startup
sudo pm2 startup
# Follow the instructions provided by the command above
```

### Step 5: Create Service User

```bash
# Create zeduno user
sudo useradd -r -s /bin/false zeduno
sudo mkdir -p /opt/zeduno
sudo chown zeduno:zeduno /opt/zeduno
```

### Step 6: Deploy Application

```bash
# Switch to service user context
sudo -u zeduno bash

# Navigate to app directory
cd /opt/zeduno

# Clone the repository
git clone https://github.com/githuax/dine-serve-hub.git .

# Install dependencies
npm install
cd backend && npm install && cd ..

# Create environment configuration
cat > .env.local <<EOF
# Frontend Configuration
VITE_API_URL=http://$(curl -s ifconfig.me):5000/api
VITE_APP_NAME=ZedUno
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PAYMENT_GATEWAYS=true
VITE_DEFAULT_CURRENCY=KES
VITE_DEBUG=false
EOF

# Backend environment (replace with your values)
cat > backend/.env <<EOF
# Database
MONGODB_URI=mongodb://localhost:27017/zeduno
DB_NAME=zeduno

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=http://$(curl -s ifconfig.me):3000

# File Upload Configuration
UPLOAD_PATH=uploads
MAX_FILE_SIZE=10485760

# Email Configuration (Optional)
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# FROM_EMAIL=

# Payment Gateway Configuration (Optional)
# MPESA_CONSUMER_KEY=
# MPESA_CONSUMER_SECRET=
# MPESA_PASSKEY=
# MPESA_SHORTCODE=
EOF

# Build the application
npm run build
```

### Step 7: Configure MongoDB Authentication

```bash
# Connect to MongoDB
sudo mongosh

# Switch to admin database and create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "your-secure-password",
  roles: ["root"]
})

# Create ZedUno database and user
use zeduno
db.createUser({
  user: "zeduno",
  pwd: "your-zeduno-password",
  roles: ["readWrite"]
})

# Exit MongoDB shell
exit
```

### Step 8: Start Services with PM2

```bash
# Still as zeduno user, create PM2 configuration
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'zeduno-backend',
      script: 'backend/src/server.ts',
      interpreter: 'node',
      interpreter_args: '--loader ts-node/esm',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
      log_file: 'logs/backend.log'
    },
    {
      name: 'zeduno-frontend',
      script: 'serve',
      args: '-s dist -l 3000',
      env: {
        NODE_ENV: 'production'
      },
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log',
      log_file: 'logs/frontend.log'
    }
  ]
};
EOF

# Install serve globally for frontend
sudo npm install -g serve ts-node

# Create logs directory
mkdir -p logs

# Start applications
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Exit zeduno user context
exit

# Configure PM2 startup as root
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u zeduno --hp /opt/zeduno
```

### Step 9: Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow application ports
sudo ufw allow 3000  # Frontend
sudo ufw allow 5000  # Backend API

# Check firewall status
sudo ufw status
```

### Step 10: Install SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot

# Install Nginx for reverse proxy
sudo apt install -y nginx

# Configure Nginx
sudo tee /etc/nginx/sites-available/zeduno <<EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/zeduno /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```bash
# API Configuration
VITE_API_URL=https://your-domain.com/api

# App Information
VITE_APP_NAME=ZedUno
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PAYMENT_GATEWAYS=true
VITE_DEFAULT_CURRENCY=KES
VITE_DEBUG=false
```

#### Backend (backend/.env)
```bash
# Database
MONGODB_URI=mongodb://zeduno:password@localhost:27017/zeduno?authSource=zeduno
DB_NAME=zeduno

# Security
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# File Uploads
UPLOAD_PATH=uploads
MAX_FILE_SIZE=10485760

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@your-domain.com
```

---

## 🚀 Post-Installation

### Verify Installation

```bash
# Check PM2 processes
sudo -u zeduno pm2 status

# Check service logs
sudo -u zeduno pm2 logs

# Test API endpoint
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:3000
```

### Access Your Application

- **Frontend**: http://your-server-ip:3000 or https://your-domain.com
- **API**: http://your-server-ip:5000/api or https://your-domain.com/api

### Default Admin Access

1. Navigate to your ZedUno installation
2. Access the SuperAdmin login at `/superadmin/login`
3. Default credentials (change immediately):
   - Username: `admin@zeduno.com`
   - Password: `admin123`

---

## 🔄 Maintenance

### Update Application

Use the provided update script:
```bash
# Download and run update script
wget https://raw.githubusercontent.com/githuax/dine-serve-hub/main/update-ubuntu.sh
chmod +x update-ubuntu.sh
sudo ./update-ubuntu.sh
```

### Manual Update

```bash
# As zeduno user
sudo -u zeduno bash
cd /opt/zeduno

# Pull latest changes
git pull origin main

# Update dependencies
npm install
cd backend && npm install && cd ..

# Rebuild application
npm run build

# Restart services
pm2 restart all
pm2 save

exit
```

### Backup

```bash
# Create backup script
sudo tee /opt/zeduno/backup.sh <<EOF
#!/bin/bash
BACKUP_DIR="/opt/backups/zeduno"
DATE=\$(date +"%Y%m%d_%H%M%S")

mkdir -p \$BACKUP_DIR

# Backup database
mongodump --db zeduno --out \$BACKUP_DIR/db_\$DATE

# Backup application files
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz /opt/zeduno --exclude=/opt/zeduno/node_modules --exclude=/opt/zeduno/backend/node_modules

echo "Backup completed: \$BACKUP_DIR"
EOF

chmod +x /opt/zeduno/backup.sh

# Run backup
sudo /opt/zeduno/backup.sh

# Schedule daily backups (optional)
echo "0 2 * * * /opt/zeduno/backup.sh" | sudo crontab -
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo journalctl -u mongod

# Restart MongoDB
sudo systemctl restart mongod
```

#### 2. PM2 Process Errors
```bash
# Check PM2 status
sudo -u zeduno pm2 status

# View logs
sudo -u zeduno pm2 logs

# Restart specific process
sudo -u zeduno pm2 restart zeduno-backend
```

#### 3. Port Already in Use
```bash
# Find process using port
sudo lsof -i :5000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 PID
```

#### 4. Permission Issues
```bash
# Fix ownership
sudo chown -R zeduno:zeduno /opt/zeduno

# Fix permissions
sudo chmod -R 755 /opt/zeduno
```

#### 5. Firewall Blocking Connections
```bash
# Check UFW status
sudo ufw status

# Allow required ports
sudo ufw allow 3000
sudo ufw allow 5000
```

### Log Locations

- **Application Logs**: `/opt/zeduno/logs/`
- **PM2 Logs**: `~/.pm2/logs/` (as zeduno user)
- **MongoDB Logs**: `/var/log/mongodb/mongod.log`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/syslog`

### Performance Monitoring

```bash
# System resources
htop
df -h
free -h

# PM2 monitoring
sudo -u zeduno pm2 monit

# MongoDB monitoring
mongosh --eval "db.stats()"
```

---

## 🔐 Security Recommendations

### 1. Change Default Passwords
- MongoDB admin password
- ZedUno admin credentials
- JWT secrets

### 2. Configure Firewall
```bash
# Only allow necessary ports
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. Enable Fail2Ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Regular Updates
```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Application updates
sudo /opt/zeduno/update-ubuntu.sh
```

### 5. SSL/HTTPS Only
Configure Nginx to redirect HTTP to HTTPS and use strong SSL settings.

---

## 📞 Support

### Getting Help

1. **Documentation**: Check this guide thoroughly
2. **Logs**: Always check application and system logs first
3. **GitHub Issues**: Report bugs at https://github.com/githuax/dine-serve-hub/issues
4. **Community**: Join our community discussions

### Before Reporting Issues

Please include:
- Ubuntu version (`lsb_release -a`)
- Node.js version (`node --version`)
- PM2 status (`pm2 status`)
- Relevant log excerpts
- Steps to reproduce the issue

---

## 📊 Performance Optimization

### 1. Database Indexing
```javascript
// Connect to MongoDB and create indexes
use zeduno
db.orders.createIndex({"tenantId": 1, "createdAt": -1})
db.users.createIndex({"email": 1})
db.menuitems.createIndex({"tenantId": 1, "category": 1})
```

### 2. PM2 Clustering
The provided PM2 configuration uses cluster mode for better performance.

### 3. Nginx Caching
Add caching rules to your Nginx configuration for static assets.

### 4. MongoDB Tuning
Configure MongoDB memory usage and connection pooling based on your server specs.

---

*This guide covers Ubuntu 18.04, 20.04, 22.04, and 24.04 LTS versions. For other Linux distributions, adapt the package manager commands accordingly.*

**Happy deploying! 🚀**