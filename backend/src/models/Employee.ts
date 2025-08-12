import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'chef' | 'server' | 'host' | 'cashier' | 'cleaner' | 'delivery';
  department: string;
  position: string;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  hireDate: Date;
  hourlyRate: number;
  weeklyHours: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  permissions: string[];
  avatar?: string;
  dateOfBirth?: Date;
  socialSecurityNumber?: string;
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema: Schema = new Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'chef', 'server', 'host', 'cashier', 'cleaner', 'delivery'],
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated', 'on_leave'],
      default: 'active',
    },
    hireDate: {
      type: Date,
      required: true,
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    weeklyHours: {
      type: Number,
      required: true,
      min: 0,
      max: 60,
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
    },
    emergencyContact: {
      name: {
        type: String,
        required: true,
      },
      relationship: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
    permissions: [{
      type: String,
    }],
    avatar: String,
    dateOfBirth: Date,
    socialSecurityNumber: String, // Should be encrypted
    bankDetails: {
      accountNumber: String, // Should be encrypted
      routingNumber: String,
      bankName: String,
    },
  },
  {
    timestamps: true,
  }
);

// Generate employee ID before saving
EmployeeSchema.pre('save', function(next) {
  if (this.isNew && !this.employeeId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.employeeId = `EMP${year}${month}${random}`;
  }
  next();
});

// Index for better performance
EmployeeSchema.index({ employeeId: 1 });
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ role: 1, status: 1 });

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);