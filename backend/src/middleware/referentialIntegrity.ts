import mongoose from 'mongoose';

import { Branch } from '../models/Branch';
import { Order } from '../models/Order';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';

/**
 * Referential Integrity Middleware
 * Handles cascade operations and maintains data consistency
 */

/**
 * Cascade delete operations for Tenant
 * When a tenant is deleted, handle all related entities
 */
export const cascadeDeleteTenant = async (tenantId: mongoose.Types.ObjectId) => {
  try {
    // 1. Delete all branches belonging to this tenant
    const branches = await Branch.find({ tenantId });
    const branchIds = branches.map(b => b._id);
    
    // 2. Delete all orders for this tenant
    await Order.deleteMany({ tenantId });
    
    // 3. Delete or reassign users
    // For safety, we deactivate users instead of deleting
    await User.updateMany(
      { tenantId, role: { $ne: 'superadmin' } },
      { 
        $set: { 
          isActive: false,
          accountStatus: 'suspended',
          assignedBranches: [],
          currentBranch: null
        }
      }
    );
    
    // 4. Delete all branches
    await Branch.deleteMany({ tenantId });
    
    // 5. Handle child tenants (for franchise model)
    await Tenant.updateMany(
      { parentTenantId: tenantId },
      { $set: { parentTenantId: null } }
    );
    
    console.log(`Cascade delete completed for tenant ${tenantId}`);
    return true;
  } catch (error) {
    console.error('Error in cascade delete tenant:', error);
    throw error;
  }
};

/**
 * Cascade delete operations for Branch
 * When a branch is deleted, handle all related entities
 */
export const cascadeDeleteBranch = async (branchId: mongoose.Types.ObjectId) => {
  try {
    // 1. Check for active orders
    const activeOrders = await Order.countDocuments({
      branchId,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'] }
    });
    
    if (activeOrders > 0) {
      throw new Error(`Cannot delete branch with ${activeOrders} active orders`);
    }
    
    // 2. Reassign or remove users from this branch
    await User.updateMany(
      { assignedBranches: branchId },
      { 
        $pull: { assignedBranches: branchId },
        $unset: { currentBranch: 1 }
      }
    );
    
    // Reset current branch for users who had this as current
    await User.updateMany(
      { currentBranch: branchId },
      { $unset: { currentBranch: 1 } }
    );
    
    // Reset default branch for users who had this as default
    await User.updateMany(
      { defaultBranch: branchId },
      { $unset: { defaultBranch: 1 } }
    );
    
    // 3. Handle child branches (set parent to null)
    await Branch.updateMany(
      { parentBranchId: branchId },
      { $set: { parentBranchId: null } }
    );
    
    // 4. Archive historical orders (keep for records but mark branch as deleted)
    await Order.updateMany(
      { branchId },
      { $set: { branchDeleted: true } }
    );
    
    console.log(`Cascade operations completed for branch ${branchId}`);
    return true;
  } catch (error) {
    console.error('Error in cascade delete branch:', error);
    throw error;
  }
};

/**
 * Cascade operations for User deletion
 * Handle orders and other references
 */
