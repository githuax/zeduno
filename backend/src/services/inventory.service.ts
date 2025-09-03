import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem';
import { Recipe } from '../models/Recipe';
import { Ingredient } from '../models/Ingredient';
import { StockMovement } from '../models/StockMovement';
import { IOrder } from '../models/Order';

export class InventoryService {
  /**
   * Check if all items in an order have sufficient stock
   */
  static async checkOrderInventory(items: any[], tenantId: string): Promise<{
    available: boolean;
    unavailableItems: any[];
  }> {
    const unavailableItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findOne({ 
        _id: item.menuItem, 
        tenantId 
      });

      if (!menuItem) {
        unavailableItems.push({
          menuItem: item.menuItem,
          reason: 'Menu item not found'
        });
        continue;
      }

      // Check if menu item tracks inventory directly
      if (menuItem.trackInventory) {
        const available = menuItem.checkStockAvailable(item.quantity);
        if (!available) {
          unavailableItems.push({
            menuItem: menuItem._id,
            name: menuItem.name,
            requested: item.quantity,
            available: menuItem.amount,
            reason: 'Insufficient stock'
          });
        }
      }

      // Check recipe ingredients if recipe exists
      const recipe = await Recipe.findOne({ 
        menuItemId: item.menuItem, 
        tenantId,
        isActive: true 
      });

      if (recipe) {
        const ingredientsAvailable = await recipe.checkIngredientsAvailable(item.quantity);
        if (!ingredientsAvailable) {
          // Get specific ingredients that are unavailable
          const unavailableIngredients = [];
          for (const recipeItem of recipe.ingredients) {
            const ingredient = await Ingredient.findById(recipeItem.ingredientId);
            if (ingredient) {
              const required = recipeItem.quantity * item.quantity;
              if (ingredient.currentStock < required) {
                unavailableIngredients.push({
                  name: ingredient.name,
                  required,
                  available: ingredient.currentStock
                });
              }
            }
          }

          unavailableItems.push({
            menuItem: menuItem._id,
            name: menuItem.name,
            reason: 'Insufficient ingredients',
            unavailableIngredients
          });
        }
      }
    }

