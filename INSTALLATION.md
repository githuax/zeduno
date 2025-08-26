# ZedUno Restaurant Management System - Installation Guide

Welcome to ZedUno! This guide provides multiple installation methods for Ubuntu 25.04 (also compatible with 24.04 and 22.04).

## 🚀 Quick Start (Recommended for Testing)

For a quick development setup, use our one-command installer:

```bash
curl -sSL https://raw.githubusercontent.com/githuax/dine-serve-hub/main/quick-install.sh | bash
```

This will:
- Install Node.js, MongoDB, and dependencies
- Clone and configure the application
- Start services with PM2
- Provide access URLs

**Access**: `http://localhost:5173` (Frontend) | `http://localhost:5000/api` (Backend)

---

## 🏢 Production Installation (Full Setup)

For production deployments with SSL, security hardening, and monitoring:

```bash
curl -sSL https://raw.githubusercontent.com/githuax/dine-serve-hub/main/install.sh | bash
```

### Features:
- ✅ Complete system hardening (Firewall, Fail2ban)
- ✅ Nginx reverse proxy with SSL/HTTPS
- ✅ Production-grade MongoDB setup
- ✅ PM2 process management
- ✅ Automated SSL certificate management
- ✅ Log rotation and monitoring
- ✅ Security headers and rate limiting

### Interactive Configuration:
- Domain name setup
- SSL certificate automation
- MongoDB password generation
- JWT secret generation
- Service user creation

---

## 🐳 Docker Installation (Containerized)

For containerized deployment with Docker:

```bash
curl -sSL https://raw.githubusercontent.com/githuax/dine-serve-hub/main/docker-install.sh | bash
```

### Features:
- ✅ Multi-container setup (MongoDB, Backend, Frontend)
- ✅ Production-ready Docker Compose configuration
- ✅ Nginx load balancing
- ✅ Persistent data volumes
- ✅ Health checks and auto-restart
- ✅ Optional SSL with Let's Encrypt

---

## 🛠 Manual Installation

For custom setups or when you want full control:

### Prerequisites

**System Requirements:**
- Ubuntu 25.04, 24.04, or 22.04 LTS
- 2GB+ RAM (4GB recommended)
- 2+ CPU cores
- 5GB+ disk space
- sudo privileges

### Step 1: Install Dependencies

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB 7.x
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install additional tools
sudo apt-get install -y git nginx certbot python3-certbot-nginx
```

### Step 2: Download and Configure

```bash
# Clone repository
git clone https://github.com/githuax/dine-serve-hub.git /opt/zeduno
cd /opt/zeduno

# Install dependencies
npm install
cd backend && npm install && cd ..

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your settings
```

### Step 3: Environment Configuration

Edit `backend/.env` with your configuration:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/zeduno

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-here
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Backend URL
BACKEND_URL=https://yourdomain.com

# Payment Gateway Settings (Configure in Admin Panel)
MPESA_ENVIRONMENT=sandbox
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
SQUARE_APPLICATION_ID=
SQUARE_ACCESS_TOKEN=
```

### Step 4: Build and Start

```bash
# Build applications
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start backend
cd backend
pm2 start dist/server.js --name zeduno-backend
cd ..

# For production, serve frontend via Nginx
# For development, you can use: npm run dev:frontend

# Setup PM2 startup
pm2 save
pm2 startup
```

### Step 5: Configure Nginx (Production)

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/zeduno
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Frontend static files
    location / {
        root /opt/zeduno/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads/ {
        alias /opt/zeduno/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

Enable the site and obtain SSL certificate:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/zeduno /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔐 Security Configuration

### Firewall Setup

```bash
# Enable UFW firewall
sudo ufw enable

# Configure rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

### MongoDB Security

```bash
# Create admin user
mongosh
```

```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "your-secure-password",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})
```

Update MongoDB URI in `.env`:
```
MONGODB_URI=mongodb://admin:your-secure-password@localhost:27017/zeduno?authSource=admin
```

---

## 📊 Post-Installation

### 1. Initial Setup

1. Visit your domain or server IP
2. Complete the setup wizard
3. Create superadmin account
4. Configure system settings

### 2. Create First Tenant

1. Access SuperAdmin dashboard
2. Create new tenant (restaurant)
3. Configure tenant settings
4. Add initial users

### 3. Configure Payment Gateways

Navigate to **Payment Gateway Settings** to configure:

- **M-Pesa**: For Kenyan mobile payments
  - Consumer Key & Secret
  - Business Short Code
  - Passkey
  - Environment (sandbox/production)

- **Stripe**: For international cards
  - Publishable Key
  - Secret Key
  - Webhook Secret

- **Square**: For POS integration
  - Application ID
  - Access Token

- **Cash**: Enable/disable cash payments

### 4. Menu Management

1. Access Menu Management
2. Create categories
3. Add menu items with prices
4. Upload item images
5. Set availability

---

## 🔧 Management Commands

### Service Management

```bash
# PM2 Commands
pm2 status              # View service status
pm2 logs                # View logs
pm2 restart zeduno-backend  # Restart backend
pm2 stop all            # Stop all services
pm2 delete all          # Delete all services

# System Services
sudo systemctl status nginx    # Nginx status
sudo systemctl restart nginx   # Restart Nginx
sudo systemctl status mongod   # MongoDB status
```

### Monitoring

```bash
# View application logs
pm2 logs zeduno-backend

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View system resources
htop
df -h
free -h
```

### Maintenance

```bash
# Update application
cd /opt/zeduno
git pull
npm run build
pm2 restart zeduno-backend

# Backup database
mongodump --uri="mongodb://admin:password@localhost:27017/zeduno?authSource=admin" --out=/backup/$(date +%Y%m%d)

# SSL certificate renewal (automatic with certbot)
sudo certbot renew --dry-run
```

---

## 🆘 Troubleshooting

### Common Issues

**Backend not starting:**
```bash
# Check logs
pm2 logs zeduno-backend

# Check MongoDB connection
mongosh --eval "db.runCommand('ping')"

# Check environment variables
cat backend/.env
```

**Frontend not loading:**
```bash
# Check Nginx configuration
sudo nginx -t

# Check if build exists
ls -la dist/

# Rebuild frontend
npm run build:frontend
```

**Database connection issues:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo journalctl -u mongod -f

# Test connection
mongosh "mongodb://localhost:27017/zeduno"
```

**SSL certificate issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

### Performance Optimization

**For high traffic:**
```bash
# Increase PM2 instances
pm2 scale zeduno-backend 4

# Configure Nginx caching
# Add to Nginx config:
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Database optimization:**
```javascript
// In MongoDB
use zeduno
db.orders.createIndex({ "createdAt": 1 })
db.orders.createIndex({ "tenantId": 1 })
db.menuItems.createIndex({ "tenantId": 1, "category": 1 })
```

---

## 📞 Support

- **GitHub Issues**: [https://github.com/githuax/dine-serve-hub/issues](https://github.com/githuax/dine-serve-hub/issues)
- **Documentation**: Check the `/docs` folder in the repository
- **Community**: Join our discussions on GitHub

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Happy restaurant management with ZedUno! 🍽️🚀**