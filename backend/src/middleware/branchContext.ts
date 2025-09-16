import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import { Branch } from '../models/Branch';
import { User } from '../models/User';
import { AuthRequest } from '../types/auth.types';

declare global {
  namespace Express {
    interface Request {
      branch?: any;
      branchId?: string;
    }
  }
}

/**
 * Middleware to inject branch context into requests
 */
export const branchContext = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get branch ID from various sources
    const branchId = 
      req.headers['x-branch-id'] as string ||
      req.query.branchId as string ||
      req.body?.branchId ||
      req.user?.currentBranch;

    // For certain endpoints, branch context might be optional
    // Note: req.path is relative to the mounted router, not the full URL path
    const optionalBranchPaths = [
      '/',                    // /api/branches (root branch discovery endpoint)
      '/hierarchy',           // /api/branches/hierarchy (branch hierarchy endpoint)
      '/users/switch-branch', 
      '/auth',
      '/tenants',
    ];

    // Special case: POST /branches for creating first branch should always be allowed
    const isBranchCreation = req.method === 'POST' && req.path === '/';

    const isOptional = optionalBranchPaths.some(path => 
      req.path.startsWith(path)
    );

    console.log(`DEBUG: ${req.method} ${req.path} | branchId=${branchId} | isOptional=${isOptional} | isBranchCreation=${isBranchCreation}`);

    if (!branchId && !isOptional && !isBranchCreation) {
      return res.status(400).json({
        success: false,
        error: 'Branch context required. Please provide x-branch-id header or select a branch.',
      });
    }

    if (branchId) {
      // Validate branch exists and user has access
      const branch = await Branch.findById(branchId);
      
      if (!branch) {
        return res.status(404).json({
          success: false,
          error: 'Branch not found',
        });
      }

      // Check if branch belongs to user's tenant
      if (req.user?.tenantId && branch.tenantId.toString() !== req.user.tenantId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this branch',
        });
      }

      // Check if branch is active
      if (!branch.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Branch is inactive',
        });
      }

      // Check if user is assigned to this branch (for non-admin users)
      if (req.user && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        const user = await User.findById(req.user._id);
        
        if (user?.assignedBranches && !user.assignedBranches.includes(branch._id as mongoose.Types.ObjectId)) {
          return res.status(403).json({
            success: false,
            error: 'User not assigned to this branch',
          });
        }
      }

      // Attach branch to request
      req.branch = branch;
      req.branchId = branchId;
    }

    next();
  } catch (error: any) {
    console.error('Branch context middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to establish branch context',
    });
  }
};

/**
 * Middleware to require branch context
 */
export const requireBranch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.branchId || !req.branch) {
    return res.status(400).json({
      success: false,
      error: 'Branch context is required for this operation',
    });
  }
  next();
};

/**
 * Middleware to validate branch manager permissions
 */
export const requireBranchManager = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Superadmins and admins have full access
    if (req.user.role === 'superadmin' || req.user.role === 'admin') {
      return next();
    }

    // Check if user is a branch manager
    if (req.user.role === 'manager') {
      const user = await User.findById(req.user._id);
      
      if (user?.branchRole === 'branch_manager' || user?.branchRole === 'multi_branch') {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      error: 'Branch manager permissions required',
    });
  } catch (error: any) {
    console.error('Branch manager permission check error:', error);
    res.status(500).json({
      success: false,
      error: 'Permission check failed',
    });
  }
};

/**
 * Middleware to validate multi-branch access
 */
export const requireMultiBranchAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Superadmins and admins have full access
    if (req.user.role === 'superadmin' || req.user.role === 'admin') {
      return next();
    }

    // Check if user has multi-branch access
    const user = await User.findById(req.user._id);
    
    if (user?.branchRole === 'multi_branch' || user?.canSwitchBranches) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Multi-branch access required',
    });
  } catch (error: any) {
    console.error('Multi-branch access check error:', error);
    res.status(500).json({
      success: false,
      error: 'Access check failed',
    });
  }
};

/**
 * Middleware to filter data by branch
 */
export const filterByBranch = (modelField: string = 'branchId') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.branchId) {
      // Add branch filter to query
      if (!req.query.filter) {
        req.query.filter = {};
      }
      
      if (typeof req.query.filter === 'string') {
        try {
          req.query.filter = JSON.parse(req.query.filter);
        } catch {
          req.query.filter = {};
        }
      }
      
      (req.query.filter as any)[modelField] = req.branchId;
    }
    next();
  };
};

/**
 * Middleware to inject branch info into response
 */
export const injectBranchInfo = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Override res.json to include branch info
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    if (req.branch && body && typeof body === 'object') {
      body.branchInfo = {
        id: req.branch._id,
        name: req.branch.name,
        code: req.branch.code,
      };
    }
    return originalJson(body);
  };
  
  next();
};