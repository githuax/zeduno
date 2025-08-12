// MongoDB Schema and Collections for Multitenant Restaurant Management System
// This file contains the collection schemas, indexes, and validation rules

// =============================================================================
// TENANTS COLLECTION
// =============================================================================
db.createCollection("tenants", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "slug", "status", "plan", "settings", "contact", "createdAt"],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string", minLength: 1, maxLength: 255 },
        slug: { 
          bsonType: "string", 
          pattern: "^[a-z0-9-]+$",
          minLength: 3,
          maxLength: 50
        },
        domain: { bsonType: ["string", "null"] },
        status: { 
          enum: ["active", "inactive", "trial", "suspended", "cancelled"]
        },
        plan: {
          bsonType: "object",
          required: ["id", "name", "displayName", "price", "currency", "billingCycle"],
          properties: {
            id: { bsonType: "string" },
            name: { bsonType: "string" },
            displayName: { bsonType: "string" },
            price: { bsonType: "number" },
            currency: { bsonType: "string" },
            billingCycle: { enum: ["monthly", "yearly"] },
            features: { bsonType: "array" },
            limits: { bsonType: "object" }
          }
        },
        settings: {
          bsonType: "object",
          required: ["timezone", "currency", "language"],
          properties: {
            timezone: { bsonType: "string" },
            currency: { bsonType: "string" },
            language: { bsonType: "string" },
            dateFormat: { bsonType: "string" },
            timeFormat: { bsonType: "string" },
            defaultTaxRate: { bsonType: "number" },
            serviceChargeRate: { bsonType: "number" },
            allowGuestCheckout: { bsonType: "bool" },
            requireEmailVerification: { bsonType: "bool" },
            enableNotifications: { bsonType: "bool" },
            maintenanceMode: { bsonType: "bool" }
          }
        },
        contact: {
          bsonType: "object",
          required: ["email", "firstName", "lastName"],
          properties: {
            email: { bsonType: "string" },
            phone: { bsonType: "string" },
            firstName: { bsonType: "string" },
            lastName: { bsonType: "string" },
            company: { bsonType: "string" },
            address: { bsonType: "object" }
          }
        },
        billing: {
          bsonType: "object",
          properties: {
            billingEmail: { bsonType: "string" },
            paymentMethodId: { bsonType: "string" },
            subscriptionId: { bsonType: "string" },
            invoiceHistory: { bsonType: "array" }
          }
        },
        limits: {
          bsonType: "object",
          properties: {
            currentUsers: { bsonType: "number" },
            currentTables: { bsonType: "number" },
            currentOrders: { bsonType: "number" },
            currentMenuItems: { bsonType: "number" },
            storageUsedGB: { bsonType: "number" }
          }
        },
        features: {
          bsonType: "object",
          properties: {
            multiLocation: { bsonType: "bool" },
            customDomain: { bsonType: "bool" },
            whiteLabel: { bsonType: "bool" },
            apiAccess: { bsonType: "bool" },
            customIntegrations: { bsonType: "bool" },
            advancedReporting: { bsonType: "bool" },
            prioritySupport: { bsonType: "bool" },
            sso: { bsonType: "bool" },
            auditLogs: { bsonType: "bool" },
            dataExport: { bsonType: "bool" }
          }
        },
        trialEndsAt: { bsonType: ["date", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes for tenants collection
db.tenants.createIndex({ "slug": 1 }, { unique: true });
db.tenants.createIndex({ "domain": 1 }, { unique: true, sparse: true });
db.tenants.createIndex({ "status": 1 });
db.tenants.createIndex({ "plan.name": 1 });
db.tenants.createIndex({ "trialEndsAt": 1 });
db.tenants.createIndex({ "createdAt": 1 });

// =============================================================================
// USERS COLLECTION (Tenant-aware)
// =============================================================================
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "email", "username", "firstName", "lastName", "role", "status"],
      properties: {
        _id: { bsonType: "objectId" },
        tenantId: { bsonType: "objectId" },
        email: { bsonType: "string" },
        username: { bsonType: "string" },
        firstName: { bsonType: "string" },
        lastName: { bsonType: "string" },
        passwordHash: { bsonType: "string" },
        role: {
          bsonType: "object",
          required: ["id", "name", "displayName"],
          properties: {
            id: { bsonType: "string" },
            tenantId: { bsonType: "objectId" },
            name: { bsonType: "string" },
            displayName: { bsonType: "string" },
            description: { bsonType: "string" },
            permissions: { bsonType: "object" },
            isSystem: { bsonType: "bool" },
            isDefault: { bsonType: "bool" }
          }
        },
        permissions: { bsonType: "object" },
        status: { enum: ["active", "inactive", "pending", "suspended"] },
        lastLoginAt: { bsonType: ["date", "null"] },
        twoFactorEnabled: { bsonType: "bool" },
        twoFactorSecret: { bsonType: "string" },
        profilePicture: { bsonType: "string" },
        preferences: { bsonType: "object" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes for users collection
db.users.createIndex({ "tenantId": 1, "email": 1 }, { unique: true });
db.users.createIndex({ "tenantId": 1, "username": 1 }, { unique: true });
db.users.createIndex({ "tenantId": 1, "status": 1 });
db.users.createIndex({ "tenantId": 1 });
db.users.createIndex({ "role.name": 1 });

// =============================================================================
// ORGANIZATIONS COLLECTION (for multi-location tenants)
// =============================================================================
db.createCollection("organizations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "name", "type"],
      properties: {
        _id: { bsonType: "objectId" },
        tenantId: { bsonType: "objectId" },
        name: { bsonType: "string" },
        type: { enum: ["restaurant", "chain", "franchise", "group"] },
        description: { bsonType: "string" },
        settings: { bsonType: "object" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

db.organizations.createIndex({ "tenantId": 1 });
db.organizations.createIndex({ "tenantId": 1, "name": 1 }, { unique: true });

// =============================================================================
// LOCATIONS COLLECTION (for multi-location support)
// =============================================================================
db.createCollection("locations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "organizationId", "name", "code"],
      properties: {
        _id: { bsonType: "objectId" },
        tenantId: { bsonType: "objectId" },
        organizationId: { bsonType: "objectId" },
        name: { bsonType: "string" },
        code: { bsonType: "string" },
        address: { bsonType: "object" },
        contact: { bsonType: "object" },
        businessHours: { bsonType: "array" },
        capacity: { bsonType: "object" },
        features: { bsonType: "object" },
        status: { enum: ["active", "inactive", "maintenance"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

db.locations.createIndex({ "tenantId": 1 });
db.locations.createIndex({ "tenantId": 1, "organizationId": 1 });
db.locations.createIndex({ "tenantId": 1, "code": 1 }, { unique: true });

// =============================================================================
// MENU ITEMS COLLECTION (Tenant + Location aware)
// =============================================================================
db.createCollection("menuItems", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "name", "category", "price", "isAvailable"],
      properties: {
        _id: { bsonType: "objectId" },
        tenantId: { bsonType: "objectId" },
        locationId: { bsonType: ["objectId", "null"] },
        name: { bsonType: "string" },
        description: { bsonType: "string" },
        category: { bsonType: "string" },
        categoryId: { bsonType: ["objectId", "null"] },
        price: { bsonType: "number", minimum: 0 },
        costPrice: { bsonType: "number", minimum: 0 },
        image: { bsonType: "string" },
        isAvailable: { bsonType: "bool" },
        preparationTime: { bsonType: "number" },
        allergens: { bsonType: "array" },
        dietaryTags: { bsonType: "array" },
        customizations: { bsonType: "array" },
        tags: { bsonType: "array" },
        sku: { bsonType: "string" },
        trackInventory: { bsonType: "bool" },
        currentStock: { bsonType: "number" },
        lowStockThreshold: { bsonType: "number" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

db.menuItems.createIndex({ "tenantId": 1 });
db.menuItems.createIndex({ "tenantId": 1, "locationId": 1 });
db.menuItems.createIndex({ "tenantId": 1, "category": 1 });
db.menuItems.createIndex({ "tenantId": 1, "isAvailable": 1 });
db.menuItems.createIndex({ "tenantId": 1, "sku": 1 }, { unique: true, sparse: true });

// =============================================================================
// TABLES COLLECTION (Tenant + Location aware)
// =============================================================================
db.createCollection("tables", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "locationId", "tableNumber", "capacity", "status"],
      properties: {
        _id: { bsonType: "objectId" },
        tenantId: { bsonType: "objectId" },
        locationId: { bsonType: "objectId" },
        tableNumber: { bsonType: "string" },
        capacity: { bsonType: "number", minimum: 1 },
        status: { enum: ["available", "occupied", "reserved", "maintenance"] },
        currentOrderId: { bsonType: ["objectId", "null"] },
        currentCustomerCount: { bsonType: "number" },
        floor: { bsonType: "number" },
        section: { bsonType: "string" },
        position: {
          bsonType: "object",
          properties: {
            x: { bsonType: "number" },
            y: { bsonType: "number" }
          }
        },
        reservedBy: { bsonType: "string" },
        reservedUntil: { bsonType: "date" },
        notes: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

db.tables.createIndex({ "tenantId": 1 });
db.tables.createIndex({ "tenantId": 1, "locationId": 1 });
db.tables.createIndex({ "tenantId": 1, "locationId": 1, "tableNumber": 1 }, { unique: true });
db.tables.createIndex({ "tenantId": 1, "status": 1 });

// =============================================================================
// CUSTOMERS COLLECTION (Tenant aware)
// =============================================================================
db.createCollection("customers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "phone"],
      properties: {
        _id: { bsonType: "objectId" },
        tenantId: { bsonType: "objectId" },
        firstName: { bsonType: "string" },
        lastName: { bsonType: "string" },
        email: { bsonType: "string" },
        phone: { bsonType: "string" },
        address: { bsonType: "object" },
        dateOfBirth: { bsonType: "date" },
        dietaryPreferences: { bsonType: "array" },
        allergens: { bsonType: "array" },
        notes: { bsonType: "string" },
        totalOrders: { bsonType: "number", minimum: 0 },
        totalSpent: { bsonType: "number", minimum: 0 },
        averageRating: { bsonType: "number", minimum: 0, maximum: 5 },
        loyaltyPoints: { bsonType: "number", minimum: 0 },
        preferredLocation: { bsonType: "string" },
        marketingConsent: { bsonType: "bool" },
        tags: { bsonType: "array" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

db.customers.createIndex({ "tenantId": 1 });
db.customers.createIndex({ "tenantId": 1, "phone": 1 }, { unique: true });
db.customers.createIndex({ "tenantId": 1, "email": 1 }, { sparse: true });

// =============================================================================
// ORDERS COLLECTION (Tenant + Location aware)
// =============================================================================
db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "orderNumber", "orderType", "status", "customerName", "items", "total"],
      properties: {
        _id: { bsonType: "objectId" },
        tenantId: { bsonType: "objectId" },
        locationId: { bsonType: ["objectId", "null"] },
        orderNumber: { bsonType: "string" },
        orderType: { enum: ["dine-in", "takeaway", "delivery"] },
        status: { enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"] },
        customerId: { bsonType: ["objectId", "null"] },
        customerName: { bsonType: "string" },
        customerPhone: { bsonType: "string" },
        customerEmail: { bsonType: "string" },
        tableId: { bsonType: ["objectId", "null"] },
        guestCount: { bsonType: "number" },
        deliveryAddress: { bsonType: "object" },
        items: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["menuItem", "quantity", "price", "totalPrice"],
            properties: {
              _id: { bsonType: "objectId" },
              menuItem: { bsonType: "objectId" },
              quantity: { bsonType: "number", minimum: 1 },
              price: { bsonType: "number", minimum: 0 },
              totalPrice: { bsonType: "number", minimum: 0 },
              customizations: { bsonType: "array" },
              specialInstructions: { bsonType: "string" },
              status: { enum: ["pending", "preparing", "ready", "served", "cancelled"] }
            }
          }
        },
        subtotal: { bsonType: "number", minimum: 0 },
        tax: { bsonType: "number", minimum: 0 },
        taxRate: { bsonType: "number", minimum: 0 },
        serviceCharge: { bsonType: "number", minimum: 0 },
        serviceChargeRate: { bsonType: "number", minimum: 0 },
        deliveryFeeAmount: { bsonType: "number", minimum: 0 },
        discount: { bsonType: "number", minimum: 0 },
        discountType: { enum: ["amount", "percentage"] },
        discountCode: { bsonType: "string" },
        tipAmount: { bsonType: "number", minimum: 0 },
        total: { bsonType: "number", minimum: 0 },
        paymentStatus: { enum: ["pending", "paid", "partial", "refunded"] },
        paymentMethod: { enum: ["cash", "card", "upi", "wallet"] },
        paymentReference: { bsonType: "string" },
        paidAt: { bsonType: "date" },
        createdBy: { bsonType: "objectId" },
        assignedTo: { bsonType: "objectId" },
        staffNotes: { bsonType: "string" },
        estimatedPrepTime: { bsonType: "number" },
        prepStartedAt: { bsonType: "date" },
        readyAt: { bsonType: "date" },
        completedAt: { bsonType: "date" },
        cancelledAt: { bsonType: "date" },
        cancellationReason: { bsonType: "string" },
        kitchenStatus: { enum: ["pending", "in-progress", "ready", "served"] },
        kitchenNotes: { bsonType: "string" },
        priority: { enum: ["low", "normal", "high", "urgent"] },
        notes: { bsonType: "string" },
        allergenInfo: { bsonType: "array" },
        specialRequests: { bsonType: "string" },
        source: { enum: ["pos", "online", "phone", "mobile-app", "third-party"] },
        sourceDetails: { bsonType: "string" },
        loyaltyPointsEarned: { bsonType: "number" },
        loyaltyPointsUsed: { bsonType: "number" },
        promotionsApplied: { bsonType: "array" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes for orders collection
db.orders.createIndex({ "tenantId": 1 });
db.orders.createIndex({ "tenantId": 1, "locationId": 1 });
db.orders.createIndex({ "tenantId": 1, "orderNumber": 1 }, { unique: true });
db.orders.createIndex({ "tenantId": 1, "status": 1 });
db.orders.createIndex({ "tenantId": 1, "orderType": 1 });
db.orders.createIndex({ "tenantId": 1, "customerId": 1 });
db.orders.createIndex({ "tenantId": 1, "createdAt": -1 });
db.orders.createIndex({ "tenantId": 1, "paymentStatus": 1 });

// =============================================================================
// EMPLOYEES COLLECTION (Tenant + Location aware)
// =============================================================================
db.createCollection("employees", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "employeeId", "firstName", "lastName", "email", "position", "status"],
      properties: {
        _id: { bsonType: "objectId" },
        tenantId: { bsonType: "objectId" },
        locationId: { bsonType: ["objectId", "null"] },
        employeeId: { bsonType: "string" },
        firstName: { bsonType: "string" },
        lastName: { bsonType: "string" },
        email: { bsonType: "string" },
        phone: { bsonType: "string" },
        position: { bsonType: "string" },
        department: { bsonType: "string" },
        hireDate: { bsonType: "date" },
        salary: { bsonType: "number" },
        hourlyRate: { bsonType: "number" },
        status: { enum: ["active", "inactive", "on-leave", "terminated"] },
        permissions: { bsonType: "array" },
        schedule: { bsonType: "object" },
        emergencyContact: { bsonType: "object" },
        documents: { bsonType: "array" },
        notes: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

db.employees.createIndex({ "tenantId": 1 });
db.employees.createIndex({ "tenantId": 1, "locationId": 1 });
db.employees.createIndex({ "tenantId": 1, "employeeId": 1 }, { unique: true });
db.employees.createIndex({ "tenantId": 1, "status": 1 });

// =============================================================================
// DELIVERY TRACKING COLLECTION
// =============================================================================
db.createCollection("deliveryTracking", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "orderId", "status"],
      properties: {
        _id: { bsonType: "objectId" },
        tenantId: { bsonType: "objectId" },
        orderId: { bsonType: "objectId" },
        driverId: { bsonType: "objectId" },
        driverName: { bsonType: "string" },
        driverPhone: { bsonType: "string" },
        status: { enum: ["assigned", "picked_up", "in_transit", "delivered", "failed"] },
        estimatedDeliveryTime: { bsonType: "date" },
        actualDeliveryTime: { bsonType: "date" },
        trackingUpdates: { bsonType: "array" },
        deliveryFeedback: { bsonType: "object" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

db.deliveryTracking.createIndex({ "tenantId": 1 });
db.deliveryTracking.createIndex({ "tenantId": 1, "orderId": 1 });
db.deliveryTracking.createIndex({ "tenantId": 1, "status": 1 });

// =============================================================================
// AUDIT LOGS COLLECTION (for enterprise features)
// =============================================================================
db.createCollection("auditLogs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "userId", "action", "resource", "timestamp"],
      properties: {
        _id: { bsonType: "objectId" },
        tenantId: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        action: { bsonType: "string" },
        resource: { bsonType: "string" },
        resourceId: { bsonType: ["objectId", "string"] },
        changes: { bsonType: "object" },
        ipAddress: { bsonType: "string" },
        userAgent: { bsonType: "string" },
        timestamp: { bsonType: "date" }
      }
    }
  }
});

db.auditLogs.createIndex({ "tenantId": 1 });
db.auditLogs.createIndex({ "tenantId": 1, "timestamp": -1 });
db.auditLogs.createIndex({ "tenantId": 1, "userId": 1 });
db.auditLogs.createIndex({ "tenantId": 1, "resource": 1 });

// =============================================================================
// SAMPLE DATA INSERTION
// =============================================================================

// Insert sample tenant
db.tenants.insertOne({
  name: "Joe's Pizza Palace",
  slug: "joes-pizza",
  domain: "joespizza.com",
  status: "active",
  plan: {
    id: "plan_pro",
    name: "professional",
    displayName: "Professional",
    price: 79,
    currency: "USD",
    billingCycle: "monthly",
    features: ["online_ordering", "analytics", "inventory"],
    limits: {
      maxUsers: 10,
      maxTables: 50,
      maxOrders: 2000,
      maxMenuItems: 200,
      storageGB: 5,
      supportLevel: "priority",
      customBranding: true,
      apiAccess: true,
      advancedAnalytics: true
    }
  },
  settings: {
    timezone: "America/New_York",
    currency: "USD",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    defaultTaxRate: 8.5,
    serviceChargeRate: 0,
    allowGuestCheckout: true,
    requireEmailVerification: true,
    enableNotifications: true,
    maintenanceMode: false
  },
  contact: {
    email: "joe@joespizza.com",
    phone: "+1-555-123-4567",
    firstName: "Joe",
    lastName: "Smith",
    company: "Joe's Pizza Palace",
    address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      country: "USA",
      zipCode: "10001"
    }
  },
  billing: {
    billingEmail: "billing@joespizza.com",
    invoiceHistory: []
  },
  limits: {
    currentUsers: 5,
    currentTables: 24,
    currentOrders: 150,
    currentMenuItems: 85,
    storageUsedGB: 2.3
  },
  features: {
    multiLocation: false,
    customDomain: true,
    whiteLabel: false,
    apiAccess: true,
    customIntegrations: true,
    advancedReporting: true,
    prioritySupport: true,
    sso: false,
    auditLogs: true,
    dataExport: true
  },
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date()
});

print("✅ MongoDB Multitenant Schema Created Successfully!");
print("✅ Collections: tenants, users, organizations, locations, menuItems, tables, customers, orders, employees, deliveryTracking, auditLogs");
print("✅ Indexes created for optimal query performance with tenant isolation");
print("✅ Validation rules applied to ensure data consistency");
print("✅ Sample tenant data inserted");