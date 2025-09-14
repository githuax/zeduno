import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import AuditLog from '../models/AuditLog';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { emailService } from '../services/email.service';

interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId?: string;
    role: string;
  };
}

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId, role } = req.user || {};
    
    const query: any = {};
    
    // SuperAdmin can see all users, regular users only see their tenant users
    if (role !== 'superadmin' && tenantId) {
      query.tenantId = tenantId;
    }
    
    const users = await User.find(query).select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId, role } = req.user || {};
    const { id } = req.params;
    
    const query: any = { _id: id };
    
    // SuperAdmin can see any user, regular users only see users from their tenant
    if (role !== 'superadmin' && tenantId) {
      query.tenantId = tenantId;
    }
    
    const user = await User.findOne(query).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('tenantId', 'name');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate password expiry (90 days from last change)
    const passwordExpiryDate = new Date(user.passwordLastChanged || user.createdAt);
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + 90);

    const profileData = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantName: user.tenantId ? (user.tenantId as any).name : undefined,
      passwordLastChanged: user.passwordLastChanged || user.createdAt,
      passwordExpiryDate,
      lastLogin: user.lastLogin,
      twoFactorEnabled: user.twoFactorEnabled || false,
      accountStatus: user.accountStatus || 'active'
    };

    res.json(profileData);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'email'];
    const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));
    
    const updateData: any = {};
    updates.forEach(update => {
      updateData[update] = req.body[update];
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName, role, password } = req.body;
    
    // Validate required fields
    if (!email || !firstName || !lastName || !role || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, firstName, lastName, role, and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Get the tenant admin's tenant ID
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || !adminUser.tenantId) {
      return res.status(400).json({ success: false, message: 'Admin user must belong to a tenant' });
    }

    // Create new user in the same tenant as the admin
    const newUser = new User({
      email,
      firstName,
      lastName,
      role,
      password,
      tenantId: adminUser.tenantId,
      isActive: true,
      mustChangePassword: req.body.mustChangePassword || false,
      accountStatus: 'active'
    });

    await newUser.save();

    // Send welcome email if role is customer or staff
    try {
      if (['customer', 'staff'].includes(role)) {
        const tenant = await Tenant.findById(newUser.tenantId);
        if (tenant) {
          await emailService.sendEmail({
            tenantId: newUser.tenantId,
            to: newUser.email,
            toName: `${newUser.firstName} ${newUser.lastName}`,
            templateSlug: 'welcome-user',
            templateData: {
              customerName: `${newUser.firstName} ${newUser.lastName}`,
              restaurantName: tenant.name,
              menuUrl: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/menu`,
              supportEmail: tenant.email || 'support@dineservehub.com',
              restaurantPhone: tenant.phone || '',
              currentYear: new Date().getFullYear()
            },
            category: 'user',
            type: 'welcome',
            priority: 'normal',
            metadata: {
              userId: newUser._id.toString(),
              role: newUser.role
            }
          });
        }
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail user creation if email fails
    }

    // Return user without password
    const userResponse = {
      _id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      tenantId: newUser.tenantId,
      isActive: newUser.isActive,
      mustChangePassword: newUser.mustChangePassword,
      accountStatus: newUser.accountStatus,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'User created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get user audit logs
export const getUserAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    
    const logs = await AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      // Log failed attempt
      await AuditLog.create({
        userId,
        action: 'Password Change Attempt',
        details: 'Failed: Invalid current password',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failure'
      });

      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Check if new password is same as old
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password cannot be the same as current password' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    user.passwordLastChanged = new Date();
    await user.save();

    // Log successful change
    await AuditLog.create({
      userId,
      action: 'Password Changed',
      details: 'Password successfully changed',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
};