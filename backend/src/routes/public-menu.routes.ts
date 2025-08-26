import { Router } from 'express';
import { query, param } from 'express-validator';
import { 
  getPublicMenuItems,
  getPublicMenuItem,
  getPublicCategories,
  getPublicCategory
} from '../controllers/public-menu.controller';

const router = Router();

// ===== PUBLIC MENU ROUTES (No authentication required) =====

// Get all available menu items for customers
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
  getPublicMenuItems
);

// Get single menu item for customers
router.get('/items/:id',
  [
    param('id').isMongoId().withMessage('Menu item ID must be valid')
  ],
  getPublicMenuItem
);

// Get all active categories for customers
router.get('/categories',
  [
    query('includeCount')
      .optional()
      .isBoolean()
      .withMessage('includeCount must be true or false')
  ],
  getPublicCategories
);

// Get single category for customers
router.get('/categories/:id',
  [
    param('id').isMongoId().withMessage('Category ID must be valid')
  ],
  getPublicCategory
);

export default router;