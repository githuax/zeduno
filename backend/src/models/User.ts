import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'admin' | 'manager' | 'staff' | 'customer';
  tenantId?: mongoose.Types.ObjectId;
  tenant?: mongoose.Types.ObjectId;
  isActive: boolean;
  mustChangePassword: boolean;
  passwordLastChanged?: Date;
  lastLogin?: Date;
  twoFactorEnabled?: boolean;
  accountStatus?: 'active' | 'locked' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
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
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'manager', 'staff', 'customer'],
      default: 'customer',
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: function() {
        return this.role !== 'superadmin';
      },
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    passwordLastChanged: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'locked', 'suspended'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Use lower salt rounds for faster hashing in development
    const saltRounds = process.env.NODE_ENV === 'production' ? 10 : 8;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    // Update passwordLastChanged when password is changed
    this.passwordLastChanged = new Date();
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Helper function to update tenant user count (debounced)
const updateTenantUserCount = async (tenantId: mongoose.Types.ObjectId) => {
  if (!tenantId) return;
  
  // Skip in development for faster response
  if (process.env.NODE_ENV !== 'production') return;
  
  try {
    const { Tenant } = await import('./Tenant');
    const userCount = await User.countDocuments({ 
      tenantId: tenantId, 
      isActive: true 
    });
    
    await Tenant.updateOne(
      { _id: tenantId },
      { currentUsers: userCount }
    );
  } catch (error) {
    console.error('Error updating tenant user count:', error);
  }
};

// Post-save middleware to update tenant user count (async)
userSchema.post('save', async function(doc) {
  if (doc.tenantId && doc.role !== 'superadmin') {
    // Run asynchronously to not block response
    setImmediate(() => updateTenantUserCount(doc.tenantId));
  }
});

// Post-remove middleware to update tenant user count
userSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  if (doc.tenantId && doc.role !== 'superadmin') {
    await updateTenantUserCount(doc.tenantId);
  }
});

// Post-findOneAndUpdate middleware to update tenant user count
userSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.tenantId && doc.role !== 'superadmin') {
    await updateTenantUserCount(doc.tenantId);
  }
  
  // Also check if tenantId was changed (need to update both old and new tenant)
  const update = this.getUpdate();
  if (update && typeof update === 'object' && '$set' in update) {
    const updateObj = update as { $set?: { tenantId?: any } };
    if (updateObj.$set && updateObj.$set.tenantId) {
      const oldDoc = await this.model.findOne(this.getQuery());
      if (oldDoc && oldDoc.tenantId && oldDoc.role !== 'superadmin') {
        await updateTenantUserCount(oldDoc.tenantId);
      }
    }
  }
});

export const User = mongoose.model<IUser>('User', userSchema);