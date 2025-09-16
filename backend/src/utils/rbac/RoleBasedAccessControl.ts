import { IUser } from '../../models/User';
import { AuthRequest } from '../../types/auth.types';

/**
 * Comprehensive Role-Based Access Control System for Restaurant & Bar Operations
 * 
 * This system defines detailed permission matrices for all hospitality roles,
 * including cross-departmental permissions, shift-based variations, and
 * emergency backup role permissions for operational continuity.
 */

// ===== CORE PERMISSION FLAGS =====
export enum Permission {
  // === MENU & POS PERMISSIONS ===
  MENU_VIEW = 'menu.view',
  MENU_CREATE = 'menu.create',
  MENU_EDIT = 'menu.edit',
  MENU_DELETE = 'menu.delete',
  MENU_PRICING = 'menu.pricing',
  MENU_CATEGORIES = 'menu.categories',
  MENU_SPECIALS = 'menu.specials',
  MENU_ALLERGENS = 'menu.allergens',

  // POS Access Levels
  POS_BASIC = 'pos.basic',
  POS_FULL_MENU = 'pos.full_menu',
  POS_BAR_ONLY = 'pos.bar_only',
  POS_FOOD_ONLY = 'pos.food_only',
  POS_DISCOUNTS = 'pos.discounts',
  POS_REFUNDS = 'pos.refunds',
  POS_CASH_MANAGEMENT = 'pos.cash_management',
  POS_REPORTS = 'pos.reports',

  // === ORDER MANAGEMENT ===
  ORDER_VIEW = 'order.view',
  ORDER_CREATE = 'order.create',
  ORDER_EDIT = 'order.edit',
  ORDER_CANCEL = 'order.cancel',
  ORDER_REFUND = 'order.refund',
  ORDER_KITCHEN_DISPLAY = 'order.kitchen_display',
  ORDER_BAR_DISPLAY = 'order.bar_display',
  ORDER_PRIORITY = 'order.priority',
  ORDER_MODIFICATIONS = 'order.modifications',

  // === BAR OPERATIONS ===
  BAR_SERVE = 'bar.serve',
  BAR_INVENTORY = 'bar.inventory',
  BAR_RECIPES = 'bar.recipes',
  BAR_WINE_LIST = 'bar.wine_list',
  BAR_COCKTAILS = 'bar.cocktails',
  BAR_BEER_DRAFT = 'bar.beer_draft',
  BAR_CASH_REGISTER = 'bar.cash_register',
  BAR_STOCK_COUNT = 'bar.stock_count',
  BAR_WASTE_TRACKING = 'bar.waste_tracking',
  BAR_TEMPERATURE_LOGS = 'bar.temperature_logs',

  // === RESTAURANT OPERATIONS ===
  TABLE_MANAGEMENT = 'table.management',
  TABLE_ASSIGN = 'table.assign',
  TABLE_TRANSFER = 'table.transfer',
  TABLE_SECTION_MANAGE = 'table.section_manage',
  RESERVATION_VIEW = 'reservation.view',
  RESERVATION_CREATE = 'reservation.create',
  RESERVATION_MODIFY = 'reservation.modify',
  RESERVATION_CANCEL = 'reservation.cancel',

  // Service Operations
  SERVICE_TAKE_ORDERS = 'service.take_orders',
  SERVICE_SERVE_FOOD = 'service.serve_food',
  SERVICE_SERVE_DRINKS = 'service.serve_drinks',
  SERVICE_PAYMENT_PROCESS = 'service.payment_process',
  SERVICE_CUSTOMER_COMPLAINTS = 'service.customer_complaints',

  // === INVENTORY MANAGEMENT ===
  INVENTORY_VIEW = 'inventory.view',
  INVENTORY_ADJUST = 'inventory.adjust',
  INVENTORY_RECEIVE = 'inventory.receive',
  INVENTORY_TRANSFER = 'inventory.transfer',
  INVENTORY_COUNT = 'inventory.count',
  INVENTORY_WASTE = 'inventory.waste',
  INVENTORY_COSTING = 'inventory.costing',

  // === STAFF MANAGEMENT ===
  STAFF_VIEW = 'staff.view',
  STAFF_SCHEDULE = 'staff.schedule',
  STAFF_ATTENDANCE = 'staff.attendance',
  STAFF_PERFORMANCE = 'staff.performance',
  STAFF_PAYROLL = 'staff.payroll',
  STAFF_HIRE_FIRE = 'staff.hire_fire',

