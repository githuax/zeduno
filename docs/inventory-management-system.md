# Inventory Management System Documentation

## Overview
A comprehensive inventory management system has been implemented for the Dine Serve Hub restaurant application. This system provides real-time tracking of ingredients, automated stock management, supplier management, and purchase order processing.

## System Architecture

### Database Models (MongoDB/Mongoose)

#### 1. **Ingredient Model** (`backend/src/models/Ingredient.ts`)
Manages raw materials and supplies used in the restaurant.

**Key Fields:**
- `name`: Ingredient name
- `unit`: Measurement unit (kg, g, l, ml, piece, etc.)
- `currentStock`: Current quantity in stock
- `minStockLevel`: Minimum acceptable stock level
- `reorderPoint`: Level at which reordering is triggered
- `cost`: Cost per unit
- `category`: Classification (vegetables, meat, dairy, etc.)
- `expiryDate`: Expiration date for perishables
- `location`: Storage location
- `isPerishable`: Boolean flag for perishable items

**Methods:**
- `checkLowStock()`: Returns true if stock is below minimum
- `needsReorder()`: Returns true if reorder point reached
- `updateStock(quantity, operation)`: Add or subtract stock
- `calculateValue()`: Calculate total value of current stock

#### 2. **Recipe Model** (`backend/src/models/Recipe.ts`)
Links menu items to their required ingredients.

**Key Fields:**
- `menuItemId`: Reference to menu item
- `ingredients`: Array of ingredients with quantities
- `preparationTime`: Time to prepare (minutes)
- `cookingTime`: Time to cook (minutes)
- `servingSize`: Number of servings
- `yield`: Output quantity

**Methods:**
- `calculateCost()`: Calculate total recipe cost
- `checkIngredientsAvailable(quantity)`: Verify ingredient availability
- `consumeIngredients(quantity)`: Deduct ingredients from stock

#### 3. **StockMovement Model** (`backend/src/models/StockMovement.ts`)
Audit trail for all inventory changes.

**Key Fields:**
- `type`: Movement type (purchase, consumption, waste, adjustment, transfer, return)
- `referenceType`: Type of item (ingredient or menuItem)
- `referenceId`: ID of the affected item
- `quantity`: Amount changed
- `previousStock`: Stock level before change
- `newStock`: Stock level after change
- `reason`: Reason for movement
- `performedBy`: User who made the change

#### 4. **Supplier Model** (`backend/src/models/Supplier.ts`)
Manages vendor information.

**Key Fields:**
- `name`: Supplier company name
- `contactPerson`: Primary contact name
- `email`: Contact email
- `phone`: Contact phone
- `categories`: Product categories supplied
- `paymentTerms`: Payment conditions
- `leadTime`: Delivery time in days
- `rating`: Supplier rating (1-5)

#### 5. **PurchaseOrder Model** (`backend/src/models/PurchaseOrder.ts`)
Handles procurement workflow.

**Key Fields:**
- `orderNumber`: Unique order identifier
- `supplierId`: Reference to supplier
- `items`: Array of items to purchase
- `status`: Order status (draft, pending, approved, ordered, received, cancelled)
- `orderDate`: Date order was placed
- `expectedDeliveryDate`: Anticipated delivery
- `total`: Total order value
- `paymentStatus`: Payment state

**Methods:**
- `calculateTotals()`: Calculate order totals
- `approve(userId)`: Approve the order
- `markAsReceived(userId, receivedItems)`: Process receipt and update stock

## API Endpoints

All endpoints are prefixed with `/api/inventory/`

### Ingredient Management
- `GET /ingredients` - List all ingredients (supports filtering by category, low stock, expiring)
- `GET /ingredients/:id` - Get single ingredient
- `POST /ingredients` - Create new ingredient
- `PUT /ingredients/:id` - Update ingredient
- `DELETE /ingredients/:id` - Soft delete ingredient
- `POST /ingredients/:id/adjust-stock` - Adjust stock levels with tracking

### Recipe Management
- `GET /recipes` - List all recipes
- `GET /recipes/:id` - Get single recipe
- `GET /recipes/menu-item/:menuItemId` - Get recipe for specific menu item
- `POST /recipes` - Create new recipe
- `PUT /recipes/:id` - Update recipe
- `DELETE /recipes/:id` - Soft delete recipe

