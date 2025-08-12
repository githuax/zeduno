import mongoose, { Document, Schema } from 'mongoose';

export interface IShift extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  breakDuration: number;
  status: 'scheduled' | 'started' | 'on_break' | 'completed' | 'missed' | 'cancelled';
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualBreakDuration?: number;
  notes?: string;
  hourlyRate: number;
  totalHours?: number;
  totalPay?: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema: Schema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    breakDuration: {
      type: Number,
      required: true,
      min: 0,
      max: 120, // max 2 hours break
    },
    status: {
      type: String,
      enum: ['scheduled', 'started', 'on_break', 'completed', 'missed', 'cancelled'],
      default: 'scheduled',
    },
    actualStartTime: Date,
    actualEndTime: Date,
    actualBreakDuration: {
      type: Number,
      min: 0,
    },
    notes: String,
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    totalHours: {
      type: Number,
      min: 0,
    },
    totalPay: {
      type: Number,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total hours and pay when shift is completed
ShiftSchema.pre('save', function(next) {
  if (this.status === 'completed' && this.actualStartTime && this.actualEndTime) {
    const startTime = new Date(this.actualStartTime);
    const endTime = new Date(this.actualEndTime);
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const breakMinutes = this.actualBreakDuration || this.breakDuration;
    const workMinutes = totalMinutes - breakMinutes;
    
    this.totalHours = Math.max(0, workMinutes / 60);
    this.totalPay = this.totalHours * this.hourlyRate;
  }
  next();
});

// Indexes for better performance
ShiftSchema.index({ employeeId: 1, date: 1 });
ShiftSchema.index({ date: 1, status: 1 });

export default mongoose.model<IShift>('Shift', ShiftSchema);