// MongoDB Service Utilities for Multitenant Operations
// This file contains helper functions for tenant-aware database operations

const { MongoClient, ObjectId } = require('mongodb');

class MultiTenantService {
  constructor(connectionString, dbName) {
    this.connectionString = connectionString;
    this.dbName = dbName;
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(this.connectionString);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('✅ Disconnected from MongoDB');
    }
  }

  // =============================================================================
  // TENANT OPERATIONS
  // =============================================================================

  async createTenant(tenantData) {
    const tenant = {
      ...tenantData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.collection('tenants').insertOne(tenant);
    return { _id: result.insertedId, ...tenant };
  }

  async getTenantBySlug(slug) {
    return await this.db.collection('tenants').findOne({ slug });
  }

  async getTenantById(tenantId) {
    return await this.db.collection('tenants').findOne({ _id: new ObjectId(tenantId) });
  }

  async updateTenantLimits(tenantId, limits) {
    return await this.db.collection('tenants').updateOne(
      { _id: new ObjectId(tenantId) },
      { 
        $set: { 
          limits,
          updatedAt: new Date()
        }
      }
    );
  }

  // =============================================================================
  // TENANT-AWARE CRUD OPERATIONS
  // =============================================================================

  // Generic function to add tenant filter to all queries
  _addTenantFilter(filter, tenantId) {
    return {
      tenantId: new ObjectId(tenantId),
      ...filter
    };
  }

  // Create document with tenant ID
  async createDocument(collection, data, tenantId) {
    const document = {
      ...data,
      tenantId: new ObjectId(tenantId),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.collection(collection).insertOne(document);
    return { _id: result.insertedId, ...document };
  }

  // Find documents with tenant isolation
  async findDocuments(collection, filter = {}, tenantId, options = {}) {
    const tenantFilter = this._addTenantFilter(filter, tenantId);
    return await this.db.collection(collection).find(tenantFilter, options).toArray();
  }

  // Find one document with tenant isolation
  async findOneDocument(collection, filter = {}, tenantId) {
    const tenantFilter = this._addTenantFilter(filter, tenantId);
    return await this.db.collection(collection).findOne(tenantFilter);
  }

  // Update documents with tenant isolation
  async updateDocument(collection, filter, update, tenantId) {
    const tenantFilter = this._addTenantFilter(filter, tenantId);
    const updateData = {
      ...update,
      $set: {
        ...update.$set,
        updatedAt: new Date()
      }
    };
    
    return await this.db.collection(collection).updateOne(tenantFilter, updateData);
  }

  // Delete documents with tenant isolation
  async deleteDocument(collection, filter, tenantId) {
    const tenantFilter = this._addTenantFilter(filter, tenantId);
    return await this.db.collection(collection).deleteOne(tenantFilter);
  }

  // Count documents with tenant isolation
  async countDocuments(collection, filter = {}, tenantId) {
    const tenantFilter = this._addTenantFilter(filter, tenantId);
    return await this.db.collection(collection).countDocuments(tenantFilter);
  }

  // =============================================================================
  // MENU ITEM OPERATIONS
  // =============================================================================

  async createMenuItem(menuItemData, tenantId, locationId = null) {
    return await this.createDocument('menuItems', {
      ...menuItemData,
      locationId: locationId ? new ObjectId(locationId) : null
    }, tenantId);
  }

  async getMenuItems(tenantId, locationId = null, filters = {}) {
    const filter = locationId ? { ...filters, locationId: new ObjectId(locationId) } : filters;
    return await this.findDocuments('menuItems', filter, tenantId);
  }

  async updateMenuItemAvailability(menuItemId, isAvailable, tenantId) {
    return await this.updateDocument(
      'menuItems',
      { _id: new ObjectId(menuItemId) },
      { $set: { isAvailable, updatedAt: new Date() } },
      tenantId
    );
  }

  // =============================================================================
  // ORDER OPERATIONS
  // =============================================================================

  async createOrder(orderData, tenantId) {
    // Generate order number
    const orderCount = await this.countDocuments('orders', {}, tenantId);
    const orderNumber = `ORD-${Date.now()}-${String(orderCount + 1).padStart(4, '0')}`;
    
    return await this.createDocument('orders', {
      ...orderData,
      orderNumber,
      locationId: orderData.locationId ? new ObjectId(orderData.locationId) : null,
      customerId: orderData.customerId ? new ObjectId(orderData.customerId) : null,
      tableId: orderData.tableId ? new ObjectId(orderData.tableId) : null,
      createdBy: new ObjectId(orderData.createdBy),
      assignedTo: orderData.assignedTo ? new ObjectId(orderData.assignedTo) : null
    }, tenantId);
  }

  async getOrders(tenantId, filters = {}, options = {}) {
    // Convert string IDs to ObjectIds in filters
    if (filters.customerId) filters.customerId = new ObjectId(filters.customerId);
    if (filters.locationId) filters.locationId = new ObjectId(filters.locationId);
    if (filters.tableId) filters.tableId = new ObjectId(filters.tableId);
    
    return await this.findDocuments('orders', filters, tenantId, options);
  }

  async updateOrderStatus(orderId, status, tenantId, userId) {
    const updateData = { status, updatedAt: new Date() };
    
    // Add completion timestamp for completed orders
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    // Log audit trail for status changes
    if (userId) {
      await this.createAuditLog(tenantId, userId, 'update', 'order', orderId, {
        field: 'status',
        newValue: status
      });
    }
    
    return await this.updateDocument(
      'orders',
      { _id: new ObjectId(orderId) },
      { $set: updateData },
      tenantId
    );
  }

  // =============================================================================
  // TABLE OPERATIONS
  // =============================================================================

  async createTable(tableData, tenantId, locationId) {
    return await this.createDocument('tables', {
      ...tableData,
      locationId: new ObjectId(locationId)
    }, tenantId);
  }

  async getTables(tenantId, locationId = null, status = null) {
    const filter = {};
    if (locationId) filter.locationId = new ObjectId(locationId);
    if (status) filter.status = status;
    
    return await this.findDocuments('tables', filter, tenantId);
  }

  async updateTableStatus(tableId, status, tenantId, orderId = null) {
    const updateData = { 
      status, 
      currentOrderId: orderId ? new ObjectId(orderId) : null,
      updatedAt: new Date()
    };
    
    return await this.updateDocument(
      'tables',
      { _id: new ObjectId(tableId) },
      { $set: updateData },
      tenantId
    );
  }

  // =============================================================================
  // CUSTOMER OPERATIONS
  // =============================================================================

  async createCustomer(customerData, tenantId) {
    // Check if customer already exists by phone
    const existingCustomer = await this.findOneDocument(
      'customers',
      { phone: customerData.phone },
      tenantId
    );
    
    if (existingCustomer) {
      return existingCustomer;
    }
    
    return await this.createDocument('customers', {
      ...customerData,
      totalOrders: 0,
      totalSpent: 0,
      loyaltyPoints: 0
    }, tenantId);
  }

  async updateCustomerStats(customerId, tenantId, orderTotal) {
    return await this.updateDocument(
      'customers',
      { _id: new ObjectId(customerId) },
      {
        $inc: {
          totalOrders: 1,
          totalSpent: orderTotal,
          loyaltyPoints: Math.floor(orderTotal * 0.1) // 10% of order value as points
        },
        $set: { updatedAt: new Date() }
      },
      tenantId
    );
  }

  // =============================================================================
  // ANALYTICS OPERATIONS
  // =============================================================================

  async getOrderAnalytics(tenantId, startDate, endDate, locationId = null) {
    const pipeline = [
      {
        $match: {
          tenantId: new ObjectId(tenantId),
          createdAt: {
            $gte: startDate,
            $lte: endDate
          },
          ...(locationId && { locationId: new ObjectId(locationId) })
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          ordersByType: {
            $push: {
              type: '$orderType',
              total: '$total'
            }
          },
          ordersByStatus: {
            $push: {
              status: '$status',
              count: 1
            }
          }
        }
      }
    ];
    
    const result = await this.db.collection('orders').aggregate(pipeline).toArray();
    return result[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      ordersByType: [],
      ordersByStatus: []
    };
  }

  async getPopularItems(tenantId, startDate, endDate, limit = 10) {
    const pipeline = [
      {
        $match: {
          tenantId: new ObjectId(tenantId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'menuItems',
          localField: '_id',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      {
        $project: {
          itemName: '$menuItem.name',
          totalQuantity: 1,
          totalRevenue: 1
        }
      }
    ];
    
    return await this.db.collection('orders').aggregate(pipeline).toArray();
  }

  // =============================================================================
  // AUDIT LOG OPERATIONS
  // =============================================================================

  async createAuditLog(tenantId, userId, action, resource, resourceId, changes = {}) {
    return await this.createDocument('auditLogs', {
      userId: new ObjectId(userId),
      action,
      resource,
      resourceId: typeof resourceId === 'string' ? resourceId : new ObjectId(resourceId),
      changes,
      timestamp: new Date(),
      ipAddress: null, // Would be set by the API layer
      userAgent: null  // Would be set by the API layer
    }, tenantId);
  }

  async getAuditLogs(tenantId, filters = {}, options = {}) {
    return await this.findDocuments('auditLogs', filters, tenantId, {
      ...options,
      sort: { timestamp: -1 }
    });
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  // Check if tenant exists and is active
  async validateTenant(tenantId) {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    if (tenant.status !== 'active') {
      throw new Error('Tenant is not active');
    }
    return tenant;
  }

  // Check if tenant is within usage limits
  async checkTenantLimits(tenantId, resource) {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) return false;
    
    const currentUsage = tenant.limits[`current${resource}`] || 0;
    const maxLimit = tenant.plan.limits[`max${resource}`] || Infinity;
    
    return currentUsage < maxLimit;
  }

  // Update tenant usage statistics
  async updateTenantUsage(tenantId, resource, increment = 1) {
    const field = `limits.current${resource}`;
    return await this.db.collection('tenants').updateOne(
      { _id: new ObjectId(tenantId) },
      {
        $inc: { [field]: increment },
        $set: { updatedAt: new Date() }
      }
    );
  }

  // Aggregate tenant statistics
  async getTenantStats(tenantId) {
    const [orders, menuItems, customers, tables] = await Promise.all([
      this.countDocuments('orders', { status: { $in: ['pending', 'confirmed', 'preparing'] } }, tenantId),
      this.countDocuments('menuItems', { isAvailable: true }, tenantId),
      this.countDocuments('customers', {}, tenantId),
      this.countDocuments('tables', {}, tenantId)
    ]);

    return {
      activeOrders: orders,
      availableMenuItems: menuItems,
      totalCustomers: customers,
      totalTables: tables
    };
  }
}

module.exports = MultiTenantService;

// Example usage:
/*
const service = new MultiTenantService('mongodb://localhost:27017', 'restaurant_db');

async function example() {
  await service.connect();
  
  const tenantId = '507f1f77bcf86cd799439011';
  
  // Create a menu item
  const menuItem = await service.createMenuItem({
    name: 'Margherita Pizza',
    description: 'Fresh tomatoes, mozzarella, basil',
    category: 'Pizza',
    price: 12.99,
    isAvailable: true,
    preparationTime: 15
  }, tenantId);
  
  // Get all orders for tenant
  const orders = await service.getOrders(tenantId, {
    status: 'pending'
  });
  
  // Update order status
  await service.updateOrderStatus(orderId, 'confirmed', tenantId, userId);
  
  // Get analytics
  const analytics = await service.getOrderAnalytics(
    tenantId,
    new Date('2024-01-01'),
    new Date('2024-12-31')
  );
  
  await service.disconnect();
}
*/