    return {
      available: unavailableItems.length === 0,
      unavailableItems
    };
  }

  /**
   * Consume inventory when an order is confirmed
   */
  static async consumeOrderInventory(
    order: IOrder, 
    userId: string
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const item of order.items) {
        const menuItem = await MenuItem.findById(item.menuItem).session(session);
        
        if (!menuItem) continue;

        // Reduce menu item stock if it tracks inventory
        if (menuItem.trackInventory) {
          await menuItem.reduceStock(item.quantity);
          
          // Create stock movement record
          await StockMovement.create([{
            type: 'consumption',
            referenceType: 'menuItem',
            referenceId: menuItem._id,
            quantity: item.quantity,
            unit: 'piece',
            previousStock: menuItem.amount + item.quantity,
            newStock: menuItem.amount,
            orderId: order._id,
            performedBy: userId,
            tenantId: order.tenantId
          }], { session });
        }

        // Consume recipe ingredients if recipe exists
        const recipe = await Recipe.findOne({ 
          menuItemId: item.menuItem, 
          tenantId: order.tenantId,
          isActive: true 
        }).session(session);

        if (recipe) {
          for (const recipeItem of recipe.ingredients) {
            const ingredient = await Ingredient.findById(recipeItem.ingredientId).session(session);
            
            if (ingredient) {
              const consumeQuantity = recipeItem.quantity * item.quantity;
              const previousStock = ingredient.currentStock;
              
              await ingredient.updateStock(consumeQuantity, 'subtract');
              
              // Create stock movement record for ingredient
              await StockMovement.create([{
                type: 'consumption',
                referenceType: 'ingredient',
                referenceId: ingredient._id,
                quantity: consumeQuantity,
                unit: ingredient.unit,
                previousStock,
                newStock: ingredient.currentStock,
                orderId: order._id,
                reason: `Used in ${menuItem.name}`,
                performedBy: userId,
                tenantId: order.tenantId
              }], { session });
            }
          }
        }
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Return inventory when an order is cancelled
   */
  static async returnOrderInventory(
    order: IOrder,
    userId: string
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const item of order.items) {
        const menuItem = await MenuItem.findById(item.menuItem).session(session);
        
        if (!menuItem) continue;

        // Return menu item stock if it tracks inventory
        if (menuItem.trackInventory) {
          await menuItem.increaseStock(item.quantity);
          
          // Create stock movement record
          await StockMovement.create([{
            type: 'return',
            referenceType: 'menuItem',
            referenceId: menuItem._id,
            quantity: item.quantity,
            unit: 'piece',
            previousStock: menuItem.amount - item.quantity,
            newStock: menuItem.amount,
            orderId: order._id,
            reason: 'Order cancelled',
            performedBy: userId,
            tenantId: order.tenantId
          }], { session });
        }

        // Return recipe ingredients if recipe exists
        const recipe = await Recipe.findOne({ 
          menuItemId: item.menuItem, 
          tenantId: order.tenantId,
          isActive: true 
        }).session(session);

        if (recipe) {
          for (const recipeItem of recipe.ingredients) {
            const ingredient = await Ingredient.findById(recipeItem.ingredientId).session(session);
            
            if (ingredient) {
              const returnQuantity = recipeItem.quantity * item.quantity;
              const previousStock = ingredient.currentStock;
              
              await ingredient.updateStock(returnQuantity, 'add');
              
              // Create stock movement record for ingredient
              await StockMovement.create([{
                type: 'return',
                referenceType: 'ingredient',
                referenceId: ingredient._id,
                quantity: returnQuantity,
                unit: ingredient.unit,
                previousStock,
                newStock: ingredient.currentStock,
                orderId: order._id,
                reason: 'Order cancelled',
                performedBy: userId,
                tenantId: order.tenantId
              }], { session });
            }
          }
        }
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Record waste
   */
  static async recordWaste(
    itemType: 'ingredient' | 'menuItem',
    itemId: string,
    quantity: number,
    reason: string,
    notes: string,
    userId: string,
    tenantId: string
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let item: any;
      let unit: string;
      let cost: number;
      let previousStock: number;

      if (itemType === 'ingredient') {
        item = await Ingredient.findById(itemId).session(session);
        if (!item) throw new Error('Ingredient not found');
        
        unit = item.unit;
        cost = item.cost * quantity;
        previousStock = item.currentStock;
        
        await item.updateStock(quantity, 'subtract');
      } else {
        item = await MenuItem.findById(itemId).session(session);
        if (!item) throw new Error('Menu item not found');
        
        unit = 'piece';
        cost = item.price * quantity;
        previousStock = item.amount;
        
        if (item.trackInventory) {
          await item.reduceStock(quantity);
        }
      }

      // Create stock movement record
      await StockMovement.create([{
        type: 'waste',
        referenceType: itemType,
        referenceId: itemId,
        quantity,
        unit,
        previousStock,
        newStock: previousStock - quantity,
        cost,
        reason,
        notes,
        performedBy: userId,
        tenantId
      }], { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get low stock alerts
   */
  static async getLowStockAlerts(tenantId: string): Promise<{
    ingredients: any[];
    menuItems: any[];
  }> {
    const [ingredients, menuItems] = await Promise.all([
      Ingredient.find({
        tenantId,
        isActive: true,
        $expr: { $lte: ['$currentStock', '$minStockLevel'] }
      }).sort({ currentStock: 1 }),
      
      MenuItem.find({
        tenantId,
        isActive: true,
        trackInventory: true,
        $expr: { $lte: ['$amount', '$minStockLevel'] }
      }).sort({ amount: 1 })
    ]);

    return { ingredients, menuItems };
  }

  /**
   * Get expiring items
   */
  static async getExpiringItems(tenantId: string, daysAhead: number = 7): Promise<any[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return Ingredient.find({
      tenantId,
      isActive: true,
      expiryDate: {
        $gte: new Date(),
        $lte: futureDate
      }
    }).sort({ expiryDate: 1 });
  }

  /**
   * Calculate inventory value
   */
  static async calculateInventoryValue(tenantId: string): Promise<{
    ingredientValue: number;
    menuItemValue: number;
    totalValue: number;
  }> {
    const [ingredientResult, menuItemResult] = await Promise.all([
      Ingredient.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), isActive: true } },
        { $group: {
          _id: null,
          total: { $sum: { $multiply: ['$currentStock', '$cost'] } }
        }}
      ]),
      
      MenuItem.aggregate([
        { 
          $match: { 
            tenantId: new mongoose.Types.ObjectId(tenantId), 
            isActive: true,
            trackInventory: true 
          } 
        },
        { $group: {
          _id: null,
          total: { $sum: { $multiply: ['$amount', '$price'] } }
        }}
      ])
    ]);

    const ingredientValue = ingredientResult[0]?.total || 0;
    const menuItemValue = menuItemResult[0]?.total || 0;

    return {
      ingredientValue,
      menuItemValue,
      totalValue: ingredientValue + menuItemValue
    };
  }
}