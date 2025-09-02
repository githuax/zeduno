import fs from 'fs';

const fixUserController = () => {
  const filePath = 'src/controllers/user.controller.ts';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Update the AuthRequest interface to include optional tenantId
  content = content.replace(
    /interface AuthRequest extends Request \{\s+user\?: any;\s+\}/,
    `interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId?: string;
    role: string;
  };
}`
  );

  // 2. Update getAllUsers to filter by tenant
  const oldGetAllUsers = `export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};`;

  const newGetAllUsers = `export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId, role } = req.user || {};
    
    let query: any = {};
    
    // SuperAdmin can see all users, regular users only see their tenant users
    if (role !== 'superadmin' && tenantId) {
      query.tenantId = tenantId;
    }
    
    const users = await User.find(query).select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};`;

  content = content.replace(oldGetAllUsers, newGetAllUsers);

  // 3. Update getUserById to filter by tenant
  const oldGetUserById = `export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};`;

  const newGetUserById = `export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId, role } = req.user || {};
    const { id } = req.params;
    
    let query: any = { _id: id };
    
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
};`;

  content = content.replace(oldGetUserById, newGetUserById);

  // Add mongoose import if not present
  if (!content.includes("import mongoose")) {
    content = content.replace(
      "import { User } from '../models/User';",
      "import { User } from '../models/User';\nimport mongoose from 'mongoose';"
    );
  }

  fs.writeFileSync(filePath, content);
  console.log('✅ User controller updated for tenant filtering');
};

fixUserController();
