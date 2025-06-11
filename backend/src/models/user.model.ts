import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Base interface for user attributes
export interface IUserAttributes {
  username: string;
  phoneNumber?: string;
  password: string;
  fullName: string;
  role: 'admin' | 'commander' | 'brigadeAssistant' | 'unitAssistant' | 'stationManager';
  unit: mongoose.Types.ObjectId;
  rank: string;
  position: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Interface for user document (combines base interface with Document)
export interface IUser extends IUserAttributes, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Interface for user model
export interface IUserModel extends Model<IUser> {
  // Add any static methods here if needed
}

const UserSchema: Schema = new Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  phoneNumber: { 
    type: String, 
    unique: true, 
    sparse: true,  // Allows null/undefined values
    trim: true 
  },
  password: { 
    type: String, 
    required: true,
    select: false  // Don't include by default in queries
  },
  fullName: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: ['admin', 'commander', 'brigadeAssistant', 'unitAssistant', 'stationManager'],
    required: true
  },
  unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  rank: { 
    type: String, 
    required: true 
  },
  position: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function(next) {
  // No need for type assertion here since we specified the generic type parameter
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser, IUserModel>('User', UserSchema); 