  // === FINANCIAL OPERATIONS ===
  FINANCE_DAILY_CLOSE = 'finance.daily_close',
  FINANCE_REPORTS = 'finance.reports',
  FINANCE_BANKING = 'finance.banking',
  FINANCE_PETTY_CASH = 'finance.petty_cash',
  FINANCE_TILL_MANAGEMENT = 'finance.till_management',

  // === EMERGENCY & BACKUP ===
  EMERGENCY_OVERRIDE = 'emergency.override',
  BACKUP_MANAGER = 'backup.manager',
  BACKUP_BARTENDER = 'backup.bartender',
  BACKUP_SERVER = 'backup.server',
  BACKUP_HOST = 'backup.host',

  // === SYSTEM OPERATIONS ===
  SYSTEM_SETTINGS = 'system.settings',
  SYSTEM_BACKUP = 'system.backup',
  SYSTEM_MAINTENANCE = 'system.maintenance',
  AUDIT_LOGS = 'audit.logs'
}

// ===== SHIFT-BASED PERMISSION MODIFIERS =====
export enum ShiftType {
  DAY = 'day',
  EVENING = 'evening',
  NIGHT = 'night',
  WEEKEND = 'weekend',
  HOLIDAY = 'holiday',
  EMERGENCY = 'emergency'
}

export interface ShiftPermissionModifier {
  shift: ShiftType;
  additionalPermissions: Permission[];
  restrictedPermissions: Permission[];
}

// ===== HOSPITALITY ROLE DEFINITIONS =====
export enum HospitalityRole {
  // Bar Roles
  BAR_MANAGER = 'bar_manager',
  HEAD_BARTENDER = 'head_bartender',
  BARTENDER = 'bartender',
  BAR_BACK = 'bar_back',
  
  // Restaurant Roles
  RESTAURANT_MANAGER = 'restaurant_manager',
  SHIFT_MANAGER = 'shift_manager',
  HEAD_SERVER = 'head_server',
  SERVER = 'server',
  HOST = 'host',
  SOMMELIER = 'sommelier',
  FOOD_RUNNER = 'food_runner',
  BUSSER = 'busser',
  
  // Kitchen Roles (for cross-department permissions)
  EXECUTIVE_CHEF = 'executive_chef',
  SOUS_CHEF = 'sous_chef',
  LINE_COOK = 'line_cook',
  PREP_COOK = 'prep_cook',
  
  // Support Roles
  CASHIER = 'cashier',
  CLEANER = 'cleaner',
  DELIVERY = 'delivery'
}

