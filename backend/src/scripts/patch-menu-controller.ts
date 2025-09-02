import fs from 'fs';

const patchMenuController = () => {
  const filePath = 'src/controllers/menu.controller.ts';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the getMenuItems function to allow SuperAdmin access
  const oldGetMenuItems = `export const getMenuItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    const { category, search, available, page = 1, limit = 50, sortBy = 'name', order = 'asc' } = req.query;

    const result = await MenuService.getMenuItems({
      category: category as string,
      search: search as string,
      available: available as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      order: order as string,
      tenantId,
      isPublic: false
    });`;

  const newGetMenuItems = `export const getMenuItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId, role } = req.user!;
    const { category, search, available, page = 1, limit = 50, sortBy = 'name', order = 'asc' } = req.query;

    // SuperAdmin can see all data, regular users only see their tenant data
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
    });`;

  content = content.replace(oldGetMenuItems, newGetMenuItems);

  // Replace the getCategories function
  const oldGetCategories = `export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;

    const result = await MenuService.getCategories(tenantId, false);`;

  const newGetCategories = `export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId, role } = req.user!;

    // SuperAdmin can see all categories, regular users only see their tenant categories
    const filterTenantId = role === 'superadmin' ? undefined : tenantId;

    const result = await MenuService.getCategories(filterTenantId, false);`;

  content = content.replace(oldGetCategories, newGetCategories);

  // Replace the getMenuOverview function
  const oldGetOverview = `export const getMenuOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    
    // Get aggregate counts for all menu items
    const [menuStats] = await MenuItem.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          isActive: true
        }
      },`;

  const newGetOverview = `export const getMenuOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId, role } = req.user!;
    
    // SuperAdmin sees stats for all tenants, regular users only their tenant
    const matchQuery: any = { isActive: true };
    if (role !== 'superadmin' && tenantId) {
      matchQuery.tenantId = new mongoose.Types.ObjectId(tenantId);
    }
    
    // Get aggregate counts for menu items
    const [menuStats] = await MenuItem.aggregate([
      {
        $match: matchQuery
      },`;

  content = content.replace(oldGetOverview, newGetOverview);

  // Also update the categories count in overview
  const oldCategoriesCount = `// Get total categories count
    const totalCategories = await Category.countDocuments({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isActive: true
    });`;

  const newCategoriesCount = `// Get total categories count
    const categoriesQuery: any = { isActive: true };
    if (role !== 'superadmin' && tenantId) {
      categoriesQuery.tenantId = new mongoose.Types.ObjectId(tenantId);
    }
    const totalCategories = await Category.countDocuments(categoriesQuery);`;

  content = content.replace(oldCategoriesCount, newCategoriesCount);

  fs.writeFileSync(filePath, content);
  console.log('✅ Menu controller patched for SuperAdmin access');
};

patchMenuController();
