/**
 * AccessControl.js - Legacy JavaScript Implementation
 * 
 * This file provides a JavaScript interface for the RBAC system
 * to maintain compatibility with existing JavaScript files in the codebase.
 * 
 * For new implementations, use the TypeScript version: RoleBasedAccessControl.ts
 */

const mongoose = require('mongoose');

// Permission flags (mirrored from TypeScript enum)
const Permission = {
  // Menu & POS Permissions
  MENU_VIEW: 'menu.view',
  MENU_CREATE: 'menu.create',
  MENU_EDIT: 'menu.edit',
  MENU_DELETE: 'menu.delete',
  MENU_PRICING: 'menu.pricing',
  MENU_CATEGORIES: 'menu.categories',
  MENU_SPECIALS: 'menu.specials',
  MENU_ALLERGENS: 'menu.allergens',

  // POS Access Levels
  POS_BASIC: 'pos.basic',
  POS_FULL_MENU: 'pos.full_menu',
  POS_BAR_ONLY: 'pos.bar_only',
  POS_FOOD_ONLY: 'pos.food_only',
  POS_DISCOUNTS: 'pos.discounts',
  POS_REFUNDS: 'pos.refunds',
  POS_CASH_MANAGEMENT: 'pos.cash_management',
  POS_REPORTS: 'pos.reports',

  // Order Management
  ORDER_VIEW: 'order.view',
  ORDER_CREATE: 'order.create',
  ORDER_EDIT: 'order.edit',
  ORDER_CANCEL: 'order.cancel',
  ORDER_REFUND: 'order.refund',
  ORDER_KITCHEN_DISPLAY: 'order.kitchen_display',
  ORDER_BAR_DISPLAY: 'order.bar_display',
  ORDER_PRIORITY: 'order.priority',
  ORDER_MODIFICATIONS: 'order.modifications',

  // Bar Operations
  BAR_SERVE: 'bar.serve',
  BAR_INVENTORY: 'bar.inventory',
  BAR_RECIPES: 'bar.recipes',
  BAR_WINE_LIST: 'bar.wine_list',
  BAR_COCKTAILS: 'bar.cocktails',
  BAR_BEER_DRAFT: 'bar.beer_draft',
  BAR_CASH_REGISTER: 'bar.cash_register',
  BAR_STOCK_COUNT: 'bar.stock_count',
  BAR_WASTE_TRACKING: 'bar.waste_tracking',
  BAR_TEMPERATURE_LOGS: 'bar.temperature_logs',

  // Restaurant Operations
  TABLE_MANAGEMENT: 'table.management',
  TABLE_ASSIGN: 'table.assign',
  TABLE_TRANSFER: 'table.transfer',
  TABLE_SECTION_MANAGE: 'table.section_manage',
  RESERVATION_VIEW: 'reservation.view',
  RESERVATION_CREATE: 'reservation.create',
  RESERVATION_MODIFY: 'reservation.modify',
  RESERVATION_CANCEL: 'reservation.cancel',

  // Service Operations
  SERVICE_TAKE_ORDERS: 'service.take_orders',
  SERVICE_SERVE_FOOD: 'service.serve_food',
  SERVICE_SERVE_DRINKS: 'service.serve_drinks',
  SERVICE_PAYMENT_PROCESS: 'service.payment_process',
  SERVICE_CUSTOMER_COMPLAINTS: 'service.customer_complaints',

  // Inventory Management
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_RECEIVE: 'inventory.receive',
  INVENTORY_TRANSFER: 'inventory.transfer',
  INVENTORY_COUNT: 'inventory.count',
  INVENTORY_WASTE: 'inventory.waste',
  INVENTORY_COSTING: 'inventory.costing',

  // Staff Management
  STAFF_VIEW: 'staff.view',
  STAFF_SCHEDULE: 'staff.schedule',
  STAFF_ATTENDANCE: 'staff.attendance',
  STAFF_PERFORMANCE: 'staff.performance',
  STAFF_PAYROLL: 'staff.payroll',
  STAFF_HIRE_FIRE: 'staff.hire_fire',

  // Financial Operations
  FINANCE_DAILY_CLOSE: 'finance.daily_close',
  FINANCE_REPORTS: 'finance.reports',
  FINANCE_BANKING: 'finance.banking',
  FINANCE_PETTY_CASH: 'finance.petty_cash',
  FINANCE_TILL_MANAGEMENT: 'finance.till_management',

  // Emergency & Backup
  EMERGENCY_OVERRIDE: 'emergency.override',
  BACKUP_MANAGER: 'backup.manager',
  BACKUP_BARTENDER: 'backup.bartender',
  BACKUP_SERVER: 'backup.server',
  BACKUP_HOST: 'backup.host',

  // System Operations
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  AUDIT_LOGS: 'audit.logs'
};

