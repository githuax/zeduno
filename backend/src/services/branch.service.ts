import mongoose from 'mongoose';

import { Branch, IBranch } from '../models/Branch';
import { Order } from '../models/Order';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';

export class BranchService {
  /**
   * Create a new branch for a tenant
   */
  static async createBranch(
    tenantId: string,
    branchData: Partial<IBranch>,
    createdBy: string
  ): Promise<IBranch> {
    // Check tenant branch quota
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (tenant.branchQuota.currentBranches >= tenant.branchQuota.maxBranches) {
      throw new Error(`Branch quota exceeded. Maximum allowed: ${tenant.branchQuota.maxBranches}`);
    }

    // Create branch
    console.log('Creating branch with data:', {
      ...branchData,
      tenantId,
      createdBy,
    });
    
    const branch = new Branch({
      ...branchData,
      tenantId,
      createdBy,
    });

    console.log('Branch object before save:', {
      name: branch.name,
      code: branch.code,
      tenantId: branch.tenantId,
      settings: branch.settings
    });

    await branch.save();
    
    console.log('Branch saved successfully:', {
      name: branch.name,
      code: branch.code,
      _id: branch._id
    });

    // Update tenant branch count
    await Tenant.findByIdAndUpdate(tenantId, {
      $inc: { 'branchQuota.currentBranches': 1 },
    });

    return branch;
  }

  /**
   * Get all branches for a tenant
   */
  static async getTenantBranches(
    tenantId: string,
    includeInactive: boolean = false
  ): Promise<IBranch[]> {
    const query: any = { tenantId };
    if (!includeInactive) {
      query.isActive = true;
    }

    return await Branch.find(query)
      .populate({
        path: 'ward',
        populate: {
          path: 'subcounty',
          model: 'Subcounty'
        }
      })
      .sort({ createdAt: -1 });
  }

  /**
   * Get branch by ID with validation
   */
  static async getBranchById(
    branchId: string,
    tenantId?: string
  ): Promise<IBranch | null> {
    const query: any = { _id: branchId };
    if (tenantId) {
      query.tenantId = tenantId;
    }

    return await Branch.findOne(query)
      .populate({
        path: 'ward',
        populate: {
          path: 'subcounty',
          model: 'Subcounty'
        }
      });
  }

