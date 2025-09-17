# MongoDB Multitenant Database Setup

This directory contains the MongoDB database schema and service utilities for the multitenant restaurant management system.

## Files

- **`mongodb-schema.js`** - Complete MongoDB schema with collections, validation, and indexes
- **`mongodb-service.js`** - Service class for tenant-aware database operations  
- **`README.md`** - This file

## Quick Setup

### 1. Install MongoDB
```bash
# On macOS with Homebrew
brew install mongodb/brew/mongodb-community

# On Windows, download from https://www.mongodb.com/download-center/community

# On Ubuntu/Debian
sudo apt-get install mongodb
```

### 2. Start MongoDB
```bash
# Start MongoDB service
mongod --dbpath /path/to/your/data/directory

# Or if installed via package manager
sudo systemctl start mongod
```

### 3. Create Database and Collections
```bash
# Connect to MongoDB
mongo

# Switch to your database
use restaurant_db

# Execute the schema file
load('database/mongodb-schema.js')
```

## Database Structure

### Core Collections

#### **tenants**
- Main tenant information
- Subscription plans and limits  
- Settings and configuration
- Billing and contact details

#### **users**
- Tenant-aware user accounts
- Roles and permissions
- Authentication data

#### **organizations** 
- Multi-location tenant organizations
- Organization settings and branding

#### **locations**
- Individual restaurant locations
- Address, hours, capacity info
- Location-specific settings

#### **menuItems**
- Tenant + location aware menu items
- Pricing, availability, allergens
- Inventory tracking

#### **tables**
- Restaurant table management
- Status, capacity, positioning
- Current occupancy tracking

#### **customers**
- Tenant-specific customer database
- Order history and loyalty points
- Contact and preferences

#### **orders**
- Complete order management
- Items, payments, status tracking
- Kitchen workflow support

#### **employees**
- Staff management per tenant/location
- Schedules, permissions, payroll
- Department assignments

#### **deliveryTracking**
- Real-time delivery status
- Driver assignments and routes
- Customer feedback

#### **auditLogs**
- Complete audit trail for enterprise
- User actions and system changes
- Security and compliance tracking

## Key Features

### 🔐 **Tenant Isolation**
- Every document includes `tenantId` field
- All queries automatically filtered by tenant
- No cross-tenant data access possible

### 📊 **Validation & Constraints**
- JSON Schema validation on all collections
- Required fields and data type enforcement
- Business rule validation (prices > 0, etc.)

### ⚡ **Optimized Indexes**
- Compound indexes for tenant + other fields
- Performance optimized for common queries
- Unique constraints where needed

### 🏢 **Multi-Location Support**
- Organizations can have multiple locations
- Location-aware menu items and staff
- Centralized management with location isolation

## Usage Examples

### Initialize Service
```javascript
const MultiTenantService = require('./database/mongodb-service');
const service = new MultiTenantService('mongodb://localhost:27017', 'restaurant_db');
await service.connect();
```

### Create Menu Item
```javascript
const menuItem = await service.createMenuItem({
  name: 'Margherita Pizza',
  description: 'Fresh tomatoes, mozzarella, basil',
  category: 'Pizza',
  price: 12.99,
  isAvailable: true,
  preparationTime: 15
}, tenantId, locationId);
```

### Process Order
```javascript
const order = await service.createOrder({
  orderType: 'dine-in',
  tableId: tableId,
  customerName: 'John Doe',
  items: [
    {
      menuItem: menuItemId,
      quantity: 2,
      price: 12.99,
      totalPrice: 25.98
    }
  ],
  subtotal: 25.98,
  tax: 2.08,
  total: 28.06,
  createdBy: userId
}, tenantId);
```

### Get Analytics
```javascript
const analytics = await service.getOrderAnalytics(
  tenantId,
  new Date('2024-01-01'),
  new Date('2024-12-31'),
  locationId // optional
);
```

## Security Best Practices

1. **Always include tenantId** in queries
2. **Validate tenant permissions** before operations  
3. **Use indexes** for performance with tenant filtering
4. **Enable audit logging** for sensitive operations
5. **Implement rate limiting** per tenant
6. **Regular backup** of tenant data

## Connection Strings

### Development
```
mongodb://localhost:27017/restaurant_db
```

### Production (with authentication)
```
mongodb://username:password@host:port/restaurant_db?authSource=admin
```

### MongoDB Atlas (Cloud)
```
mongodb+srv://username:password@cluster.mongodb.net/restaurant_db?retryWrites=true&w=majority
```

## Monitoring

Monitor key metrics:
- **Tenant usage** against plan limits
- **Query performance** with tenant filtering
- **Storage usage** per tenant
- **Connection pool** utilization
- **Index efficiency** for tenant queries

## Backup Strategy

```bash
# Full database backup
mongodump --db restaurant_db --out /backup/path

# Tenant-specific backup
mongodump --db restaurant_db --collection orders --query '{"tenantId": ObjectId("...")}'

# Restore
mongorestore --db restaurant_db /backup/path/restaurant_db
```

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/restaurant_db
MONGODB_DB_NAME=restaurant_db
TENANT_ISOLATION_ENABLED=true
AUDIT_LOGS_ENABLED=true
```

---

🚀 **Your multitenant MongoDB database is ready!**

The schema provides complete tenant isolation, supports multi-location operations, and includes enterprise features like audit logging and usage tracking.