// Shift types
const ShiftType = {
  DAY: 'day',
  EVENING: 'evening',
  NIGHT: 'night',
  WEEKEND: 'weekend',
  HOLIDAY: 'holiday',
  EMERGENCY: 'emergency'
};

// Hospitality roles
const HospitalityRole = {
  // Bar Roles
  BAR_MANAGER: 'bar_manager',
  HEAD_BARTENDER: 'head_bartender',
  BARTENDER: 'bartender',
  BAR_BACK: 'bar_back',
  
  // Restaurant Roles
  RESTAURANT_MANAGER: 'restaurant_manager',
  SHIFT_MANAGER: 'shift_manager',
  HEAD_SERVER: 'head_server',
  SERVER: 'server',
  HOST: 'host',
  SOMMELIER: 'sommelier',
  FOOD_RUNNER: 'food_runner',
  BUSSER: 'busser',
  
  // Kitchen Roles
  EXECUTIVE_CHEF: 'executive_chef',
  SOUS_CHEF: 'sous_chef',
  LINE_COOK: 'line_cook',
  PREP_COOK: 'prep_cook',
  
  // Support Roles
  CASHIER: 'cashier',
  CLEANER: 'cleaner',
  DELIVERY: 'delivery'
};

// Role to permissions mapping (simplified version for JS)
const rolePermissions = {
  [HospitalityRole.BAR_MANAGER]: [
    Permission.BAR_SERVE, Permission.BAR_INVENTORY, Permission.BAR_RECIPES,
    Permission.BAR_WINE_LIST, Permission.BAR_COCKTAILS, Permission.BAR_BEER_DRAFT,
    Permission.BAR_CASH_REGISTER, Permission.BAR_STOCK_COUNT, Permission.BAR_WASTE_TRACKING,
    Permission.MENU_VIEW, Permission.MENU_EDIT, Permission.MENU_PRICING,
    Permission.POS_FULL_MENU, Permission.POS_BAR_ONLY, Permission.POS_DISCOUNTS,
    Permission.POS_REFUNDS, Permission.POS_CASH_MANAGEMENT, Permission.POS_REPORTS,
    Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_EDIT,
    Permission.ORDER_CANCEL, Permission.ORDER_BAR_DISPLAY, Permission.ORDER_PRIORITY,
    Permission.INVENTORY_VIEW, Permission.INVENTORY_ADJUST, Permission.INVENTORY_RECEIVE,
    Permission.STAFF_VIEW, Permission.STAFF_SCHEDULE, Permission.STAFF_ATTENDANCE,
    Permission.FINANCE_DAILY_CLOSE, Permission.FINANCE_REPORTS, Permission.FINANCE_TILL_MANAGEMENT,
    Permission.BACKUP_BARTENDER, Permission.BACKUP_SERVER
  ],

  [HospitalityRole.BARTENDER]: [
    Permission.BAR_SERVE, Permission.BAR_RECIPES, Permission.BAR_WINE_LIST,
    Permission.BAR_COCKTAILS, Permission.BAR_BEER_DRAFT, Permission.BAR_CASH_REGISTER,
    Permission.MENU_VIEW, Permission.POS_BAR_ONLY, Permission.POS_BASIC,
    Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_BAR_DISPLAY,
    Permission.ORDER_MODIFICATIONS, Permission.INVENTORY_VIEW,
    Permission.SERVICE_SERVE_DRINKS, Permission.SERVICE_PAYMENT_PROCESS
  ],

  [HospitalityRole.SERVER]: [
    Permission.SERVICE_TAKE_ORDERS, Permission.SERVICE_SERVE_FOOD, Permission.SERVICE_SERVE_DRINKS,
    Permission.SERVICE_PAYMENT_PROCESS, Permission.TABLE_ASSIGN, Permission.MENU_VIEW,
    Permission.MENU_ALLERGENS, Permission.POS_FULL_MENU, Permission.POS_BASIC,
    Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_MODIFICATIONS
  ],

  [HospitalityRole.RESTAURANT_MANAGER]: [
    Permission.TABLE_MANAGEMENT, Permission.TABLE_ASSIGN, Permission.TABLE_TRANSFER,
    Permission.RESERVATION_VIEW, Permission.RESERVATION_CREATE, Permission.RESERVATION_MODIFY,
    Permission.SERVICE_TAKE_ORDERS, Permission.SERVICE_SERVE_FOOD, Permission.SERVICE_SERVE_DRINKS,
    Permission.SERVICE_PAYMENT_PROCESS, Permission.SERVICE_CUSTOMER_COMPLAINTS,
    Permission.MENU_VIEW, Permission.MENU_CREATE, Permission.MENU_EDIT, Permission.MENU_DELETE,
    Permission.POS_FULL_MENU, Permission.POS_DISCOUNTS, Permission.POS_REFUNDS,
    Permission.POS_CASH_MANAGEMENT, Permission.POS_REPORTS,
    Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_EDIT,
    Permission.ORDER_CANCEL, Permission.ORDER_REFUND, Permission.ORDER_KITCHEN_DISPLAY,
    Permission.INVENTORY_VIEW, Permission.INVENTORY_ADJUST, Permission.INVENTORY_RECEIVE,
    Permission.STAFF_VIEW, Permission.STAFF_SCHEDULE, Permission.STAFF_ATTENDANCE,
    Permission.STAFF_PERFORMANCE, Permission.STAFF_PAYROLL, Permission.STAFF_HIRE_FIRE,
    Permission.FINANCE_DAILY_CLOSE, Permission.FINANCE_REPORTS, Permission.FINANCE_BANKING,
    Permission.EMERGENCY_OVERRIDE, Permission.BACKUP_MANAGER, Permission.BACKUP_BARTENDER,
    Permission.BACKUP_SERVER, Permission.BACKUP_HOST
  ]
};

