# Tenant Admin Login Guide

## How Tenant Creation Works

When you create a new tenant through the SuperAdmin interface, the system automatically:

1. **Creates the Tenant Organization**
   - Restaurant/Business entity
   - Unique slug for identification
   - Settings and configuration

2. **Creates an Admin User**
   - **Email**: Same as the tenant email
   - **Default Password**: `restaurant123`
   - **Role**: `admin` (full control over the tenant)
   - **Access**: Can manage all aspects of their restaurant

## Example: Chris Foods

When "Chris Foods" was created:
- **Tenant Name**: CHRIS FOOD
- **Admin Email**: chris@mail.com
- **Default Password**: restaurant123
- **Role**: Tenant Admin

## Admin User Capabilities

Once logged in, the tenant admin can:
- ✅ Access their restaurant dashboard
- ✅ Manage menu items and categories
- ✅ Process orders
- ✅ Create and manage staff accounts
- ✅ Configure payment settings
- ✅ View analytics and reports
- ✅ Manage tables (for dine-in)
- ✅ Configure restaurant settings

## Login Process

1. **First Login**:
   ```
   Email: [tenant-email]
   Password: restaurant123
   ```

2. **Password Change**: 
   - User will be prompted to change password on first login
   - This is enforced by the `mustChangePassword` flag

3. **Access Control**:
   - Each tenant admin only sees data for their restaurant
   - Cannot access other tenants' data
   - SuperAdmin can access all tenants

## Security Notes

- Default password should be changed immediately
- Each tenant's data is isolated
- Tenant admins cannot create superadmin users
- Only SuperAdmin can create new tenants

## API Endpoints

- **Tenant Admin Login**: `POST /api/auth/login`
- **SuperAdmin Login**: `POST /api/superadmin/login`
- **Create Tenant** (SuperAdmin only): `POST /api/superadmin/tenants`

## Testing

To test a tenant admin login:
```javascript
// Login request
POST http://localhost:5000/api/auth/login
{
  "email": "tenant@email.com",
  "password": "restaurant123"
}
```

The response will include the user details and authentication token.