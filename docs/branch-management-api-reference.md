# Branch Management API Reference

## Overview

The Branch Management API provides comprehensive endpoints for managing restaurant branches within the Dine Serve Hub system. This RESTful API supports creating, reading, updating, and deleting branches, as well as managing user assignments, metrics, and hierarchical relationships.

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL and Versioning](#base-url-and-versioning)
3. [Request/Response Format](#requestresponse-format)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Branch Operations](#branch-operations)
7. [User Management](#user-management)
8. [Metrics and Analytics](#metrics-and-analytics)
9. [Hierarchy Management](#hierarchy-management)
10. [Bulk Operations](#bulk-operations)
11. [WebSocket Events](#websocket-events)
12. [SDKs and Code Examples](#sdks-and-code-examples)

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the `Authorization` header:

```http
Authorization: Bearer <jwt_token>
```

### Required Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Tenant-ID: <tenant_id>
```

### Permission Levels

- **Superadmin**: Full access to all branches across all tenants
- **Admin**: Full access to tenant branches
- **Manager**: Read/write access to assigned branches
- **Staff**: Read-only access to assigned branches

## Base URL and Versioning

**Base URL**: `https://api.dineservehub.com/api/branches`

**API Version**: v1 (current)

All endpoints are prefixed with the base URL. Future versions will use versioned endpoints (e.g., `/v2/branches`).

## Request/Response Format

### Request Format

- **Content-Type**: `application/json`
- **Method**: GET, POST, PUT, DELETE
- **Body**: JSON for POST/PUT requests
- **Query Parameters**: URL-encoded for GET requests

### Response Format

All responses follow a consistent format:

```json
{
  "success": true,
  "data": {}, // or [] for arrays
  "count": 10, // for paginated results
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "version": "1.0",
    "requestId": "uuid-v4"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "uuid-v4"
  }
}
```

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Rate Limited |
| 500 | Internal Server Error |

### Error Codes

| Code | Description |
|------|-------------|
| `BRANCH_NOT_FOUND` | Branch does not exist |
| `QUOTA_EXCEEDED` | Branch quota limit reached |
| `DUPLICATE_CODE` | Branch code already exists |
| `VALIDATION_ERROR` | Request validation failed |
| `PERMISSION_DENIED` | Insufficient permissions |
| `ACTIVE_ORDERS_EXIST` | Cannot delete branch with active orders |
| `CHILD_BRANCHES_EXIST` | Cannot delete branch with child branches |

### Example Error Response

```json
{
  "success": false,
  "error": "Branch quota exceeded",
  "code": "QUOTA_EXCEEDED",
  "details": {
    "current": 10,
    "limit": 10,
    "tenantId": "507f1f77bcf86cd799439011"
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## Rate Limiting

Rate limits are applied per user and endpoint:

- **General endpoints**: 100 requests per minute
- **Creation endpoints**: 10 requests per minute
- **Bulk operations**: 5 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642677600
```

## Branch Operations

### List Branches

Retrieve all branches for the authenticated user's tenant.

```http
GET /api/branches
```

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `status` | string | Filter by status: `active`, `inactive`, `suspended` | all |
| `type` | string | Filter by type: `main`, `branch`, `franchise` | all |
| `search` | string | Search in name, code, email, address | - |
| `includeInactive` | boolean | Include inactive branches | `false` |
| `page` | number | Page number for pagination | `1` |
| `limit` | number | Items per page (max 100) | `20` |
| `sort` | string | Sort field: `name`, `createdAt`, `updatedAt` | `createdAt` |
| `order` | string | Sort order: `asc`, `desc` | `desc` |

#### Example Request

```http
GET /api/branches?status=active&type=branch&limit=10&page=1
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "tenantId": "507f1f77bcf86cd799439012",
      "parentBranchId": null,
      "name": "Downtown Branch",
      "code": "ACME-BR001",
      "type": "main",
      "status": "active",
      "address": {
        "street": "123 Main Street",
        "city": "New York",
        "state": "NY",
        "postalCode": "10001",
        "country": "USA",
        "coordinates": {
          "latitude": 40.7128,
          "longitude": -74.0060
        }
      },
      "contact": {
        "phone": "+1-555-123-4567",
        "email": "downtown@example.com",
        "managerName": "John Smith",
        "managerPhone": "+1-555-123-4568",
        "managerEmail": "john.smith@example.com"
      },
      "operations": {
        "openTime": "09:00",
        "closeTime": "22:00",
        "timezone": "America/New_York",
        "daysOpen": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "holidaySchedule": [],
        "seatingCapacity": 50,
        "deliveryRadius": 5
      },
      "financial": {
        "currency": "USD",
        "taxRate": 8.5,
        "serviceChargeRate": 3.0,
        "tipEnabled": true,
        "paymentMethods": ["cash", "credit_card", "digital_wallet"],
        "bankAccount": {
          "accountName": "Downtown Branch Account",
          "accountNumber": "****1234",
          "bankName": "First National Bank",
          "routingNumber": "****5678"
        }
      },
      "inventory": {
        "trackInventory": true,
        "lowStockAlertEnabled": true,
        "autoReorderEnabled": false,
        "warehouseId": "507f1f77bcf86cd799439013"
      },
      "menuConfig": {
        "inheritFromParent": false,
        "priceMultiplier": 1.0,
        "customPricing": true,
        "availableCategories": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
      },
      "staffing": {
        "maxStaff": 25,
        "currentStaff": 18,
        "roles": ["manager", "cashier", "waiter", "chef", "delivery"],
        "shiftPattern": "2-shift"
      },
      "metrics": {
        "avgOrderValue": 45.50,
        "totalOrders": 1250,
        "totalRevenue": 56875.00,
        "rating": 4.5,
        "lastUpdated": "2025-01-20T10:30:00Z"
      },
      "integrations": {
        "posSystemId": "pos-system-001",
        "posSystemType": "square",
        "kitchenDisplayId": "kds-001",
        "onlineOrderingEnabled": true
      },
      "settings": {
        "orderPrefix": "DT",
        "orderNumberSequence": 1001,
        "receiptHeader": "Downtown Branch",
        "receiptFooter": "Thank you for dining with us!",
        "logoUrl": "https://cdn.example.com/logos/downtown.png",
        "theme": "modern"
      },
      "isActive": true,
      "createdBy": "507f1f77bcf86cd799439016",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2025-01-20T10:00:00Z"
    }
  ],
  "count": 1,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "version": "1.0",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Get Branch by ID

Retrieve a specific branch by its ID.

```http
GET /api/branches/{branchId}
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `branchId` | string | MongoDB ObjectId of the branch |

#### Example Request

```http
GET /api/branches/507f1f77bcf86cd799439011
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    // ... full branch object as shown above
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Create Branch

Create a new branch within the authenticated user's tenant.

```http
POST /api/branches
```

#### Request Body

```json
{
  "name": "New Branch",
  "type": "branch",
  "parentBranchId": "507f1f77bcf86cd799439011",
  "address": {
    "street": "456 Oak Avenue",
    "city": "Brooklyn",
    "state": "NY",
    "postalCode": "11201",
    "country": "USA",
    "coordinates": {
      "latitude": 40.6892,
      "longitude": -73.9442
    }
  },
  "contact": {
    "phone": "+1-555-987-6543",
    "email": "newbranch@example.com",
    "managerName": "Jane Doe",
    "managerPhone": "+1-555-987-6544",
    "managerEmail": "jane.doe@example.com"
  },
  "operations": {
    "openTime": "08:00",
    "closeTime": "23:00",
    "timezone": "America/New_York",
    "daysOpen": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "seatingCapacity": 35,
    "deliveryRadius": 3
  },
  "financial": {
    "currency": "USD",
    "taxRate": 8.5,
    "serviceChargeRate": 2.5,
    "tipEnabled": true,
    "paymentMethods": ["cash", "credit_card"]
  },
  "inventory": {
    "trackInventory": true,
    "lowStockAlertEnabled": true,
    "autoReorderEnabled": false
  },
  "staffing": {
    "maxStaff": 20,
    "roles": ["manager", "cashier", "waiter", "chef"]
  },
  "integrations": {
    "onlineOrderingEnabled": true
  },
  "settings": {
    "orderPrefix": "NB",
    "receiptHeader": "New Branch Location",
    "receiptFooter": "Visit us again soon!"
  }
}
```

#### Required Fields

- `name`: Branch name
- `type`: Branch type (`main`, `branch`, `franchise`)
- `address.street`: Street address
- `address.city`: City
- `address.state`: State/province
- `address.postalCode`: Postal code
- `address.country`: Country
- `contact.phone`: Contact phone
- `contact.email`: Contact email

#### Example Response

```json
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "name": "New Branch",
    "code": "ACME-BR002",
    // ... full branch object with generated fields
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Update Branch

Update an existing branch's information.

```http
PUT /api/branches/{branchId}
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `branchId` | string | MongoDB ObjectId of the branch |

#### Request Body

Partial update supported - only include fields to be updated:

```json
{
  "name": "Updated Branch Name",
  "status": "inactive",
  "operations": {
    "openTime": "10:00",
    "closeTime": "21:00"
  },
  "contact": {
    "managerName": "New Manager",
    "managerEmail": "newmanager@example.com"
  }
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Branch updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    // ... updated branch object
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Delete Branch

Soft delete a branch (sets `isActive` to `false`).

```http
DELETE /api/branches/{branchId}
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `branchId` | string | MongoDB ObjectId of the branch |

#### Validation Rules

- Branch cannot have active orders
- Branch cannot have active child branches
- Only admin users can delete branches

#### Example Response

```json
{
  "success": true,
  "message": "Branch deleted successfully",
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Clone Branch

Create a new branch based on an existing branch's configuration.

```http
POST /api/branches/{sourceBranchId}/clone
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sourceBranchId` | string | MongoDB ObjectId of the source branch |

#### Request Body

```json
{
  "name": "Cloned Branch",
  "address": {
    "street": "789 Pine Street",
    "city": "Queens",
    "state": "NY",
    "postalCode": "11354",
    "country": "USA"
  },
  "contact": {
    "phone": "+1-555-111-2222",
    "email": "cloned@example.com"
  }
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Branch cloned successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439018",
    "name": "Cloned Branch",
    // ... cloned branch with new address/contact but same settings
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## User Management

### Assign User to Branch

Assign a user to a branch with specific role.

```http
POST /api/branches/{branchId}/users
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `branchId` | string | MongoDB ObjectId of the branch |

#### Request Body

```json
{
  "userId": "507f1f77bcf86cd799439019",
  "role": "branch_manager"
}
```

#### Available Roles

- `branch_manager`: Full branch management access
- `branch_staff`: Operational access
- `multi_branch`: Access to multiple branches

#### Example Response

```json
{
  "success": true,
  "message": "User assigned to branch successfully",
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Remove User from Branch

Remove a user's assignment from a branch.

```http
DELETE /api/branches/{branchId}/users/{userId}
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `branchId` | string | MongoDB ObjectId of the branch |
| `userId` | string | MongoDB ObjectId of the user |

#### Example Response

```json
{
  "success": true,
  "message": "User removed from branch successfully",
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Switch User's Current Branch

Switch the authenticated user's current active branch.

```http
POST /api/branches/switch
```

#### Request Body

```json
{
  "branchId": "507f1f77bcf86cd799439011"
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Branch switched successfully",
  "currentBranch": "507f1f77bcf86cd799439011",
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## Metrics and Analytics

### Get Branch Metrics

Retrieve performance metrics for a specific branch.

```http
GET /api/branches/{branchId}/metrics
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `branchId` | string | MongoDB ObjectId of the branch |

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `startDate` | string | ISO date string for start date | 30 days ago |
| `endDate` | string | ISO date string for end date | today |
| `granularity` | string | Data granularity: `hour`, `day`, `week`, `month` | `day` |

#### Example Request

```http
GET /api/branches/507f1f77bcf86cd799439011/metrics?startDate=2025-01-01T00:00:00Z&endDate=2025-01-20T23:59:59Z&granularity=day
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 1250,
      "totalRevenue": 56875.00,
      "avgOrderValue": 45.50,
      "totalItems": 3750
    },
    "daily": [
      {
        "_id": "2025-01-01",
        "orders": 65,
        "revenue": 2925.50
      },
      {
        "_id": "2025-01-02",
        "orders": 58,
        "revenue": 2640.25
      }
    ],
    "trends": {
      "ordersGrowth": 12.5,
      "revenueGrowth": 18.3,
      "avgOrderValueGrowth": 5.2
    },
    "topItems": [
      {
        "itemId": "507f1f77bcf86cd799439020",
        "name": "Margherita Pizza",
        "orders": 125,
        "revenue": 1875.00
      }
    ]
  },
  "period": {
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-01-20T23:59:59Z"
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Get Consolidated Metrics

Retrieve aggregated metrics across all branches for the tenant.

```http
GET /api/branches/metrics/consolidated
```

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `startDate` | string | ISO date string for start date | 30 days ago |
| `endDate` | string | ISO date string for end date | today |
| `includeInactive` | boolean | Include inactive branches | `false` |

#### Example Response

```json
{
  "success": true,
  "data": {
    "totals": {
      "totalOrders": 5250,
      "totalRevenue": 245875.00,
      "totalBranches": 4,
      "avgRevenuePerBranch": 61468.75,
      "avgOrdersPerBranch": 1312.5
    },
    "branches": [
      {
        "branchId": "507f1f77bcf86cd799439011",
        "branchName": "Downtown Branch",
        "branchCode": "ACME-BR001",
        "orders": 1250,
        "revenue": 56875.00,
        "avgOrderValue": 45.50
      },
      {
        "branchId": "507f1f77bcf86cd799439017",
        "branchName": "Uptown Branch",
        "branchCode": "ACME-BR002",
        "orders": 1100,
        "revenue": 48500.00,
        "avgOrderValue": 44.09
      }
    ],
    "trends": {
      "performanceRanking": [
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439017"
      ],
      "growthLeaders": [
        {
          "branchId": "507f1f77bcf86cd799439011",
          "growthRate": 18.5
        }
      ]
    }
  },
  "period": {
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-01-20T23:59:59Z"
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## Hierarchy Management

### Get Branch Hierarchy

Retrieve the hierarchical structure of branches for the tenant.

```http
GET /api/branches/hierarchy
```

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `includeInactive` | boolean | Include inactive branches | `false` |
| `maxDepth` | number | Maximum hierarchy depth | unlimited |

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Main Branch",
      "code": "ACME-MAIN",
      "type": "main",
      "status": "active",
      "address": {
        "city": "New York",
        "state": "NY"
      },
      "children": [
        {
          "_id": "507f1f77bcf86cd799439017",
          "name": "Downtown Subsidiary",
          "code": "ACME-BR001",
          "type": "branch",
          "status": "active",
          "address": {
            "city": "Brooklyn",
            "state": "NY"
          },
          "children": []
        },
        {
          "_id": "507f1f77bcf86cd799439018",
          "name": "Uptown Subsidiary",
          "code": "ACME-BR002",
          "type": "branch",
          "status": "active",
          "address": {
            "city": "Queens",
            "state": "NY"
          },
          "children": []
        }
      ]
    }
  ],
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## Bulk Operations

### Bulk Update Branches

Update multiple branches with the same changes.

```http
PATCH /api/branches/bulk
```

#### Request Body

```json
{
  "branchIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439017",
    "507f1f77bcf86cd799439018"
  ],
  "updates": {
    "operations": {
      "openTime": "09:00",
      "closeTime": "22:00"
    },
    "financial": {
      "serviceChargeRate": 3.0
    }
  }
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Bulk update completed",
  "data": {
    "updated": 3,
    "failed": 0,
    "results": [
      {
        "branchId": "507f1f77bcf86cd799439011",
        "status": "success"
      },
      {
        "branchId": "507f1f77bcf86cd799439017",
        "status": "success"
      },
      {
        "branchId": "507f1f77bcf86cd799439018",
        "status": "success"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Bulk Status Change

Change the status of multiple branches.

```http
PATCH /api/branches/bulk/status
```

#### Request Body

```json
{
  "branchIds": [
    "507f1f77bcf86cd799439017",
    "507f1f77bcf86cd799439018"
  ],
  "status": "inactive",
  "reason": "Temporary closure for renovations"
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Status updated for 2 branches",
  "data": {
    "updated": 2,
    "failed": 0
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## WebSocket Events

### Real-time Branch Updates

Connect to WebSocket endpoint for real-time branch updates.

**WebSocket URL**: `wss://api.dineservehub.com/ws/branches`

#### Authentication

Send authentication message after connection:

```json
{
  "type": "auth",
  "token": "jwt_token_here"
}
```

#### Subscribe to Branch Updates

```json
{
  "type": "subscribe",
  "channel": "branch-updates",
  "branchId": "507f1f77bcf86cd799439011"
}
```

#### Event Types

##### Branch Updated

```json
{
  "type": "branch-updated",
  "data": {
    "branchId": "507f1f77bcf86cd799439011",
    "changes": {
      "status": "inactive",
      "updatedAt": "2025-01-20T10:30:00Z"
    },
    "updatedBy": "507f1f77bcf86cd799439016"
  },
  "timestamp": "2025-01-20T10:30:00Z"
}
```

##### Branch Metrics Update

```json
{
  "type": "metrics-updated",
  "data": {
    "branchId": "507f1f77bcf86cd799439011",
    "metrics": {
      "totalOrders": 1251,
      "totalRevenue": 56920.50,
      "avgOrderValue": 45.52
    }
  },
  "timestamp": "2025-01-20T10:30:00Z"
}
```

##### User Assignment Change

```json
{
  "type": "user-assignment-changed",
  "data": {
    "branchId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439019",
    "action": "assigned", // or "removed"
    "role": "branch_manager"
  },
  "timestamp": "2025-01-20T10:30:00Z"
}
```

## SDKs and Code Examples

### JavaScript/TypeScript SDK

#### Installation

```bash
npm install @dineservehub/branch-api-sdk
```

#### Usage

```typescript
import { BranchAPIClient } from '@dineservehub/branch-api-sdk';

const client = new BranchAPIClient({
  baseURL: 'https://api.dineservehub.com',
  apiKey: 'your-api-key',
  tenantId: 'your-tenant-id'
});

// List branches
const branches = await client.branches.list({
  status: 'active',
  type: 'branch'
});

// Create branch
const newBranch = await client.branches.create({
  name: 'New Branch',
  type: 'branch',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA'
  },
  contact: {
    phone: '+1-555-123-4567',
    email: 'branch@example.com'
  }
});

// Update branch
const updatedBranch = await client.branches.update('branchId', {
  name: 'Updated Branch Name'
});

// Get metrics
const metrics = await client.branches.getMetrics('branchId', {
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});
```

### Python SDK

#### Installation

```bash
pip install dineservehub-branch-api
```

#### Usage

```python
from dineservehub_branch_api import BranchAPIClient

client = BranchAPIClient(
    base_url='https://api.dineservehub.com',
    api_key='your-api-key',
    tenant_id='your-tenant-id'
)

# List branches
branches = client.branches.list(status='active')

# Create branch
new_branch = client.branches.create({
    'name': 'New Branch',
    'type': 'branch',
    'address': {
        'street': '123 Main St',
        'city': 'New York',
        'state': 'NY',
        'postalCode': '10001',
        'country': 'USA'
    },
    'contact': {
        'phone': '+1-555-123-4567',
        'email': 'branch@example.com'
    }
})
```

### cURL Examples

#### List Branches

```bash
curl -X GET "https://api.dineservehub.com/api/branches?status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

#### Create Branch

```bash
curl -X POST "https://api.dineservehub.com/api/branches" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -d '{
    "name": "New Branch",
    "type": "branch",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA"
    },
    "contact": {
      "phone": "+1-555-123-4567",
      "email": "branch@example.com"
    }
  }'
```

#### Update Branch

```bash
curl -X PUT "https://api.dineservehub.com/api/branches/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -d '{
    "name": "Updated Branch Name",
    "status": "inactive"
  }'
```

#### Get Branch Metrics

```bash
curl -X GET "https://api.dineservehub.com/api/branches/507f1f77bcf86cd799439011/metrics?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

## Best Practices

### API Usage Guidelines

1. **Authentication**: Always include valid JWT tokens and tenant IDs
2. **Rate Limiting**: Respect rate limits and implement retry logic with exponential backoff
3. **Error Handling**: Implement proper error handling for all response codes
4. **Pagination**: Use pagination for large result sets to improve performance
5. **Caching**: Cache frequently accessed data to reduce API calls
6. **WebSockets**: Use WebSocket connections for real-time updates instead of polling

### Performance Optimization

1. **Filtering**: Use query parameters to filter data on the server side
2. **Field Selection**: Request only needed fields to reduce payload size
3. **Batch Operations**: Use bulk endpoints for operations on multiple branches
4. **Compression**: Enable gzip compression for request/response bodies
5. **CDN**: Use CDN for static assets like branch logos

### Security Considerations

1. **HTTPS**: Always use HTTPS for API communication
2. **Token Management**: Implement secure token storage and refresh mechanisms
3. **Input Validation**: Validate all input data before sending to the API
4. **Permission Checking**: Verify user permissions before making API calls
5. **Audit Logging**: Log all API operations for security and compliance

---
*Last Updated: January 2025*
*Version: 2.0*