export const cascadeDeleteUser = async (userId: mongoose.Types.ObjectId) => {
  try {
    // 1. Check if user has active orders as staff
    const activeStaffOrders = await Order.countDocuments({
      staffId: userId,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
    });
    
    if (activeStaffOrders > 0) {
      throw new Error(`Cannot delete user with ${activeStaffOrders} active orders as staff`);
    }
    
    // 2. Nullify references in completed orders (keep for history)
    await Order.updateMany(
      { staffId: userId },
      { $set: { staffDeleted: true } }
    );
    
    await Order.updateMany(
      { customerId: userId },
      { $set: { customerDeleted: true } }
    );
    
    await Order.updateMany(
      { 'deliveryInfo.driverId': userId },
      { $set: { 'deliveryInfo.driverDeleted': true } }
    );
    
    // 3. Update status history references
    await Order.updateMany(
      { 'statusHistory.updatedBy': userId },
      { $set: { 'statusHistory.$.updatedByDeleted': true } }
    );
    
    console.log(`Cascade operations completed for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error in cascade delete user:', error);
    throw error;
  }
};

/**
 * Validate referential integrity before operations
 */
export const validateReferences = {
  /**
   * Validate branch references before creating/updating an order
   */
  async validateOrderReferences(order: any) {
    // Check if branch exists and is active
    if (order.branchId) {
      const branch = await Branch.findOne({ 
        _id: order.branchId, 
        isActive: true 
      });
      
      if (!branch) {
        throw new Error('Invalid or inactive branch reference');
      }
      
      // Verify branch belongs to the same tenant
      if (order.tenantId && branch.tenantId.toString() !== order.tenantId.toString()) {
        throw new Error('Branch does not belong to the specified tenant');
      }
    }
    
    // Check if staff exists and is assigned to the branch
    if (order.staffId && order.branchId) {
      const staff = await User.findOne({
        _id: order.staffId,
        $or: [
          { assignedBranches: order.branchId },
          { role: 'admin' },
          { role: 'superadmin' }
        ]
      });
      
      if (!staff) {
        throw new Error('Staff member not assigned to this branch');
      }
    }
    
    return true;
  },
  
  /**
   * Validate user branch assignments
   */
  async validateUserBranchAssignment(userId: string, branchId: string, tenantId: string) {
    const branch = await Branch.findOne({
      _id: branchId,
      tenantId,
      isActive: true
    });
    
    if (!branch) {
      throw new Error('Invalid branch or branch does not belong to tenant');
    }
    
    const user = await User.findOne({
      _id: userId,
      tenantId
    });
    
    if (!user) {
      throw new Error('User not found or does not belong to tenant');
    }
    
    return true;
  },
  
  /**
   * Validate tenant hierarchy
   */
  async validateTenantHierarchy(tenantId: string, parentTenantId?: string) {
    if (!parentTenantId) return true;
    
    // Check for circular references
    let currentParent = parentTenantId;
    const visited = new Set([tenantId]);
    
    while (currentParent) {
      if (visited.has(currentParent)) {
        throw new Error('Circular reference detected in tenant hierarchy');
      }
      
      visited.add(currentParent);
      
      const parent = await Tenant.findById(currentParent);
      if (!parent) {
        throw new Error('Parent tenant not found');
      }
      
      currentParent = parent.parentTenantId?.toString();
    }
    
    return true;
  }
};

/**
 * Install cascade middleware on models
 */
export const installCascadeMiddleware = () => {
  // Tenant cascade delete
  Tenant.schema.pre('deleteOne', { document: true, query: false }, async function() {
    await cascadeDeleteTenant(this._id as mongoose.Types.ObjectId);
  });
  
  // Branch cascade delete
  Branch.schema.pre('deleteOne', { document: true, query: false }, async function() {
    await cascadeDeleteBranch(this._id as mongoose.Types.ObjectId);
  });
  
  // User cascade delete
  User.schema.pre('deleteOne', { document: true, query: false }, async function() {
    await cascadeDeleteUser(this._id as mongoose.Types.ObjectId);
  });
  
  // Order validation before save
  Order.schema.pre('save', async function(next) {
    try {
      await validateReferences.validateOrderReferences(this);
      next();
    } catch (error: any) {
      next(error);
    }
  });
  
  console.log('Referential integrity middleware installed');
};

/**
 * Data consistency checks
 */
export const dataConsistencyChecks = {
  /**
   * Check and fix orphaned branches
   */
  async fixOrphanedBranches() {
    const orphanedBranches = await Branch.find({
      $or: [
        { tenantId: { $exists: false } },
        { tenantId: null }
      ]
    });
    
    console.log(`Found ${orphanedBranches.length} orphaned branches`);
    
    // Deactivate orphaned branches
    await Branch.updateMany(
      {
        $or: [
          { tenantId: { $exists: false } },
          { tenantId: null }
        ]
      },
      { $set: { isActive: false, status: 'suspended' } }
    );
    
    return orphanedBranches.length;
  },
  
  /**
   * Check and fix orphaned orders
   */
  async fixOrphanedOrders() {
    // Find orders with missing branch references
    const ordersWithoutBranch = await Order.find({
      branchId: { $exists: false }
    });
    
    console.log(`Found ${ordersWithoutBranch.length} orders without branch reference`);
    
    // For each order, try to assign to default branch of tenant
    for (const order of ordersWithoutBranch) {
      const defaultBranch = await Branch.findOne({
        tenantId: order.tenantId,
        type: 'main',
        isActive: true
      });
      
      if (defaultBranch) {
        order.branchId = defaultBranch._id as mongoose.Types.ObjectId;
        order.branchCode = defaultBranch.code;
        await order.save();
      }
    }
    
    return ordersWithoutBranch.length;
  },
  
  /**
   * Validate all references in the database
   */
  async validateAllReferences() {
    const issues = [];
    
    // Check orders with invalid branch references
    const orders = await Order.find({});
    for (const order of orders) {
      if (order.branchId) {
        const branch = await Branch.findById(order.branchId);
        if (!branch) {
          issues.push({
            type: 'order',
            id: order._id,
            issue: 'Invalid branch reference'
          });
        }
      }
    }
    
    // Check users with invalid branch assignments
    const users = await User.find({});
    for (const user of users) {
      if (user.assignedBranches && user.assignedBranches.length > 0) {
        for (const branchId of user.assignedBranches) {
          const branch = await Branch.findById(branchId);
          if (!branch) {
            issues.push({
              type: 'user',
              id: user._id,
              issue: `Invalid branch assignment: ${branchId}`
            });
          }
        }
      }
    }
    
    return issues;
  }
};

export default {
  cascadeDeleteTenant,
  cascadeDeleteBranch,
  cascadeDeleteUser,
  validateReferences,
  installCascadeMiddleware,
  dataConsistencyChecks
};