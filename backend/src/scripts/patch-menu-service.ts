import fs from 'fs';

const patchMenuService = () => {
  const filePath = 'src/services/menu.service.ts';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update the buildMenuItemsQuery method to handle undefined tenantId
  const oldBuildQuery = `    // For public access, only show available items
    if (isPublic) {
      query.isAvailable = true;
    } else if (tenantId) {
      // For authenticated access, filter by tenant
      query.tenantId = new mongoose.Types.ObjectId(tenantId);
    }`;

  const newBuildQuery = `    // For public access, only show available items
    if (isPublic) {
      query.isAvailable = true;
    } else if (tenantId) {
      // For authenticated access, filter by tenant
      query.tenantId = new mongoose.Types.ObjectId(tenantId);
    }
    // If tenantId is undefined (SuperAdmin), don't add tenant filter - show all data`;

  content = content.replace(oldBuildQuery, newBuildQuery);

  // Update the buildCategoriesQuery method
  const oldCategoriesQuery = `  static buildCategoriesQuery(tenantId?: string, isPublic: boolean = false): any {
    let query: any = { isActive: true };

    if (isPublic) {
      // For public, only show categories that have available items
      return MenuItem.aggregate([
        { $match: { isActive: true, isAvailable: true } },
        { $group: { _id: '$categoryId' } },
        { $lookup: { 
          from: 'categories', 
          localField: '_id', 
          foreignField: '_id', 
          as: 'category' 
        }},
        { $unwind: '$category' },
        { $match: { 'category.isActive': true } },
        { $replaceRoot: { newRoot: '$category' } },
        { $sort: { displayOrder: 1, name: 1 } }
      ]);
    } else if (tenantId) {
      query.tenantId = new mongoose.Types.ObjectId(tenantId);
    }

    return query;
  }`;

  const newCategoriesQuery = `  static buildCategoriesQuery(tenantId?: string, isPublic: boolean = false): any {
    let query: any = { isActive: true };

    if (isPublic) {
      // For public, only show categories that have available items
      return MenuItem.aggregate([
        { $match: { isActive: true, isAvailable: true } },
        { $group: { _id: '$categoryId' } },
        { $lookup: { 
          from: 'categories', 
          localField: '_id', 
          foreignField: '_id', 
          as: 'category' 
        }},
        { $unwind: '$category' },
        { $match: { 'category.isActive': true } },
        { $replaceRoot: { newRoot: '$category' } },
        { $sort: { displayOrder: 1, name: 1 } }
      ]);
    } else if (tenantId) {
      query.tenantId = new mongoose.Types.ObjectId(tenantId);
    }
    // If tenantId is undefined (SuperAdmin), don't add tenant filter - show all categories

    return query;
  }`;

  content = content.replace(oldCategoriesQuery, newCategoriesQuery);

  fs.writeFileSync(filePath, content);
  console.log('✅ Menu service patched for SuperAdmin access');
};

patchMenuService();
