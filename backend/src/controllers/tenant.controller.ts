import crypto from 'crypto';

import { Request, Response } from 'express';
import mongoose from 'mongoose';

import { Tenant } from '../models/Tenant';
import { User } from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

const generateTemporaryPassword = (): string => {
  return crypto.randomBytes(8).toString('hex');
};

export const createTenantWithAdmin = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      name, 
      email, 
      domain, 
      plan = 'basic', 
      maxUsers = 10, 
      address, 
      phone, 
      contactPerson,
      admin,
      settings,
      paymentConfig
    } = req.body;

    if (!name || !email || !admin) {
      return res.status(400).json({
        success: false,
        message: 'Tenant name, email and admin information are required',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const existingTenant = await Tenant.findOne({ 
      $or: [
        { name },
        { email },
        { domain }
      ]
    });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'A tenant with this name, email, or domain already exists',
      });
    }

    const existingUser = await User.findOne({ email: admin.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const newTenant = new Tenant({
      name,
      email,
      domain,
      slug,
      plan,
      maxUsers,
      currentUsers: 0,
      address,
      phone,
      contactPerson,
      status: 'active',
      createdBy: req.user?.id,
      settings: settings || { 
        currency: 'USD', 
        businessType: 'restaurant' 
      },
      paymentConfig: paymentConfig || {
        mpesa: { enabled: false },
        stripe: { enabled: false },
        square: { enabled: false },
        cash: { enabled: true }
      }
    });

    const savedTenant = await newTenant.save({ session });

    const newAdminUser = new User({
      email: admin.email,
      password: admin.password,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: 'admin',
      tenantId: savedTenant._id,
      tenant: savedTenant._id,
      isActive: true,
      mustChangePassword: false,
    });

    const savedAdminUser = await newAdminUser.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Tenant and admin user created successfully',
      data: {
        tenant: savedTenant,
        adminUser: {
          id: savedAdminUser._id,
          email: savedAdminUser.email,
          firstName: savedAdminUser.firstName,
          lastName: savedAdminUser.lastName,
        },
      },
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Error creating tenant with admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tenant',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const getAllTenants = async (req: AuthRequest, res: Response) => {
  try {
    const tenants = await Tenant.find()
      .populate('createdBy', 'firstName lastName email')
      .sort('-createdAt');

    // Get user counts for each tenant
    const tenantsWithCounts = await Promise.all(
      tenants.map(async (tenant) => {
        const userCount = await User.countDocuments({ tenantId: tenant._id });
        return {
          ...tenant.toObject(),
          currentUsers: userCount
        };
      })
    );

    res.json({
      success: true,
      tenants: tenantsWithCounts
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenants',
      error: error.message,
    });
  }
};

export const getTenantById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id)
      .populate('createdBy', 'firstName lastName email');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    const adminUsers = await User.find({ 
      tenantId: tenant._id,
      role: 'admin'
    }).select('-password');

    res.json({
      success: true,
      data: {
        tenant,
        adminUsers,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant',
      error: error.message,
    });
  }
};

export const updateTenant = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: tenant,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant',
      error: error.message,
    });
  }
};

export const updateTenantStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    tenant.status = status;
    await tenant.save();

    // Update all users in this tenant
    await User.updateMany(
      { tenantId: tenant._id },
      { isActive: status === 'active' }
    );

    res.json({
      success: true,
      message: `Tenant status updated to ${status} successfully`,
      data: tenant,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant status',
      error: error.message,
    });
  }
};

export const deleteTenant = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    // Delete all users belonging to this tenant
    await User.deleteMany({ tenantId: tenant._id }, { session });

    // Delete the tenant
    await Tenant.findByIdAndDelete(id, { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Tenant and all associated data deleted successfully',
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'Failed to delete tenant',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};