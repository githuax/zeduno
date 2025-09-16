# Branch Management Administrator Guide

## Overview

This guide provides comprehensive information for administrators managing the Branch Management system in Dine Serve Hub. It covers system configuration, user management, performance optimization, security best practices, and troubleshooting procedures.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Initial Setup and Configuration](#initial-setup-and-configuration)
3. [Branch Quota Management](#branch-quota-management)
4. [User Permissions and Roles](#user-permissions-and-roles)
5. [Bulk Operations](#bulk-operations)
6. [Data Management](#data-management)
7. [Performance Monitoring](#performance-monitoring)
8. [Security and Compliance](#security-and-compliance)
9. [Backup and Recovery](#backup-and-recovery)
10. [API Management](#api-management)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Maintenance Procedures](#maintenance-procedures)

## System Architecture

### Database Schema

The branch management system uses MongoDB with the following key collections:

#### Branch Collection
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,           // Tenant association
  parentBranchId: ObjectId,     // Hierarchy support
  name: String,                 // Branch name
  code: String,                 // Unique identifier
  type: 'main|branch|franchise',
  status: 'active|inactive|suspended',
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: String,
    email: String,
    managerName: String,
    managerPhone: String,
    managerEmail: String
  },
  operations: {
    openTime: String,
    closeTime: String,
    timezone: String,
    daysOpen: [String],
    holidaySchedule: [Mixed],
    seatingCapacity: Number,
    deliveryRadius: Number
  },
  financial: {
    currency: String,
    taxRate: Number,
    serviceChargeRate: Number,
    tipEnabled: Boolean,
    paymentMethods: [String],
    bankAccount: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      routingNumber: String
    }
  },
  inventory: {
    trackInventory: Boolean,
    lowStockAlertEnabled: Boolean,
    autoReorderEnabled: Boolean,
    warehouseId: ObjectId
  },
  menuConfig: {
    inheritFromParent: Boolean,
    priceMultiplier: Number,
    customPricing: Boolean,
    availableCategories: [ObjectId]
  },
  staffing: {
    maxStaff: Number,
    currentStaff: Number,
    roles: [String],
    shiftPattern: String
  },
  metrics: {
    avgOrderValue: Number,
    totalOrders: Number,
    totalRevenue: Number,
    rating: Number,
    lastUpdated: Date
  },
  integrations: {
    posSystemId: String,
    posSystemType: String,
    kitchenDisplayId: String,
    onlineOrderingEnabled: Boolean
  },
  settings: {
    orderPrefix: String,
    orderNumberSequence: Number,
    receiptHeader: String,
    receiptFooter: String,
    logoUrl: String,
    theme: String
  },
  isActive: Boolean,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### User Collection (Branch-related fields)
```javascript
{
  assignedBranches: [ObjectId],
  currentBranch: ObjectId,
  defaultBranch: ObjectId,
  canSwitchBranches: Boolean,
  branchRole: 'branch_manager|branch_staff|multi_branch'
}
```

### Performance Indexes

Ensure these indexes exist for optimal performance:

```javascript
// Branch collection indexes
db.branches.createIndex({ tenantId: 1, status: 1 })
db.branches.createIndex({ tenantId: 1, code: 1 }, { unique: true })
db.branches.createIndex({ "address.coordinates": "2dsphere" })
db.branches.createIndex({ tenantId: 1, type: 1 })
db.branches.createIndex({ parentBranchId: 1 })

// User collection indexes
db.users.createIndex({ tenantId: 1, assignedBranches: 1 })
db.users.createIndex({ currentBranch: 1 })

// Order collection indexes (for metrics)
db.orders.createIndex({ branchId: 1, createdAt: -1 })
db.orders.createIndex({ branchId: 1, status: 1 })
```

## Initial Setup and Configuration

### System Requirements

#### Minimum Requirements
- **Database**: MongoDB 4.4+
- **Node.js**: 18.0+
- **Memory**: 4GB RAM minimum
- **Storage**: 100GB available space
- **Network**: Stable internet connection

#### Recommended Requirements
- **Database**: MongoDB 6.0+ with replica set
- **Node.js**: 20.0+ LTS
- **Memory**: 8GB+ RAM
- **Storage**: 500GB+ SSD
- **Network**: High-speed connection with CDN

### Environment Configuration

Create environment variables for branch management:

```env
# Branch Management Configuration
BRANCH_QUOTA_DEFAULT=10
BRANCH_QUOTA_MAX=100
BRANCH_CODE_PREFIX=BR
BRANCH_AUTO_CODE_GENERATION=true
BRANCH_HIERARCHY_MAX_DEPTH=5

# Performance Settings
BRANCH_CACHE_TTL=300
BRANCH_METRICS_CACHE_TTL=1800
BRANCH_BULK_OPERATION_LIMIT=50

# Security Settings
BRANCH_CREATION_RATE_LIMIT=10
BRANCH_API_RATE_LIMIT=100
BRANCH_AUDIT_ENABLED=true
```

### Initial Database Setup

Run the branch schema migration:

```bash
cd backend
npm run migrate:branches
```

This will:
- Create necessary collections
- Set up indexes
- Initialize default data
- Configure permissions

### System Configuration

#### 1. Tenant Configuration
```javascript
// Configure tenant branch quotas
db.tenants.updateMany({}, {
  $set: {
    'branchQuota.maxBranches': 10,
    'branchQuota.currentBranches': 0,
    'features.branchManagement': true
  }
})
```

#### 2. Default Branch Creation
```javascript
// Create default main branch for existing tenants
const tenants = db.tenants.find({})
tenants.forEach(tenant => {
  db.branches.insertOne({
    tenantId: tenant._id,
    name: tenant.name + " Main Branch",
    code: tenant.slug.toUpperCase() + "-MAIN",
    type: "main",
    status: "active",
    // ... other required fields
  })
})
```

## Branch Quota Management

### Understanding Quotas

Branch quotas control the number of branches a tenant can create:

- **maxBranches**: Maximum allowed branches
- **currentBranches**: Currently active branches
- **quotaType**: 'fixed' | 'tiered' | 'unlimited'

### Managing Quotas

#### View Current Quotas
```javascript
// Check all tenant quotas
db.tenants.find({}, {
  name: 1,
  'branchQuota.maxBranches': 1,
  'branchQuota.currentBranches': 1
})
```

#### Update Quota for Specific Tenant
```javascript
// Increase quota for a tenant
db.tenants.updateOne(
  { _id: ObjectId("TENANT_ID") },
  { $set: { 'branchQuota.maxBranches': 25 } }
)
```

#### Bulk Quota Updates
```javascript
// Update quotas based on subscription tier
db.tenants.updateMany(
  { subscriptionTier: 'premium' },
  { $set: { 'branchQuota.maxBranches': 50 } }
)

db.tenants.updateMany(
  { subscriptionTier: 'enterprise' },
  { $set: { 'branchQuota.maxBranches': 200 } }
)
```

### Quota Monitoring

Create monitoring queries:

```javascript
// Find tenants approaching quota limits
db.tenants.find({
  $expr: {
    $gte: [
      '$branchQuota.currentBranches',
      { $multiply: ['$branchQuota.maxBranches', 0.8] }
    ]
  }
})

// Find tenants exceeding quotas
db.tenants.find({
  $expr: {
    $gt: ['$branchQuota.currentBranches', '$branchQuota.maxBranches']
  }
})
```

## User Permissions and Roles

### Permission Matrix

| Role | Create Branch | Edit Branch | Delete Branch | View All Branches | Switch Branches | Assign Users |
|------|---------------|-------------|---------------|-------------------|----------------|--------------|
| Superadmin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✓ (Tenant) | ✓ | ✓ |
| Manager | ✗ | ✓ (Assigned) | ✗ | ✓ (Assigned) | ✓ (Assigned) | ✓ (Assigned) |
| Staff | ✗ | ✗ | ✗ | ✓ (Assigned) | ✓ (If allowed) | ✗ |

### Branch-Specific Roles

#### Branch Manager
- Full control over assigned branches
- Can manage staff within branches
- Access to branch metrics and reports
- Can update operational settings

#### Branch Staff
- Operational access to assigned branches
- Cannot modify branch settings
- View-only access to metrics
- Limited to daily operations

#### Multi-Branch User
- Access to multiple branches
- Can switch between assigned branches
- Role-based permissions per branch
- Consolidated reporting access

### Managing User Assignments

#### Assign User to Branch
```javascript
// Assign user to branch with role
db.users.updateOne(
  { _id: ObjectId("USER_ID") },
  {
    $addToSet: { assignedBranches: ObjectId("BRANCH_ID") },
    $set: {
      currentBranch: ObjectId("BRANCH_ID"),
      branchRole: "branch_manager",
      canSwitchBranches: true
    }
  }
)
```

#### Remove User from Branch
```javascript
// Remove user from specific branch
db.users.updateOne(
  { _id: ObjectId("USER_ID") },
  {
    $pull: { assignedBranches: ObjectId("BRANCH_ID") },
    $unset: { currentBranch: "" }
  }
)
```

#### Bulk User Assignment
```javascript
// Assign multiple users to a branch
const userIds = [ObjectId("USER1"), ObjectId("USER2"), ObjectId("USER3")]
const branchId = ObjectId("BRANCH_ID")

userIds.forEach(userId => {
  db.users.updateOne(
    { _id: userId },
    {
      $addToSet: { assignedBranches: branchId },
      $set: { branchRole: "branch_staff" }
    }
  )
})
```

### Permission Validation

Implement middleware for permission checking:

```typescript
// Example permission middleware
export const requireBranchAccess = (action: 'read' | 'write' | 'admin') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { branchId } = req.params
    const user = req.user

    // Check if user has access to branch
    const hasAccess = await checkBranchPermission(user, branchId, action)
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Insufficient branch permissions' })
    }
    
    next()
  }
}
```

## Bulk Operations

### Supported Bulk Operations

1. **Branch Activation/Deactivation**
2. **Status Updates**
3. **User Assignments**
4. **Setting Updates**
5. **Data Export/Import**

### Bulk Activation/Deactivation

#### Activate Multiple Branches
```javascript
// Activate branches by IDs
const branchIds = [ObjectId("ID1"), ObjectId("ID2"), ObjectId("ID3")]
db.branches.updateMany(
  { _id: { $in: branchIds } },
  { $set: { status: 'active', isActive: true } }
)
```

#### Deactivate by Criteria
```javascript
// Deactivate branches in specific city
db.branches.updateMany(
  { 
    tenantId: ObjectId("TENANT_ID"),
    'address.city': 'Old City',
    type: 'branch'
  },
  { $set: { status: 'inactive', isActive: false } }
)
```

### Bulk User Management

#### Assign Users to Multiple Branches
```javascript
// Assign user to multiple branches
const userId = ObjectId("USER_ID")
const branchIds = [ObjectId("B1"), ObjectId("B2"), ObjectId("B3")]

db.users.updateOne(
  { _id: userId },
  {
    $addToSet: { 
      assignedBranches: { $each: branchIds }
    },
    $set: { 
      branchRole: 'multi_branch',
      canSwitchBranches: true
    }
  }
)
```

#### Remove Users from Branches
```javascript
// Remove all users from a closing branch
const branchId = ObjectId("BRANCH_ID")
db.users.updateMany(
  { assignedBranches: branchId },
  {
    $pull: { assignedBranches: branchId },
    $unset: { currentBranch: "" }
  }
)
```

### Bulk Configuration Updates

#### Update Operating Hours
```javascript
// Update operating hours for all branches in a region
db.branches.updateMany(
  { 
    tenantId: ObjectId("TENANT_ID"),
    'address.state': 'California'
  },
  {
    $set: {
      'operations.openTime': '09:00',
      'operations.closeTime': '22:00'
    }
  }
)
```

#### Update Payment Methods
```javascript
// Add new payment method to all branches
db.branches.updateMany(
  { tenantId: ObjectId("TENANT_ID") },
  {
    $addToSet: {
      'financial.paymentMethods': 'digital_wallet'
    }
  }
)
```

### Import/Export Operations

#### Export Branch Data
```javascript
// Export all branch data for a tenant
const exportData = db.branches.find({
  tenantId: ObjectId("TENANT_ID"),
  isActive: true
}).toArray()

// Save to file or send via API
```

#### Import Branch Data
```javascript
// Bulk import branches from JSON
const importData = [
  // Branch objects...
]

importData.forEach(branchData => {
  try {
    db.branches.insertOne({
      ...branchData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  } catch (error) {
    console.error('Failed to import branch:', branchData.name, error)
  }
})
```

## Data Management

### Data Retention Policies

#### Inactive Branch Cleanup
```javascript
// Archive branches inactive for over 1 year
const oneYearAgo = new Date()
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

db.branches.updateMany(
  {
    status: 'inactive',
    updatedAt: { $lt: oneYearAgo }
  },
  {
    $set: {
      archived: true,
      archivedAt: new Date()
    }
  }
)
```

#### Metrics Cleanup
```javascript
// Clean up old daily metrics (keep last 2 years)
const twoYearsAgo = new Date()
twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

db.branchMetrics.deleteMany({
  date: { $lt: twoYearsAgo },
  type: 'daily'
})
```

### Data Validation

#### Validate Branch Data Integrity
```javascript
// Find branches with missing required fields
db.branches.find({
  $or: [
    { name: { $exists: false } },
    { code: { $exists: false } },
    { tenantId: { $exists: false } },
    { 'address.city': { $exists: false } },
    { 'contact.phone': { $exists: false } }
  ]
})
```

#### Fix Data Inconsistencies
```javascript
// Fix missing branch codes
db.branches.find({ code: { $exists: false } }).forEach(branch => {
  const tenant = db.tenants.findOne({ _id: branch.tenantId })
  const branchCount = db.branches.countDocuments({ tenantId: branch.tenantId })
  const newCode = `${tenant.slug.toUpperCase()}-BR${String(branchCount).padStart(3, '0')}`
  
  db.branches.updateOne(
    { _id: branch._id },
    { $set: { code: newCode } }
  )
})
```

### Data Migration Scripts

#### Migrate Legacy Branch Data
```javascript
// Migrate from old branch structure
db.branches.find({ version: { $exists: false } }).forEach(branch => {
  const updatedBranch = {
    ...branch,
    version: 2,
    // Add new required fields
    integrations: {
      onlineOrderingEnabled: true,
      posSystemId: null,
      posSystemType: null,
      kitchenDisplayId: null
    },
    inventory: {
      trackInventory: true,
      lowStockAlertEnabled: true,
      autoReorderEnabled: false
    }
  }
  
  db.branches.replaceOne({ _id: branch._id }, updatedBranch)
})
```

## Performance Monitoring

### Key Performance Metrics

1. **Response Times**: API endpoint performance
2. **Database Queries**: Query execution times
3. **Memory Usage**: Application memory consumption
4. **Cache Hit Rates**: Caching effectiveness
5. **User Activity**: Branch switching frequency

### Monitoring Queries

#### Branch Query Performance
```javascript
// Check slow queries on branches collection
db.setProfilingLevel(2, { slowms: 100 })

// After running operations, check slow queries
db.system.profile.find({ 
  ns: "dineservehub.branches",
  ts: { $gte: new Date(Date.now() - 3600000) } // Last hour
}).sort({ ts: -1 })
```

#### Branch Access Patterns
```javascript
// Monitor branch access frequency
db.orders.aggregate([
  {
    $match: {
      createdAt: { $gte: new Date(Date.now() - 86400000) } // Last 24 hours
    }
  },
  {
    $group: {
      _id: '$branchId',
      orderCount: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: 'branches',
      localField: '_id',
      foreignField: '_id',
      as: 'branch'
    }
  },
  {
    $sort: { orderCount: -1 }
  }
])
```

### Performance Optimization

#### Database Optimization
```javascript
// Optimize branch queries with proper indexing
db.branches.createIndex({ tenantId: 1, status: 1, type: 1 })
db.branches.createIndex({ tenantId: 1, 'address.city': 1 })
db.branches.createIndex({ createdAt: -1 })
```

#### Caching Strategy
```javascript
// Implement Redis caching for frequently accessed branches
const branchCache = {
  key: (tenantId, branchId) => `branch:${tenantId}:${branchId}`,
  ttl: 300, // 5 minutes
  
  async get(tenantId, branchId) {
    const cacheKey = this.key(tenantId, branchId)
    return await redis.get(cacheKey)
  },
  
  async set(tenantId, branchId, data) {
    const cacheKey = this.key(tenantId, branchId)
    await redis.setex(cacheKey, this.ttl, JSON.stringify(data))
  }
}
```

### Load Testing

#### Branch Creation Load Test
```javascript
// Simulate concurrent branch creation
const createBranchLoad = async (tenantId, concurrency = 10) => {
  const promises = []
  
  for (let i = 0; i < concurrency; i++) {
    promises.push(
      fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Load Test Branch ${i}`,
          type: 'branch',
          address: { /* address data */ },
          contact: { /* contact data */ }
        })
      })
    )
  }
  
  const results = await Promise.allSettled(promises)
  console.log('Load test results:', results)
}
```

## Security and Compliance

### Access Control

#### Branch-Level Security
```javascript
// Implement row-level security for branches
const branchAccessControl = {
  async canAccess(userId, branchId, action) {
    const user = await db.users.findOne({ _id: userId })
    
    // Superadmin access
    if (user.role === 'superadmin') return true
    
    // Admin access to tenant branches
    if (user.role === 'admin') {
      const branch = await db.branches.findOne({ _id: branchId })
      return branch.tenantId.equals(user.tenantId)
    }
    
    // User access to assigned branches
    return user.assignedBranches?.includes(branchId) || false
  }
}
```

#### API Security
```javascript
// Rate limiting for branch operations
const branchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many branch requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
})
```

### Data Protection

#### Sensitive Data Handling
```javascript
// Encrypt sensitive branch data
const encryptBranchData = (data) => {
  const sensitiveFields = ['contact.phone', 'contact.email', 'financial.bankAccount']
  
  sensitiveFields.forEach(field => {
    const value = _.get(data, field)
    if (value) {
      _.set(data, field, encrypt(value))
    }
  })
  
  return data
}
```

#### Audit Logging
```javascript
// Log all branch operations
const auditLog = {
  async logBranchOperation(userId, branchId, action, details) {
    await db.auditLogs.insertOne({
      userId,
      branchId,
      action,
      details,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })
  }
}
```

### Compliance Features

#### GDPR Compliance
```javascript
// Data anonymization for GDPR
const anonymizeBranchData = async (branchId) => {
  await db.branches.updateOne(
    { _id: branchId },
    {
      $unset: {
        'contact.managerName': '',
        'contact.managerPhone': '',
        'contact.managerEmail': ''
      },
      $set: {
        'contact.phone': 'REDACTED',
        'contact.email': 'REDACTED@example.com'
      }
    }
  )
}
```

#### PCI DSS Compliance
```javascript
// Secure payment method storage
const securePaymentData = {
  async storePaymentMethod(branchId, paymentMethod) {
    // Encrypt payment data
    const encrypted = await encrypt(paymentMethod)
    
    await db.branches.updateOne(
      { _id: branchId },
      { $addToSet: { 'financial.paymentMethods': encrypted } }
    )
  }
}
```

## Backup and Recovery

### Automated Backups

#### Daily Branch Data Backup
```bash
#!/bin/bash
# Daily backup script for branch data

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/branches"
DB_NAME="dineservehub"

