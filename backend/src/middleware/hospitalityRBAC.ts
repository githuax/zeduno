/**
 * Hospitality RBAC Middleware Integration
 * 
 * This file provides middleware integration examples for the comprehensive
 * restaurant and bar RBAC system within the existing dine-serve-hub codebase.
 */

import { Request, Response, NextFunction } from 'express';
import { 
  RolePermissionMatrix, 
  Permission, 
  ShiftType, 
  HospitalityRole,
  requirePermission,
  requirePOSAccess,
  emergencyOverride
} from '../utils/rbac/RoleBasedAccessControl';
import { AuthRequest } from '../types/auth.types';
import { IUser } from '../models/User';

// ===== ENHANCED AUTH MIDDLEWARE WITH RBAC =====

/**
 * Enhanced authentication middleware that includes RBAC permission loading
 */
export const authenticateWithRBAC = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // First run standard authentication
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No authentication token provided' });
    }

    // ... existing auth logic from auth.ts middleware ...
    // Assuming req.user is populated by existing auth middleware

    if (req.user) {
      // Determine current shift for permission adjustments
      const currentShift = determineCurrentShift();
      
      // Load user permissions based on role and current shift
      const userPermissions = RolePermissionMatrix.getUserPermissions(req.user as IUser, currentShift);
      
      // Attach permission info to request
      req.userPermissions = userPermissions;
      req.currentShift = currentShift;
      
      // Add convenience method for permission checking
      req.hasPermission = (permission: Permission, shift?: ShiftType) => {
        return RolePermissionMatrix.hasPermission(req.user as IUser, permission, shift || currentShift);
      };
    }

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

/**
 * Determine current shift based on time of day and day of week
 */
function determineCurrentShift(): ShiftType {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Check for weekend first
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return ShiftType.WEEKEND;
  }
  
  // Determine shift by hour
  if (hour >= 22 || hour < 6) {
    return ShiftType.NIGHT;
  } else if (hour >= 17) {
    return ShiftType.EVENING;
  } else {
    return ShiftType.DAY;
  }
}

// ===== MENU MANAGEMENT MIDDLEWARE =====

/**
 * Middleware for menu management operations with granular permissions
 */
export const menuPermissionGate = {
  // View menu items (most permissive)
  viewMenu: requirePermission(Permission.MENU_VIEW),
  
  // Create new menu items
  createMenu: requirePermission(Permission.MENU_CREATE),
  
  // Edit existing menu items
  editMenu: requirePermission(Permission.MENU_EDIT),
  
  // Delete menu items (most restrictive)
  deleteMenu: requirePermission(Permission.MENU_DELETE),
  
  // Modify pricing (special permission)
  editPricing: requirePermission(Permission.MENU_PRICING),
  
  // Manage allergen information
  manageAllergens: requirePermission(Permission.MENU_ALLERGENS),
  
  // Handle daily specials
  manageSpecials: requirePermission(Permission.MENU_SPECIALS),
  
  // Advanced: Check multiple permissions for complex operations
  fullMenuManagement: (req: AuthRequest, res: Response, next: NextFunction) => {
    const requiredPermissions = [
      Permission.MENU_VIEW,
      Permission.MENU_EDIT,
      Permission.MENU_PRICING
    ];
    
    const hasAllPermissions = requiredPermissions.every(permission => 
      req.hasPermission!(permission)
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for full menu management',
        required: requiredPermissions,
        userRole: req.user?.role
      });
    }
    
    next();
  }
};

// ===== ORDER MANAGEMENT MIDDLEWARE =====

/**
 * Order management permissions with context-aware access
 */
