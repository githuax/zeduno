# ZedUno Deployment Scripts

This directory contains comprehensive deployment and update scripts for ZedUno Restaurant Management System on Ubuntu servers.

## 🚀 Available Scripts

### 1. `deploy-ubuntu.sh` - Initial Deployment
Comprehensive deployment script for fresh Ubuntu server installations.

**Features:**
- ✅ Supports Ubuntu 18.04, 20.04, 22.04, 24.04 LTS
- ✅ Interactive configuration with deployment options
- ✅ Automatic system preparation and package installation
- ✅ Node.js 20.x LTS and MongoDB 7.x installation
- ✅ PM2 process management with clustering
- ✅ Optional Nginx reverse proxy configuration
- ✅ SSL certificate setup with Let's Encrypt
- ✅ Security hardening (UFW firewall, Fail2ban)
- ✅ Automated backup system configuration
- ✅ Health monitoring and log rotation
- ✅ Production-ready environment configuration

### 2. `update-ubuntu.sh` - Update Existing Installation
Update script for existing ZedUno installations.

**Features:**
- ✅ Multiple update types (Quick, Full, Safe, Config-only)
- ✅ Automatic installation detection
- ✅ Pre-update backup creation (optional)
- ✅ Service management (PM2/Docker/Manual)
- ✅ Configuration updates and verification
- ✅ Rollback capability with backups

### 3. `update-remote.sh` - Legacy Update Script
Simplified update script for basic deployments.

## 📋 Quick Start

### One-Command Deployment
```bash
# Deploy to fresh Ubuntu server
curl -fsSL https://raw.githubusercontent.com/githuax/dine-serve-hub/main/deploy-ubuntu.sh | sudo bash
```

### Manual Deployment
```bash
# Download and run deployment script
wget https://raw.githubusercontent.com/githuax/dine-serve-hub/main/deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

### Update Existing Installation
```bash
# Quick update
wget https://raw.githubusercontent.com/githuax/dine-serve-hub/main/update-ubuntu.sh
chmod +x update-ubuntu.sh
sudo ./update-ubuntu.sh
```

## 🛠️ Deployment Options

### Development Setup
- Quick localhost-only access
- Minimal security configuration
- Direct port access (3000, 5000)
- Perfect for testing and development

### Production Setup
- Full security hardening
- Nginx reverse proxy
- SSL certificate support
- Firewall configuration
- Automated backups
- Health monitoring

### Docker Setup
- Container-based deployment
- Docker Compose configuration
- Isolated environment
- Easy scaling and management

## 📁 File Structure After Deployment

```
/opt/zeduno/                    # Main application directory
├── backend/                    # Backend application
│   ├── src/                   # Source code
│   └── .env                   # Backend configuration
├── dist/                      # Built frontend
├── logs/                      # Application logs
├── uploads/                   # File uploads
├── .env.local                 # Frontend configuration
├── ecosystem.config.js        # PM2 configuration
├── DEPLOYMENT_INFO.txt        # Deployment summary
└── health-check.sh           # Health monitoring script

/opt/backups/zeduno/           # Backup directory
├── backup.sh                 # Backup script
└── [daily backups]           # Automated backups

/etc/nginx/sites-available/zeduno  # Nginx configuration (if enabled)
```

## ⚙️ Configuration Files

### Frontend Environment (`.env.local`)
```bash
VITE_API_URL=https://yourdomain.com/api
VITE_APP_NAME=ZedUno
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PAYMENT_GATEWAYS=true
VITE_DEFAULT_CURRENCY=KES
```

### Backend Environment (`backend/.env`)
```bash
# Database
MONGODB_URI=mongodb://zeduno:password@localhost:27017/zeduno?authSource=zeduno
DB_NAME=zeduno

# JWT Configuration
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# CORS allowlist (comma-separated) — required in production
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# Zed Business (M‑Pesa via KCB) — required in production
ZED_API_BASE_URL=https://api.zed.business
ZED_AUTH_TOKEN=your-zed-business-token
ZED_EXTERNAL_ORIGIN=your-zed-business-id
# Optional: header name for token, defaults to X-Authorization
ZED_API_KEY_HEADER=X-Authorization

# Additional configurations...
```

## 🔧 Service Management

### PM2 Commands
```bash
# Check status
sudo -u zeduno pm2 status

# View logs
sudo -u zeduno pm2 logs

# Restart services
sudo -u zeduno pm2 restart all

# Stop services
sudo -u zeduno pm2 stop all

# Monitor resources
sudo -u zeduno pm2 monit
```

### Docker Commands (if using Docker)
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

## 📊 Monitoring and Maintenance

### Health Check
The deployment includes an automated health check script:
```bash
# Manual health check
/opt/zeduno/health-check.sh

# Check health check logs
tail -f /var/log/zeduno-health.log
```

### Backups
Automated daily backups are configured:
```bash
# Manual backup
/opt/backups/zeduno/backup.sh

# Check backup logs
tail -f /var/log/zeduno-backup.log

# List backups
ls -la /opt/backups/zeduno/
```

### Log Management
Application logs with automatic rotation:
```bash
# View application logs
tail -f /opt/zeduno/logs/backend.log
tail -f /opt/zeduno/logs/frontend.log

# PM2 logs
sudo -u zeduno pm2 logs --lines 100

