import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';

const generateToken = (id: string, isSuperAdmin: boolean = false) => {
  return jwt.sign({ id, isSuperAdmin }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  } as any);
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Mock response for development
    res.status(201).json({
      success: true,
      token: generateToken('mock-user-id'),
      user: {
        id: 'mock-user-id',
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: 'customer',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Try real database authentication with optimized query
    const { User } = await import('../models/User');
    const user = await User.findOne({ email })
      .select('+password')
      .populate('tenantId', 'name _id isActive')
      .lean({ virtuals: false });
    
    if (user) {
      // Use bcrypt directly for lean document
      const bcrypt = await import('bcryptjs');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account is inactive' });
      }

      const token = generateToken(user._id.toString(), user.role === 'superadmin');

      const userResponse = {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword || false,
        tenantId: user.tenantId?._id,
        tenantName: user.tenantId && typeof user.tenantId === 'object' && 'name' in user.tenantId ? user.tenantId.name : null,
        tenant: user.tenantId // Include full tenant data
      };

      res.json({
        success: true,
        token,
        user: userResponse,
        mustChangePassword: user.mustChangePassword || false,
        message: 'Login successful'
      });
      return;
    }

    // No fallback - only database authentication
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock response for development
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock profile data
    res.json({
      success: true,
      user: {
        id: 'mock-user-id',
        email: 'admin@demo.com',
        firstName: 'Demo',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock response
    res.json({
      success: true,
      user: { id: 'mock-user-id', ...req.body },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user._id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user from database
    const { User } = await import('../models/User');
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.mustChangePassword = false;
    user.passwordLastChanged = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock response for token refresh
    res.json({
      success: true,
      token: generateToken('mock-user-id'),
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    next(error);
  }
};
