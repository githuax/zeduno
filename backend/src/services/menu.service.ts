import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem';
import { Category } from '../models/Category';
import { Recipe } from '../models/Recipe';
import { Ingredient } from '../models/Ingredient';
import { inventoryCache } from '../utils/cache';

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

  /**
   * Check ingredient availability for a menu item (with caching)
   */
  static async checkMenuItemIngredientAvailability(menuItemId: string, tenantId: string): Promise<{
    isAvailable: boolean;
    unavailableIngredients: string[];
    recipe?: any;
  }> {
    // Create cache key
    const cacheKey = `item-availability-${tenantId}-${menuItemId}`;
    
    // Check cache first (30 second TTL for individual items)
    const cached = inventoryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const recipe = await Recipe.findOne({
        menuItemId: new mongoose.Types.ObjectId(menuItemId),
        tenantId: new mongoose.Types.ObjectId(tenantId)
      }).populate('ingredients.ingredientId', 'name currentStock minStockLevel unit');

      if (!recipe) {
        // If no recipe exists, consider it available (manual tracking)
        const result = {
          isAvailable: true,
          unavailableIngredients: [],
          recipe: null
        };
        // Cache for 30 seconds
        inventoryCache.set(cacheKey, result, 30);
        return result;
      }

      const unavailableIngredients: string[] = [];

      for (const recipeIngredient of recipe.ingredients) {
        const ingredient = recipeIngredient.ingredientId as any;
        if (!ingredient || ingredient.currentStock < recipeIngredient.quantity) {
          unavailableIngredients.push(ingredient?.name || 'Unknown ingredient');
        }
      }

      const result = {
        isAvailable: unavailableIngredients.length === 0,
        unavailableIngredients,
        recipe
      };

      // Cache for 30 seconds
      inventoryCache.set(cacheKey, result, 30);
      
      return result;
    } catch (error) {
      console.error('Error checking ingredient availability:', error);
      return {
        isAvailable: true, // Default to available on error
        unavailableIngredients: [],
        recipe: null
      };
    }
  }

  /**
   * Get menu items with inventory availability information (with caching)
   */
  static async getMenuItemsWithInventory(params: MenuQueryParams): Promise<MenuQueryResult> {
    // Create cache key based on params
    const cacheKey = `menu-inventory-${params.tenantId}-${JSON.stringify(params)}`;
    
    // Check cache first (60 second TTL)
    const cached = inventoryCache.get(cacheKey);
    if (cached) {
      console.log('Menu inventory data served from cache');
      return cached;
    }

    // Fetch fresh data
    const result = await this.getMenuItems(params);
    
    if (!params.tenantId) {
      return result;
    }

    // Add inventory availability to each item
    const itemsWithInventory = await Promise.all(
      result.items.map(async (item) => {
        const availability = await this.checkMenuItemIngredientAvailability(
          item._id.toString(),
          params.tenantId!
        );

        return {
          ...item,
          inventoryAvailable: availability.isAvailable,
          unavailableIngredients: availability.unavailableIngredients,
          hasRecipe: !!availability.recipe
        };
      })
    );

    const finalResult = {
      ...result,
      items: itemsWithInventory
    };

    // Cache the result for 60 seconds
    inventoryCache.set(cacheKey, finalResult, 60);
    console.log('Menu inventory data cached for 60 seconds');

    return finalResult;
  }

  /**
   * Get single menu item with inventory information
   */
  static async getMenuItemByIdWithInventory(id: string, tenantId?: string, isPublic: boolean = false): Promise<any> {
    const menuItem = await this.getMenuItemById(id, tenantId, isPublic);
    
    if (!menuItem || !tenantId || isPublic) {
      return menuItem;
    }

    const availability = await this.checkMenuItemIngredientAvailability(id, tenantId);

    return {
      ...menuItem,
      inventoryAvailable: availability.isAvailable,
      unavailableIngredients: availability.unavailableIngredients,
      hasRecipe: !!availability.recipe,
      recipe: availability.recipe
    };
  }

  /**
   * Get low stock menu items (items with recipes that have insufficient ingredients)
   */
  static async getLowStockMenuItems(tenantId: string): Promise<any[]> {
    try {
      const recipes = await Recipe.find({
        tenantId: new mongoose.Types.ObjectId(tenantId)
      }).populate('menuItemId', 'name price').populate('ingredients.ingredientId', 'name currentStock minStockLevel unit');

      const lowStockItems = [];

      for (const recipe of recipes) {
        const unavailableIngredients = [];
        
        for (const recipeIngredient of recipe.ingredients) {
          const ingredient = recipeIngredient.ingredientId as any;
          if (!ingredient || ingredient.currentStock < recipeIngredient.quantity) {
            unavailableIngredients.push({
              name: ingredient?.name || 'Unknown',
              required: recipeIngredient.quantity,
              available: ingredient?.currentStock || 0,
              unit: ingredient?.unit || 'units'
            });
          }
        }

        if (unavailableIngredients.length > 0) {
          lowStockItems.push({
            menuItem: recipe.menuItemId,
            recipe: recipe,
            unavailableIngredients
          });
        }
      }

      return lowStockItems;
    } catch (error) {
      console.error('Error getting low stock menu items:', error);
      return [];
    }
  }
}