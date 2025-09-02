# User Login Troubleshooting Guide

## Common Issue: "Invalid Credentials" for Tenant Admins

When you create a new tenant, sometimes the admin user may have login issues. Here's how to fix them:

## Quick Fix Script

For any user getting "Invalid credentials", run this script (replace `USERNAME` with the actual name):

```bash
cd /home/osbui/applications/zeduno/dine-serve-hub/backend
node check-and-fix-USERNAME-user.js
```

## Manual Fix Process

### 1. Check if User Exists
```javascript
const user = await User.findOne({ email: 'user@mail.com' });
console.log('User found:', !!user);
```

### 2. Reset Password to Default
```javascript
user.password = 'restaurant123';  // Pre-save hook will hash it
user.mustChangePassword = true;   // Force password change
user.isActive = true;             // Ensure active
user.accountStatus = 'active';    // Ensure account is active
await user.save();
```

### 3. Update Tenant Name
```javascript
if (user.tenantId) {
  const tenant = await Tenant.findById(user.tenantId);
  if (tenant) {
    user.tenantName = tenant.name;
    await user.save();
  }
}
```

## Fixed Users List

| Email | Status | Password | Tenant |
|-------|--------|----------|---------|
| frank@mail.com | ✅ Fixed | restaurant123 | FRANK FOODS |
| phil@mail.com | ✅ Fixed | restaurant123 | PHIL FOODS |
| chris@mail.com | ✅ Fixed | restaurant123 | CHRIS FOOD |

## How to Test Login

```javascript
// Test API endpoint
POST http://localhost:5000/api/auth/login
{
  "email": "user@mail.com",
  "password": "restaurant123"
}
```

## Expected Response

```javascript
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "email": "user@mail.com",
    "firstName": "User",
    "lastName": "Name",
    "role": "admin",
    "tenantId": "tenant_id",
    "tenantName": "TENANT NAME",
    "mustChangePassword": true
  },
  "mustChangePassword": true
}
```

## Frontend Behavior

1. User enters email and password
2. If `mustChangePassword: true`, password change modal appears
3. User must create new secure password
4. After password change, user accesses dashboard

## Troubleshooting Steps

### If user still can't login:

1. **Check backend is running:**
   ```bash
   pm2 status
   ```

2. **Verify user exists:**
   ```bash
   node check-and-fix-USERNAME-user.js
   ```

3. **Check backend logs:**
   ```bash
   pm2 logs zeduno-backend --lines 20
   ```

4. **Test password directly:**
   ```javascript
   const isValid = await user.comparePassword('restaurant123');
   console.log('Password valid:', isValid);
   ```

## Prevention

When creating tenants through SuperAdmin:
- Always fill in the "Admin Password" field
- Use a secure password (will still require change on first login)
- Verify the tenant admin can login before giving credentials

## Scripts Available

- `check-and-fix-frank-user.js` - Fix Frank user
- `check-and-fix-phil-user.js` - Fix Phil user  
- `check-and-fix-chris-user.js` - Fix Chris user
- `fix-chris-tenant-name.js` - Fix all tenant names

## Default Credentials

All newly created tenant admins use:
- **Password**: `restaurant123`
- **Must Change**: Yes (on first login)
- **Status**: Active