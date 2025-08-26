import mongoose, { Document, Schema } from 'mongoose';

export interface ITable extends Document {
  tenantId: mongoose.Types.ObjectId;
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentOrderId?: string;
  floor: number;
  section: string;
  position?: {
    x: number;
    y: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    tableNumber: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available',
    },
    currentOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    floor: {
      type: Number,
      default: 1,
    },
    section: {
      type: String,
      required: true,
    },
    position: {
      x: Number,
      y: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure table numbers are unique per tenant
TableSchema.index({ tenantId: 1, tableNumber: 1 }, { unique: true });

export default mongoose.model<ITable>('Table', TableSchema);