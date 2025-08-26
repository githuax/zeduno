import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Handle mock users for development
    if (decoded.id === 'mock-user-id' || decoded.id === 'joe-pizza-admin-id') {
      const mockUser = decoded.id === 'joe-pizza-admin-id' ? {
        _id: 'joe-pizza-admin-id',
        email: 'admin@joespizzapalace.com',
        firstName: 'Joe',
        lastName: 'Pizza',
        role: 'admin',
        isActive: true,
        tenantId: '507f1f77bcf86cd799439011',
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
      
      req.user = mockUser;
      next();
      return;
    }

    // Try to find real user in database
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Please authenticate' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    next();
  };
};

export const authenticateSuperAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (!decoded.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Superadmin access required' });
    }

    // Try to find superadmin user
    let superAdmin;
    
    try {
      const SuperAdmin = require('../models/SuperAdmin').SuperAdmin;
      superAdmin = await SuperAdmin.findById(decoded.id);
    } catch (error) {
      // SuperAdmin model might not exist
    }

    // If not found in SuperAdmin model, check User model with superadmin role
    if (!superAdmin) {
      superAdmin = await User.findById(decoded.id).select('-password');
      if (!superAdmin || superAdmin.role !== 'superadmin') {
        return res.status(403).json({ success: false, message: 'Superadmin access required' });
      }
    }

    if (!superAdmin || !superAdmin.isActive) {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    req.user = superAdmin;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