# System logs
journalctl -u mongod -f
journalctl -u nginx -f
```

## 🔐 Security Configuration

### Default Security Measures
- UFW firewall with minimal open ports
- Fail2ban for intrusion prevention
- MongoDB authentication enabled
- Secure JWT token configuration
- Nginx security headers
- Regular security updates

### Important Security Steps
1. **Change Default Passwords**
   - MongoDB admin and user passwords
   - ZedUno admin credentials (admin@zeduno.com / admin123)

2. **Configure SSL/HTTPS**
   - Use Let's Encrypt for free SSL certificates
   - Redirect all HTTP traffic to HTTPS

3. **Regular Updates**
   - Keep system packages updated
   - Update ZedUno regularly using update script

## 🚨 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check PM2 status
sudo -u zeduno pm2 status

# Check PM2 logs
sudo -u zeduno pm2 logs

# Restart services
sudo -u zeduno pm2 restart all
```

#### Database Connection Issues
```bash
# Check MongoDB status
systemctl status mongod

# Check MongoDB logs
journalctl -u mongod

# Restart MongoDB
systemctl restart mongod
```

#### Port Already in Use
```bash
# Find process using port
lsof -i :5000
lsof -i :3000

# Kill process if needed
kill -9 PID
```

#### Permission Issues
```bash
# Fix ownership
chown -R zeduno:zeduno /opt/zeduno

# Fix permissions
chmod -R 755 /opt/zeduno
```

### Log Locations
- **Application Logs**: `/opt/zeduno/logs/`
- **PM2 Logs**: `/home/zeduno/.pm2/logs/`
- **MongoDB Logs**: `/var/log/mongodb/mongod.log`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/syslog`
- **Health Check Logs**: `/var/log/zeduno-health.log`
- **Backup Logs**: `/var/log/zeduno-backup.log`

## 🔄 Update Process

### Update Types

1. **Quick Update** (Default)
   - Pull latest code
   - Update dependencies
   - Rebuild application
   - Restart services

2. **Full Update**
   - System package updates
   - Node.js updates if available
   - Complete application update
   - Security updates

3. **Safe Update**
   - Create backup before update
   - Full update process
   - Rollback capability

4. **Configuration Only**
   - Update configuration files
   - No code changes
   - Useful for environment changes

### Update Commands
```bash
# Quick update
sudo ./update-ubuntu.sh

# Full update with system packages
sudo ./update-ubuntu.sh
# Choose option 2 when prompted

# Safe update with backup
sudo ./update-ubuntu.sh
# Choose option 3 when prompted
```

## 📈 Performance Optimization

### PM2 Configuration
The deployment uses optimized PM2 configuration:
- Cluster mode for backend (max instances)
- Memory restart limits
- Automatic restart on failures
- Log rotation and management

### MongoDB Optimization
- Authentication enabled
- Connection pooling configured
- Indexes created for performance
- Memory usage optimization

### Nginx Optimization
- Gzip compression enabled
- Static file caching
- Security headers
- Proxy optimization

## 🌐 Multi-Environment Setup

### Environment Variables
Configure different environments using environment variables:
- `NODE_ENV`: development, staging, production
- `VITE_API_URL`: API endpoint URL
- `MONGODB_URI`: Database connection string
- `FRONTEND_URL`: Frontend URL for CORS

### Domain Configuration
For production with custom domain:
1. Point your domain to server IP
2. Run deployment script with domain option
3. SSL certificate will be automatically configured
4. Nginx will handle domain routing

## 📞 Support and Documentation

### Getting Help
1. **Documentation**: Check `UBUNTU_DEPLOYMENT_GUIDE.md` for detailed instructions
2. **Logs**: Always check application and system logs first
3. **GitHub Issues**: Report bugs at repository issues page
4. **Health Check**: Use built-in health monitoring

### Before Reporting Issues
Include the following information:
- Ubuntu version (`lsb_release -a`)
- Node.js version (`node --version`)
- PM2 status (`pm2 status`)
- Relevant log excerpts
- Steps to reproduce the issue

## 📚 Additional Resources

- **Main Repository**: https://github.com/githuax/dine-serve-hub
- **Documentation**: `UBUNTU_DEPLOYMENT_GUIDE.md`
- **Configuration Examples**: Check `.env.example` files
- **Docker Setup**: `docker-compose.prod.yml`

---

## 🎯 Quick Reference

### Essential Commands
```bash
# Deploy fresh installation
curl -fsSL https://raw.githubusercontent.com/githuax/dine-serve-hub/main/deploy-ubuntu.sh | sudo bash

# Update existing installation
wget -O update.sh https://raw.githubusercontent.com/githuax/dine-serve-hub/main/update-ubuntu.sh && chmod +x update.sh && sudo ./update.sh

# Check service status
sudo -u zeduno pm2 status

# View logs
sudo -u zeduno pm2 logs

# Health check
/opt/zeduno/health-check.sh

# Manual backup
/opt/backups/zeduno/backup.sh
```

### Default Access
- **Application**: http://server-ip:3000 or https://yourdomain.com
- **Admin Panel**: /superladmin/login
- **API**: http://server-ip:5000/api or https://yourdomain.com/api
- **Default Credentials**: admin@zeduno.com / admin123 (CHANGE IMMEDIATELY!)

### File Locations
- **Application**: `/opt/zeduno/`
- **Logs**: `/opt/zeduno/logs/`
- **Backups**: `/opt/backups/zeduno/`
- **Nginx Config**: `/etc/nginx/sites-available/zeduno`

---

*Happy deploying! 🚀*
