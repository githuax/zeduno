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

    // Try real database authentication first
    const { User } = await import('../models/User');
    const user = await User.findOne({ email }).populate('tenantId');
    
    if (user && await user.comparePassword(password)) {
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
        tenantId: user.tenantId?._id,
        tenantName: user.tenantId && typeof user.tenantId === 'object' && 'name' in user.tenantId ? user.tenantId.name : null,
        tenant: user.tenantId // Include full tenant data
      };

      res.json({
        success: true,
        token,
        user: userResponse,
        message: 'Login successful'
      });
      return;
    }

    // Fallback to mock authentication for development
    if ((email === 'admin@demo.com' && password === 'admin123') ||
        (email === 'admin@joespizzapalace.com' && password === 'JoesPizza@2024')) {
      
      const mockUser = email === 'admin@joespizzapalace.com' ? {
        _id: 'joe-pizza-admin-id',
        email: 'admin@joespizzapalace.com',
        firstName: 'Joe',
        lastName: 'Pizza',
        role: 'admin',
        isActive: true,
        tenantId: 'joe-pizza-tenant-1',
        tenantName: "Joe's Pizza Palace"
      } : {
        _id: 'mock-user-id',
        email: 'admin@demo.com',
        firstName: 'Demo',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
        tenantId: '507f1f77bcf86cd799439011',
        tenantName: 'Demo Restaurant'
      };

      const token = generateToken(mockUser._id);

      res.json({
        success: true,
        token,
        user: mockUser,
        message: 'Login successful'
      });
      return;
    }

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
    // Mock response
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