### Supplier Management
- `GET /suppliers` - List all suppliers (supports category filtering)
- `GET /suppliers/:id` - Get single supplier
- `POST /suppliers` - Create new supplier
- `PUT /suppliers/:id` - Update supplier
- `DELETE /suppliers/:id` - Soft delete supplier

### Purchase Order Management
- `GET /purchase-orders` - List purchase orders (supports status, date filtering)
- `GET /purchase-orders/:id` - Get single purchase order
- `POST /purchase-orders` - Create new purchase order
- `PUT /purchase-orders/:id` - Update purchase order (draft only)
- `POST /purchase-orders/:id/approve` - Approve purchase order
- `POST /purchase-orders/:id/receive` - Mark as received and update stock
- `POST /purchase-orders/:id/cancel` - Cancel purchase order

### Reports and Analytics
- `GET /stock-movements` - Get stock movement history
- `GET /reports/inventory` - Get inventory summary report
- `GET /reports/waste` - Get waste analysis report

## Services

### InventoryService (`backend/src/services/inventory.service.ts`)

Key functions for inventory management:

#### `checkOrderInventory(items, tenantId)`
Verifies all items in an order have sufficient stock before confirmation.

#### `consumeOrderInventory(order, userId)`
Automatically deducts inventory when an order is confirmed:
- Reduces menu item stock if tracked
- Consumes recipe ingredients
- Creates stock movement records
- Uses database transactions for consistency

#### `returnOrderInventory(order, userId)`
Returns inventory when an order is cancelled:
- Restores menu item stock
- Returns recipe ingredients
- Creates return movement records

#### `recordWaste(itemType, itemId, quantity, reason, notes, userId, tenantId)`
Records waste with proper tracking and cost calculation.

#### `getLowStockAlerts(tenantId)`
Returns ingredients and menu items below minimum stock levels.

#### `getExpiringItems(tenantId, daysAhead)`
Returns items expiring within specified days.

#### `calculateInventoryValue(tenantId)`
Calculates total inventory value for financial reporting.

## Frontend Components

### Inventory Management Page (`src/pages/InventoryManagement.tsx`)

A comprehensive React component with the following features:

#### Overview Tab
- **Dashboard Cards**: Display total items, low stock alerts, expiring items, total inventory value
- **Low Stock Table**: Quick view of items needing reorder
- **Recent Movements**: Activity log
- **Pending Orders**: Purchase orders awaiting action

#### Ingredients Tab
- **Search and Filter**: Find ingredients by name or category
- **Stock Status Badges**: Visual indicators (critical, low, optimal, overstocked)
- **Stock Adjustment**: Modal for adjusting quantities with reason tracking
- **Value Calculation**: Real-time inventory valuation

#### Recipes Tab
- **Recipe Management**: Link menu items to ingredients
- **Cost Calculation**: Automatic recipe costing
- **Availability Check**: Verify ingredient availability

#### Suppliers Tab
- **Supplier Directory**: Contact information and ratings
- **Category Filtering**: Find suppliers by product type
- **Lead Time Tracking**: Delivery time expectations

#### Purchase Orders Tab
- **Order Creation**: Generate new purchase orders
- **Status Tracking**: Monitor order progress
- **Payment Status**: Track payment state
- **Receipt Processing**: Update stock on delivery

## Integration Points

### Order Processing Integration
The inventory system automatically integrates with order processing:

1. **Order Creation**: Checks ingredient availability
2. **Order Confirmation**: Deducts inventory
3. **Order Cancellation**: Returns inventory
4. **Order Completion**: Tracks consumption patterns

### Menu Management Integration
- Menu items can track their own stock (e.g., pre-made items)
- Menu items can have recipes linking to ingredients
- Availability automatically updated based on stock

### Dashboard Integration
- New "Inventory Management" module added to main dashboard
- Low stock count displayed as module statistic
- Quick navigation to inventory page

## Authentication & Authorization

The system uses existing authentication middleware with role-based access:

