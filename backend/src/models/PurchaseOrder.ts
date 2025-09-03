import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPurchaseOrderItem {
  ingredientId: Types.ObjectId;
  ingredientName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  receivedQuantity?: number;
  notes?: string;
}

export interface IPurchaseOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  supplierId: Types.ObjectId;
  supplierName: string;
  items: IPurchaseOrderItem[];
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled';
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentMethod?: string;
  invoiceNumber?: string;
  notes?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  receivedBy?: Types.ObjectId;
  receivedAt?: Date;
  tenantId: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateTotals(): void;
  approve(userId: Types.ObjectId): Promise<IPurchaseOrder>;
  markAsReceived(userId: Types.ObjectId, receivedItems?: Map<string, number>): Promise<IPurchaseOrder>;
}

const purchaseOrderItemSchema = new Schema({
  ingredientId: {
    type: Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  ingredientName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unit: {
    type: String,
    required: true
  },
  unitCost: {
    type: Number,
    required: true,
    min: [0, 'Unit cost cannot be negative']
  },
  totalCost: {
    type: Number,
    required: true,
    min: [0, 'Total cost cannot be negative']
  },
  receivedQuantity: {
    type: Number,
    min: [0, 'Received quantity cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  }
});

const purchaseOrderSchema = new Schema<IPurchaseOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  supplierName: {
    type: String,
    required: true
  },
  items: {
    type: [purchaseOrderItemSchema],
    required: [true, 'At least one item is required'],
    validate: {
      validator: function(v: any[]) {
        return v && v.length > 0;
      },
      message: 'Purchase order must have at least one item'
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'cancelled'],
    default: 'draft'
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    min: [0, 'Tax cannot be negative'],
    default: 0
  },
  shipping: {
    type: Number,
    min: [0, 'Shipping cannot be negative'],
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  receivedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  receivedAt: {
    type: Date
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
purchaseOrderSchema.index({ tenantId: 1, orderNumber: 1 });
purchaseOrderSchema.index({ tenantId: 1, status: 1 });
purchaseOrderSchema.index({ tenantId: 1, supplierId: 1 });
purchaseOrderSchema.index({ tenantId: 1, orderDate: -1 });

// Pre-save middleware to generate order number
purchaseOrderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `PO-${timestamp}-${random}`;
  }
  next();
});

// Instance method to calculate totals
purchaseOrderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum: number, item: any) => {
    item.totalCost = item.quantity * item.unitCost;
    return sum + item.totalCost;
  }, 0);
  
  this.total = this.subtotal + (this.tax || 0) + (this.shipping || 0);
};

// Instance method to approve order
purchaseOrderSchema.methods.approve = function(userId: Types.ObjectId) {
  this.status = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  return this.save();
};

// Instance method to mark as received
purchaseOrderSchema.methods.markAsReceived = async function(
  userId: Types.ObjectId, 
  receivedItems?: Map<string, number>
) {
  const Ingredient = mongoose.model('Ingredient');
  const StockMovement = mongoose.model('StockMovement');
  
  // Update received quantities
  let allReceived = true;
  for (const item of this.items) {
    if (receivedItems && receivedItems.has(item.ingredientId.toString())) {
      item.receivedQuantity = receivedItems.get(item.ingredientId.toString());
    } else {
      item.receivedQuantity = item.quantity;
    }
    
    if (item.receivedQuantity < item.quantity) {
      allReceived = false;
    }
    
    // Update ingredient stock
    const ingredient = await Ingredient.findById(item.ingredientId);
    if (ingredient) {
      await ingredient.updateStock(item.receivedQuantity || 0, 'add');
      
      // Create stock movement record
      await StockMovement.create({
        type: 'purchase',
        referenceType: 'ingredient',
        referenceId: item.ingredientId,
        quantity: item.receivedQuantity,
        unit: item.unit,
        previousStock: ingredient.currentStock - (item.receivedQuantity || 0),
        newStock: ingredient.currentStock,
        cost: item.totalCost,
        supplierId: this.supplierId,
        performedBy: userId,
        tenantId: this.tenantId
      });
    }
  }
  
  this.status = allReceived ? 'received' : 'partial';
  this.receivedBy = userId;
  this.receivedAt = new Date();
  this.actualDeliveryDate = new Date();
  
  return this.save();
};

// Static method to get pending orders
purchaseOrderSchema.statics.getPending = function(tenantId: Types.ObjectId) {
  return this.find({
    tenantId,
    status: { $in: ['pending', 'approved', 'ordered'] }
  }).sort({ orderDate: -1 });
};

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);