export const orderPermissionGate = {
  // Basic order operations
  viewOrders: requirePermission(Permission.ORDER_VIEW),
  createOrder: requirePermission(Permission.ORDER_CREATE),
  editOrder: requirePermission(Permission.ORDER_EDIT),
  cancelOrder: requirePermission(Permission.ORDER_CANCEL),
  
  // Kitchen display access
  kitchenDisplay: requirePermission(Permission.ORDER_KITCHEN_DISPLAY),
  
  // Bar display access
  barDisplay: requirePermission(Permission.ORDER_BAR_DISPLAY),
  
  // Priority order handling (enhanced during peak times)
  priorityHandling: (req: AuthRequest, res: Response, next: NextFunction) => {
    const hasBasicPermission = req.hasPermission!(Permission.ORDER_PRIORITY);
    const isWeekendShift = req.currentShift === ShiftType.WEEKEND;
    
    // Enhanced priority permissions during weekend shifts
    if (hasBasicPermission || (isWeekendShift && req.hasPermission!(Permission.ORDER_VIEW))) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: 'Priority order handling permission required',
        currentShift: req.currentShift,
        userRole: req.user?.role
      });
    }
  },
  
  // Order modifications with business logic
  modifyOrder: (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.hasPermission!(Permission.ORDER_MODIFICATIONS)) {
      return res.status(403).json({
        success: false,
        error: 'Order modification permission required'
      });
    }
    
    // Additional business rules for order modifications
    const order = req.body;
    if (order.status === 'completed' && !req.hasPermission!(Permission.ORDER_REFUND)) {
      return res.status(403).json({
        success: false,
        error: 'Cannot modify completed orders without refund permission'
      });
    }
    
    next();
  }
};

// ===== POS SYSTEM INTEGRATION =====

/**
 * POS access control with menu-specific permissions
 */
export const posPermissionGate = {
  // Basic POS access
  basicAccess: requirePOSAccess('full'),
  
  // Bar-only POS terminals
  barAccess: requirePOSAccess('bar'),
  
  // Food-only POS terminals
  foodAccess: requirePOSAccess('food'),
  
  // Discount application
  applyDiscounts: requirePermission(Permission.POS_DISCOUNTS),
  
  // Refund processing
  processRefunds: requirePermission(Permission.POS_REFUNDS),
  
  // Cash management operations
  manageCash: requirePermission(Permission.POS_CASH_MANAGEMENT),
  
  // Dynamic menu filtering based on user permissions
  filterMenuByPermissions: (req: AuthRequest, res: Response, next: NextFunction) => {
    const canAccessFull = RolePermissionMatrix.canAccessPOSMenu(req.user as IUser, 'full');
    const canAccessBar = RolePermissionMatrix.canAccessPOSMenu(req.user as IUser, 'bar');
    const canAccessFood = RolePermissionMatrix.canAccessPOSMenu(req.user as IUser, 'food');
    
    // Attach menu access info to request for use in route handlers
    req.menuAccess = {
      full: canAccessFull,
      bar: canAccessBar,
      food: canAccessFood
    };
    
    next();
  }
};

// ===== BAR OPERATIONS MIDDLEWARE =====

/**
 * Bar-specific permission gates
 */
export const barPermissionGate = {
  // Core bar service
  serveBar: requirePermission(Permission.BAR_SERVE),
  
  // Inventory management
  manageInventory: requirePermission(Permission.BAR_INVENTORY),
  
  // Recipe access
  accessRecipes: requirePermission(Permission.BAR_RECIPES),
  
  // Wine list management
  manageWineList: requirePermission(Permission.BAR_WINE_LIST),
  
  // Stock counting (enhanced on weekends)
  stockCount: (req: AuthRequest, res: Response, next: NextFunction) => {
    const hasBasicPermission = req.hasPermission!(Permission.BAR_STOCK_COUNT);
    const isWeekendEnhanced = req.currentShift === ShiftType.WEEKEND && 
      req.hasPermission!(Permission.BAR_SERVE);
    
    if (hasBasicPermission || isWeekendEnhanced) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: 'Bar stock count permission required'
      });
    }
  },
  
  // Temperature log management
  temperatureLogs: requirePermission(Permission.BAR_TEMPERATURE_LOGS),
  
  // Waste tracking
  trackWaste: requirePermission(Permission.BAR_WASTE_TRACKING)
};

