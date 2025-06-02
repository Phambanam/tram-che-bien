import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  phoneNumber?: string;
  password: string;
  fullName: string;
  role: 'admin' | 'commander' | 'brigadeAssistant' | 'unitAssistant';
  unit: mongoose.Types.ObjectId;
  rank: string;
  position: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
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
    enum: ['admin', 'commander', 'brigadeAssistant', 'unitAssistant'],
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
UserSchema.pre('save', async function(next) {
  const user = this as IUser;
  
  // Only hash if password is new or modified
  if (!user.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema); 