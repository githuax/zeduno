import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { MenuItem } from '../models/MenuItem';
import { Category } from '../models/Category';
import mongoose from 'mongoose';
import { MenuService } from '../services/menu.service';

interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId?: string;  // Made optional for SuperAdmin
    role: string;
  };
}

// ===== MENU ITEM CONTROLLERS =====

export const getMenuItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    });

    res.json({
      success: true,
      data: result.items,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: parseInt(limit as string)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    const { id } = req.params;

    const menuItem = await MenuService.getMenuItemById(id, tenantId, false);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({ success: true, data: menuItem });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tenantId } = req.user!;
    const {
      name,
      description,
      price,
      categoryId,
      isVegetarian,
      isVegan,
      isGlutenFree,
      allergens,
      ingredients,
      nutritionalInfo,
      spiceLevel,
      preparationTime,
      servingSize,
      tags,
      image
    } = req.body;

    // Validate category exists and belongs to tenant
    const category = await Category.findOne({
      _id: new mongoose.Types.ObjectId(categoryId),
      tenantId: new mongoose.Types.ObjectId(tenantId)
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category or category does not belong to your restaurant'
      });
    }

    const menuItem = new MenuItem({
      name,
      description,
      price,
      categoryId: new mongoose.Types.ObjectId(categoryId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isVegetarian: isVegetarian || false,
      isVegan: isVegan || false,
      isGlutenFree: isGlutenFree || false,
      allergens: allergens || [],
      ingredients: ingredients || [],
      nutritionalInfo,
      spiceLevel: spiceLevel || 'mild',
      preparationTime: preparationTime || 15,
      servingSize: servingSize || 1,
      tags: tags || [],
      image,
      isAvailable: true,
      isActive: true,
      orderCount: 0
    });

    await menuItem.save();
    await menuItem.populate('categoryId', 'name description');

    res.status(201).json({
      success: true,
      data: menuItem,
      message: 'Menu item created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tenantId } = req.user!;
    const { id } = req.params;
    const updateData = req.body;

    // If categoryId is being updated, validate it
    if (updateData.categoryId) {
      const category = await Category.findOne({
        _id: new mongoose.Types.ObjectId(updateData.categoryId),
        tenantId: new mongoose.Types.ObjectId(tenantId)
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category or category does not belong to your restaurant'
        });
      }

      updateData.categoryId = new mongoose.Types.ObjectId(updateData.categoryId);
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        tenantId: new mongoose.Types.ObjectId(tenantId)
      },
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name description');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: menuItem,
      message: 'Menu item updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    const { id } = req.params;

    const menuItem = await MenuItem.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        tenantId: new mongoose.Types.ObjectId(tenantId)
      },
      { isActive: false },
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const toggleMenuItemAvailability = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    const { id } = req.params;
    const { isAvailable } = req.body;

    const menuItem = await MenuItem.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        tenantId: new mongoose.Types.ObjectId(tenantId),
        isActive: true
      },
      { isAvailable },
      { new: true }
    ).populate('categoryId', 'name description');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: menuItem,
      message: `Menu item marked as ${isAvailable ? 'available' : 'unavailable'}`
    });
  } catch (error) {
    next(error);
  }
};

// ===== CATEGORY CONTROLLERS =====

export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId, role } = req.user!;

    // SuperAdmin can see all categories, regular users only see their tenant categories
    const filterTenantId = role === 'superadmin' ? undefined : tenantId;
    const result = await MenuService.getCategories(filterTenantId, false);

    res.json({
      success: true,
      data: result.categories,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    const { id } = req.params;

    const category = await MenuService.getCategoryById(id, tenantId, false);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tenantId } = req.user!;
    const { name, description, displayOrder, isActive = true } = req.body;

    const category = new Category({
      name,
      description,
      displayOrder: displayOrder || 0,
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isActive
    });

    await category.save();

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tenantId } = req.user!;
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        tenantId: new mongoose.Types.ObjectId(tenantId)
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    const { id } = req.params;

    // Check if category has menu items
    const menuItemsCount = await MenuItem.countDocuments({
      categoryId: new mongoose.Types.ObjectId(id),
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isActive: true
    });

    if (menuItemsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that contains menu items. Please move or delete the menu items first.'
      });
    }

    const category = await Category.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        tenantId: new mongoose.Types.ObjectId(tenantId)
      },
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const reorderCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    const { categoryOrders } = req.body; // Array of { id, displayOrder }

    if (!Array.isArray(categoryOrders)) {
      return res.status(400).json({
        success: false,
        message: 'categoryOrders must be an array'
      });
    }

    // Update all categories in a transaction-like manner
    const updatePromises = categoryOrders.map(({ id, displayOrder }) =>
      Category.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(id),
          tenantId: new mongoose.Types.ObjectId(tenantId)
        },
        { displayOrder },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getMenuOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    
    // Get aggregate counts for all menu items
    const [menuStats] = await MenuItem.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          availableItems: {
            $sum: { $cond: [{ $eq: ['$isAvailable', true] }, 1, 0] }
          },
          unavailableItems: {
            $sum: { $cond: [{ $eq: ['$isAvailable', false] }, 1, 0] }
          }
        }
      }
    ]);

    // Get total categories count
    const totalCategories = await Category.countDocuments({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isActive: true
    });

    const overview = {
      totalItems: menuStats?.totalItems || 0,
      availableItems: menuStats?.availableItems || 0,
      unavailableItems: menuStats?.unavailableItems || 0,
      totalCategories: totalCategories || 0
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    next(error);
  }
};

// Alias for backward compatibility
export const toggleAvailability = toggleMenuItemAvailability;