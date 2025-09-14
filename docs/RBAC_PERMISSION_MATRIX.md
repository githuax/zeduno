# Restaurant & Bar RBAC Permission Matrix

## Complete Permission Matrix by Role

This document provides a comprehensive visual representation of all permissions across hospitality roles, including cross-departmental access, shift-based variations, and emergency backup capabilities.

## Legend

- ✅ **Full Access**: Complete permission with all capabilities
- 🔹 **Limited Access**: Restricted or conditional permission
- 📋 **View Only**: Read-only access without modification rights
- 🚨 **Emergency Only**: Access granted only during emergency situations
- 🌙 **Night Shift**: Additional permission during night shifts
- 🎯 **Weekend**: Enhanced permission during weekend shifts
- ❌ **No Access**: Permission explicitly denied

---

## Bar Operations Matrix

| Permission | Bar Manager | Head Bartender | Bartender | Bar Back | Sommelier | Notes |
|------------|-------------|----------------|-----------|----------|-----------|-------|
| **Bar Service** |
| `bar.serve` | ✅ | ✅ | ✅ | ❌ | ✅ | Core beverage service |
| `bar.inventory` | ✅ | ✅ | 📋 | ✅ | 📋 | Stock management |
| `bar.recipes` | ✅ | ✅ | ✅ | 📋 | ✅ | Cocktail formulations |
| `bar.wine_list` | ✅ | ✅ | ✅ | ❌ | ✅ | Wine inventory & service |
| `bar.cocktails` | ✅ | ✅ | ✅ | ❌ | 🔹 | Mixed drink preparation |
| `bar.beer_draft` | ✅ | ✅ | ✅ | 🔹 | ✅ | Draft beer systems |
| `bar.cash_register` | ✅ | ✅ | ✅ | ❌ | 🔹 | Bar POS operations |
| `bar.stock_count` | ✅ | ✅ | 🎯 | ✅ | 📋 | Inventory counts |
| `bar.waste_tracking` | ✅ | ✅ | ✅ | ✅ | 📋 | Loss prevention |
| `bar.temperature_logs` | ✅ | 🔹 | ❌ | ✅ | 📋 | Equipment monitoring |

## Restaurant Operations Matrix

| Permission | Restaurant Manager | Shift Manager | Head Server | Server | Host | Food Runner | Busser |
|------------|-------------------|---------------|-------------|--------|------|-------------|---------|
| **Table Management** |
| `table.management` | ✅ | ✅ | ✅ | 🔹 | ✅ | 🔹 | ✅ |
| `table.assign` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `table.transfer` | ✅ | ✅ | 🔹 | ❌ | 🔹 | ❌ | ❌ |
| `table.section_manage` | ✅ | 🔹 | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Reservations** |
| `reservation.view` | ✅ | ✅ | ✅ | 📋 | ✅ | ❌ | ❌ |
| `reservation.create` | ✅ | ✅ | ✅ | 🔹 | ✅ | ❌ | ❌ |
| `reservation.modify` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `reservation.cancel` | ✅ | 🔹 | 🔹 | ❌ | 🔹 | ❌ | ❌ |
| **Service Operations** |
| `service.take_orders` | ✅ | ✅ | ✅ | ✅ | 🔹 | ❌ | ❌ |
| `service.serve_food` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | 🔹 |
| `service.serve_drinks` | ✅ | ✅ | ✅ | ✅ | ❌ | 🔹 | ❌ |
| `service.payment_process` | ✅ | ✅ | ✅ | ✅ | 🔹 | ❌ | ❌ |
| `service.customer_complaints` | ✅ | ✅ | ✅ | 🔹 | ✅ | ❌ | ❌ |

## POS Access Matrix

| Permission | Restaurant Manager | Bar Manager | Shift Manager | Server | Bartender | Host | Cashier |
|------------|-------------------|-------------|---------------|--------|-----------|------|---------|
| `pos.basic` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `pos.full_menu` | ✅ | ✅ | ✅ | ✅ | 🔹 | 🔹 | ✅ |
| `pos.bar_only` | ✅ | ✅ | 🔹 | 🌙 | ✅ | ❌ | ❌ |
| `pos.food_only` | ✅ | ❌ | ✅ | ✅ | ❌ | 🔹 | ✅ |
| `pos.discounts` | ✅ | ✅ | ✅ | 🎯 | 🌙 | ❌ | 🔹 |
| `pos.refunds` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 🔹 |
| `pos.cash_management` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `pos.reports` | ✅ | ✅ | 📋 | ❌ | ❌ | ❌ | ❌ |

