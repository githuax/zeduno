import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISuperAdmin extends Document {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'system_admin';
  permissions: string[];
  isActive: boolean;
  mustChangePassword: boolean;
  passwordLastChanged: Date;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  apiAccess: boolean;
  allowedIPs?: string[];
  sessionTimeout: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const superAdminSchema = new Schema<ISuperAdmin>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      validate: {
        validator: function(v: string) {
          return /^[a-zA-Z0-9_]+$/.test(v);
        },
        message: 'Username can only contain letters, numbers, and underscores'
      }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [12, 'Password must be at least 12 characters long'],
      validate: {
        validator: function(v: string) {
          // Strong password: at least 12 chars, uppercase, lowercase, number, special char
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(v);
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    role: {
      type: String,
      enum: {
        values: ['super_admin', 'system_admin'],
        message: 'Role must be either super_admin or system_admin'
      },
      default: 'system_admin'
    },
    permissions: {
      type: [String],
      default: [
        'view_tenants',
        'create_tenants',
        'edit_tenants',
        'delete_tenants',
        'view_users',
        'create_users',
        'edit_users',
        'delete_users',
        'view_analytics',
        'system_settings'
      ],
      validate: {
        validator: function(v: string[]) {
          const validPermissions = [
            'view_tenants', 'create_tenants', 'edit_tenants', 'delete_tenants',
            'view_users', 'create_users', 'edit_users', 'delete_users',
            'view_analytics', 'system_settings', 'backup_restore',
            'audit_logs', 'security_settings'
          ];
          return v.every(permission => validPermissions.includes(permission));
        },
        message: 'Invalid permission specified'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    },
    passwordLastChanged: {
      type: Date,
      default: Date.now
    },
    lastLoginAt: {
      type: Date
    },
    loginAttempts: {
      type: Number,
      default: 0,
      max: [10, 'Too many login attempts']
    },
    lockedUntil: {
      type: Date
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    allowedIPs: {
      type: [String],
      validate: {
        validator: function(v: string[]) {
          return v.every(ip => {
            // Basic IP validation (supports IPv4 and CIDR notation)
            return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(ip) || ip === '*';
          });
        },
        message: 'Invalid IP address format'
      }
    },
    sessionTimeout: {
      type: Number,
      default: 480, // 8 hours in minutes
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
superAdminSchema.index({ isActive: 1 });
superAdminSchema.index({ lockedUntil: 1 });

// Hash password before saving
superAdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12); // Higher salt rounds for super admin
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordLastChanged = new Date();
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
superAdminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
superAdminSchema.methods.isLocked = function (): boolean {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
};

// Increment login attempts
superAdminSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes

  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < new Date()) {
    return this.updateOne({
      $unset: { lockedUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  // If we've reached max attempts and it's not locked yet, lock account
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockedUntil: new Date(Date.now() + lockTime) };
  }

  return this.updateOne(updates);
};

// Reset login attempts
superAdminSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  return this.updateOne({
    $unset: { 
      loginAttempts: 1,
      lockedUntil: 1
    }
  });
};

// Virtual for full name
superAdminSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
superAdminSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.twoFactorSecret;
    return ret;
  }
});

export const SuperAdmin = mongoose.model<ISuperAdmin>('SuperAdmin', superAdminSchema);