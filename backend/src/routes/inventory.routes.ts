import express from 'express';

import * as inventoryController from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Ingredient routes
router.get('/ingredients', inventoryController.getIngredients);
router.get('/ingredients/:id', inventoryController.getIngredient);
router.post('/ingredients', authorize('admin', 'manager'), inventoryController.createIngredient);
router.put('/ingredients/:id', authorize('admin', 'manager'), inventoryController.updateIngredient);
router.delete('/ingredients/:id', authorize('admin', 'manager'), inventoryController.deleteIngredient);
router.post('/ingredients/:id/adjust-stock', authorize('admin', 'manager', 'staff'), inventoryController.adjustStock);

// Recipe routes
router.get('/recipes', inventoryController.getRecipes);
router.get('/recipes/:id', inventoryController.getRecipe);
router.get('/recipes/menu-item/:menuItemId', inventoryController.getRecipeByMenuItem);
router.post('/recipes', authorize('admin', 'manager'), inventoryController.createRecipe);
router.put('/recipes/:id', authorize('admin', 'manager'), inventoryController.updateRecipe);
router.delete('/recipes/:id', authorize('admin', 'manager'), inventoryController.deleteRecipe);

// Stock movement and reports
router.get('/stock-movements', inventoryController.getStockMovements);
router.get('/reports/inventory', inventoryController.getInventoryReport);
router.get('/reports/waste', inventoryController.getWasteReport);

// Supplier routes
router.get('/suppliers', inventoryController.getSuppliers);
router.get('/suppliers/:id', inventoryController.getSupplier);
router.post('/suppliers', authorize('admin', 'manager'), inventoryController.createSupplier);
router.put('/suppliers/:id', authorize('admin', 'manager'), inventoryController.updateSupplier);
router.delete('/suppliers/:id', authorize('admin', 'manager'), inventoryController.deleteSupplier);

// Purchase order routes
router.get('/purchase-orders', inventoryController.getPurchaseOrders);
router.get('/purchase-orders/:id', inventoryController.getPurchaseOrder);
router.post('/purchase-orders', authorize('admin', 'manager'), inventoryController.createPurchaseOrder);
router.put('/purchase-orders/:id', authorize('admin', 'manager'), inventoryController.updatePurchaseOrder);
router.post('/purchase-orders/:id/approve', authorize('admin', 'manager'), inventoryController.approvePurchaseOrder);
router.post('/purchase-orders/:id/receive', authorize('admin', 'manager', 'staff'), inventoryController.receivePurchaseOrder);
router.post('/purchase-orders/:id/cancel', authorize('admin', 'manager'), inventoryController.cancelPurchaseOrder);

export default router;