## Order Management Matrix

| Permission | Restaurant Manager | Bar Manager | Shift Manager | Head Server | Server | Bartender | Kitchen Staff |
|------------|-------------------|-------------|---------------|-------------|--------|-----------|---------------|
| `order.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `order.create` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `order.edit` | ✅ | ✅ | ✅ | ✅ | 🔹 | 🔹 | ❌ |
| `order.cancel` | ✅ | ✅ | ✅ | 🔹 | ❌ | ❌ | ❌ |
| `order.refund` | ✅ | 🔹 | 🔹 | ❌ | ❌ | ❌ | ❌ |
| `order.kitchen_display` | ✅ | ❌ | ✅ | ✅ | 📋 | ❌ | ✅ |
| `order.bar_display` | ✅ | ✅ | 🔹 | 📋 | ❌ | ✅ | ❌ |
| `order.priority` | ✅ | ✅ | ✅ | 🎯 | 🎯 | 🎯 | ✅ |
| `order.modifications` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔹 |

## Menu Management Matrix

| Permission | Restaurant Manager | Bar Manager | Executive Chef | Sous Chef | Head Server | Sommelier |
|------------|-------------------|-------------|----------------|-----------|-------------|-----------|
| `menu.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `menu.create` | ✅ | 🔹 | ✅ | 🔹 | ❌ | 🔹 |
| `menu.edit` | ✅ | 🔹 | ✅ | ✅ | ❌ | 🔹 |
| `menu.delete` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `menu.pricing` | ✅ | ✅ | 🔹 | ❌ | ❌ | 🔹 |
| `menu.categories` | ✅ | 🔹 | ✅ | 🔹 | ❌ | 🔹 |
| `menu.specials` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `menu.allergens` | ✅ | ❌ | ✅ | ✅ | ✅ | 🔹 |

## Inventory Management Matrix

| Permission | Restaurant Manager | Bar Manager | Executive Chef | Sous Chef | Bartender | Server |
|------------|-------------------|-------------|----------------|-----------|-----------|--------|
| `inventory.view` | ✅ | ✅ | ✅ | ✅ | 📋 | ❌ |
| `inventory.adjust` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `inventory.receive` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `inventory.transfer` | ✅ | ✅ | ✅ | 🔹 | ❌ | ❌ |
| `inventory.count` | ✅ | ✅ | ✅ | ✅ | 🎯 | ❌ |
| `inventory.waste` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔹 |
| `inventory.costing` | ✅ | ✅ | ✅ | 📋 | ❌ | ❌ |

## Staff Management Matrix