// ===== ROLE PERMISSION MATRICES =====
export class RolePermissionMatrix {
  private static rolePermissions: Record<HospitalityRole, Permission[]> = {
    // === BAR ROLES ===
    [HospitalityRole.BAR_MANAGER]: [
      // Full bar operations
      Permission.BAR_SERVE, Permission.BAR_INVENTORY, Permission.BAR_RECIPES,
      Permission.BAR_WINE_LIST, Permission.BAR_COCKTAILS, Permission.BAR_BEER_DRAFT,
      Permission.BAR_CASH_REGISTER, Permission.BAR_STOCK_COUNT, Permission.BAR_WASTE_TRACKING,
      Permission.BAR_TEMPERATURE_LOGS,
      
      // Menu management for bar items
      Permission.MENU_VIEW, Permission.MENU_EDIT, Permission.MENU_PRICING,
      Permission.MENU_SPECIALS,
      
      // POS access
      Permission.POS_FULL_MENU, Permission.POS_BAR_ONLY, Permission.POS_DISCOUNTS,
      Permission.POS_REFUNDS, Permission.POS_CASH_MANAGEMENT, Permission.POS_REPORTS,
      
      // Order management
      Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_EDIT,
      Permission.ORDER_CANCEL, Permission.ORDER_BAR_DISPLAY, Permission.ORDER_PRIORITY,
      
      // Inventory
      Permission.INVENTORY_VIEW, Permission.INVENTORY_ADJUST, Permission.INVENTORY_RECEIVE,
      Permission.INVENTORY_TRANSFER, Permission.INVENTORY_COUNT, Permission.INVENTORY_WASTE,
      Permission.INVENTORY_COSTING,
      
      // Staff management for bar staff
      Permission.STAFF_VIEW, Permission.STAFF_SCHEDULE, Permission.STAFF_ATTENDANCE,
      Permission.STAFF_PERFORMANCE,
      
      // Financial
      Permission.FINANCE_DAILY_CLOSE, Permission.FINANCE_REPORTS, Permission.FINANCE_TILL_MANAGEMENT,
      
      // Emergency backup roles
      Permission.BACKUP_BARTENDER, Permission.BACKUP_SERVER,
      
      // Cross-department (limited restaurant access)
      Permission.TABLE_MANAGEMENT, Permission.SERVICE_SERVE_DRINKS
    ],

    [HospitalityRole.HEAD_BARTENDER]: [
      // Bar operations
      Permission.BAR_SERVE, Permission.BAR_INVENTORY, Permission.BAR_RECIPES,
      Permission.BAR_WINE_LIST, Permission.BAR_COCKTAILS, Permission.BAR_BEER_DRAFT,
      Permission.BAR_CASH_REGISTER, Permission.BAR_STOCK_COUNT, Permission.BAR_WASTE_TRACKING,
      
      // Limited menu access
      Permission.MENU_VIEW, Permission.MENU_SPECIALS,
      
      // POS access
      Permission.POS_FULL_MENU, Permission.POS_BAR_ONLY, Permission.POS_DISCOUNTS,
      
      // Orders
      Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_BAR_DISPLAY,
      Permission.ORDER_PRIORITY, Permission.ORDER_MODIFICATIONS,
      
      // Limited inventory
      Permission.INVENTORY_VIEW, Permission.INVENTORY_COUNT, Permission.INVENTORY_WASTE,
      
      // Staff support
      Permission.STAFF_VIEW, Permission.STAFF_ATTENDANCE,
      
      // Emergency backup
      Permission.BACKUP_BARTENDER,
      
      // Cross-department
      Permission.SERVICE_SERVE_DRINKS
    ],

    [HospitalityRole.BARTENDER]: [
      // Core bar operations
      Permission.BAR_SERVE, Permission.BAR_RECIPES, Permission.BAR_WINE_LIST,
      Permission.BAR_COCKTAILS, Permission.BAR_BEER_DRAFT, Permission.BAR_CASH_REGISTER,
      Permission.BAR_WASTE_TRACKING,
      
      // Menu viewing
      Permission.MENU_VIEW,
      
      // POS access
      Permission.POS_BAR_ONLY, Permission.POS_BASIC,
      
      // Orders
      Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_BAR_DISPLAY,
      Permission.ORDER_MODIFICATIONS,
      
      // Limited inventory
      Permission.INVENTORY_VIEW, Permission.INVENTORY_WASTE,
      
      // Service
      Permission.SERVICE_SERVE_DRINKS, Permission.SERVICE_PAYMENT_PROCESS
    ],

    [HospitalityRole.BAR_BACK]: [
      // Support operations
      Permission.BAR_INVENTORY, Permission.BAR_STOCK_COUNT, Permission.BAR_WASTE_TRACKING,
      Permission.BAR_TEMPERATURE_LOGS,
      
      // Menu viewing
      Permission.MENU_VIEW,
      
      // Limited inventory
      Permission.INVENTORY_VIEW, Permission.INVENTORY_COUNT, Permission.INVENTORY_WASTE,
      
      // Support service
      Permission.SERVICE_SERVE_DRINKS
    ],

    // === RESTAURANT ROLES ===
    [HospitalityRole.RESTAURANT_MANAGER]: [
      // Full restaurant operations
      Permission.TABLE_MANAGEMENT, Permission.TABLE_ASSIGN, Permission.TABLE_TRANSFER,
      Permission.TABLE_SECTION_MANAGE, Permission.RESERVATION_VIEW, Permission.RESERVATION_CREATE,
      Permission.RESERVATION_MODIFY, Permission.RESERVATION_CANCEL,
      
      // Service management
      Permission.SERVICE_TAKE_ORDERS, Permission.SERVICE_SERVE_FOOD, Permission.SERVICE_SERVE_DRINKS,
      Permission.SERVICE_PAYMENT_PROCESS, Permission.SERVICE_CUSTOMER_COMPLAINTS,
      
      // Menu management
      Permission.MENU_VIEW, Permission.MENU_CREATE, Permission.MENU_EDIT, Permission.MENU_DELETE,
      Permission.MENU_PRICING, Permission.MENU_CATEGORIES, Permission.MENU_SPECIALS,
      Permission.MENU_ALLERGENS,
      
      // Full POS access
      Permission.POS_FULL_MENU, Permission.POS_DISCOUNTS, Permission.POS_REFUNDS,
      Permission.POS_CASH_MANAGEMENT, Permission.POS_REPORTS,
      
      // Order management
      Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_EDIT,
      Permission.ORDER_CANCEL, Permission.ORDER_REFUND, Permission.ORDER_KITCHEN_DISPLAY,
      Permission.ORDER_BAR_DISPLAY, Permission.ORDER_PRIORITY, Permission.ORDER_MODIFICATIONS,
      
      // Inventory
      Permission.INVENTORY_VIEW, Permission.INVENTORY_ADJUST, Permission.INVENTORY_RECEIVE,
      Permission.INVENTORY_TRANSFER, Permission.INVENTORY_COUNT, Permission.INVENTORY_WASTE,
      Permission.INVENTORY_COSTING,
      
      // Staff management
      Permission.STAFF_VIEW, Permission.STAFF_SCHEDULE, Permission.STAFF_ATTENDANCE,
      Permission.STAFF_PERFORMANCE, Permission.STAFF_PAYROLL, Permission.STAFF_HIRE_FIRE,
      
      // Financial
      Permission.FINANCE_DAILY_CLOSE, Permission.FINANCE_REPORTS, Permission.FINANCE_BANKING,
      Permission.FINANCE_PETTY_CASH, Permission.FINANCE_TILL_MANAGEMENT,
      
      // Emergency backup roles
      Permission.EMERGENCY_OVERRIDE, Permission.BACKUP_MANAGER, Permission.BACKUP_BARTENDER,
      Permission.BACKUP_SERVER, Permission.BACKUP_HOST,
      
      // Cross-department (bar access)
      Permission.BAR_SERVE, Permission.BAR_CASH_REGISTER
    ],

    [HospitalityRole.SHIFT_MANAGER]: [
      // Table and reservation management
      Permission.TABLE_MANAGEMENT, Permission.TABLE_ASSIGN, Permission.TABLE_TRANSFER,
      Permission.RESERVATION_VIEW, Permission.RESERVATION_CREATE, Permission.RESERVATION_MODIFY,
      
      // Service operations
      Permission.SERVICE_TAKE_ORDERS, Permission.SERVICE_SERVE_FOOD, Permission.SERVICE_SERVE_DRINKS,
      Permission.SERVICE_PAYMENT_PROCESS, Permission.SERVICE_CUSTOMER_COMPLAINTS,
      
      // Menu access
      Permission.MENU_VIEW, Permission.MENU_SPECIALS,
      
      // POS access
      Permission.POS_FULL_MENU, Permission.POS_DISCOUNTS, Permission.POS_REFUNDS,
      Permission.POS_CASH_MANAGEMENT,
      
      // Order management
      Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_EDIT,
      Permission.ORDER_CANCEL, Permission.ORDER_KITCHEN_DISPLAY, Permission.ORDER_PRIORITY,
      Permission.ORDER_MODIFICATIONS,
      
      // Limited inventory
      Permission.INVENTORY_VIEW, Permission.INVENTORY_WASTE,
      
      // Staff management (shift level)
      Permission.STAFF_VIEW, Permission.STAFF_ATTENDANCE,
      
      // Financial (shift level)
      Permission.FINANCE_DAILY_CLOSE, Permission.FINANCE_TILL_MANAGEMENT,
      
      // Emergency backup roles
      Permission.BACKUP_SERVER, Permission.BACKUP_HOST,
      
      // Cross-department (limited bar)
      Permission.BAR_SERVE, Permission.BAR_CASH_REGISTER
    ],

    [HospitalityRole.HEAD_SERVER]: [
      // Service leadership
      Permission.SERVICE_TAKE_ORDERS, Permission.SERVICE_SERVE_FOOD, Permission.SERVICE_SERVE_DRINKS,
      Permission.SERVICE_PAYMENT_PROCESS, Permission.SERVICE_CUSTOMER_COMPLAINTS,
      
      // Table management
      Permission.TABLE_MANAGEMENT, Permission.TABLE_ASSIGN, Permission.TABLE_SECTION_MANAGE,
      
      // Reservations
      Permission.RESERVATION_VIEW, Permission.RESERVATION_CREATE, Permission.RESERVATION_MODIFY,
      
      // Menu access
      Permission.MENU_VIEW, Permission.MENU_SPECIALS, Permission.MENU_ALLERGENS,
      
      // POS access
      Permission.POS_FULL_MENU, Permission.POS_DISCOUNTS,
      
      // Orders
      Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_EDIT,
      Permission.ORDER_KITCHEN_DISPLAY, Permission.ORDER_MODIFICATIONS,
      
      // Staff support
      Permission.STAFF_VIEW, Permission.STAFF_ATTENDANCE,
      
      // Emergency backup
      Permission.BACKUP_SERVER,
      
      // Cross-department
      Permission.SERVICE_SERVE_DRINKS
    ],

    [HospitalityRole.SERVER]: [
      // Core service operations
      Permission.SERVICE_TAKE_ORDERS, Permission.SERVICE_SERVE_FOOD, Permission.SERVICE_SERVE_DRINKS,
      Permission.SERVICE_PAYMENT_PROCESS,
      
      // Table operations
      Permission.TABLE_ASSIGN,
      
      // Menu access
      Permission.MENU_VIEW, Permission.MENU_ALLERGENS,
      
      // POS access
      Permission.POS_FULL_MENU, Permission.POS_BASIC,
      
      // Orders
      Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_MODIFICATIONS,
      
      // Cross-department
      Permission.SERVICE_SERVE_DRINKS
    ],

    [HospitalityRole.HOST]: [
      // Reservation and seating
      Permission.RESERVATION_VIEW, Permission.RESERVATION_CREATE, Permission.RESERVATION_MODIFY,
      Permission.TABLE_MANAGEMENT, Permission.TABLE_ASSIGN,
      
      // Menu viewing
      Permission.MENU_VIEW,
      
      // Limited POS
      Permission.POS_BASIC,
      
      // Limited service
      Permission.SERVICE_CUSTOMER_COMPLAINTS
    ],

    [HospitalityRole.SOMMELIER]: [
      // Wine expertise
      Permission.BAR_WINE_LIST, Permission.BAR_SERVE,
      
      // Menu management for wine
      Permission.MENU_VIEW, Permission.MENU_EDIT, Permission.MENU_PRICING,
      
      // Service
      Permission.SERVICE_SERVE_DRINKS, Permission.SERVICE_CUSTOMER_COMPLAINTS,
      
      // POS access
      Permission.POS_FULL_MENU, Permission.POS_BAR_ONLY,
      
      // Orders
      Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_MODIFICATIONS,
      
      // Inventory (wine focus)
      Permission.INVENTORY_VIEW, Permission.INVENTORY_COUNT, Permission.INVENTORY_COSTING,
      
      // Cross-department
      Permission.BAR_COCKTAILS
    ],

    [HospitalityRole.FOOD_RUNNER]: [
      // Food service
      Permission.SERVICE_SERVE_FOOD,
      
      // Menu viewing
      Permission.MENU_VIEW,
      
      // Orders
      Permission.ORDER_VIEW, Permission.ORDER_KITCHEN_DISPLAY,
      
      // Table operations
      Permission.TABLE_ASSIGN
    ],

    [HospitalityRole.BUSSER]: [
      // Table maintenance
      Permission.TABLE_MANAGEMENT,
      
      // Limited service
      Permission.SERVICE_SERVE_FOOD,
      
      // Menu viewing
      Permission.MENU_VIEW
    ],

    // === KITCHEN ROLES (for cross-department permissions) ===
    [HospitalityRole.EXECUTIVE_CHEF]: [
      // Full menu control
      Permission.MENU_VIEW, Permission.MENU_CREATE, Permission.MENU_EDIT, Permission.MENU_DELETE,
      Permission.MENU_PRICING, Permission.MENU_CATEGORIES, Permission.MENU_SPECIALS,
      Permission.MENU_ALLERGENS,
      
      // Kitchen operations
      Permission.ORDER_VIEW, Permission.ORDER_KITCHEN_DISPLAY, Permission.ORDER_PRIORITY,
      
      // Full inventory access
      Permission.INVENTORY_VIEW, Permission.INVENTORY_ADJUST, Permission.INVENTORY_RECEIVE,
      Permission.INVENTORY_TRANSFER, Permission.INVENTORY_COUNT, Permission.INVENTORY_WASTE,
      Permission.INVENTORY_COSTING,
      
      // Staff management (kitchen)
      Permission.STAFF_VIEW, Permission.STAFF_SCHEDULE, Permission.STAFF_ATTENDANCE,
      Permission.STAFF_PERFORMANCE,
      
      // Cross-department
      Permission.SERVICE_CUSTOMER_COMPLAINTS
    ],

    [HospitalityRole.SOUS_CHEF]: [
      // Menu access
      Permission.MENU_VIEW, Permission.MENU_EDIT, Permission.MENU_SPECIALS,
      
      // Kitchen operations
      Permission.ORDER_VIEW, Permission.ORDER_KITCHEN_DISPLAY, Permission.ORDER_PRIORITY,
      
      // Inventory
      Permission.INVENTORY_VIEW, Permission.INVENTORY_ADJUST, Permission.INVENTORY_COUNT,
      Permission.INVENTORY_WASTE,
      
      // Staff support
      Permission.STAFF_VIEW, Permission.STAFF_ATTENDANCE
    ],

    [HospitalityRole.LINE_COOK]: [
      // Menu viewing
      Permission.MENU_VIEW,
      
      // Kitchen operations
      Permission.ORDER_VIEW, Permission.ORDER_KITCHEN_DISPLAY,
      
      // Limited inventory
      Permission.INVENTORY_VIEW, Permission.INVENTORY_WASTE
    ],

    [HospitalityRole.PREP_COOK]: [
      // Menu viewing
      Permission.MENU_VIEW,
      
      // Limited kitchen operations
      Permission.ORDER_KITCHEN_DISPLAY,
      
      // Inventory
      Permission.INVENTORY_VIEW, Permission.INVENTORY_WASTE
    ],

    // === SUPPORT ROLES ===
    [HospitalityRole.CASHIER]: [
      // POS operations
      Permission.POS_FULL_MENU, Permission.POS_CASH_MANAGEMENT,
      
      // Payment processing
      Permission.SERVICE_PAYMENT_PROCESS,
      
      // Menu viewing
      Permission.MENU_VIEW,
      
      // Orders
      Permission.ORDER_VIEW, Permission.ORDER_CREATE,
      
      // Financial
      Permission.FINANCE_TILL_MANAGEMENT
    ],

    [HospitalityRole.CLEANER]: [
      // Basic menu viewing
      Permission.MENU_VIEW,
      
      // Table maintenance
      Permission.TABLE_MANAGEMENT
    ],

    [HospitalityRole.DELIVERY]: [
      // Menu viewing
      Permission.MENU_VIEW,
      
      // Orders
      Permission.ORDER_VIEW,
      
      // Basic POS
      Permission.POS_BASIC,
      
      // Payment
      Permission.SERVICE_PAYMENT_PROCESS
    ]
  };

