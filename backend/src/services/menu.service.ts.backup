import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem';
import { Category } from '../models/Category';

export interface MenuQueryParams {
  category?: string;
  search?: string;
  available?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: string;
  tenantId?: string;
  isPublic?: boolean;
}

export interface MenuQueryResult {
  items: any[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface CategoryQueryResult {
  categories: any[];
  total: number;
}

export class MenuService {
  /**
   * Build menu items query based on parameters
   */
  static buildMenuItemsQuery(params: MenuQueryParams): any {
    const { category, available, search, tenantId, isPublic } = params;
    
    let query: any = { isActive: true };

    // For public access, only show available items
    if (isPublic) {
      query.isAvailable = true;
    } else if (tenantId) {
      // For authenticated access, filter by tenant
      query.tenantId = new mongoose.Types.ObjectId(tenantId);
    }

    // Filter by category
    if (category) {
      query.categoryId = new mongoose.Types.ObjectId(category);
    }

    // Filter by availability (for admin, they can see unavailable items)
    if (available !== undefined && !isPublic) {
      query.isAvailable = available === 'true';
    }

    // Search functionality
    if (search) {
      if (isPublic) {
        // Public search uses regex for broader matching
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      } else {
        // Admin search uses text index for performance
        query.$text = { $search: search };
      }
    }

    return query;
  }

  /**
   * Build sort options
   */
  static buildSortOptions(sortBy: string = 'name', order: string = 'asc'): any {
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    
    switch (sortBy) {
      case 'price':
        sortObj.price = sortOrder;
        break;
      case 'createdAt':
        sortObj.createdAt = sortOrder;
        break;
      case 'popularity':
        sortObj.orderCount = sortOrder;
        break;
      case 'category':
        sortObj['categoryId.name'] = sortOrder;
        break;
      default:
        sortObj.name = sortOrder;
    }
    
    return sortObj;
  }

  /**
   * Get menu items with pagination and filtering
   */
  static async getMenuItems(params: MenuQueryParams): Promise<MenuQueryResult> {
    const { page = 1, limit = 50, sortBy = 'name', order = 'asc' } = params;

    const query = this.buildMenuItemsQuery(params);
    const sortOptions = this.buildSortOptions(sortBy, order);

    // Pagination
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;

    // Execute query with population
    const [items, total] = await Promise.all([
      MenuItem.find(query)
        .populate('categoryId', 'name description')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MenuItem.countDocuments(query)
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum
    };
  }

  /**
   * Get single menu item by ID
   */
  static async getMenuItemById(id: string, tenantId?: string, isPublic: boolean = false): Promise<any> {
    const query: any = { 
      _id: new mongoose.Types.ObjectId(id),
      isActive: true 
    };

    if (isPublic) {
      query.isAvailable = true;
    } else if (tenantId) {
      query.tenantId = new mongoose.Types.ObjectId(tenantId);
    }

    return await MenuItem.findOne(query)
      .populate('categoryId', 'name description')
      .lean();
  }

  /**
   * Build categories query
   */
  static buildCategoriesQuery(tenantId?: string, isPublic: boolean = false): any {
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
  }

  /**
   * Get categories with filtering
   */
  static async getCategories(tenantId?: string, isPublic: boolean = false): Promise<CategoryQueryResult> {
    if (isPublic) {
      const categories = await this.buildCategoriesQuery(tenantId, isPublic);
      return {
        categories,
        total: categories.length
      };
    } else {
      const query = this.buildCategoriesQuery(tenantId, isPublic);
      const categories = await Category.find(query)
        .sort({ displayOrder: 1, name: 1 })
        .lean();
      
      return {
        categories,
        total: categories.length
      };
    }
  }

  /**
   * Get single category by ID
   */
  static async getCategoryById(id: string, tenantId?: string, isPublic: boolean = false): Promise<any> {
    const query: any = { 
      _id: new mongoose.Types.ObjectId(id),
      isActive: true 
    };

    if (!isPublic && tenantId) {
      query.tenantId = new mongoose.Types.ObjectId(tenantId);
    }

    const category = await Category.findOne(query).lean();
    
    if (isPublic && category) {
      // For public access, also check if category has available items
      const hasAvailableItems = await MenuItem.countDocuments({
        categoryId: category._id,
        isActive: true,
        isAvailable: true
      });
      
      if (hasAvailableItems === 0) {
        return null;
      }
    }

    return category;
  }
}