| Permission | Restaurant Manager | Bar Manager | Shift Manager | Head Server | Head Bartender |
|------------|-------------------|-------------|---------------|-------------|----------------|
| `staff.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `staff.schedule` | ✅ | ✅ | 🔹 | ❌ | 🔹 |
| `staff.attendance` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `staff.performance` | ✅ | ✅ | 🔹 | 🔹 | 🔹 |
| `staff.payroll` | ✅ | 🔹 | ❌ | ❌ | ❌ |
| `staff.hire_fire` | ✅ | 🔹 | ❌ | ❌ | ❌ |

## Financial Operations Matrix

| Permission | Restaurant Manager | Bar Manager | Shift Manager | Cashier | Executive Chef |
|------------|-------------------|-------------|---------------|---------|----------------|
| `finance.daily_close` | ✅ | ✅ | ✅ | 🔹 | ❌ |
| `finance.reports` | ✅ | ✅ | 📋 | ❌ | 📋 |
| `finance.banking` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `finance.petty_cash` | ✅ | 🔹 | 🔹 | ✅ | ❌ |
| `finance.till_management` | ✅ | ✅ | ✅ | ✅ | ❌ |

## Emergency & Backup Permissions Matrix

| Permission | Restaurant Manager | Bar Manager | Shift Manager | Head Server | Head Bartender |
|------------|-------------------|-------------|---------------|-------------|----------------|
| `emergency.override` | ✅ | 🔹 | 🚨 | ❌ | ❌ |
| `backup.manager` | ✅ | ✅ | 🚨 | 🚨 | 🚨 |
| `backup.bartender` | ✅ | ✅ | 🌙 | 🌙 | ✅ |
| `backup.server` | ✅ | ✅ | ✅ | ✅ | 🌙 |
| `backup.host` | ✅ | 🔹 | ✅ | ✅ | ❌ |

## Shift-Based Permission Variations

### Night Shift Enhancements (🌙)

During night shifts (typically 9 PM - 6 AM), certain roles receive additional permissions to handle reduced staffing:

| Base Role | Additional Night Permissions | Reason |
|-----------|----------------------------|--------|
| **Bartender** | `backup.server`, `pos.discounts` | May need to serve tables when short-staffed |
| **Server** | `backup.bartender`, `bar.serve` | May need to prepare simple drinks |
| **Shift Manager** | `emergency.override`, `system.maintenance` | Senior person on duty for emergencies |

### Weekend Enhancements (🎯)

Weekend shifts often require enhanced capabilities for busy periods:

| Base Role | Additional Weekend Permissions | Reason |
|-----------|-------------------------------|--------|
| **Server** | `order.priority`, `pos.discounts` | Handle high-volume service efficiently |
| **Bartender** | `order.priority`, `bar.stock_count` | Manage busy bar operations |
| **Head Server** | `staff.performance` | Monitor team performance during peak times |

### Emergency Overrides (🚨)

Emergency situations activate special permissions for operational continuity:

| Role | Emergency Permissions | Activation Conditions |
|------|---------------------|---------------------|
| **Shift Manager** | All `backup.*` permissions | Manager absence, system failures |
| **Head Server** | `backup.manager`, `emergency.override` | Critical staffing shortage |
| **Head Bartender** | `backup.manager`, `pos.full_menu` | Bar manager absence |

## Cross-Departmental Access Patterns

### Bar-Restaurant Integration

| Scenario | Involved Roles | Required Permissions | Implementation |
|----------|---------------|-------------------|----------------|
| **Wine Service** | Sommelier, Server | `bar.wine_list`, `service.serve_drinks` | Sommelier selects, server delivers |
| **Bar Food Orders** | Bartender, Kitchen | `pos.food_only`, `order.kitchen_display` | Bartender takes order, kitchen prepares |
| **Manager Coverage** | Restaurant Manager | `bar.serve`, `bar.cash_register` | Full cross-department authority |

### Kitchen-Service Integration

| Scenario | Involved Roles | Required Permissions | Implementation |
|----------|---------------|-------------------|----------------|
| **Quality Control** | Executive Chef | `service.customer_complaints` | Address food quality issues directly |
| **Order Modifications** | Sous Chef, Server | `order.modifications` | Coordinate special requests |
| **Inventory Updates** | Line Cook | `inventory.waste` | Report ingredient shortages |

## Permission Inheritance Hierarchy

The system implements a management hierarchy where senior roles inherit permissions from their subordinates:

```
Restaurant Manager
├── Inherits all Shift Manager permissions
├── Inherits all Head Server permissions
└── Inherits all Server permissions

Bar Manager
├── Inherits all Head Bartender permissions
├── Inherits all Bartender permissions
└── Inherits all Bar Back permissions