// ===== STAFF MANAGEMENT MIDDLEWARE =====

/**
 * Staff management with hierarchical permissions
 */
export const staffPermissionGate = {
  // View staff information
  viewStaff: requirePermission(Permission.STAFF_VIEW),
  
  // Schedule management
  manageSchedule: requirePermission(Permission.STAFF_SCHEDULE),
  
  // Attendance tracking
  trackAttendance: requirePermission(Permission.STAFF_ATTENDANCE),
  
  // Performance monitoring
  monitorPerformance: requirePermission(Permission.STAFF_PERFORMANCE),
  
  // Payroll access
  accessPayroll: requirePermission(Permission.STAFF_PAYROLL),
  
  // Hiring and termination (highest level)
  hireFire: requirePermission(Permission.STAFF_HIRE_FIRE),
  
  // Context-aware staff access (can only manage subordinates)
  hierarchicalAccess: (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.hasPermission!(Permission.STAFF_VIEW)) {
      return res.status(403).json({
        success: false,
        error: 'Staff viewing permission required'
      });
    }
    
    // Additional logic to restrict access to subordinates only
    const targetUserId = req.params.userId || req.body.userId;
    
    // This would need to be implemented based on your organizational hierarchy
    // For now, we'll just ensure basic permission
    next();
  }
};

// ===== FINANCIAL OPERATIONS MIDDLEWARE =====

/**
 * Financial operations with audit logging
 */
export const financePermissionGate = {
  // Daily close operations
  dailyClose: (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.hasPermission!(Permission.FINANCE_DAILY_CLOSE)) {
      return res.status(403).json({
        success: false,
        error: 'Daily close permission required'
      });
    }
    
    // Log financial operation access
    console.log(`💰 FINANCE ACCESS: ${req.user?.email} - Daily Close Operation`);
    next();
  },
  
  // Financial reports
  viewReports: (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.hasPermission!(Permission.FINANCE_REPORTS)) {
      return res.status(403).json({
        success: false,
        error: 'Financial reports permission required'
      });
    }
    
    // Log report access for audit
    console.log(`📊 REPORT ACCESS: ${req.user?.email} - Financial Reports`);
    next();
  },
  
  // Banking operations
  banking: requirePermission(Permission.FINANCE_BANKING),
  
  // Till management
  manageTill: requirePermission(Permission.FINANCE_TILL_MANAGEMENT),
  
  // Petty cash handling
  pettyCash: requirePermission(Permission.FINANCE_PETTY_CASH)
};

// ===== EMERGENCY OPERATIONS =====

/**
 * Emergency override system with comprehensive logging
 */
export const emergencyOperations = {
  // Standard emergency override
  override: emergencyOverride(),
  
  // Enhanced emergency override with additional validation
  enhancedOverride: (req: AuthRequest, res: Response, next: NextFunction) => {
    const emergencyPermissions = RolePermissionMatrix.getEmergencyPermissions(req.user as IUser);
    
    if (!emergencyPermissions.includes(Permission.EMERGENCY_OVERRIDE)) {
      return res.status(403).json({
        success: false,
        error: 'Emergency override access denied',
        userRole: req.user?.role,
        availablePermissions: emergencyPermissions.length
      });
    }
    
    // Require additional headers for enhanced security
    const overrideReason = req.headers['x-override-reason'] as string;
    const managerApproval = req.headers['x-manager-approval'] as string;
    const emergencyType = req.headers['x-emergency-type'] as string;
    
    if (!overrideReason || !managerApproval || !emergencyType) {
      return res.status(400).json({
        success: false,
        error: 'Emergency override requires: x-override-reason, x-manager-approval, and x-emergency-type headers'
      });
    }
    
    // Enhanced logging with structured data
    const emergencyLog = {
      timestamp: new Date(),
      userId: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      action: 'ENHANCED_EMERGENCY_OVERRIDE',
      endpoint: `${req.method} ${req.path}`,
      reason: overrideReason,
      managerApproval: managerApproval,
      emergencyType: emergencyType,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      branchId: req.branchId,
      tenantId: req.user?.tenantId
    };
    
    // Log to console immediately
    console.log('🚨 ENHANCED EMERGENCY OVERRIDE:', JSON.stringify(emergencyLog, null, 2));
    
    // Store in database (implement EmergencyLog model as needed)
    // await EmergencyLog.create(emergencyLog);
    
    // Send real-time notification to management
    // await notifyEmergencyOverride(emergencyLog);
    
    next();
  },
  
  // Backup role activation
  activateBackupRole: (backupRole: Permission) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      const userPermissions = req.userPermissions || [];
      
      if (!userPermissions.includes(backupRole)) {
        return res.status(403).json({
          success: false,
          error: `Backup role activation denied: ${backupRole}`,
          userRole: req.user?.role
        });
      }
      
      // Log backup role activation
      console.log(`🔄 BACKUP ROLE ACTIVATED: ${req.user?.email} -> ${backupRole}`);
      
      // Add backup role context to request
      req.activeBackupRole = backupRole;
      
      next();
    };
  }
};

