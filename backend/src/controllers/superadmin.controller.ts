import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

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
    console.log('SuperAdmin login attempt for:', email);

    // First check SuperAdmin model, then fallback to User model with superadmin role
    let superAdmin;
    
    try {
      // Try SuperAdmin model first
      const { SuperAdmin } = await import('../models/SuperAdmin');
      superAdmin = await SuperAdmin.findOne({ 
        $or: [
          { email: email },
          { username: email }
        ]
      });
      console.log('SuperAdmin model search result:', superAdmin ? 'Found' : 'Not found');
    } catch (error) {
      console.log('SuperAdmin model error or not found:', error.message);
    }

    // If not found in SuperAdmin model, check User model with superadmin role
    if (!superAdmin) {
      const { User } = await import('../models/User');
      superAdmin = await User.findOne({ 
        email: email,
        role: 'superadmin'
      });
      console.log('User model search result:', superAdmin ? 'Found' : 'Not found');
    }

    if (!superAdmin) {
      console.log('No superadmin user found for email:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('Found superadmin:', {
      email: superAdmin.email,
      role: superAdmin.role,
      isActive: superAdmin.isActive
    });

    // Verify password
    const isPasswordValid = await superAdmin.comparePassword(password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!superAdmin.isActive) {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    const token = generateToken(superAdmin._id.toString(), true);
    console.log('Generated token with isSuperAdmin flag');

    res.json({
      success: true,
      token,
      user: {
        _id: superAdmin._id,
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        role: 'superadmin',
        isActive: superAdmin.isActive,
        permissions: superAdmin.permissions || ['all'],
      },
      message: 'SuperAdmin login successful'
    });
  } catch (error) {
    console.error('SuperAdmin login error:', error);
    next(error);
  }
};

export const getTenants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    console.log('getTenants called for user:', { 
      id: user._id, 
      email: user.email, 
      role: user.role 
    });
    
    // Get real tenants from database
    const { Tenant } = await import('../models/Tenant');
    const { User } = await import('../models/User');
    
    // Check if this is the root superadmin or a delegated admin
    let query = {};
    let isRootSuperAdmin = false;
    
    // First try SuperAdmin collection
    try {
      const { SuperAdmin } = await import('../models/SuperAdmin');
      const superAdmin = await SuperAdmin.findById(user._id);
      if (superAdmin && superAdmin.email === 'superadmin@zeduno.com') {
        isRootSuperAdmin = true;
        console.log('User is root superadmin from SuperAdmin collection');
      }
    } catch (error) {
      console.log('SuperAdmin collection check failed:', error.message);
    }
    
    // If not root superadmin, check if they're a delegated admin
    if (!isRootSuperAdmin) {
      const userFromDb = await User.findById(user._id);
      console.log('User from database:', {
        found: !!userFromDb,
        email: userFromDb?.email,
        role: userFromDb?.role
      });
      
      if (userFromDb && userFromDb.role === 'superadmin') {
        // Check if this user is the root superadmin by email
        if (userFromDb.email === 'superadmin@zeduno.com') {
          isRootSuperAdmin = true;
          console.log('User is root superadmin by email');
        } else {
          // This is a delegated admin, only show tenants they created
          query = { createdBy: user._id };
          console.log('User is delegated admin, filtering by createdBy:', user._id);
        }
      }
    }
    
    console.log('Query for tenants:', query);
    console.log('Is root superadmin:', isRootSuperAdmin);
    
    // Root superadmin sees all tenants, delegated admins see only their tenants
    const tenants = await Tenant.find(query)
      .populate('createdBy', 'email firstName lastName')
      .sort({ createdAt: -1 });

    console.log(`Found ${tenants.length} tenants matching query`);
    if (tenants.length > 0) {
      console.log('First tenant:', {
        name: tenants[0].name,
        email: tenants[0].email,
        createdBy: tenants[0].createdBy,
        slug: tenants[0].slug
      });
    }

    res.json({
      success: true,
      tenants,
      isRootSuperAdmin
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    next(error);
  }
};

export const switchTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.body;

    // Get actual tenant data from database
    const { Tenant } = require('../models/Tenant');
    
    // Try to find by ID first, then by slug
    let tenant = await Tenant.findById(tenantId).catch(() => null);
    
    if (!tenant) {
      // If not found by ID, try finding by slug
      tenant = await Tenant.findOne({ slug: tenantId });
    }

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    res.json({
      success: true,
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        status: tenant.status,
        settings: tenant.settings // Include settings with currency
      },
    });
  } catch (error) {
    console.error('Switch tenant error:', error);
    next(error);
  }
};

export const createTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    // Create new tenant in database
    const { Tenant } = require('../models/Tenant');
    
    // Generate slug from name if not provided
    const tenantData = {
      ...req.body,
      slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      status: req.body.status || 'active',
      plan: req.body.plan || 'basic',
      currentUsers: 0,
      maxUsers: req.body.maxUsers || 10,
      isActive: true,
      createdBy: user._id // Track who created this tenant
    };

    const newTenant = new Tenant(tenantData);
    await newTenant.save();

    console.log('New tenant created:', newTenant.name, 'with ID:', newTenant._id);

    res.status(201).json({
      success: true,
      tenant: newTenant,
      message: 'Tenant created successfully'
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        success: false, 
        message: `A tenant with this ${field} already exists` 
      });
    }
    
    next(error);
  }
};

