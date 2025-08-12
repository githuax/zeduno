import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  shiftId?: mongoose.Types.ObjectId;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  status: 'present' | 'absent' | 'late' | 'early_leave';
  totalHours: number;
  totalBreakTime: number;
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    shiftId: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
    },
    date: {
      type: Date,
      required: true,
    },
    clockIn: Date,
    clockOut: Date,
    breakStart: Date,
    breakEnd: Date,
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'early_leave'],
      default: 'present',
    },
    totalHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBreakTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: String,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total hours and break time
AttendanceSchema.pre('save', function(next) {
  if (this.clockIn && this.clockOut) {
    const totalMinutes = (this.clockOut.getTime() - this.clockIn.getTime()) / (1000 * 60);
    let breakMinutes = 0;
    
    if (this.breakStart && this.breakEnd) {
      breakMinutes = (this.breakEnd.getTime() - this.breakStart.getTime()) / (1000 * 60);
    }
    
    this.totalHours = Math.max(0, (totalMinutes - breakMinutes) / 60);
    this.totalBreakTime = breakMinutes / 60;
  }
  next();
});

// Indexes for better performance
AttendanceSchema.index({ employeeId: 1, date: 1 });
AttendanceSchema.index({ date: 1 });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);