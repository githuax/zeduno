import { Request, Response } from 'express';
import { Ingredient } from '../models/Ingredient';
import { Recipe } from '../models/Recipe';
import { StockMovement } from '../models/StockMovement';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder } from '../models/PurchaseOrder';
import mongoose from 'mongoose';
import { inventoryCache } from '../utils/cache';

// Ingredient Management
export const getIngredients = async (req: Request, res: Response) => {
  try {
    const { category, lowStock, expiring } = req.query;
    const tenantId = (req as any).user.tenantId;

    let query: any = { tenantId, isActive: true };

    if (category) {
      query.category = category;
    }

    let ingredients;
    
    if (lowStock === 'true') {
      ingredients = await Ingredient.find({
        ...query,
        $expr: { $lte: ['$currentStock', '$minStockLevel'] }
      }).sort({ currentStock: 1 });
    } else if (expiring === 'true') {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      ingredients = await Ingredient.find({
        ...query,
        expiryDate: {
          $gte: new Date(),
          $lte: futureDate
        }
      }).sort({ expiryDate: 1 });
    } else {
      ingredients = await Ingredient.find(query).sort({ name: 1 });
    }

    res.json(ingredients);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const ingredient = await Ingredient.findOne({ _id: id, tenantId });
    
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    res.json(ingredient);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createIngredient = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.id;

    const ingredient = new Ingredient({
      ...req.body,
      tenantId
    });

    await ingredient.save();

    // Create initial stock movement
    if (ingredient.currentStock > 0) {
      await StockMovement.create({
        type: 'adjustment',
        referenceType: 'ingredient',
        referenceId: ingredient._id,
        quantity: ingredient.currentStock,
        unit: ingredient.unit,
        previousStock: 0,
        newStock: ingredient.currentStock,
        cost: ingredient.cost * ingredient.currentStock,
        reason: 'Initial stock',
        performedBy: userId,
        tenantId
      });
    }

    // Invalidate cache when new ingredient is added
    inventoryCache.invalidate(`menu-inventory-${tenantId}`);
    inventoryCache.invalidate(`item-availability-${tenantId}`);

    res.status(201).json(ingredient);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const ingredient = await Ingredient.findOneAndUpdate(
      { _id: id, tenantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    // Invalidate cache when ingredient is updated
    inventoryCache.invalidate(`menu-inventory-${tenantId}`);
    inventoryCache.invalidate(`item-availability-${tenantId}`);

    res.json(ingredient);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const ingredient = await Ingredient.findOneAndUpdate(
      { _id: id, tenantId },
      { isActive: false },
      { new: true }
    );

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, operation, reason, notes } = req.body;
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.id;

    const ingredient = await Ingredient.findOne({ _id: id, tenantId });
    
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    const previousStock = ingredient.currentStock;
    
    if (operation === 'add') {
      ingredient.currentStock += quantity;
    } else if (operation === 'subtract') {
      if (ingredient.currentStock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      ingredient.currentStock -= quantity;
    } else if (operation === 'set') {
      ingredient.currentStock = quantity;
    }

    await ingredient.save();

    // Create stock movement record
    await StockMovement.create({
      type: 'adjustment',
      referenceType: 'ingredient',
      referenceId: ingredient._id,
      quantity: Math.abs(ingredient.currentStock - previousStock),
      unit: ingredient.unit,
      previousStock,
      newStock: ingredient.currentStock,
      reason,
      notes,
      performedBy: userId,
      tenantId
    });

    // Invalidate menu-inventory cache when stock changes
    inventoryCache.invalidate(`menu-inventory-${tenantId}`);
    inventoryCache.invalidate(`item-availability-${tenantId}`);
    console.log('Menu inventory cache invalidated after stock adjustment');

    res.json(ingredient);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Recipe Management
export const getRecipes = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const recipes = await Recipe.find({ tenantId, isActive: true })
      .populate('menuItemId')
      .populate('ingredients.ingredientId')
      .sort({ createdAt: -1 });

    res.json(recipes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const recipe = await Recipe.findOne({ _id: id, tenantId })
      .populate('menuItemId')
      .populate('ingredients.ingredientId');
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const cost = await recipe.calculateCost();
    const available = await recipe.checkIngredientsAvailable(1);

    res.json({
      ...recipe.toObject(),
      estimatedCost: cost,
      ingredientsAvailable: available
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecipeByMenuItem = async (req: Request, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const tenantId = (req as any).user.tenantId;

    const recipe = await Recipe.findOne({ menuItemId, tenantId, isActive: true })
      .populate('ingredients.ingredientId');
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found for this menu item' });
    }

    const cost = await recipe.calculateCost();
    const available = await recipe.checkIngredientsAvailable(1);

    res.json({
      ...recipe.toObject(),
      estimatedCost: cost,
      ingredientsAvailable: available
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createRecipe = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    // Check if recipe already exists for this menu item
    const existingRecipe = await Recipe.findOne({ 
      menuItemId: req.body.menuItemId, 
      tenantId 
    });

    if (existingRecipe) {
      return res.status(400).json({ 
        message: 'Recipe already exists for this menu item' 
      });
    }

    const recipe = new Recipe({
      ...req.body,
      tenantId
    });

    await recipe.save();
    await recipe.populate('menuItemId ingredients.ingredientId');

    res.status(201).json(recipe);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const recipe = await Recipe.findOneAndUpdate(
      { _id: id, tenantId },
      req.body,
      { new: true, runValidators: true }
    ).populate('menuItemId ingredients.ingredientId');

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const recipe = await Recipe.findOneAndUpdate(
      { _id: id, tenantId },
      { isActive: false },
      { new: true }
    );

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Stock Movement Reports
export const getStockMovements = async (req: Request, res: Response) => {
  try {
    const { type, referenceId, startDate, endDate, limit = 50 } = req.query;
    const tenantId = (req as any).user.tenantId;

    let query: any = { tenantId };

    if (type) {
      query.type = type;
    }

    if (referenceId) {
      query.referenceId = referenceId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }

    const movements = await StockMovement.find(query)
      .populate('performedBy', 'username')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json(movements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getInventoryReport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const [ingredients, lowStock, expiring, totalValue] = await Promise.all([
      Ingredient.countDocuments({ tenantId, isActive: true }),
      Ingredient.find({
        tenantId,
        isActive: true,
        $expr: { $lte: ['$currentStock', '$minStockLevel'] }
      }).countDocuments(),
      Ingredient.find({
        tenantId,
        isActive: true,
        expiryDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }).countDocuments(),
      Ingredient.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), isActive: true } },
        { $group: {
          _id: null,
          total: { $sum: { $multiply: ['$currentStock', '$cost'] } }
        }}
      ])
    ]);

    const report = {
      totalIngredients: ingredients,
      lowStockItems: lowStock,
      expiringItems: expiring,
      totalInventoryValue: totalValue[0]?.total || 0,
      generatedAt: new Date()
    };

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getWasteReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = (req as any).user.tenantId;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const wasteData = await StockMovement.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          type: 'waste',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            referenceId: '$referenceId',
            referenceType: '$referenceType'
          },
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$cost' },
          count: { $sum: 1 },
          reasons: { $push: '$reason' }
        }
      },
      {
        $sort: { totalCost: -1 }
      }
    ]);

    const totalWasteCost = wasteData.reduce((sum, item) => sum + (item.totalCost || 0), 0);

    res.json({
      wasteItems: wasteData,
      totalWasteCost,
      period: {
        start,
        end
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Supplier Management
export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const tenantId = (req as any).user.tenantId;

    let query: any = { tenantId, isActive: true };

    if (category) {
      query.categories = category;
    }

    const suppliers = await Supplier.find(query).sort({ name: 1 });

    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const supplier = await Supplier.findOne({ _id: id, tenantId });
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const supplier = new Supplier({
      ...req.body,
      tenantId
    });

    await supplier.save();

    res.status(201).json(supplier);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const supplier = await Supplier.findOneAndUpdate(
      { _id: id, tenantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const supplier = await Supplier.findOneAndUpdate(
      { _id: id, tenantId },
      { isActive: false },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Purchase Order Management
export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { status, supplierId, startDate, endDate } = req.query;
    const tenantId = (req as any).user.tenantId;

    let query: any = { tenantId };

    if (status) {
      query.status = status;
    }

    if (supplierId) {
      query.supplierId = supplierId;
    }

    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        query.orderDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.orderDate.$lte = new Date(endDate as string);
      }
    }

    const orders = await PurchaseOrder.find(query)
      .populate('supplierId', 'name')
      .populate('createdBy', 'username')
      .populate('approvedBy', 'username')
      .sort({ orderDate: -1 });

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const order = await PurchaseOrder.findOne({ _id: id, tenantId })
      .populate('supplierId')
      .populate('items.ingredientId')
      .populate('createdBy', 'username')
      .populate('approvedBy', 'username')
      .populate('receivedBy', 'username');
    
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.id;

    const order = new PurchaseOrder({
      ...req.body,
      tenantId,
      createdBy: userId
    });

    order.calculateTotals();
    await order.save();

    await order.populate('supplierId items.ingredientId');

    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const order = await PurchaseOrder.findOne({ _id: id, tenantId });

    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (order.status !== 'draft') {
      return res.status(400).json({ message: 'Can only edit draft orders' });
    }

    Object.assign(order, req.body);
    order.calculateTotals();
    await order.save();

    await order.populate('supplierId items.ingredientId');

    res.json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const approvePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.id;

    const order = await PurchaseOrder.findOne({ _id: id, tenantId });

    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order must be in pending status to approve' });
    }

    await order.approve(userId);
    await order.populate('supplierId items.ingredientId');

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const receivePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { receivedItems } = req.body;
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.id;

    const order = await PurchaseOrder.findOne({ _id: id, tenantId });

    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (!['approved', 'ordered', 'partial'].includes(order.status)) {
      return res.status(400).json({ message: 'Order must be approved to receive' });
    }

    const receivedMap = receivedItems ? new Map(Object.entries(receivedItems).map(([k, v]) => [k, Number(v)])) : undefined;
    await order.markAsReceived(userId, receivedMap);
    await order.populate('supplierId items.ingredientId');

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const order = await PurchaseOrder.findOne({ _id: id, tenantId });

    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (['received', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};