# Create backup directory
mkdir -p $BACKUP_DIR/$DATE

# Backup branch collection
mongodump --db $DB_NAME --collection branches --out $BACKUP_DIR/$DATE

# Backup related collections
mongodump --db $DB_NAME --collection users --query '{"assignedBranches":{"$exists":true}}' --out $BACKUP_DIR/$DATE
mongodump --db $DB_NAME --collection orders --out $BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/branches_backup_$DATE.tar.gz $BACKUP_DIR/$DATE

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "branches_backup_*.tar.gz" -mtime +30 -delete
```

### Recovery Procedures

#### Branch Data Recovery
```javascript
// Recover deleted branch
const recoverBranch = async (branchId, backupDate) => {
  // Load from backup
  const backupData = await loadBackup(backupDate, 'branches', branchId)
  
  if (backupData) {
    // Restore branch
    await db.branches.insertOne({
      ...backupData,
      _id: new ObjectId(branchId),
      recoveredAt: new Date(),
      recoveredBy: 'admin'
    })
    
    console.log(`Branch ${branchId} recovered successfully`)
    return true
  }
  
  return false
}
```

#### Point-in-Time Recovery
```javascript
// Recover to specific timestamp
const pointInTimeRecover = async (timestamp) => {
  // Use MongoDB oplog for point-in-time recovery
  await mongo.replayOplogFrom(timestamp)
}
```

## API Management

### API Endpoints Overview

| Endpoint | Method | Purpose | Admin Only |
|----------|--------|---------|------------|
| `/api/branches` | GET | List branches | No |
| `/api/branches` | POST | Create branch | Yes |
| `/api/branches/:id` | GET | Get branch details | No |
| `/api/branches/:id` | PUT | Update branch | No* |
| `/api/branches/:id` | DELETE | Delete branch | Yes |
| `/api/branches/hierarchy` | GET | Get hierarchy | No |
| `/api/branches/metrics/consolidated` | GET | Consolidated metrics | Yes |
| `/api/branches/:id/metrics` | GET | Branch metrics | No* |

*Requires appropriate permissions

### API Rate Limiting

#### Configure Rate Limits
```javascript
// Different limits for different roles
const getRateLimit = (userRole) => {
  const limits = {
    superadmin: { windowMs: 60000, max: 200 },
    admin: { windowMs: 60000, max: 150 },
    manager: { windowMs: 60000, max: 100 },
    staff: { windowMs: 60000, max: 50 }
  }
  
  return limits[userRole] || limits.staff
}
```

### API Monitoring

#### Request Logging
```javascript
const apiLogger = {
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
      responseTime,
      status: res.statusCode,
      timestamp: new Date()
    }
    
    db.apiLogs.insertOne(logData)
  }
}
```

#### Performance Metrics
```javascript
// Track API performance
const trackPerformance = {
  async getBranchAPIMetrics(timeRange = '24h') {
    return await db.apiLogs.aggregate([
      {
        $match: {
          url: /^\/api\/branches/,
          timestamp: { $gte: getTimeRange(timeRange) }
        }
      },
      {
        $group: {
          _id: '$url',
          avgResponseTime: { $avg: '$responseTime' },
          requestCount: { $sum: 1 },
          errorCount: {
            $sum: {
              $cond: [{ $gte: ['$status', 400] }, 1, 0]
            }
          }
        }
      }
    ])
  }
}
```

## Troubleshooting Guide

### Common Issues

#### Branch Creation Failures

**Issue**: "Branch quota exceeded"
```javascript
// Diagnosis
const checkQuota = async (tenantId) => {
  const tenant = await db.tenants.findOne({ _id: tenantId })
  const branchCount = await db.branches.countDocuments({ tenantId, isActive: true })
  
  return {
    current: branchCount,
    limit: tenant.branchQuota.maxBranches,
    available: tenant.branchQuota.maxBranches - branchCount
  }
}

