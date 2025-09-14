import { Request, Response, NextFunction } from 'express';

import { MenuItem } from '../models/MenuItem';
import Order from '../models/Order';
import Table from '../models/Table';
import { User } from '../models/User';
import { Branch } from '../models/Branch';
import { Ingredient } from '../models/Ingredient';

interface AuthRequest extends Request {
  user?: {
    id?: string;
    _id?: string;
    tenantId: string;
    role: string;
  };
}

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Get all stats in parallel for better performance
    const [
      // Order stats
      activeOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      totalOrdersToday,
      
      // Table stats
      totalTables,
      occupiedTables,
      availableTables,
      reservedTables,
      
      // Menu stats
      totalMenuItems,
      availableMenuItems,
      outOfStockItems,
      
      // Staff stats
      totalStaff,
      activeStaff,
      
      // Revenue stats (today)
      todayRevenue,

      // Branch stats
      totalBranches,
      activeBranches,

      // Inventory low stock and expiring counts
      lowStockCount,
      expiringSoonCount,

      // Delivery status splits
      deliveryPreparing,
      deliveryReady,
      deliveryOutForDelivery,
      deliveryDeliveredToday
    ] = await Promise.all([
      // Order queries
      Order.countDocuments({ 
        tenantId, 
        status: { $in: ['pending', 'preparing', 'ready'] } 
      }),
      Order.countDocuments({ tenantId, status: 'pending' }),
      Order.countDocuments({ tenantId, status: 'preparing' }),
      Order.countDocuments({ tenantId, status: 'ready' }),
      Order.countDocuments({ 
        tenantId, 
        createdAt: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        } 
      }),
      
      // Table queries
      Table.countDocuments({ tenantId }),
      Table.countDocuments({ tenantId, status: 'occupied' }),
      Table.countDocuments({ tenantId, status: 'available' }),
      Table.countDocuments({ tenantId, status: 'reserved' }),
      
      // Menu queries
      MenuItem.countDocuments({ tenantId }),
      MenuItem.countDocuments({ tenantId, isAvailable: true }),
      MenuItem.countDocuments({ tenantId, isAvailable: false }),
      
      // Staff queries
      User.countDocuments({ 
        tenantId, 
        role: { $in: ['staff', 'manager', 'admin'] } 
      }),
      User.countDocuments({ 
        tenantId, 
        role: { $in: ['staff', 'manager', 'admin'] },
        isActive: true 
      }),
      
      // Revenue query (today's completed orders)
      Order.aggregate([
        {
          $match: {
            tenantId: tenantId,
            status: { $in: ['completed', 'delivered'] },
            createdAt: { 
              $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' }
          }
        }
      ]).then(result => result[0]?.totalRevenue || 0),

      // Branch queries
      Branch.countDocuments({ tenantId }),
      Branch.countDocuments({ tenantId, isActive: true, status: 'active' }),

      // Inventory low stock: currentStock <= minStockLevel
      Ingredient.countDocuments({
        tenantId,
        isActive: true,
        $expr: { $lte: ['$currentStock', '$minStockLevel'] }
      }),
      // Expiring soon (next 7 days)
      (async () => {
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + 7);
        return Ingredient.countDocuments({
          tenantId,
          isActive: true,
          expiryDate: { $gte: now, $lte: future }
        });
      })(),

      // Delivery splits
      Order.countDocuments({ tenantId, orderType: 'delivery', status: 'preparing' }),
      Order.countDocuments({ tenantId, orderType: 'delivery', status: 'ready' }),
      Order.countDocuments({ tenantId, orderType: 'delivery', status: 'out-for-delivery' }),
      Order.countDocuments({
        tenantId,
        orderType: 'delivery',
        status: 'delivered',
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    // Debug logging for staff count
    const debugStaff = await User.find({ 
      tenantId, 
      role: { $in: ['staff', 'manager', 'admin'] } 
    }).select('firstName lastName role isActive');
    
    console.log('Debug: All staff/manager/admin users for tenant:', tenantId);
    console.log('Debug: Users found:', debugStaff.map(user => ({
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      isActive: user.isActive
    })));
    console.log('Debug: Total staff count:', totalStaff);
    console.log('Debug: Active staff count:', activeStaff);

    // Calculate delivery stats
    const deliveryOrders = await Order.countDocuments({
      tenantId,
      orderType: 'delivery',
      status: { $in: ['preparing', 'ready', 'out-for-delivery'] }
    });

    const takeawayOrders = await Order.countDocuments({
      tenantId,
      orderType: 'takeaway',
      status: { $in: ['pending', 'preparing', 'ready'] }
    });

    res.json({
      success: true,
      stats: {
        orders: {
          active: activeOrders,
          pending: pendingOrders,
          preparing: preparingOrders,
          ready: readyOrders,
          totalToday: totalOrdersToday,
          takeaway: takeawayOrders,
          delivery: deliveryOrders,
          deliveryStatus: {
            preparing: deliveryPreparing,
            ready: deliveryReady,
            outForDelivery: deliveryOutForDelivery,
            deliveredToday: deliveryDeliveredToday
          }
        },
        inventory: {
          lowStock: lowStockCount,
          expiringSoon: expiringSoonCount
        },
        tables: {
          total: totalTables,
          occupied: occupiedTables,
          available: availableTables,
          reserved: reservedTables,
          occupancyRate: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0
        },
        menu: {
          total: totalMenuItems,
          available: availableMenuItems,
          outOfStock: outOfStockItems
        },
        staff: {
          total: totalStaff,
          active: activeStaff,
          onShift: activeStaff // For now, assuming active = on shift
        },
        branches: {
          total: totalBranches,
          active: activeBranches
        },
        revenue: {
          today: Math.round(todayRevenue * 100) / 100 // Round to 2 decimal places
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    next(error);
  }
};