// Role mapping from generic roles to hospitality roles
const mapUserRoleToHospitalityRole = (userRole) => {
  const roleMapping = {
    'bar_manager': HospitalityRole.BAR_MANAGER,
    'head_bartender': HospitalityRole.HEAD_BARTENDER,
    'bartender': HospitalityRole.BARTENDER,
    'bar_back': HospitalityRole.BAR_BACK,
    'restaurant_manager': HospitalityRole.RESTAURANT_MANAGER,
    'shift_manager': HospitalityRole.SHIFT_MANAGER,
    'head_server': HospitalityRole.HEAD_SERVER,
    'server': HospitalityRole.SERVER,
    'host': HospitalityRole.HOST,
    'sommelier': HospitalityRole.SOMMELIER,
    'food_runner': HospitalityRole.FOOD_RUNNER,
    'busser': HospitalityRole.BUSSER,
    'executive_chef': HospitalityRole.EXECUTIVE_CHEF,
    'sous_chef': HospitalityRole.SOUS_CHEF,
    'line_cook': HospitalityRole.LINE_COOK,
    'prep_cook': HospitalityRole.PREP_COOK,
    'cashier': HospitalityRole.CASHIER,
    'cleaner': HospitalityRole.CLEANER,
    'delivery': HospitalityRole.DELIVERY,
    
    // Generic role mappings
    'manager': HospitalityRole.RESTAURANT_MANAGER,
    'staff': HospitalityRole.SERVER,
    'admin': HospitalityRole.RESTAURANT_MANAGER
  };
  
  return roleMapping[userRole] || null;
};

/**
 * AccessControl class - JavaScript interface for RBAC
 */
