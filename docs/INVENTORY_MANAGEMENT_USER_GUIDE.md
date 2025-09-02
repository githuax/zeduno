# Inventory Management User Guide

## 📋 Table of Contents
1. [Getting Started](#getting-started)
2. [Setting Up Inventory Tracking](#setting-up-inventory-tracking)
3. [Managing Stock Levels](#managing-stock-levels)
4. [Taking Orders with Inventory](#taking-orders-with-inventory)
5. [Understanding Stock Indicators](#understanding-stock-indicators)
6. [Daily Operations Guide](#daily-operations-guide)
7. [Common Scenarios](#common-scenarios)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

The ZedUno inventory management system helps you track stock levels for your menu items automatically. When customers place orders, the system reduces stock quantities in real-time, preventing overselling and helping you maintain optimal inventory levels.

### Prerequisites
- Access to ZedUno restaurant portal
- Admin or Manager role permissions
- Existing menu items (or ability to create new ones)

---

## ⚙️ Setting Up Inventory Tracking

### For New Menu Items

1. **Navigate to Menu Management**
   - Login to your ZedUno dashboard
   - Click **"Menu Management"** from the main navigation
   - Click **"Add New Item"** button

2. **Fill Basic Information**
   - Enter item name, description, and price
   - Select appropriate category
   - Upload image (optional)
   - Set dietary preferences (vegetarian, vegan, etc.)

3. **Configure Inventory Settings**
   - Scroll down to the **"Inventory Management"** section
   - Toggle **"Track inventory for this item"** to ON
   - Fill in the inventory fields:

   ![Inventory Management Section]
   ```
   ☑️ Track inventory for this item
   
   Current Stock *: [50    ] (How many you have right now)
   Minimum Stock Level: [5     ] (Alert when stock drops to this level)  
   Maximum Stock Level: [100   ] (Optional: Maximum capacity)
   ```

4. **Save the Item**
   - Click **"Create Item"** to save with inventory tracking enabled

### For Existing Menu Items

1. **Access Item for Editing**
   - Go to **Menu Management**
   - Find the item you want to track
   - Click the **Edit** button (pencil icon) next to the item

2. **Enable Inventory Tracking**
   - Scroll to the **"Inventory Management"** section
   - Toggle **"Track inventory for this item"** to ON
   - Set your current stock levels

3. **Update and Save**
   - Click **"Update Item"** to apply changes

---

## 📊 Managing Stock Levels

### Understanding Stock Fields

| **Field** | **Purpose** | **Example** | **Required** |
|-----------|-------------|-------------|--------------|
| **Current Stock** | How many units you currently have | 25 burgers | Yes |
| **Minimum Stock Level** | When to get low stock alerts | 5 (alert when ≤ 5 left) | No |
| **Maximum Stock Level** | Inventory capacity limit | 100 (don't exceed) | No |

### Updating Stock Quantities

#### Manual Stock Updates
1. Go to **Menu Management**
2. Click **Edit** on the item
3. Update the **"Current Stock"** field
4. Save changes

#### When to Update Stock
- **Daily**: Update stock at start of each day
- **After Deliveries**: Add new inventory received
- **During Prep**: Adjust for items prepared in batches
- **End of Day**: Verify remaining quantities

---

## 🛒 Taking Orders with Inventory

### Order Interface Features

When staff create orders, they'll see real-time stock information:

#### Stock Status Badges
- **"15 left"** (Green/Normal): Sufficient stock available
- **"3 left"** (Red/Warning): Low stock - below minimum threshold  
- **"Out of Stock"** (Red): No inventory available
- **No Badge**: Inventory tracking disabled for this item

#### Automatic Controls
- **Disabled Add Buttons**: Items with 0 stock cannot be added to orders
- **Quantity Limits**: System prevents adding more than available stock
- **Real-time Updates**: Stock reduces immediately when orders are confirmed

### Order Process with Inventory

1. **Staff opens Create Order dialog**
2. **Browses menu items** - sees stock levels on each item
3. **Adds items to cart** - system checks stock availability
4. **Attempts to exceed stock** - receives warning message
5. **Confirms order** - stock automatically reduces

---

## 🎯 Understanding Stock Indicators

### Visual Indicators Throughout the Portal

#### In Menu Management
```
Burger Deluxe          $12.99  [Edit] [Delete]
└─ Available • 15 left

Fish & Chips          $18.50  [Edit] [Delete]  
└─ Available • 2 left ⚠️

Pasta Special         $14.99  [Edit] [Delete]
└─ Available • Out of Stock 🚫
```

#### In Order Creation Interface
```
[Menu Item Card]
Burger Deluxe
Delicious beef burger with fries
$12.99  [15 left]  [+ Add]

[Menu Item Card - Low Stock]
Fish & Chips  
Fresh fish with crispy chips
$18.50  [2 left]  [+ Add]

[Menu Item Card - Out of Stock]
Pasta Special
Creamy pasta with vegetables  
$14.99  [Out of Stock]  [+ Add] (disabled)
```

### Stock Status Meanings

| **Indicator** | **Status** | **Action Available** | **Meaning** |
|---------------|------------|---------------------|-------------|
| Green badge "X left" | Normal stock | Can order any quantity up to X | Stock is above minimum level |
| Red badge "X left" | Low stock | Can order remaining quantity | Stock is at or below minimum level |
| Red "Out of Stock" | No stock | Cannot order | Zero inventory remaining |
| No badge | Tracking disabled | Can order unlimited | Inventory not being tracked |

---

## 📅 Daily Operations Guide

### Morning Setup Checklist

**⏰ Start of Day (30 minutes before opening)**

1. **Review Yesterday's Stock**
   ```
   ✅ Check Menu Management for current levels
   ✅ Note any items that ran out yesterday  
   ✅ Review low stock alerts
   ```

2. **Update Inventory from Prep/Deliveries**
   ```
   ✅ Add new inventory received today
   ✅ Account for items prepared this morning
   ✅ Update stock quantities in system
   ```

3. **Verify Critical Items**
   ```
   ✅ Check bestsellers have adequate stock
   ✅ Ensure special/promoted items are available
   ✅ Review minimum stock levels are appropriate
   ```

### During Service Monitoring

**📱 Real-time Management**

1. **Monitor Low Stock Alerts**
   - Watch for red badges appearing during service
   - Note items approaching minimum levels
   - Plan restocking during slow periods

2. **Handle Stock-outs**
   - Items automatically become unavailable when stock hits 0
   - Inform front-of-house staff about unavailable items
   - Consider offering alternatives to customers

3. **Quick Stock Adjustments**
   - Update stock if you find more inventory
   - Adjust for items that expire or are damaged
   - Account for prep work done during service

### End of Day Review

**🌙 Closing Procedures**

1. **Stock Level Assessment**
   ```
   ✅ Review remaining stock for tomorrow
   ✅ Note items that need restocking  
   ✅ Plan tomorrow's prep requirements
   ```

2. **Update Minimum Levels**
   ```
   ✅ Adjust minimums based on today's usage
   ✅ Account for busy days coming up
   ✅ Plan for special events or promotions
   ```

---

## 📝 Common Scenarios

### Scenario 1: New Restaurant Opening

**Goal**: Set up inventory tracking for entire menu

**Steps**:
1. List all menu items and current inventory
2. Enable tracking for each item one by one
3. Set realistic minimum stock levels (start conservative)
4. Train staff on new stock indicators
5. Monitor for first week and adjust minimums

**Pro Tips**:
- Start with your 20 most popular items
- Set minimums to last through your busiest service
- Review and adjust weekly for first month

### Scenario 2: Busy Weekend Preparation

**Goal**: Ensure adequate stock for high-volume days

**Steps**:
1. Review last weekend's usage patterns
2. Increase stock levels for popular items
3. Adjust minimum levels temporarily higher
4. Prepare backup alternatives for critical items
5. Brief staff on stock priorities

**Pro Tips**:
- Order 50% more of weekend favorites
- Have backup ingredients for popular items
- Set up alerts 2 hours before minimum levels

### Scenario 3: New Item Launch

**Goal**: Track performance and stock needs for new menu item

**Steps**:
1. Enable inventory tracking from launch day
2. Start with conservative stock estimate
3. Set low minimum (allows quick stock-outs)
4. Monitor demand patterns closely
5. Adjust stock levels based on first week's data

**Pro Tips**:
- Better to run out and restock than waste
- Monitor hourly for first few days
- Use data to predict ongoing needs

### Scenario 4: Supplier Delivery Issues

**Goal**: Manage operations with limited inventory

**Steps**:
1. Assess current stock levels immediately
2. Prioritize stock for bestselling items
3. Temporarily increase minimum levels to preserve stock
4. Prepare alternative menu suggestions for staff
5. Communicate potential unavailability to customers

**Pro Tips**:
- Update stock levels immediately when deliveries are delayed
- Use 86 list (unavailable items) to guide staff
- Focus remaining stock on signature dishes

### Scenario 5: Seasonal Menu Changes

**Goal**: Transition inventory tracking for seasonal items

**Steps**:
1. Disable tracking for seasonal items going off menu
2. Enable tracking for new seasonal additions
3. Adjust stock levels based on seasonal demand patterns
4. Update minimum levels for weather-related demand changes
5. Train staff on new item availability

**Pro Tips**:
- Keep historical data for next year's planning
- Seasonal items often have different demand patterns
- Weather can significantly impact certain item sales

---

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### **Issue**: "I enabled inventory tracking but don't see stock badges"
**Solutions**:
- ✅ Verify you set a "Current Stock" amount > 0
- ✅ Refresh your browser/app
- ✅ Check that the item is marked as "Available"
- ✅ Ensure you're looking in the Order Creation interface

#### **Issue**: "Staff can't add items to orders even though we have stock"
**Solutions**:
- ✅ Check if "Current Stock" is set to 0 in Menu Management
- ✅ Verify the item is marked as "Available" 
- ✅ Update stock quantity if it was reduced to 0 by previous orders
- ✅ Temporarily disable inventory tracking if needed

#### **Issue**: "Stock levels don't match what we actually have"
**Solutions**:
- ✅ Manually update "Current Stock" to correct amount
- ✅ Check if orders were cancelled (stock should auto-restore)
- ✅ Review if prep work created additional inventory
- ✅ Account for waste, damage, or theft

#### **Issue**: "Getting too many low stock alerts"
**Solutions**:
- ✅ Lower the "Minimum Stock Level" setting
- ✅ Increase ordering quantities to maintain higher stock
- ✅ Adjust alert threshold based on actual usage patterns
- ✅ Consider disabling tracking for items that don't run out

#### **Issue**: "System won't let me add more stock than maximum"
**Solutions**:
- ✅ Increase or remove "Maximum Stock Level" setting
- ✅ Check if maximum was set too conservatively
- ✅ Verify you have physical storage space for higher maximum
- ✅ Leave maximum blank if no limit needed

### Emergency Procedures

#### **Complete System Reset for an Item**
1. Edit the menu item
2. Turn OFF "Track inventory for this item"
3. Save the changes
4. Edit again and turn inventory tracking back ON
5. Set correct current stock level
6. Save changes

#### **Bulk Stock Update Process**
1. Create a spreadsheet with: Item Name | Current Stock
2. Update items one by one through Menu Management
3. Consider doing this during slow periods
4. Verify each item shows correct stock after update

#### **When Stock Tracking is Causing Problems**
1. **Temporary Disable**: Turn off tracking for problematic items
2. **Staff Override**: Train staff when to manually check physical inventory
3. **Hybrid Approach**: Track only high-value or frequently-out items
4. **Review Settings**: Ensure minimums and maximums are realistic

---

## 📞 Support and Best Practices

### Getting Help
- **Technical Issues**: Contact ZedUno support team
- **Setup Questions**: Refer to this guide or request training
- **Custom Needs**: Discuss specialized inventory requirements

### Best Practices Summary

1. **Start Simple**: Begin with your 10-20 most important items
2. **Monitor Daily**: Check stock levels at least once per day
3. **Adjust Regularly**: Update minimums based on actual usage patterns
4. **Train Everyone**: Ensure all staff understand stock indicators
5. **Plan Ahead**: Use historical data to predict stock needs
6. **Stay Flexible**: Adjust system settings as your business evolves

### Success Metrics

Track these indicators to measure inventory system success:
- **Reduced Stock-outs**: Fewer times running out of popular items
- **Less Food Waste**: Better inventory planning reduces spoilage
- **Improved Customer Satisfaction**: Items available when customers want them
- **Staff Efficiency**: Less time spent manually checking inventory
- **Better Financial Planning**: More accurate food cost management

---

*This guide covers the essential aspects of using ZedUno's inventory management system. For additional support or advanced features, please contact our support team.*

**Version**: 1.0  
**Last Updated**: September 2025  
**Next Review**: December 2025