Executive Chef
├── Inherits all Sous Chef permissions
├── Inherits all Line Cook permissions
└── Inherits all Prep Cook permissions
```

## Implementation Examples

### Permission Check in Route Handler

```typescript
// Example: Menu editing endpoint with role-based access
app.put('/api/menu/:id', 
  authenticate,
  requirePermission(Permission.MENU_EDIT),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    
    // Additional business logic checks
    if (updates.pricing && !RolePermissionMatrix.hasPermission(req.user, Permission.MENU_PRICING)) {
      return res.status(403).json({
        success: false,
        error: 'Price modification requires additional permission'
      });
    }
    
    try {
      const updatedMenuItem = await MenuItem.findByIdAndUpdate(id, updates, { new: true });
      res.json({ success: true, data: updatedMenuItem });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
```

### Dynamic UI Based on Permissions

```typescript
// Frontend permission checking for UI elements
const PermissionGate: React.FC<{ permission: Permission; children: React.ReactNode }> = ({ 
  permission, 
  children 
}) => {
  const { user } = useAuth();
  const hasPermission = RolePermissionMatrix.hasPermission(user, permission);
  
  if (!hasPermission) {
    return null;
  }
  
  return <>{children}</>;
};

// Usage in component
const MenuManagement = () => {
  return (
    <div>
      <h1>Menu Management</h1>
      
      <PermissionGate permission={Permission.MENU_CREATE}>
        <Button onClick={createNewItem}>Add New Item</Button>
      </PermissionGate>
      
      <PermissionGate permission={Permission.MENU_PRICING}>
        <PricingControls />
      </PermissionGate>
      
      <PermissionGate permission={Permission.MENU_DELETE}>
        <DeleteItemButton />
      </PermissionGate>
    </div>
  );
};
```

### Shift-Based Permission Adjustment

```typescript
// Middleware to adjust permissions based on current shift
const adjustShiftPermissions = (req: AuthRequest, res: Response, next: NextFunction) => {
  const currentHour = new Date().getHours();
  let shift: ShiftType;
  
  if (currentHour >= 22 || currentHour < 6) {
    shift = ShiftType.NIGHT;
  } else if ([0, 6].includes(new Date().getDay())) {
    shift = ShiftType.WEEKEND;
  } else {
    shift = ShiftType.DAY;
  }
  
  // Attach shift info to request
  req.currentShift = shift;
  
  // Get enhanced permissions for current shift
  const enhancedPermissions = RolePermissionMatrix.getUserPermissions(req.user, shift);
  req.userPermissions = enhancedPermissions;
  
  next();
};

// Use in routes that need shift-aware permissions
app.use('/api/orders', adjustShiftPermissions);
app.post('/api/orders', 
  requirePermission(Permission.ORDER_CREATE),
  createOrder
);
```

### Emergency Override Logging

```typescript
// Enhanced logging for emergency overrides
const emergencyOverrideWithAudit = () => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const emergencyPermissions = RolePermissionMatrix.getEmergencyPermissions(req.user);
    
    if (!emergencyPermissions.includes(Permission.EMERGENCY_OVERRIDE)) {
      return res.status(403).json({
        success: false,
        error: 'Emergency override access denied'
      });
    }

    // Create detailed audit record
    const auditRecord = {
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'EMERGENCY_OVERRIDE',
      endpoint: req.path,
      method: req.method,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      reason: req.headers['x-override-reason'] || 'No reason provided',
      managerApproval: req.headers['x-manager-approval'] || 'None',
      additionalContext: {
        branchId: req.branchId,
        tenantId: req.user.tenantId,
        sessionId: req.sessionID
      }
    };

    // Store in audit log
    await EmergencyAuditLog.create(auditRecord);
    
    // Send real-time alert to management
    await notifyManagement('Emergency Override Used', auditRecord);
    
    // Log to console for immediate visibility
    console.log(`🚨 EMERGENCY OVERRIDE: ${auditRecord.userEmail} at ${auditRecord.timestamp}`);
    
    next();
  };
};
```

## Security Considerations

### Permission Validation Best Practices

1. **Server-Side Validation**: Always validate permissions on the server, never trust client-side checks
2. **Principle of Least Privilege**: Grant minimal permissions necessary for job function
3. **Regular Audits**: Review and audit user permissions quarterly
4. **Emergency Procedures**: Maintain clear emergency override protocols
5. **Logging & Monitoring**: Log all permission-sensitive actions for audit trails

### Common Security Pitfalls to Avoid

```typescript
// ❌ BAD: Client-side only permission check
if (user.role === 'manager') {
  showAdminPanel();
}

// ✅ GOOD: Server-side validation with client-side UI enhancement
const canViewAdmin = await checkPermission(user.id, Permission.SYSTEM_SETTINGS);
if (canViewAdmin) {
  showAdminPanel();
}
```

```typescript
// ❌ BAD: Hardcoded role checks
if (req.user.role === 'bartender' || req.user.role === 'bar_manager') {
  // Allow bar operations
}

// ✅ GOOD: Permission-based checks
if (RolePermissionMatrix.hasPermission(req.user, Permission.BAR_SERVE)) {
  // Allow bar operations
}
```

This comprehensive permission matrix ensures precise access control while maintaining operational flexibility and security compliance across all restaurant and bar operations.