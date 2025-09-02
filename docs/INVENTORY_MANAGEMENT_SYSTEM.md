# Inventory Management System

## Overview

The ZedUno Restaurant Management System now includes a comprehensive inventory management system that automatically tracks stock levels for menu items. When items are sold through orders, the stock quantity is automatically reduced, preventing overselling and providing real-time inventory visibility.

## Features

### 📦 Stock Tracking
- **Real-time inventory updates** when orders are placed or cancelled
- **Automatic stock reduction** on order confirmation
- **Stock restoration** when orders are cancelled
- **Configurable inventory tracking** per menu item

### 🎯 Stock Validation
- **Prevents overselling** with real-time stock checks
- **Visual stock indicators** in the order interface
- **Low stock alerts** based on minimum thresholds
- **Out-of-stock prevention** with disabled order buttons

### 📊 Inventory Management
- **Minimum stock level alerts** for proactive restocking
- **Maximum stock capacity** settings for inventory planning
- **Individual item tracking control** (can be enabled/disabled per item)
- **Stock level visibility** in menu management

## Implementation Details

### Backend Model Updates

#### MenuItem Schema Extensions
```typescript
interface IMenuItem {
  // ... existing fields
  amount: number;              // Current stock quantity
  minStockLevel?: number;      // Alert when stock falls below this level
  maxStockLevel?: number;      // Maximum inventory capacity
  trackInventory: boolean;     // Whether to track inventory for this item
}
```

#### Stock Management Methods
```typescript
// Reduce stock when items are sold
await menuItem.reduceStock(quantity);

// Increase stock when restocking or cancelling orders
await menuItem.increaseStock(quantity);

// Check if sufficient stock is available
const isAvailable = menuItem.checkStockAvailable(quantity);

// Check if stock is running low
const needsRestock = menuItem.isLowStock();
```

### Order Processing Integration

#### Stock Validation During Order Creation
- Validates stock availability before processing orders
- Implements rollback mechanism if any item lacks sufficient stock
- Returns detailed error messages for insufficient stock scenarios

#### Automatic Stock Updates
```typescript
// Order creation reduces stock
for (const item of orderData.items) {
  if (menuItem.trackInventory) {
    await menuItem.reduceStock(item.quantity);
  }
}

// Order cancellation restores stock
for (const item of order.items) {
  if (menuItem.trackInventory) {
    await menuItem.increaseStock(item.quantity);
  }
}
```

### Frontend Interface Updates

#### Menu Item Management Forms
- **Create/Edit Forms** include inventory management section
- **Stock tracking toggle** to enable/disable per item
- **Current stock, minimum, and maximum level inputs**
- **Form validation** for required stock amounts

#### Order Interface Enhancements
- **Stock badges** showing remaining quantity or "Out of Stock"
- **Color-coded indicators**: Red for low stock, outline for normal stock
- **Disabled add buttons** for out-of-stock items
- **Toast notifications** when attempting to exceed available stock

## Usage Guide

### Setting Up Inventory Tracking

1. **Enable Inventory Tracking**
   - Edit a menu item
   - Toggle "Track inventory for this item"
   - Set current stock amount
   - Optionally set minimum and maximum stock levels

2. **Managing Stock Levels**
   - **Current Stock**: Enter the number of units currently available
   - **Minimum Stock Level**: Set threshold for low stock alerts
   - **Maximum Stock Level**: Set maximum capacity (optional)

### Taking Orders with Stock Management

1. **Visual Indicators**
   - Items show stock quantity badges (e.g., "15 left")
   - Out-of-stock items display "Out of Stock" badge
   - Low stock items show red warning badges

2. **Stock Validation**
   - System prevents adding more items than available in stock
   - Error messages appear when attempting to exceed stock limits
   - Add buttons are disabled for out-of-stock items

### Stock Restoration

- **Automatic Restoration**: Stock is automatically restored when orders are cancelled
- **Rollback Protection**: If order creation fails, any stock reductions are rolled back
- **Logging**: All stock movements are logged for audit purposes

## API Endpoints

### Menu Item Stock Operations
```typescript
// Create/Update menu item with inventory data
POST/PUT /api/menu/items
{
  "name": "Burger",
  "price": 12.99,
  "amount": 50,
  "minStockLevel": 5,
  "maxStockLevel": 100,
  "trackInventory": true
}

// Get menu items with stock information
GET /api/menu/items
// Returns items with current stock levels and tracking status
```

### Order Processing with Stock
```typescript
// Create order (automatically reduces stock)
POST /api/orders
{
  "items": [
    {
      "menuItem": "menu_item_id",
      "quantity": 2
    }
  ]
}

// Cancel order (automatically restores stock)
PUT /api/orders/:id/cancel
{
  "reason": "Customer cancellation"
}
```

## Error Handling

### Stock Validation Errors
- **Insufficient Stock**: Returns specific error with available quantity
- **Item Not Found**: Validates menu item existence
- **Invalid Quantity**: Ensures positive quantity values

### Rollback Mechanism
- If any item in an order lacks sufficient stock, all previous stock reductions in that order are rolled back
- Ensures data consistency and prevents partial stock deductions

## Best Practices

### Stock Management
1. **Regular Monitoring**: Check stock levels regularly to prevent shortages
2. **Set Appropriate Minimums**: Configure minimum stock levels for timely reordering
3. **Track Popular Items**: Enable inventory tracking for high-demand items
4. **Plan Capacity**: Set maximum stock levels for effective inventory planning

### Order Processing
1. **Real-time Updates**: Stock levels update immediately when orders are placed
2. **Clear Communication**: Staff receive clear notifications about stock status
3. **Prevent Overselling**: System automatically prevents orders exceeding stock
4. **Handle Cancellations**: Stock is restored when orders are cancelled

## Troubleshooting

### Common Issues

**Q: Item shows as available but can't be added to order**
- Check if inventory tracking is enabled and stock quantity is sufficient
- Verify item is marked as available in menu management

**Q: Stock not updating after order**
- Ensure inventory tracking is enabled for the menu item
- Check backend logs for any stock update errors

**Q: Low stock alerts not showing**
- Verify minimum stock level is set
- Check if current stock has fallen below minimum threshold

### System Maintenance
- Monitor backend logs for stock-related operations
- Regularly audit stock levels for accuracy
- Update minimum/maximum stock levels based on demand patterns

## Future Enhancements

### Planned Features
- **Stock History Tracking**: Detailed logs of stock movements
- **Automated Reordering**: Automatic purchase orders when stock is low
- **Supplier Integration**: Connect with suppliers for streamlined restocking
- **Analytics Dashboard**: Visual reporting of stock trends and usage patterns
- **Bulk Stock Updates**: Import/export functionality for stock management
- **Multi-location Support**: Track inventory across multiple restaurant locations

## Technical Notes

### Database Schema
- Stock fields are added to the existing MenuItem collection
- Backward compatibility maintained with existing menu items
- Default values ensure smooth migration

### Performance Considerations
- Stock checks are performed efficiently during order processing
- Minimal impact on existing order creation performance
- Optimized database queries for stock validation

### Data Integrity
- Atomic operations ensure consistent stock updates
- Transaction rollback prevents data corruption
- Comprehensive error handling for edge cases

---

*This inventory management system provides restaurants with complete control over their stock levels, preventing overselling while maintaining efficient order processing workflows.*