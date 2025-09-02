import fs from 'fs';

const fixMenuController = () => {
  const filePath = 'src/controllers/menu.controller.ts';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Update the interface to make tenantId optional
  content = content.replace(
    /interface AuthRequest extends Request \{\s+user\?: \{\s+id: string;\s+tenantId: string;\s+role: string;\s+\};\s+\}/,
    `interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId?: string;  // Made optional for SuperAdmin
    role: string;
  };
}`
  );

  // 2. Update getMenuItems function
  content = content.replace(
    /export const getMenuItems = async \(req: AuthRequest, res: Response, next: NextFunction\) => \{\s+try \{\s+const \{ tenantId \} = req\.user!;/,
    `export const getMenuItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId, role } = req.user!;`
  );

  // 3. Update the MenuService call in getMenuItems
  content = content.replace(
    /const result = await MenuService\.getMenuItems\(\{\s+category: category as string,\s+search: search as string,\s+available: available as string,\s+page: parseInt\(page as string\),\s+limit: parseInt\(limit as string\),\s+sortBy: sortBy as string,\s+order: order as string,\s+tenantId,\s+isPublic: false\s+\}\);/,
    `// SuperAdmin can see all data, regular users only see their tenant data
    const filterTenantId = role === 'superadmin' ? undefined : tenantId;

    const result = await MenuService.getMenuItems({
      category: category as string,
      search: search as string,
      available: available as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      order: order as string,
      tenantId: filterTenantId,
      isPublic: false
    });`
  );

  // 4. Update getCategories function
  content = content.replace(
    /export const getCategories = async \(req: AuthRequest, res: Response, next: NextFunction\) => \{\s+try \{\s+const \{ tenantId \} = req\.user!;/,
    `export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId, role } = req.user!;`
  );

  content = content.replace(
    /const result = await MenuService\.getCategories\(tenantId, false\);/,
    `// SuperAdmin can see all categories, regular users only see their tenant categories
    const filterTenantId = role === 'superadmin' ? undefined : tenantId;
    const result = await MenuService.getCategories(filterTenantId, false);`
  );

  fs.writeFileSync(filePath, content);
  console.log('✅ Menu controller fixed properly');
};

fixMenuController();
