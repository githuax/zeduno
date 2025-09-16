import { Response } from 'express';
import { validationResult } from 'express-validator';

import { BranchService } from '../services/branch.service';
import { AuthRequest } from '../types/auth.types';

export class BranchController {
  /**
   * Create a new branch
   */
  static async createBranch(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
      const userId = req.user?._id;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const branch = await BranchService.createBranch(
        tenantId.toString(),
        req.body,
        userId.toString()
      );

      res.status(201).json({
        success: true,
        message: 'Branch created successfully',
        data: branch,
      });
    } catch (error: any) {
      console.error('Create branch error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create branch',
      });
    }
  }

  /**
   * Get all branches for a tenant
   */
  static async getBranches(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
      const includeInactive = req.query.includeInactive === 'true';

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const branches = await BranchService.getTenantBranches(
        tenantId.toString(),
        includeInactive
      );

      res.json({
        success: true,
        data: branches,
        count: branches.length,
      });
    } catch (error: any) {
      console.error('Get branches error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch branches',
      });
    }
  }

  /**
   * Get branch hierarchy
   */
  static async getBranchHierarchy(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const hierarchy = await BranchService.getBranchHierarchy(tenantId.toString());

      res.json({
        success: true,
        data: hierarchy,
      });
    } catch (error: any) {
      console.error('Get branch hierarchy error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch branch hierarchy',
      });
    }
  }

  /**
   * Get branch by ID
   */
  static async getBranchById(req: AuthRequest, res: Response) {
    try {
      const { branchId } = req.params;
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

      const branch = await BranchService.getBranchById(
        branchId,
        tenantId?.toString()
      );

      if (!branch) {
        return res.status(404).json({
          success: false,
          error: 'Branch not found',
        });
      }

      res.json({
        success: true,
        data: branch,
      });
    } catch (error: any) {
      console.error('Get branch by ID error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch branch',
      });
    }
  }

  /**
   * Update branch
   */
  static async updateBranch(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { branchId } = req.params;
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const updatedBranch = await BranchService.updateBranch(
        branchId,
        tenantId.toString(),
        req.body
      );

      if (!updatedBranch) {
        return res.status(404).json({
          success: false,
          error: 'Branch not found or update failed',
        });
      }

      res.json({
        success: true,
        message: 'Branch updated successfully',
        data: updatedBranch,
      });
    } catch (error: any) {
      console.error('Update branch error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update branch',
      });
    }
  }

  /**
   * Delete branch
   */
  static async deleteBranch(req: AuthRequest, res: Response) {
    try {
      const { branchId } = req.params;
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const deleted = await BranchService.deleteBranch(
        branchId,
        tenantId.toString()
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Branch not found or deletion failed',
        });
      }

      res.json({
        success: true,
        message: 'Branch deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete branch error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete branch',
      });
    }
  }

  /**
   * Assign user to branch
   */
  static async assignUserToBranch(req: AuthRequest, res: Response) {
    try {
      const { branchId } = req.params;
      const { userId } = req.body;
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const assigned = await BranchService.assignUserToBranch(
        userId,
        branchId,
        tenantId.toString()
      );

      if (!assigned) {
        return res.status(400).json({
          success: false,
          error: 'Failed to assign user to branch',
        });
      }

      res.json({
        success: true,
        message: 'User assigned to branch successfully',
      });
    } catch (error: any) {
      console.error('Assign user to branch error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to assign user to branch',
      });
    }
  }

  /**
   * Remove user from branch
   */
  static async removeUserFromBranch(req: AuthRequest, res: Response) {
    try {
      const { branchId, userId } = req.params;
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const removed = await BranchService.removeUserFromBranch(
        userId,
        branchId,
        tenantId.toString()
      );

      if (!removed) {
        return res.status(400).json({
          success: false,
          error: 'Failed to remove user from branch',
        });
      }

      res.json({
        success: true,
        message: 'User removed from branch successfully',
      });
    } catch (error: any) {
      console.error('Remove user from branch error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to remove user from branch',
      });
    }
  }

  /**
   * Switch user's current branch
   */
  static async switchBranch(req: AuthRequest, res: Response) {
    try {
      const { branchId } = req.body;
      const userId = req.user?._id;
      const tenantId = req.user?.tenantId;

      if (!userId || !tenantId) {
        return res.status(400).json({ error: 'User authentication required' });
      }

      const switched = await BranchService.switchUserBranch(
        userId.toString(),
        branchId,
        tenantId.toString()
      );

      if (!switched) {
        return res.status(400).json({
          success: false,
          error: 'Failed to switch branch',
        });
      }

      res.json({
        success: true,
        message: 'Branch switched successfully',
        currentBranch: branchId,
      });
    } catch (error: any) {
      console.error('Switch branch error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to switch branch',
      });
    }
  }

  /**
   * Get branch metrics
   */
  static async getBranchMetrics(req: AuthRequest, res: Response) {
    try {
      const { branchId } = req.params;
      const { startDate, endDate } = req.query;
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

      // Validate branch belongs to tenant
      const branch = await BranchService.getBranchById(
        branchId,
        tenantId?.toString()
      );

      if (!branch) {
        return res.status(404).json({
          success: false,
          error: 'Branch not found',
        });
      }

      const start = startDate
        ? new Date(startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const end = endDate ? new Date(endDate as string) : new Date();

      const metrics = await BranchService.getBranchMetrics(branchId, start, end);

      res.json({
        success: true,
        data: metrics,
        period: {
          startDate: start,
          endDate: end,
        },
      });
    } catch (error: any) {
      console.error('Get branch metrics error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch branch metrics',
      });
    }
  }

  /**
   * Get consolidated metrics for all branches
   */
  static async getConsolidatedMetrics(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const start = startDate
        ? new Date(startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const metrics = await BranchService.getConsolidatedMetrics(
        tenantId.toString(),
        start,
        end
      );

      res.json({
        success: true,
        data: metrics,
        period: {
          startDate: start,
          endDate: end,
        },
      });
    } catch (error: any) {
      console.error('Get consolidated metrics error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch consolidated metrics',
      });
    }
  }

  /**
   * Clone branch
   */
  static async cloneBranch(req: AuthRequest, res: Response) {
    try {
      const { sourceBranchId } = req.params;
      const newBranchData = req.body;
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
      const userId = req.user?._id;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const clonedBranch = await BranchService.cloneBranch(
        sourceBranchId,
        newBranchData,
        tenantId.toString(),
        userId.toString()
      );

      res.status(201).json({
        success: true,
        message: 'Branch cloned successfully',
        data: clonedBranch,
      });
    } catch (error: any) {
      console.error('Clone branch error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to clone branch',
      });
    }
  }
}