  // ===== SHIFT-BASED PERMISSION MODIFIERS =====
  private static shiftModifiers: Record<HospitalityRole, ShiftPermissionModifier[]> = {
    [HospitalityRole.BARTENDER]: [
      {
        shift: ShiftType.NIGHT,
        additionalPermissions: [Permission.BACKUP_SERVER, Permission.POS_DISCOUNTS],
        restrictedPermissions: []
      },
      {
        shift: ShiftType.WEEKEND,
        additionalPermissions: [Permission.ORDER_PRIORITY, Permission.BAR_STOCK_COUNT],
        restrictedPermissions: []
      }
    ],
    
    [HospitalityRole.SERVER]: [
      {
        shift: ShiftType.NIGHT,
        additionalPermissions: [Permission.BACKUP_BARTENDER, Permission.BAR_SERVE],
        restrictedPermissions: []
      },
      {
        shift: ShiftType.WEEKEND,
        additionalPermissions: [Permission.ORDER_PRIORITY, Permission.POS_DISCOUNTS],
        restrictedPermissions: []
      }
    ],

    [HospitalityRole.SHIFT_MANAGER]: [
      {
        shift: ShiftType.NIGHT,
        additionalPermissions: [Permission.EMERGENCY_OVERRIDE, Permission.SYSTEM_MAINTENANCE],
        restrictedPermissions: []
      },
      {
        shift: ShiftType.EMERGENCY,
        additionalPermissions: [
          Permission.EMERGENCY_OVERRIDE, Permission.BACKUP_MANAGER,
          Permission.BACKUP_BARTENDER, Permission.BACKUP_SERVER, Permission.BACKUP_HOST
        ],
        restrictedPermissions: []
      }
    ],

    // Default empty arrays for roles without shift modifiers
    [HospitalityRole.BAR_MANAGER]: [],
    [HospitalityRole.HEAD_BARTENDER]: [],
    [HospitalityRole.BAR_BACK]: [],
    [HospitalityRole.RESTAURANT_MANAGER]: [],
    [HospitalityRole.HEAD_SERVER]: [],
    [HospitalityRole.HOST]: [],
    [HospitalityRole.SOMMELIER]: [],
    [HospitalityRole.FOOD_RUNNER]: [],
    [HospitalityRole.BUSSER]: [],
    [HospitalityRole.EXECUTIVE_CHEF]: [],
    [HospitalityRole.SOUS_CHEF]: [],
    [HospitalityRole.LINE_COOK]: [],
    [HospitalityRole.PREP_COOK]: [],
    [HospitalityRole.CASHIER]: [],
    [HospitalityRole.CLEANER]: [],
    [HospitalityRole.DELIVERY]: []
  };