// ===== CONVENIENCE MIDDLEWARE COMBINATIONS =====

/**
 * Common middleware combinations for typical restaurant operations
 */
export const commonPermissionSets = {
  // Full restaurant management access
  restaurantManager: [
    menuPermissionGate.fullMenuManagement,
    orderPermissionGate.modifyOrder,
    staffPermissionGate.hierarchicalAccess,
    financePermissionGate.viewReports
  ],
  
  // Shift supervisor access
  shiftSupervisor: [
    menuPermissionGate.viewMenu,
    orderPermissionGate.priorityHandling,
    staffPermissionGate.trackAttendance,
    financePermissionGate.dailyClose
  ],
  
  // Server core functions
  serverCore: [
    menuPermissionGate.viewMenu,
    orderPermissionGate.createOrder,
    posPermissionGate.basicAccess
  ],
  
  // Bartender core functions
  bartenderCore: [
    barPermissionGate.serveBar,
    orderPermissionGate.barDisplay,
    posPermissionGate.barAccess
  ],
  
  // Kitchen staff functions
  kitchenStaff: [
    menuPermissionGate.viewMenu,
    orderPermissionGate.kitchenDisplay
  ]
};

// ===== UTILITY FUNCTIONS =====

/**
 * Apply multiple middleware functions in sequence
 */
export const applyPermissionSet = (middlewareArray: Array<(req: AuthRequest, res: Response, next: NextFunction) => void>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const executeMiddleware = (index: number) => {
      if (index >= middlewareArray.length) {
        return next();
      }
      
      middlewareArray[index](req, res, (err?: any) => {
        if (err) {
          return next(err);
        }
        executeMiddleware(index + 1);
      });
    };
    
    executeMiddleware(0);
  };
};

/**
 * Create a permission summary for debugging
 */
export const debugPermissions = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development' && req.query.debug === 'permissions') {
    const permissionSummary = {
      user: {
        id: req.user?._id,
        email: req.user?.email,
        role: req.user?.role
      },
      currentShift: req.currentShift,
      permissions: req.userPermissions,
      menuAccess: req.menuAccess,
      activeBackupRole: req.activeBackupRole
    };
    
    console.log('🔍 PERMISSION DEBUG:', JSON.stringify(permissionSummary, null, 2));
  }
  
  next();
};

// ===== TYPE EXTENSIONS =====

// Extend the AuthRequest interface to include RBAC-specific properties
declare global {
  namespace Express {
    interface Request {
      userPermissions?: Permission[];
      currentShift?: ShiftType;
      hasPermission?: (permission: Permission, shift?: ShiftType) => boolean;
      menuAccess?: {
        full: boolean;
        bar: boolean;
        food: boolean;
      };
      activeBackupRole?: Permission;
    }
  }
}

// All middleware are already exported via their declarations above.