class AccessControl {
  /**
   * Check if a user has a specific permission
   * @param {Object} user - User object
   * @param {string} permission - Permission to check
   * @param {string} shift - Optional shift type
   * @returns {boolean}
   */
  static hasPermission(user, permission, shift = null) {
    if (!user || !user.role) {
      return false;
    }

    const hospitalityRole = mapUserRoleToHospitalityRole(user.role);
    if (!hospitalityRole) {
      return false;
    }

    const userPermissions = rolePermissions[hospitalityRole] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Get all permissions for a user
   * @param {Object} user - User object
   * @param {string} shift - Optional shift type
   * @returns {Array} Array of permissions
   */
  static getUserPermissions(user, shift = null) {
    if (!user || !user.role) {
      return [];
    }

    const hospitalityRole = mapUserRoleToHospitalityRole(user.role);
    if (!hospitalityRole) {
      return [];
    }

    return rolePermissions[hospitalityRole] || [];
  }

  /**
   * Check if user can access specific POS menu sections
   * @param {Object} user - User object
   * @param {string} menuType - 'full', 'bar', or 'food'
   * @returns {boolean}
   */
  static canAccessPOSMenu(user, menuType) {
    const permissions = this.getUserPermissions(user);
    
    switch (menuType) {
      case 'full':
        return permissions.includes(Permission.POS_FULL_MENU);
      case 'bar':
        return permissions.includes(Permission.POS_BAR_ONLY) || permissions.includes(Permission.POS_FULL_MENU);
      case 'food':
        return permissions.includes(Permission.POS_FOOD_ONLY) || permissions.includes(Permission.POS_FULL_MENU);
      default:
        return false;
    }
  }

  /**
   * Get emergency backup permissions
   * @param {Object} user - User object
   * @returns {Array} Array of emergency permissions
   */
  static getEmergencyPermissions(user) {
    const basePermissions = this.getUserPermissions(user);
    const emergencyPermissions = [...basePermissions];
    
    const hospitalityRole = mapUserRoleToHospitalityRole(user.role);
    if (hospitalityRole && [
      HospitalityRole.RESTAURANT_MANAGER,
      HospitalityRole.BAR_MANAGER,
      HospitalityRole.SHIFT_MANAGER
    ].includes(hospitalityRole)) {
      emergencyPermissions.push(Permission.EMERGENCY_OVERRIDE);
    }
    
    return emergencyPermissions;
  }

  /**
   * Express middleware factory for permission checking
   * @param {string} permission - Required permission
   * @param {string} shift - Optional shift type
   * @returns {Function} Express middleware function
   */
  static requirePermission(permission, shift = null) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const hasPermission = AccessControl.hasPermission(req.user, permission, shift);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Permission denied. Required: ${permission}`,
          userRole: req.user.role,
          requiredPermission: permission
        });
      }

      next();
    };
  }

  /**
   * Express middleware for POS access checking
   * @param {string} menuType - 'full', 'bar', or 'food'
   * @returns {Function} Express middleware function
   */
  static requirePOSAccess(menuType) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const hasAccess = AccessControl.canAccessPOSMenu(req.user, menuType);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: `POS access denied for ${menuType} menu`,
          userRole: req.user.role
        });
      }

      next();
    };
  }

  /**
   * Emergency override middleware
   * @returns {Function} Express middleware function
   */
  static emergencyOverride() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const emergencyPermissions = AccessControl.getEmergencyPermissions(req.user);
      
      if (!emergencyPermissions.includes(Permission.EMERGENCY_OVERRIDE)) {
        return res.status(403).json({
          success: false,
          error: 'Emergency override access denied',
          userRole: req.user.role
        });
      }

      // Log emergency override usage for audit
      console.log(`🚨 EMERGENCY OVERRIDE USED: ${req.user.email} (${req.user.role}) - ${req.method} ${req.path}`);

      next();
    };
  }
}

// Export for CommonJS (Node.js)
module.exports = {
  AccessControl,
  Permission,
  ShiftType,
  HospitalityRole,
  mapUserRoleToHospitalityRole,
  rolePermissions
};

// Export for ES6 modules
module.exports.default = AccessControl;