  // ===== MANAGEMENT HIERARCHY FOR PERMISSION INHERITANCE =====
  private static hierarchyMap: Record<HospitalityRole, HospitalityRole[]> = {
    [HospitalityRole.RESTAURANT_MANAGER]: [
      HospitalityRole.SHIFT_MANAGER, HospitalityRole.HEAD_SERVER, HospitalityRole.SERVER,
      HospitalityRole.HOST, HospitalityRole.FOOD_RUNNER, HospitalityRole.BUSSER
    ],
    [HospitalityRole.BAR_MANAGER]: [
      HospitalityRole.HEAD_BARTENDER, HospitalityRole.BARTENDER, HospitalityRole.BAR_BACK
    ],
    [HospitalityRole.SHIFT_MANAGER]: [
      HospitalityRole.SERVER, HospitalityRole.HOST, HospitalityRole.FOOD_RUNNER, HospitalityRole.BUSSER
    ],
    [HospitalityRole.HEAD_BARTENDER]: [
      HospitalityRole.BARTENDER, HospitalityRole.BAR_BACK
    ],
    [HospitalityRole.HEAD_SERVER]: [
      HospitalityRole.SERVER, HospitalityRole.FOOD_RUNNER, HospitalityRole.BUSSER
    ],
    [HospitalityRole.EXECUTIVE_CHEF]: [
      HospitalityRole.SOUS_CHEF, HospitalityRole.LINE_COOK, HospitalityRole.PREP_COOK
    ],
    [HospitalityRole.SOUS_CHEF]: [
      HospitalityRole.LINE_COOK, HospitalityRole.PREP_COOK
    ],
    
    // Leaf roles with no subordinates
    [HospitalityRole.BARTENDER]: [],
    [HospitalityRole.BAR_BACK]: [],
    [HospitalityRole.SERVER]: [],
    [HospitalityRole.HOST]: [],
    [HospitalityRole.SOMMELIER]: [],
    [HospitalityRole.FOOD_RUNNER]: [],
    [HospitalityRole.BUSSER]: [],
    [HospitalityRole.LINE_COOK]: [],
    [HospitalityRole.PREP_COOK]: [],
    [HospitalityRole.CASHIER]: [],
    [HospitalityRole.CLEANER]: [],
    [HospitalityRole.DELIVERY]: []
  };

