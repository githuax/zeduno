# WebSocket Connection Fix - Production Deployment Guide

## 🚨 **Issue Identified**

The WebSocket connection to `https://zeduno.piskoe.com` is timing out because the production nginx server is **not properly configured** to proxy Socket.io requests to the backend.

**Problem**: Socket.io requests to `/socket.io/` are returning the frontend HTML instead of being proxied to the backend server.

## 🔍 **Root Cause**

The production nginx configuration is missing or incorrectly configured the WebSocket proxy section. Currently:
- ✅ `/api` requests are properly proxied to backend
- ❌ `/socket.io/` requests are served by frontend (causing WebSocket failures)

## 🛠️ **Solution Steps**

### Step 1: Update Production Nginx Configuration

The production nginx server needs to include the WebSocket proxy configuration. Add this section to your nginx server block:

```nginx
# WebSocket proxy for Socket.io - CRITICAL for real-time features
location /socket.io/ {
    proxy_pass http://127.0.0.1:5000;  # or your backend server address
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 86400s; # 24 hours for WebSocket connections
    proxy_buffering off;
}
```

### Step 2: Nginx Configuration Order (IMPORTANT!)

The `/socket.io/` location block **must come before** the general `/` location block in nginx:

```nginx
server {
    # ... other configuration ...
    
    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        # ... proxy headers ...
    }
    
    # WebSocket proxy - MUST come before location /
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        # ... websocket proxy configuration ...
    }
    
    # Frontend routes - this catches everything else
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 3: Apply Configuration

1. **Update the nginx configuration file** on the production server
2. **Test the configuration**: `sudo nginx -t`
3. **Reload nginx**: `sudo nginx -s reload` or `sudo systemctl reload nginx`

### Step 4: Verify Fix

Test that Socket.io endpoint now returns proper response:

```bash
# This should return Socket.io handshake data, not HTML
curl "https://zeduno.piskoe.com/socket.io/?EIO=4&transport=polling"

# Expected response should start with something like:
# 0{"sid":"...","upgrades":["websocket"],"pingTimeout":...}
```

## 📋 **Complete Production Nginx Configuration**

Here's a complete nginx configuration file that should work for production:

```nginx
server {
    listen 80;
    server_name zeduno.piskoe.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zeduno.piskoe.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Frontend static files
    root /path/to/your/frontend/dist;
    index index.html;
    
    # API proxy
    location /api {
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
    
    # WebSocket proxy for Socket.io - CRITICAL!
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_buffering off;
    }
    
    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🧪 **Testing Instructions**

### 1. Backend Test
```bash
# Test local backend Socket.io
curl -s "http://localhost:5000/socket.io/?EIO=4&transport=polling"
# Should return: 0{"sid":"...","upgrades":["websocket"]...}
```

### 2. Production Test
```bash
# Test production Socket.io after nginx fix
curl -s "https://zeduno.piskoe.com/socket.io/?EIO=4&transport=polling"
# Should return: 0{"sid":"...","upgrades":["websocket"]...}
# NOT: HTML content
```

### 3. Browser Test
Open browser console and check for:
- ✅ `🔌 WebSocket connected: [socket-id]`
- ❌ No more `WebSocket connection error: timeout`

## 🔧 **Alternative Quick Fix (If Can't Access Nginx)**

If you can't immediately update the production nginx configuration, you can temporarily modify the frontend to connect directly to the backend:

### Frontend Workaround
```typescript
// In useSocket.ts, temporarily change the connection URL:
const getSocketUrl = () => {
  if (window.location.hostname === 'zeduno.piskoe.com') {
    // Temporary direct connection to backend
    return 'https://your-backend-domain.com:5000';
  }
  // ... rest of the function
};
```

**Note**: This is a temporary workaround only. The proper fix is updating nginx configuration.

## 🎯 **What This Fixes**

Once the nginx configuration is updated, the following features will work properly:

1. **Real-time Order Updates**: Staff will see order status changes immediately
2. **Payment Status Updates**: Real-time payment confirmations
3. **Inventory Notifications**: Live stock level updates across sessions
4. **Multi-user Synchronization**: Changes made by one user visible to others immediately

## ✅ **Verification Checklist**

After applying the fix:

- [ ] Socket.io endpoint returns proper handshake (not HTML)
- [ ] Browser console shows successful WebSocket connection
- [ ] No WebSocket timeout errors in browser
- [ ] Real-time features work (order updates, payment notifications)
- [ ] Inventory management shows real-time stock changes

---

**Priority**: High - This affects real-time functionality  
**Impact**: WebSocket features (real-time updates, notifications)  
**Root Cause**: Missing `/socket.io/` proxy in production nginx  
**Solution**: Update production nginx configuration