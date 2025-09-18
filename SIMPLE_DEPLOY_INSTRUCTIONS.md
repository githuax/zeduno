# 🚀 Simple M-Pesa KCB Deployment Instructions

## Your KCB M-Pesa Credentials (Pre-configured ✅)
- **API Key**: `X`
- **Auth Token**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your full token)
- **Base URL**: `https://api.dev.zed.business`
- **External Origin**: `9002742`

## Quick 3-Step Deployment

### Step 1: Upload Files to Your Server
```bash
# Upload the deployment files to your server
scp deploy-mpesa-kcb-quick.sh root@your-server-ip:/tmp/
scp capture-kcb-mpesa-config.cjs root@your-server-ip:/tmp/
scp verify-kcb-mpesa-config.cjs root@your-server-ip:/tmp/
scp test-callback.js root@your-server-ip:/tmp/
scp test-mpesa-kcb-integration.sh root@your-server-ip:/tmp/
```

### Step 2: Deploy Base ZedUno (If Not Already Done)
```bash
ssh root@your-server-ip

# If ZedUno is not already installed:
cd /tmp
wget https://raw.githubusercontent.com/githuax/dine-serve-hub/main/deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
# Follow prompts - choose Production, enter domain if you have one
```

### Step 3: Deploy M-Pesa KCB Integration
```bash
# Still on your server
cd /tmp
chmod +x deploy-mpesa-kcb-quick.sh
./deploy-mpesa-kcb-quick.sh
# Just press Enter to continue - credentials are pre-configured!
```

## ✨ That's It! 

The script will automatically:
- ✅ Configure your KCB M-Pesa credentials
- ✅ Set up East African currencies (KES, UGX, TZS, RWF, BIF, CDF, SSP)
- ✅ Update database configuration
- ✅ Configure API endpoints
- ✅ Set up webhook handling
- ✅ Create monitoring scripts
- ✅ Test the integration

## 🧪 Test Your Integration

After deployment, test everything:
```bash
cd /opt/zeduno

# Quick status check
./check-mpesa-kcb-status.sh

# Quick integration test
./test-mpesa-kcb-quick.sh

# Full comprehensive test (optional)
./test-mpesa-kcb-integration.sh
```

## 🔗 Configure Callback URL in KCB Dashboard

The script will show you your callback URL. Add it to your KCB merchant dashboard:

**Your callback URL will be:**
- With domain: `https://yourdomain.com/api/mpesa-kcb/callback`  
- With IP only: `http://your-server-ip/api/mpesa-kcb/callback`

## 💰 Currency Support (Automatic)

Your system will automatically support these East African currencies:

| Currency | Country | Symbol |
|----------|---------|---------|
| KES | Kenya | KSh |
| UGX | Uganda | USh |
| TZS | Tanzania | TSh |
| RWF | Rwanda | RF |
| BIF | Burundi | FBu |
| CDF | Congo | FC |
| SSP | South Sudan | SS£ |

## 🎯 Test Payment

To test a payment:
1. Access your app: `https://yourdomain.com` or `http://your-server-ip`
2. Go to payment section
3. Use test number: `254712345678`
4. Try small amount: `1 KES`
5. Check logs: `tail -f /opt/zeduno/logs/backend.log`

## 📊 Management Commands

```bash
# Check status
./check-mpesa-kcb-status.sh

# Quick test
./test-mpesa-kcb-quick.sh

# View logs
sudo -u zeduno pm2 logs

# Restart services  
sudo -u zeduno pm2 restart all

# Check configuration
node verify-kcb-mpesa-config.cjs
```

## 🔧 If Something Goes Wrong

1. **Check the logs**:
   ```bash
   tail -f /opt/zeduno/logs/backend.log
   sudo -u zeduno pm2 logs
   ```

2. **Restart services**:
   ```bash
   sudo -u zeduno pm2 restart all
   ```

3. **Re-run configuration**:
   ```bash
   cd /opt/zeduno
   node capture-kcb-mpesa-config.cjs
   ```

4. **Test again**:
   ```bash
   ./test-mpesa-kcb-quick.sh
   ```

## ✅ You're Done!

Your M-Pesa KCB payment gateway is now:
- ✅ **Configured** with your exact credentials
- ✅ **Supporting** all East African currencies  
- ✅ **Ready** to process payments
- ✅ **Monitored** and tested
- ✅ **Production-ready**

Access your admin panel to start accepting payments:
- **URL**: `https://yourdomain.com/superadmin/login` or `http://your-server-ip/superadmin/login`
- **Username**: `admin@zeduno.com`
- **Password**: `admin123` (⚠️ Change immediately!)

---

**Need help?** Check `/opt/zeduno/MPESA_KCB_DEPLOYMENT_SUMMARY.txt` for complete details.