// Solution
const increaseQuota = async (tenantId, newLimit) => {
  await db.tenants.updateOne(
    { _id: tenantId },
    { $set: { 'branchQuota.maxBranches': newLimit } }
  )
}
```

**Issue**: "Duplicate branch code"
```javascript
// Find duplicate codes
db.branches.aggregate([
  { $group: { _id: '$code', count: { $sum: 1 }, branches: { $push: '$_id' } } },
  { $match: { count: { $gt: 1 } } }
])

// Fix duplicates
const fixDuplicateCodes = async () => {
  const duplicates = await findDuplicates()
  
  for (const duplicate of duplicates) {
    const branches = duplicate.branches.slice(1) // Keep first, fix others
    
    for (const branchId of branches) {
      const newCode = await generateUniqueCode()
      await db.branches.updateOne(
        { _id: branchId },
        { $set: { code: newCode } }
      )
    }
  }
}
```

#### Performance Issues

**Issue**: Slow branch queries
```javascript
// Check query performance
db.branches.find({ tenantId: ObjectId("TENANT_ID") }).explain("executionStats")

// Optimize with projection
db.branches.find(
  { tenantId: ObjectId("TENANT_ID") },
  { name: 1, code: 1, status: 1, type: 1 }
)
```

**Issue**: Memory leaks in branch operations
```javascript
// Monitor memory usage
const monitorMemory = () => {
  setInterval(() => {
    const usage = process.memoryUsage()
    console.log('Memory usage:', {
      rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB'
    })
  }, 60000)
}
```

### Data Consistency Issues

#### Branch-User Assignment Sync
```javascript
// Check for orphaned assignments
const findOrphanedAssignments = async () => {
  const users = await db.users.find({ assignedBranches: { $exists: true } })
  const orphans = []
  
  for (const user of users) {
    for (const branchId of user.assignedBranches) {
      const branch = await db.branches.findOne({ _id: branchId })
      if (!branch) {
        orphans.push({ userId: user._id, branchId })
      }
    }
  }
  
  return orphans
}