  // ===== MAIN ACCESS CONTROL METHODS =====
  
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(user: IUser, permission: Permission, shift?: ShiftType): boolean {
    const basePermissions = this.getUserPermissions(user);
    
    // Check base permissions
    if (basePermissions.includes(permission)) {
      return true;
    }
    
    // Check shift-based permissions if shift is provided
    if (shift && user.role) {
      const hospitalityRole = this.mapUserRoleToHospitalityRole(user);
      if (hospitalityRole) {
        const shiftModifiers = this.shiftModifiers[hospitalityRole] || [];
        const activeModifier = shiftModifiers.find(mod => mod.shift === shift);
        
        if (activeModifier) {
          // Check if permission is restricted for this shift
          if (activeModifier.restrictedPermissions.includes(permission)) {
            return false;
          }
          
          // Check if permission is granted for this shift
          if (activeModifier.additionalPermissions.includes(permission)) {
            return true;
          }
        }
      }
    }
    
    // Check inherited permissions from hierarchy
    return this.hasInheritedPermission(user, permission);
  }

  /**
   * Get all permissions for a user including inherited ones
   */
  static getUserPermissions(user: IUser, shift?: ShiftType): Permission[] {
    const hospitalityRole = this.mapUserRoleToHospitalityRole(user);
    if (!hospitalityRole) {
      return [];
    }
    
    let permissions = [...(this.rolePermissions[hospitalityRole] || [])];
    
    // Add inherited permissions
    const inheritedPermissions = this.getInheritedPermissions(user);
    permissions = [...permissions, ...inheritedPermissions];
    
    // Apply shift modifications if provided
    if (shift) {
      const shiftModifiers = this.shiftModifiers[hospitalityRole] || [];
      const activeModifier = shiftModifiers.find(mod => mod.shift === shift);
      
      if (activeModifier) {
        // Add additional permissions for shift
        permissions = [...permissions, ...activeModifier.additionalPermissions];
        
        // Remove restricted permissions for shift
        permissions = permissions.filter(p => !activeModifier.restrictedPermissions.includes(p));
      }
    }
    
    // Remove duplicates
    return [...new Set(permissions)];
  }

