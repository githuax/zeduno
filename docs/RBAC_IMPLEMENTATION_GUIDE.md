# Restaurant & Bar RBAC Implementation Guide

## Overview

This document provides comprehensive implementation guidance for the Role-Based Access Control (RBAC) system designed specifically for restaurant and bar operations. The system includes detailed permission matrices, cross-departmental access, shift-based variations, and emergency backup roles.

## Table of Contents

1. [Core Architecture](#core-architecture)
2. [Permission Matrix](#permission-matrix)
3. [Role Definitions](#role-definitions)
4. [Implementation Examples](#implementation-examples)
5. [POS Integration](#pos-integration)
6. [Emergency Procedures](#emergency-procedures)
7. [Best Practices](#best-practices)

## Core Architecture

### Permission Categories

The RBAC system organizes permissions into logical categories:

- **Menu & POS**: Menu management and point-of-sale access
- **Order Management**: Order lifecycle and modifications
- **Bar Operations**: Beverage service and inventory
- **Restaurant Operations**: Table management and reservations
- **Service Operations**: Customer interaction and payment processing
- **Inventory Management**: Stock control and costing
- **Staff Management**: Employee scheduling and performance
- **Financial Operations**: Daily close and reporting
- **Emergency & Backup**: Crisis management and role coverage
- **System Operations**: Technical settings and maintenance

### Hierarchical Structure

```
Restaurant Manager
├── Shift Manager
│   ├── Head Server
│   │   ├── Server
│   │   ├── Food Runner
│   │   └── Busser
│   └── Host
└── Bar Manager
    ├── Head Bartender
    │   ├── Bartender
    │   └── Bar Back
    └── Sommelier
```

## Permission Matrix

### Bar Roles Permissions

#### Bar Manager
```typescript
Permissions: [
  // Full bar control
  'bar.serve', 'bar.inventory', 'bar.recipes', 'bar.wine_list',
  'bar.cocktails', 'bar.beer_draft', 'bar.cash_register',
  'bar.stock_count', 'bar.waste_tracking', 'bar.temperature_logs',
  
  // Menu management
  'menu.view', 'menu.edit', 'menu.pricing', 'menu.specials',
  
  // POS access
  'pos.full_menu', 'pos.bar_only', 'pos.discounts', 'pos.refunds',
  'pos.cash_management', 'pos.reports',
  
  // Order management
  'order.view', 'order.create', 'order.edit', 'order.cancel',
  'order.bar_display', 'order.priority',
  
  // Inventory control
  'inventory.view', 'inventory.adjust', 'inventory.receive',
  'inventory.transfer', 'inventory.count', 'inventory.waste',
  'inventory.costing',
  
  // Staff management
  'staff.view', 'staff.schedule', 'staff.attendance', 'staff.performance',
  
  // Financial operations
  'finance.daily_close', 'finance.reports', 'finance.till_management',
  
  // Emergency backup
  'backup.bartender', 'backup.server',
  
  // Cross-department
  'table.management', 'service.serve_drinks'
]
```

#### Bartender
```typescript
Permissions: [
  // Core bar operations
  'bar.serve', 'bar.recipes', 'bar.wine_list', 'bar.cocktails',
  'bar.beer_draft', 'bar.cash_register', 'bar.waste_tracking',
  
  // Menu access
  'menu.view',
  
  // POS operations
  'pos.bar_only', 'pos.basic',
  
  // Order handling
  'order.view', 'order.create', 'order.bar_display', 'order.modifications',
  
  // Basic inventory
  'inventory.view', 'inventory.waste',
  
  // Service
  'service.serve_drinks', 'service.payment_process'
]
```

### Restaurant Roles Permissions

#### Restaurant Manager
```typescript
Permissions: [
  // Complete restaurant control
  'table.management', 'table.assign', 'table.transfer', 'table.section_manage',
  'reservation.view', 'reservation.create', 'reservation.modify', 'reservation.cancel',
  
  // Full service management
  'service.take_orders', 'service.serve_food', 'service.serve_drinks',
  'service.payment_process', 'service.customer_complaints',
  
  // Complete menu control
  'menu.view', 'menu.create', 'menu.edit', 'menu.delete',
  'menu.pricing', 'menu.categories', 'menu.specials', 'menu.allergens',
  
  // Full POS access
  'pos.full_menu', 'pos.discounts', 'pos.refunds',
  'pos.cash_management', 'pos.reports',
  
  // Complete order management
  'order.view', 'order.create', 'order.edit', 'order.cancel',
  'order.refund', 'order.kitchen_display', 'order.bar_display',
  'order.priority', 'order.modifications',
  
  // Full inventory control
  'inventory.view', 'inventory.adjust', 'inventory.receive',
  'inventory.transfer', 'inventory.count', 'inventory.waste', 'inventory.costing',
  
  // Complete staff management
  'staff.view', 'staff.schedule', 'staff.attendance',
  'staff.performance', 'staff.payroll', 'staff.hire_fire',
  
  // Financial control
  'finance.daily_close', 'finance.reports', 'finance.banking',
  'finance.petty_cash', 'finance.till_management',
  
  // Emergency powers
  'emergency.override', 'backup.manager', 'backup.bartender',
  'backup.server', 'backup.host',
  
  // Cross-department bar access
  'bar.serve', 'bar.cash_register'
]
```

#### Server
```typescript
Permissions: [
  // Core service operations
  'service.take_orders', 'service.serve_food', 'service.serve_drinks',
  'service.payment_process',
  
  // Table operations
  'table.assign',
  
  // Menu access
  'menu.view', 'menu.allergens',
  
  // POS access
  'pos.full_menu', 'pos.basic',
  
  // Order management
  'order.view', 'order.create', 'order.modifications',
  
  // Cross-department
  'service.serve_drinks'
]
```

## Implementation Examples

### Basic Permission Check

```typescript
import { RolePermissionMatrix, Permission, IUser } from '../utils/rbac/RoleBasedAccessControl';

// Check if user can view menu
const canViewMenu = RolePermissionMatrix.hasPermission(user, Permission.MENU_VIEW);

// Check with shift context
const canUseDiscounts = RolePermissionMatrix.hasPermission(
  user, 
  Permission.POS_DISCOUNTS, 
  ShiftType.WEEKEND
);

// Get all user permissions
const allPermissions = RolePermissionMatrix.getUserPermissions(user, ShiftType.EVENING);
```

### Express Middleware Usage

```typescript
import { requirePermission, requirePOSAccess, Permission } from '../utils/rbac/RoleBasedAccessControl';

// Protect menu editing endpoint
app.put('/api/menu/:id', 
  authenticate,
  requirePermission(Permission.MENU_EDIT),
  updateMenuItem
);

// Protect bar-only POS access
app.get('/api/pos/bar-menu',
  authenticate,
  requirePOSAccess('bar'),
  getBarMenu
);

// Emergency override for critical operations
app.post('/api/emergency/override',
  authenticate,
  emergencyOverride(),
  handleEmergencyOperation
);
```

### JavaScript Implementation (Legacy Support)

```javascript
const { AccessControl, Permission, HospitalityRole } = require('../utils/rbac/AccessControl.js');

// Check permission in JavaScript
const hasPermission = AccessControl.hasPermission(user, Permission.BAR_SERVE);

// Middleware usage
app.get('/api/orders', 
  authenticate,
  AccessControl.requirePermission(Permission.ORDER_VIEW),
  getOrders
);

// POS access check
const canAccessBarPOS = AccessControl.canAccessPOSMenu(user, 'bar');
```

## POS Integration

### Menu Access Levels

The system defines three POS access levels:

1. **Full Menu Access** (`pos.full_menu`)
   - Complete restaurant and bar menu
   - All items, categories, and specials
   - Granted to: Servers, Managers, Shift Supervisors

2. **Bar Only Access** (`pos.bar_only`)
   - Alcoholic beverages only
   - Wine, cocktails, beer, spirits
   - Granted to: Bartenders, Bar Backs, Sommeliers

3. **Food Only Access** (`pos.food_only`)
   - Food items and non-alcoholic beverages
   - Appetizers, mains, desserts, soft drinks
   - Granted to: Food Runners, Kitchen Staff

### Implementation in POS System

```typescript
// Check menu access before displaying items
function getAvailableMenuItems(user: IUser): MenuItem[] {
  const canAccessFull = RolePermissionMatrix.canAccessPOSMenu(user, 'full');
  const canAccessBar = RolePermissionMatrix.canAccessPOSMenu(user, 'bar');
  const canAccessFood = RolePermissionMatrix.canAccessPOSMenu(user, 'food');

  if (canAccessFull) {
    return getAllMenuItems();
  } else if (canAccessBar) {
    return getBarMenuItems();
  } else if (canAccessFood) {
    return getFoodMenuItems();
  } else {
    return getBasicMenuItems(); // Limited view-only access
  }
}

// Validate order creation based on user permissions
function validateOrderItems(user: IUser, orderItems: OrderItem[]): boolean {
  for (const item of orderItems) {
    if (item.category === 'alcoholic' && !RolePermissionMatrix.canAccessPOSMenu(user, 'bar')) {
      throw new Error(`User ${user.email} cannot order alcoholic beverages`);
    }
    
    if (item.category === 'food' && !RolePermissionMatrix.canAccessPOSMenu(user, 'food')) {
      throw new Error(`User ${user.email} cannot order food items`);
    }
  }
  return true;
}
```

## Shift-Based Permission Variations

### Night Shift Enhancements

During night shifts, certain roles receive additional permissions to handle reduced staffing:

```typescript
// Bartender gains server backup permissions at night
const nightShiftPermissions = RolePermissionMatrix.getUserPermissions(
  bartenderUser, 
  ShiftType.NIGHT
);
// Result includes: backup.server, pos.discounts

// Server gains bartender backup permissions at night
const serverNightPermissions = RolePermissionMatrix.getUserPermissions(
  serverUser, 
  ShiftType.NIGHT
);
// Result includes: backup.bartender, bar.serve
```

### Weekend Enhancements

Weekend shifts often require enhanced order management capabilities:

```typescript
// Enhanced priority handling for busy weekends
const weekendPermissions = RolePermissionMatrix.getUserPermissions(
  serverUser, 
  ShiftType.WEEKEND
);
// Result includes: order.priority, pos.discounts
```

### Emergency Shift Override

Emergency situations activate special permissions for operational continuity:

```typescript
// Get emergency permissions for any role
const emergencyPermissions = RolePermissionMatrix.getEmergencyPermissions(user);

// Check for emergency override capability
const canOverride = RolePermissionMatrix.hasPermission(
  managerUser, 
  Permission.EMERGENCY_OVERRIDE, 
  ShiftType.EMERGENCY
);
```

## Emergency Procedures

### Backup Role Activation

The system supports automatic backup role activation during emergencies:

1. **Manager Backup**: Senior staff can assume management duties
2. **Bartender Backup**: Cross-trained servers can cover bar duties
3. **Server Backup**: Experienced bar staff can serve tables
4. **Host Backup**: Front-of-house staff can manage reservations

### Emergency Override Protocol

```typescript
// Emergency override middleware with audit logging
export const emergencyOverride = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Verify emergency override permission
    const emergencyPerms = RolePermissionMatrix.getEmergencyPermissions(req.user);
    
    if (!emergencyPerms.includes(Permission.EMERGENCY_OVERRIDE)) {
      return res.status(403).json({
        success: false,
        error: 'Emergency override access denied'
      });
    }

    // Log override usage for audit trail
    console.log(`🚨 EMERGENCY OVERRIDE: ${req.user.email} (${req.user.role}) - ${req.method} ${req.path}`);
    
    // Additional security: require reason and manager approval
    const overrideReason = req.headers['x-override-reason'];
    const managerApproval = req.headers['x-manager-approval'];
    
    if (!overrideReason || !managerApproval) {
      return res.status(400).json({
        success: false,
        error: 'Emergency override requires reason and manager approval'
      });
    }

    // Store override record for compliance
    storeEmergencyOverrideRecord({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      endpoint: req.path,
      method: req.method,
      reason: overrideReason,
      managerApproval: managerApproval,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  };
};
```

## Cross-Departmental Permissions

### Bar-Restaurant Integration

Many operations require coordination between bar and restaurant staff:

```typescript
// Server delivering cocktails from bar
const serverPermissions = RolePermissionMatrix.getUserPermissions(serverUser);
// Includes: service.serve_drinks (can deliver bar items)

// Bartender handling food orders for bar seating
const bartenderPermissions = RolePermissionMatrix.getUserPermissions(bartenderUser);
// Includes: service.serve_food (can serve bar food)

// Restaurant manager accessing bar operations
const managerPermissions = RolePermissionMatrix.getUserPermissions(restaurantManagerUser);
// Includes: bar.serve, bar.cash_register (can cover bar duties)
```

### Kitchen-Service Integration

Kitchen staff need limited front-of-house access for quality control:

```typescript
// Executive chef viewing customer feedback
const chefPermissions = RolePermissionMatrix.getUserPermissions(executiveChefUser);
// Includes: service.customer_complaints (can address food issues)

// Sous chef checking order modifications
const sousChefPermissions = RolePermissionMatrix.getUserPermissions(sousChefUser);
// Includes: order.modifications (can adjust preparation)
```

## Best Practices

### 1. Principle of Least Privilege

Grant only the minimum permissions necessary for job function:

```typescript
// ❌ Bad: Granting excessive permissions
const badPermissions = [
  Permission.MENU_DELETE, // Busser doesn't need to delete menu items
  Permission.STAFF_HIRE_FIRE, // Server doesn't hire/fire staff
  Permission.FINANCE_BANKING // Bartender doesn't handle banking
];

// ✅ Good: Role-appropriate permissions
const goodPermissions = [
  Permission.MENU_VIEW, // Busser needs to see menu
  Permission.TABLE_MANAGEMENT, // Busser manages table turnover
  Permission.SERVICE_CUSTOMER_COMPLAINTS // Busser reports issues
];
```

### 2. Regular Permission Audits

Implement regular reviews of user permissions:

```typescript
// Audit function to detect permission anomalies
function auditUserPermissions(users: IUser[]): AuditReport {
  const anomalies: PermissionAnomaly[] = [];
  
  users.forEach(user => {
    const permissions = RolePermissionMatrix.getUserPermissions(user);
    
    // Check for excessive permissions
    const sensitivePerms = permissions.filter(p => 
      p.startsWith('finance.') || p.startsWith('staff.hire_fire')
    );
    
    if (sensitivePerms.length > 0 && !isManagerRole(user.role)) {
      anomalies.push({
        userId: user._id,
        email: user.email,
        role: user.role,
        issue: 'Excessive sensitive permissions',
        permissions: sensitivePerms
      });
    }
    
    // Check for missing essential permissions
    const essentialPerms = getEssentialPermissionsForRole(user.role);
    const missingPerms = essentialPerms.filter(p => !permissions.includes(p));
    
    if (missingPerms.length > 0) {
      anomalies.push({
        userId: user._id,
        email: user.email,
        role: user.role,
        issue: 'Missing essential permissions',
        permissions: missingPerms
      });
    }
  });
  
  return { anomalies, auditDate: new Date() };
}
```

### 3. Permission Testing

Test permission enforcement in your application:

```typescript
// Unit test for permission checking
describe('RBAC Permission Tests', () => {
  it('should allow bartender to serve drinks', () => {
    const bartender = createTestUser(HospitalityRole.BARTENDER);
    const canServe = RolePermissionMatrix.hasPermission(bartender, Permission.BAR_SERVE);
    expect(canServe).toBe(true);
  });

  it('should deny busser access to financial reports', () => {
    const busser = createTestUser(HospitalityRole.BUSSER);
    const canViewFinance = RolePermissionMatrix.hasPermission(busser, Permission.FINANCE_REPORTS);
    expect(canViewFinance).toBe(false);
  });

  it('should grant night shift backup permissions', () => {
    const server = createTestUser(HospitalityRole.SERVER);
    const nightPermissions = RolePermissionMatrix.getUserPermissions(server, ShiftType.NIGHT);
    expect(nightPermissions).toContain(Permission.BACKUP_BARTENDER);
  });
});
```

### 4. Performance Optimization

Cache permission lookups for frequently accessed permissions:

```typescript
// Permission cache implementation
class PermissionCache {
  private cache = new Map<string, Permission[]>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  getCachedPermissions(userId: string, role: string, shift?: ShiftType): Permission[] | null {
    const key = `${userId}:${role}:${shift || 'default'}`;
    const cached = this.cache.get(key);
    
    if (cached && cached.timestamp > Date.now() - this.ttl) {
      return cached.permissions;
    }
    
    return null;
  }

  setCachedPermissions(userId: string, role: string, permissions: Permission[], shift?: ShiftType): void {
    const key = `${userId}:${role}:${shift || 'default'}`;
    this.cache.set(key, {
      permissions,
      timestamp: Date.now()
    });
  }

  clearUserCache(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(userId));
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}
```

## Migration from Existing System

### Step 1: Audit Current Permissions

```typescript
// Analyze existing user roles and permissions
const currentUsers = await User.find({});
const roleAnalysis = currentUsers.reduce((acc, user) => {
  if (!acc[user.role]) {
    acc[user.role] = { count: 0, permissions: new Set() };
  }
  acc[user.role].count++;
  
  // Add any existing permissions
  if (user.permissions) {
    user.permissions.forEach(p => acc[user.role].permissions.add(p));
  }
  
  return acc;
}, {});

console.log('Current Role Distribution:', roleAnalysis);
```

### Step 2: Create Migration Plan

```typescript
// Map existing roles to new hospitality roles
const roleMigrationMap = {
  'admin': HospitalityRole.RESTAURANT_MANAGER,
  'manager': HospitalityRole.SHIFT_MANAGER,
  'staff': HospitalityRole.SERVER,
  'bartender': HospitalityRole.BARTENDER,
  'host': HospitalityRole.HOST
};

// Migration function
async function migrateUserPermissions() {
  const users = await User.find({});
  
  for (const user of users) {
    const newRole = roleMigrationMap[user.role];
    if (newRole) {
      const newPermissions = RolePermissionMatrix.getUserPermissions({
        ...user.toObject(),
        role: newRole
      });
      
      // Update user with new role and permissions
      await User.findByIdAndUpdate(user._id, {
        $set: {
          hospitalityRole: newRole,
          permissions: newPermissions,
          migratedAt: new Date()
        }
      });
      
      console.log(`Migrated ${user.email}: ${user.role} → ${newRole}`);
    }
  }
}
```

### Step 3: Gradual Rollout

```typescript
// Feature flag for RBAC system
const isRBACEnabled = process.env.ENABLE_RBAC === 'true';

// Middleware to check both old and new systems during transition
const checkPermission = (permission: string | Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (isRBACEnabled) {
      // Use new RBAC system
      const hasPermission = RolePermissionMatrix.hasPermission(req.user as IUser, permission as Permission);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      // Fall back to old permission system
      if (!req.user.permissions.includes(permission)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    next();
  };
};
```

## Monitoring and Compliance

### Access Logging

```typescript
// Enhanced audit logging for compliance
export const auditLogger = (req: AuthRequest, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log access attempt
    const logEntry = {
      timestamp: new Date(),
      userId: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      success: res.statusCode < 400,
      branchId: req.branchId,
      tenantId: req.user?.tenantId
    };
    
    // Store in audit log collection
    AuditLog.create(logEntry);
    
    // Alert on suspicious activity
    if (res.statusCode === 403) {
      alertSecurityTeam('Permission denied', logEntry);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};
```

### Permission Analytics

```typescript
// Generate permission usage reports
class PermissionAnalytics {
  async generateUsageReport(startDate: Date, endDate: Date) {
    const usageStats = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            userRole: '$userRole',
            path: '$path',
            method: '$method'
          },
          accessCount: { $sum: 1 },
          successCount: { $sum: { $cond: ['$success', 1, 0] } },
          failureCount: { $sum: { $cond: ['$success', 0, 1] } }
        }
      }
    ]);
    
    return usageStats;
  }
  
  async detectAnomalousAccess() {
    // Detect unusual access patterns
    const anomalies = await AuditLog.aggregate([
      {
        $group: {
          _id: '$userId',
          accessCount: { $sum: 1 },
          uniquePaths: { $addToSet: '$path' },
          failureCount: { $sum: { $cond: ['$success', 0, 1] } }
        }
      },
      {
        $match: {
          $or: [
            { failureCount: { $gt: 10 } }, // High failure rate
            { accessCount: { $gt: 1000 } }, // Unusually high access
            { 'uniquePaths.10': { $exists: true } } // Accessing many endpoints
          ]
        }
      }
    ]);
    
    return anomalies;
  }
}
```

This comprehensive RBAC system provides fine-grained access control tailored specifically for restaurant and bar operations, ensuring security, compliance, and operational efficiency while maintaining flexibility for various hospitality scenarios.