export const updateTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Update tenant in database
    const { Tenant } = require('../models/Tenant');
    const { id } = req.params;
    const updateData = req.body;

    // Find and update tenant
    const tenant = await Tenant.findByIdAndUpdate(
      id,
      {
        name: updateData.name,
        email: updateData.email,
        domain: updateData.domain,
        plan: updateData.plan,
        maxUsers: updateData.maxUsers,
        address: updateData.address,
        phone: updateData.phone,
        contactPerson: updateData.contactPerson,
        settings: updateData.settings,
      },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      tenant
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    next(error);
  }
};

export const deleteTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Delete tenant from database
    const { Tenant } = require('../models/Tenant');
    const { id } = req.params;

    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    next(error);
  }
};

export const updateTenantStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Update tenant status in database
    const { Tenant } = require('../models/Tenant');
    const { id } = req.params;
    const { status } = req.body;

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    res.json({
      success: true,
      message: 'Tenant status updated successfully',
      tenant
    });
  } catch (error) {
    console.error('Update tenant status error:', error);
    next(error);
  }
};

export const uploadSystemLogo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../uploads');
    const logosDir = path.join(uploadsDir, 'logos');
    
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `system-logo${fileExtension}`;
    const filePath = path.join(logosDir, fileName);

    // Move file to logos directory
    fs.writeFileSync(filePath, req.file.buffer);

    // Save logo path in database or config
    const { SuperAdmin } = await import('../models/SuperAdmin');
    
    // Update system settings with logo path
    const logoUrl = `/uploads/logos/${fileName}`;
    
    // You could also store this in a SystemSettings collection
    // For now, we'll return the URL for the frontend to use
    
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl: logoUrl
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    next(error);
  }
};

export const getSystemLogo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if logo exists
    const logosDir = path.join(__dirname, '../../uploads/logos');
    
    // Check for various image formats
    const possibleExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'];
    let logoUrl = null;
    
    for (const ext of possibleExtensions) {
      const logoPath = path.join(logosDir, `system-logo${ext}`);
      if (fs.existsSync(logoPath)) {
        logoUrl = `/uploads/logos/system-logo${ext}`;
        break;
      }
    }
    
    res.json({
      success: true,
      logoUrl: logoUrl
    });
  } catch (error) {
    console.error('Get logo error:', error);
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get real users from database with tenant information
    const { User } = require('../models/User');
    const { Tenant } = require('../models/Tenant');
    
    const users = await User.find({})
      .populate('tenantId', 'name slug domain status')
      .select('-password')
      .sort({ createdAt: -1 });

    // Transform users to include tenant name
    const usersWithTenants = users.map(user => ({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      tenantId: user.tenantId?._id,
      tenantName: user.tenantId?.name || (user.role === 'superadmin' ? 'System Admin' : 'No Tenant'),
      tenantSlug: user.tenantId?.slug,
      tenantStatus: user.tenantId?.status,
      mustChangePassword: user.mustChangePassword,
      accountStatus: user.accountStatus,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      success: true,
      users: usersWithTenants,
    });
  } catch (error) {
    console.error('Get users error:', error);
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Create real user in database
    const { User } = require('../models/User');
    const { Tenant } = require('../models/Tenant');
    
    const { email, firstName, lastName, role, tenantId, password } = req.body;
    
    // Validate required fields
    if (!email || !firstName || !lastName || !role || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, firstName, lastName, role, and password are required' 
      });
    }

    // Verify tenant exists if tenantId provided
    if (tenantId && tenantId !== 'none') {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(400).json({ success: false, message: 'Tenant not found' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Create new user
    const newUser = new User({
      email,
      firstName,
      lastName,
      role,
      password,
      tenantId: tenantId && tenantId !== 'none' ? tenantId : undefined,
      isActive: true,
      mustChangePassword: req.body.mustChangePassword || false,
      accountStatus: 'active'
    });

    await newUser.save();

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
      user: userResponse,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock response
    res.json({
      success: true,
      user: { _id: req.params.id, ...req.body },
    });
  } catch (error) {
    console.error('Update user error:', error);
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock response
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    next(error);
  }
};

export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock response
    res.json({
      success: true,
      user: { _id: req.params.id, isActive: req.body.isActive },
    });
  } catch (error) {
    console.error('Update user status error:', error);
    next(error);
  }
};

export const getSystemAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock analytics data
    const stats = {
      totalTenants: 5,
      activeTenants: 4,
      totalUsers: 25,
      activeUsers: 20,
      totalOrders: 1500,
      totalRevenue: 45000,
      systemUptime: "15d 8h",
      lastBackup: new Date().toLocaleString(),
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Get system analytics error:', error);
    next(error);
  }
};

export const getTenantAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock tenant analytics
    const analytics = [
      {
        _id: 'tenant-1',
        name: 'Demo Restaurant',
        plan: 'basic',
        status: 'active',
        userCount: 5,
        orderCount: 150,
        revenue: 5000,
        lastActive: new Date().toISOString(),
        createdAt: new Date(),
      }
    ];

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Get tenant analytics error:', error);
    next(error);
  }
};