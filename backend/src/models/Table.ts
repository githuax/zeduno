import mongoose, { Document, Schema } from 'mongoose';

export interface ITable extends Document {
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
    tableNumber: {
      type: String,
      required: true,
      unique: true,
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

export default mongoose.model<ITable>('Table', TableSchema);