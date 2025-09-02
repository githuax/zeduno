import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { 
  // Menu Item Controllers
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  
  // Category Controllers
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  
  // Utility Controllers
  getMenuOverview,
  
  // Legacy
  toggleAvailability
} from '../controllers/menu.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ===== MENU OVERVIEW =====
router.get('/overview', authorize('admin', 'manager'), getMenuOverview);

// ===== MENU ITEM ROUTES =====

// Get all menu items with filtering, searching, and pagination
router.get('/items', 
  [
    query('category').optional().isMongoId().withMessage('Category must be a valid ID'),
    query('search').optional().isString().trim().isLength({ min: 1, max: 100 }),
    query('available').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['name', 'price', 'popularity', 'createdAt']),
    query('order').optional().isIn(['asc', 'desc'])
  ],
  getMenuItems
);

// Get single menu item
router.get('/items/:id',
  [
    param('id').isMongoId().withMessage('Menu item ID must be valid')
  ],
  getMenuItem
);

// Create new menu item
router.post('/items',
  authorize('admin', 'manager'),
  [
    body('name')
      .notEmpty()
      .withMessage('Menu item name is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Name must be between 1 and 200 characters')
      .trim(),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description must be between 1 and 1000 characters')
      .trim(),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number')
      .custom((value) => {
        const decimal = parseFloat(value);
        return Number(decimal.toFixed(2)) === decimal;
      })
      .withMessage('Price must have at most 2 decimal places'),
    body('categoryId')
      .notEmpty()
      .withMessage('Category is required')
      .isMongoId()
      .withMessage('Category must be a valid ID'),
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be valid'),
    body('images')
      .optional()
      .isArray()
      .withMessage('Images must be an array'),
    body('images.*')
      .optional()
      .isURL()
      .withMessage('Each image must be a valid URL'),
    body('isAvailable')
      .optional()
      .isBoolean()
      .withMessage('Availability must be true or false'),
    body('preparationTime')
      .optional()
      .isInt({ min: 0, max: 480 })
      .withMessage('Preparation time must be between 0 and 480 minutes'),
    body('customizationOptions')
      .optional()
      .isArray()
      .withMessage('Customization options must be an array'),
    body('customizationOptions.*.name')
      .optional()
      .notEmpty()
      .withMessage('Customization option name is required'),
    body('customizationOptions.*.price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Customization option price must be positive'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters'),
    body('isVegetarian')
      .optional()
      .isBoolean(),
    body('isVegan')
      .optional()
      .isBoolean(),
    body('isGlutenFree')
      .optional()
      .isBoolean(),
    body('spiceLevel')
      .optional()
      .isIn(['none', 'mild', 'medium', 'hot', 'extra-hot'])
      .withMessage('Spice level must be: none, mild, medium, hot, or extra-hot'),
    body('stockQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a positive number')
  ],
  createMenuItem
);

// Update menu item
router.put('/items/:id',
  authorize('admin', 'manager'),
  [
    param('id').isMongoId().withMessage('Menu item ID must be valid'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('Name must be between 1 and 200 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description must be between 1 and 1000 characters')
      .trim(),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number')
      .custom((value) => {
        if (value === undefined) return true;
        const decimal = parseFloat(value);
        return Number(decimal.toFixed(2)) === decimal;
      })
      .withMessage('Price must have at most 2 decimal places'),
    body('categoryId')
      .optional()
      .isMongoId()
      .withMessage('Category must be a valid ID'),
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be valid'),
    body('images')
      .optional()
      .isArray()
      .withMessage('Images must be an array'),
    body('preparationTime')
      .optional()
      .isInt({ min: 0, max: 480 })
      .withMessage('Preparation time must be between 0 and 480 minutes'),
    body('spiceLevel')
      .optional()
      .isIn(['none', 'mild', 'medium', 'hot', 'extra-hot'])
      .withMessage('Spice level must be: none, mild, medium, hot, or extra-hot')
  ],
  updateMenuItem
);

// Toggle menu item availability
router.patch('/items/:id/availability',
  authorize('admin', 'manager', 'staff'),
  [
    param('id').isMongoId().withMessage('Menu item ID must be valid'),
    body('isAvailable')
      .isBoolean()
      .withMessage('Availability status is required and must be boolean')
  ],
  toggleMenuItemAvailability
);

// Delete menu item (soft delete)
router.delete('/items/:id',
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Menu item ID must be valid')
  ],
  deleteMenuItem
);

// ===== CATEGORY ROUTES =====

// Get all categories
router.get('/categories',
  [
    query('includeCount')
      .optional()
      .isBoolean()
      .withMessage('includeCount must be true or false')
  ],
  getCategories
);

// Get single category
router.get('/categories/:id',
  [
    param('id').isMongoId().withMessage('Category ID must be valid')
  ],
  getCategory
);

// Create new category
router.post('/categories',
  authorize('admin', 'manager'),
  [
    body('name')
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name must be between 1 and 100 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
      .trim(),
    body('displayOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a positive number')
  ],
  createCategory
);

// Update category
router.put('/categories/:id',
  authorize('admin', 'manager'),
  [
    param('id').isMongoId().withMessage('Category ID must be valid'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name must be between 1 and 100 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
      .trim(),
    body('displayOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a positive number')
  ],
  updateCategory
);

// Reorder categories
router.patch('/categories/reorder',
  authorize('admin', 'manager'),
  [
    body('categoryIds')
      .isArray({ min: 1 })
      .withMessage('Category IDs array is required'),
    body('categoryIds.*')
      .isMongoId()
      .withMessage('Each category ID must be valid')
  ],
  reorderCategories
);

// Delete category (soft delete)
router.delete('/categories/:id',
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Category ID must be valid')
  ],
  deleteCategory
);

// ===== LEGACY ROUTES (for backward compatibility) =====
router.patch('/items/:id/toggle-availability',
  authorize('admin', 'manager', 'staff'),
  [
    param('id').isMongoId().withMessage('Menu item ID must be valid')
  ],
  toggleAvailability
);

export default router;