// Clean up orphaned assignments
const cleanupOrphans = async () => {
  const orphans = await findOrphanedAssignments()
  
  for (const orphan of orphans) {
    await db.users.updateOne(
      { _id: orphan.userId },
      { $pull: { assignedBranches: orphan.branchId } }
    )
  }
}
```

### Network and Connectivity Issues

#### Database Connection Problems
```javascript
// Test database connectivity
const testDBConnection = async () => {
  try {
    await db.admin().ping()
    console.log('Database connection: OK')
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Implement connection retry logic
const connectWithRetry = async (maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI)
      console.log('Connected to MongoDB')
      break
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error)
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}
```

## Maintenance Procedures

### Daily Maintenance

#### Health Checks
```javascript
const dailyHealthCheck = async () => {
  const checks = {
    database: await testDBConnection(),
    branchCount: await db.branches.countDocuments({ isActive: true }),
    quotaViolations: await findQuotaViolations(),
    orphanedData: await findOrphanedData(),
    performanceIssues: await checkPerformanceMetrics()
  }
  
  // Send alerts if issues found
  if (Object.values(checks).some(check => !check)) {
    await sendAlert('Daily health check failed', checks)
  }
  
  return checks
}
```

### Weekly Maintenance

#### Data Cleanup
```javascript
const weeklyCleanup = async () => {
  // Clean up inactive branches
  await archiveInactiveBranches()
  
  // Update branch metrics cache
  await updateAllBranchMetrics()
  
  // Clean up orphaned user assignments
  await cleanupOrphans()
  
  // Optimize database indexes
  await optimizeIndexes()
  
  console.log('Weekly cleanup completed')
}
```

### Monthly Maintenance

#### Full System Maintenance
```javascript
const monthlyMaintenance = async () => {
  // Full database backup
  await createFullBackup()
  
  // Performance analysis
  const perfReport = await generatePerformanceReport()
  
  // Quota analysis and recommendations
  const quotaReport = await analyzeQuotaUsage()
  
  // Security audit
  const securityReport = await performSecurityAudit()
  
  // Generate maintenance report
  await generateMaintenanceReport({
    performance: perfReport,
    quota: quotaReport,
    security: securityReport
  })
}
```

### Emergency Procedures

#### System Recovery
```javascript
const emergencyRecovery = async () => {
  console.log('Starting emergency recovery...')
  
  // Stop non-essential services
  await stopNonEssentialServices()
  
  // Check data integrity
  const integrityCheck = await checkDataIntegrity()
  
  if (!integrityCheck.valid) {
    // Restore from backup
    await restoreFromBackup(integrityCheck.lastValidBackup)
  }
  
  // Restart services
  await restartServices()
  
  // Verify system functionality
  const healthCheck = await performHealthCheck()
  
  console.log('Emergency recovery completed:', healthCheck)
}
```

## Best Practices

### Development Best Practices

1. **Code Quality**
   - Use TypeScript for type safety
   - Implement comprehensive error handling
   - Follow consistent coding standards
   - Write unit and integration tests

2. **Database Design**
   - Use appropriate indexes
   - Implement data validation
   - Design for scalability
   - Regular performance monitoring

3. **Security**
   - Implement proper authentication
   - Use authorization middleware
   - Encrypt sensitive data
   - Regular security audits

### Operational Best Practices

1. **Monitoring**
   - Set up comprehensive logging
   - Monitor performance metrics
   - Implement alerting systems
   - Regular health checks

2. **Backup and Recovery**
   - Automated daily backups
   - Test recovery procedures
   - Document recovery processes
   - Maintain backup retention policies

3. **Scalability**
   - Design for horizontal scaling
   - Use caching strategies
   - Implement load balancing
   - Monitor resource usage

## Conclusion

This administrator guide provides comprehensive information for managing the Branch Management system effectively. Regular maintenance, monitoring, and following best practices ensure optimal system performance and reliability.

For additional support or advanced configuration needs, please contact the development team or refer to the technical documentation.

---
*Last Updated: January 2025*
*Version: 2.0*