  /**
   * Check if user can access specific POS menu sections
   */
  static canAccessPOSMenu(user: IUser, menuType: 'full' | 'bar' | 'food'): boolean {
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
   * Get emergency backup permissions for operational continuity
   */
  static getEmergencyPermissions(user: IUser): Permission[] {
    const basePermissions = this.getUserPermissions(user, ShiftType.EMERGENCY);
    const emergencyPermissions: Permission[] = [];
    
    // Add emergency override if user is management
    const hospitalityRole = this.mapUserRoleToHospitalityRole(user);
    if (hospitalityRole && [
      HospitalityRole.RESTAURANT_MANAGER,
      HospitalityRole.BAR_MANAGER,
      HospitalityRole.SHIFT_MANAGER
    ].includes(hospitalityRole)) {
      emergencyPermissions.push(Permission.EMERGENCY_OVERRIDE);
    }
    
    // Add backup role permissions based on user's experience
    if (basePermissions.includes(Permission.BAR_SERVE)) {
      emergencyPermissions.push(Permission.BACKUP_BARTENDER);
    }
    
    if (basePermissions.includes(Permission.SERVICE_TAKE_ORDERS)) {
      emergencyPermissions.push(Permission.BACKUP_SERVER);
    }
    
    if (basePermissions.includes(Permission.RESERVATION_CREATE)) {
      emergencyPermissions.push(Permission.BACKUP_HOST);
    }
    
    return [...basePermissions, ...emergencyPermissions];
  }

  // ===== HELPER METHODS =====
  
  private static mapUserRoleToHospitalityRole(user: IUser): HospitalityRole | null {
    // Map the user's role string to HospitalityRole enum
    // This would need to be customized based on your actual role mapping logic
    const roleMapping: Record<string, HospitalityRole> = {
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
      
      // Map existing generic roles to specific hospitality roles
      'manager': HospitalityRole.RESTAURANT_MANAGER,
      'staff': HospitalityRole.SERVER, // Default staff role
      'admin': HospitalityRole.RESTAURANT_MANAGER
    };
    
    return roleMapping[user.role] || null;
  }
  
  private static hasInheritedPermission(user: IUser, permission: Permission): boolean {
    const hospitalityRole = this.mapUserRoleToHospitalityRole(user);
    if (!hospitalityRole) {
      return false;
    }
    
    const subordinates = this.hierarchyMap[hospitalityRole] || [];
    
    // Check if any subordinate role has this permission
    return subordinates.some(subordinateRole => {
      const subordinatePermissions = this.rolePermissions[subordinateRole] || [];
      return subordinatePermissions.includes(permission);
    });
  }
  
  private static getInheritedPermissions(user: IUser): Permission[] {
    const hospitalityRole = this.mapUserRoleToHospitalityRole(user);
    if (!hospitalityRole) {
      return [];
    }
    
    const subordinates = this.hierarchyMap[hospitalityRole] || [];
    const inheritedPermissions: Permission[] = [];
    
    // Collect all permissions from subordinate roles
    subordinates.forEach(subordinateRole => {
      const subordinatePermissions = this.rolePermissions[subordinateRole] || [];
      inheritedPermissions.push(...subordinatePermissions);
    });
    
    // Remove duplicates
    return [...new Set(inheritedPermissions)];
  }
}

// ===== EXPRESS MIDDLEWARE FOR PERMISSION CHECKING =====
import { Response, NextFunction } from 'express';

export const requirePermission = (permission: Permission, shift?: ShiftType) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasPermission = RolePermissionMatrix.hasPermission(req.user as IUser, permission, shift);
    
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
};

export const requirePOSAccess = (menuType: 'full' | 'bar' | 'food') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasAccess = RolePermissionMatrix.canAccessPOSMenu(req.user as IUser, menuType);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: `POS access denied for ${menuType} menu`,
        userRole: req.user.role
      });
    }

    next();
  };
};

export const emergencyOverride = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const emergencyPermissions = RolePermissionMatrix.getEmergencyPermissions(req.user as IUser);
    
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
};

// Symbols are already exported via their declarations above.