- **Admin/Manager**: Full access to all features
- **Staff**: Can adjust stock, view reports, cannot manage suppliers or approve orders
- **Other roles**: No access to inventory management

## Testing

A comprehensive test script (`test-inventory.cjs`) validates:

### Test Coverage
1. **Ingredient Operations**
   - Create, read, update operations
   - Stock adjustments
   - Low stock detection

2. **Supplier Operations**
   - CRUD operations
   - Category filtering

3. **Purchase Orders**
   - Order creation
   - Status workflow
   - Receipt processing

4. **Reports**
   - Inventory valuation
   - Stock movements
   - Waste tracking

5. **Recipe Management**
   - Recipe creation
   - Cost calculation
   - Availability checking

### Running Tests
```bash
node test-inventory.cjs
```

## Stock Level Management

### Stock Status Indicators
- **Critical** (Red): Current stock ≤ minimum level
- **Low** (Yellow): Current stock ≤ reorder point
- **Optimal** (Green): Stock between reorder point and 90% of max
- **Overstocked** (Gray): Stock > 90% of maximum level

### Automatic Stock Management
- **Auto-disable**: Menu items marked unavailable when stock reaches zero
- **Auto-enable**: Menu items restored when stock is replenished
- **Reorder Alerts**: Automatic notifications at reorder points

## Data Persistence

### Indexes for Performance
- Tenant-based queries optimized
- Category and status filtering indexed
- Date range queries optimized
- Text search enabled on relevant fields

### Transaction Safety
- Stock adjustments use MongoDB transactions
- Prevents partial updates during order processing
- Ensures consistency between related records

## Security Considerations

1. **Tenant Isolation**: All queries filtered by tenantId
2. **Role-Based Access**: Enforced at API level
3. **Audit Trail**: All stock movements tracked with user attribution
4. **Input Validation**: Mongoose schemas validate all inputs
5. **Transaction Atomicity**: Critical operations use database transactions

## Future Enhancements

Potential areas for expansion:

1. **Barcode Scanning**: Mobile app for inventory counts
2. **Predictive Ordering**: AI-based demand forecasting
3. **Multi-location Support**: Transfer between locations
4. **Batch Tracking**: Enhanced traceability
5. **Vendor Portal**: Supplier self-service
6. **Mobile Alerts**: Push notifications for critical stocks
7. **Integration APIs**: Connect with external ERP systems
8. **Advanced Analytics**: Trend analysis and seasonality detection

## Deployment Considerations

1. **Database Migrations**: Run model creation scripts
2. **Initial Data**: Import existing inventory if migrating
3. **User Training**: Staff training on stock adjustment procedures
4. **Backup Strategy**: Regular backups of inventory data
5. **Performance Monitoring**: Track API response times
6. **Alert Configuration**: Set up low stock notifications

## Troubleshooting

### Common Issues

1. **Stock Discrepancies**
   - Check StockMovement collection for audit trail
   - Verify recipe quantities are accurate
   - Review recent adjustments

2. **Performance Issues**
   - Ensure indexes are created
   - Monitor query patterns
   - Consider archiving old stock movements

3. **Integration Problems**
   - Verify tenantId consistency
   - Check authentication tokens
   - Review role permissions

## API Usage Examples

### Adjust Stock
```javascript
POST /api/inventory/ingredients/:id/adjust-stock
{
  "quantity": 10,
  "operation": "add", // or "subtract", "set"
  "reason": "New delivery",
  "notes": "Invoice #12345"
}
```

### Create Purchase Order
```javascript
POST /api/inventory/purchase-orders
{
  "supplierId": "...",
  "items": [{
    "ingredientId": "...",
    "quantity": 50,
    "unit": "kg",
    "unitCost": 2.50
  }],
  "expectedDeliveryDate": "2024-01-15",
  "notes": "Urgent order"
}
```

### Get Low Stock Report
```javascript
GET /api/inventory/ingredients?lowStock=true
```

## Conclusion

The inventory management system provides a robust foundation for restaurant inventory control. It automates stock tracking, reduces waste, and ensures ingredients are available when needed. The system is designed to scale with the business and can be extended with additional features as requirements evolve.