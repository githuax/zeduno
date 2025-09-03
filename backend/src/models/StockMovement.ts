import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStockMovement extends Document {
  _id: Types.ObjectId;
  type: 'purchase' | 'consumption' | 'waste' | 'adjustment' | 'transfer' | 'return';
  referenceType: 'ingredient' | 'menuItem';
  referenceId: Types.ObjectId;
  quantity: number;
  unit: string;
  previousStock: number;
  newStock: number;
  cost?: number;
  reason?: string;
  notes?: string;
  orderId?: Types.ObjectId;
  supplierId?: Types.ObjectId;
  performedBy: Types.ObjectId;
  tenantId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>({
  type: {
    type: String,
    required: [true, 'Movement type is required'],
    enum: ['purchase', 'consumption', 'waste', 'adjustment', 'transfer', 'return']
  },
  referenceType: {
    type: String,
    required: [true, 'Reference type is required'],
    enum: ['ingredient', 'menuItem']
  },
  referenceId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Reference ID is required'],
    refPath: 'referenceType',
    index: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required']
  },
  previousStock: {
    type: Number,
    required: [true, 'Previous stock is required']
  },
  newStock: {
    type: Number,
    required: [true, 'New stock is required']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [200, 'Reason cannot exceed 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Performed by is required']
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
stockMovementSchema.index({ tenantId: 1, createdAt: -1 });
stockMovementSchema.index({ tenantId: 1, type: 1 });
stockMovementSchema.index({ tenantId: 1, referenceId: 1, referenceType: 1 });
stockMovementSchema.index({ orderId: 1 });

// Static method to get movements by date range
stockMovementSchema.statics.getByDateRange = function(
  tenantId: Types.ObjectId, 
  startDate: Date, 
  endDate: Date
) {
  return this.find({
    tenantId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

// Static method to get waste report
stockMovementSchema.statics.getWasteReport = function(
  tenantId: Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        type: 'waste',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$referenceId',
        totalQuantity: { $sum: '$quantity' },
        totalCost: { $sum: '$cost' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalCost: -1 }
    }
  ]);
};

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', stockMovementSchema);