  /**
   * Update branch information
   */
  static async updateBranch(
    branchId: string,
    tenantId: string,
    updateData: Partial<IBranch>
  ): Promise<IBranch | null> {
    // Prevent updating critical fields
    delete updateData.tenantId;
    delete updateData.createdBy;
    delete updateData.code;

    return await Branch.findOneAndUpdate(
      { _id: branchId, tenantId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  /**
   * Soft delete a branch
   */
  static async deleteBranch(
    branchId: string,
    tenantId: string
  ): Promise<boolean> {
    // Check if branch has active orders
    const activeOrders = await Order.countDocuments({
      branchId,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] },
    });

    if (activeOrders > 0) {
      throw new Error(`Cannot delete branch with ${activeOrders} active orders`);
    }

    // Check if branch has child branches
    const childBranches = await Branch.countDocuments({
      parentBranchId: branchId,
      isActive: true,
    });

    if (childBranches > 0) {
      throw new Error(`Cannot delete branch with ${childBranches} active child branches`);
    }

    // Soft delete the branch
    const result = await Branch.findOneAndUpdate(
      { _id: branchId, tenantId },
      { $set: { isActive: false, status: 'inactive' } },
      { new: true }
    );

    if (result) {
      // Update tenant branch count
      await Tenant.findByIdAndUpdate(tenantId, {
        $inc: { 'branchQuota.currentBranches': -1 },
      });
      return true;
    }

    return false;
  }

  /**
   * Get branch hierarchy
   */
  static async getBranchHierarchy(tenantId: string): Promise<any[]> {
    const branches = await Branch.find({ tenantId, isActive: true });
    
    // Build hierarchy tree
    const buildTree = (parentId: string | null = null): any[] => {
      return branches
        .filter((b) => {
          const parentMatch = parentId
            ? b.parentBranchId?.toString() === parentId
            : !b.parentBranchId;
          return parentMatch;
        })
        .map((branch) => ({
          ...branch.toObject(),
          children: buildTree(branch._id.toString()),
        }));
    };

    return buildTree();
  }

  /**
   * Assign user to branch
   */
  static async assignUserToBranch(
    userId: string,
    branchId: string,
    tenantId: string
  ): Promise<boolean> {
    // Verify branch belongs to tenant
    const branch = await Branch.findOne({ _id: branchId, tenantId });
    if (!branch) {
      throw new Error('Branch not found or access denied');
    }

    // Update user's branch assignment
    const user = await User.findOneAndUpdate(
      { _id: userId, tenantId },
      {
        $addToSet: { assignedBranches: branchId },
        $set: { currentBranch: branchId },
      },
      { new: true }
    );

    if (user) {
      // Update branch staff count
      await Branch.findByIdAndUpdate(branchId, {
        $inc: { 'staffing.currentStaff': 1 },
      });
      return true;
    }

    return false;
  }

  /**
   * Remove user from branch
   */
  static async removeUserFromBranch(
    userId: string,
    branchId: string,
    tenantId: string
  ): Promise<boolean> {
    const user = await User.findOneAndUpdate(
      { _id: userId, tenantId },
      {
        $pull: { assignedBranches: branchId },
        $unset: { currentBranch: 1 },
      },
      { new: true }
    );

    if (user) {
      // Update branch staff count
      await Branch.findByIdAndUpdate(branchId, {
        $inc: { 'staffing.currentStaff': -1 },
      });
      return true;
    }

    return false;
  }

  /**
   * Switch user's current branch
   */
  static async switchUserBranch(
    userId: string,
    newBranchId: string,
    tenantId: string
  ): Promise<boolean> {
    const user = await User.findOne({ _id: userId, tenantId });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has access to the branch
    if (!user.assignedBranches?.includes(new mongoose.Types.ObjectId(newBranchId))) {
      throw new Error('User not assigned to this branch');
    }

    // Check if user can switch branches
    if (!user.canSwitchBranches && user.branchRole === 'branch_staff') {
      throw new Error('User not authorized to switch branches');
    }

    // Update current branch
    await User.findByIdAndUpdate(userId, {
      $set: { currentBranch: newBranchId },
    });

    return true;
  }

  /**
   * Get branch metrics
   */
  static async getBranchMetrics(
    branchId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const metrics = await Order.aggregate([
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId),
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'delivered'] },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
          totalItems: { $sum: { $size: '$items' } },
        },
      },
    ]);

    // Get daily breakdown
    const dailyMetrics = await Order.aggregate([
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId),
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'delivered'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 as 1 } },
    ]);

    // Update branch metrics cache
    if (metrics.length > 0) {
      await Branch.findByIdAndUpdate(branchId, {
        $set: {
          'metrics.totalOrders': metrics[0].totalOrders,
          'metrics.totalRevenue': metrics[0].totalRevenue,
          'metrics.avgOrderValue': metrics[0].avgOrderValue,
          'metrics.lastUpdated': new Date(),
        },
      });
    }

    return {
      summary: metrics[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        totalItems: 0,
      },
      daily: dailyMetrics,
    };
  }

  /**
   * Get consolidated metrics for all branches
   */
  static async getConsolidatedMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // Get all active branches
    const branches = await Branch.find({ tenantId, isActive: true });
    const branchIds = branches.map((b) => b._id);

    // Aggregate metrics across all branches
    const consolidated = await Order.aggregate([
      {
        $match: {
          branchId: { $in: branchIds },
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'delivered'] },
        },
      },
      {
        $group: {
          _id: '$branchId',
          branchOrders: { $sum: 1 },
          branchRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
        },
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch',
        },
      },
      {
        $unwind: '$branch',
      },
      {
        $project: {
          branchId: '$_id',
          branchName: '$branch.name',
          branchCode: '$branch.code',
          orders: '$branchOrders',
          revenue: '$branchRevenue',
          avgOrderValue: '$avgOrderValue',
        },
      },
      { $sort: { revenue: -1 as -1 } },
    ]);

    // Calculate totals
    const totals = consolidated.reduce(
      (acc, branch) => ({
        totalOrders: acc.totalOrders + branch.orders,
        totalRevenue: acc.totalRevenue + branch.revenue,
        totalBranches: acc.totalBranches + 1,
      }),
      { totalOrders: 0, totalRevenue: 0, totalBranches: 0 }
    );

    return {
      totals: {
        ...totals,
        avgRevenuePerBranch: totals.totalRevenue / (totals.totalBranches || 1),
        avgOrdersPerBranch: totals.totalOrders / (totals.totalBranches || 1),
      },
      branches: consolidated,
    };
  }

  /**
   * Clone branch settings to create a new branch
   */
  static async cloneBranch(
    sourceBranchId: string,
    newBranchData: Partial<IBranch>,
    tenantId: string,
    createdBy: string
  ): Promise<IBranch> {
    const sourceBranch = await Branch.findOne({ _id: sourceBranchId, tenantId });
    if (!sourceBranch) {
      throw new Error('Source branch not found');
    }

    // Clone settings from source branch
    const clonedData = {
      ...sourceBranch.toObject(),
      ...newBranchData,
      _id: undefined,
      code: undefined, // Will be auto-generated
      createdAt: undefined,
      updatedAt: undefined,
      metrics: {
        avgOrderValue: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastUpdated: new Date(),
      },
      staffing: {
        ...sourceBranch.staffing,
        currentStaff: 0,
      },
    };

    return await this.createBranch(tenantId, clonedData, createdBy);
  }
}