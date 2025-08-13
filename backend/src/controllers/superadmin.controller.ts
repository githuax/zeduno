import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const generateToken = (id: string, isSuperAdmin: boolean = false) => {
  return jwt.sign({ id, isSuperAdmin }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
};

export const superAdminLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check superadmins collection
    const superAdminCollection = mongoose.connection.db.collection('superadmins');
    const superAdmin = await superAdminCollection.findOne({ 
      $or: [
        { email: email },
        { username: email } // Allow login with username or email
      ]
    });

    if (!superAdmin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!superAdmin.isActive) {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    // Update last login
    await superAdminCollection.updateOne(
      { _id: superAdmin._id },
      { 
        $set: { 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    const token = generateToken(superAdmin._id.toString(), true);

    res.json({
      success: true,
      token,
      user: {
        id: superAdmin._id,
        email: superAdmin.email,
        username: superAdmin.username,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        role: superAdmin.role,
        isSuperAdmin: true,
        permissions: superAdmin.permissions,
      },
    });
  } catch (error) {
    console.error('SuperAdmin login error:', error);
    next(error);
  }
};

export const getTenants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify superadmin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (!decoded.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Superadmin access required' });
    }

    // Get all tenants
    const tenantsCollection = mongoose.connection.db.collection('tenants');
    const tenants = await tenantsCollection.find({}).toArray();

    res.json({
      success: true,
      tenants,
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    next(error);
  }
};

export const switchTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.body;

    // Verify superadmin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (!decoded.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Superadmin access required' });
    }

    // Get tenant details
    const tenantsCollection = mongoose.connection.db.collection('tenants');
    const tenant = await tenantsCollection.findOne({ _id: new mongoose.Types.ObjectId(tenantId) });

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    res.json({
      success: true,
      tenant,
    });
  } catch (error) {
    console.error('Switch tenant error:', error);
    next(error);
  }
};

export const createTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify superadmin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (!decoded.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Superadmin access required' });
    }

    const tenantData = req.body;
    
    // Add timestamps and defaults
    const tenant = {
      ...tenantData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: tenantData.status || 'active',
    };

    // Create tenant
    const tenantsCollection = mongoose.connection.db.collection('tenants');
    const result = await tenantsCollection.insertOne(tenant);

    res.status(201).json({
      success: true,
      tenant: {
        ...tenant,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    next(error);
  }
};
