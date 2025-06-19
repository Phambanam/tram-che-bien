import mongoose, { Schema, Document, Model } from 'mongoose';

// Define a type for the creator/approver reference
interface IUserReference {
  id: mongoose.Types.ObjectId;
  name: string;
}

// Base interface for supply attributes
export interface ISupplyAttributes {
  unit: mongoose.Types.ObjectId;
  category: string;
  product: string;
  supplyQuantity: number;
  stationEntryDate?: Date | null;
  requestedQuantity?: number | null;
  receivedQuantity?: number | null;
  actualQuantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
  expiryDate?: Date | null;
  status: 'pending' | 'approved' | 'rejected' | 'deleted' | 'received';
  note?: string;
  createdBy?: IUserReference;
  approvedBy?: IUserReference | null;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for supply document (combines base interface with Document)
export interface ISupply extends ISupplyAttributes, Document {
  // Add any document methods here if needed
}

// Interface for supply model
export interface ISupplyModel extends Model<ISupply> {
  // Add any static methods here if needed
}

const SupplySchema: Schema = new Schema({
  unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  category: {
    type: String,
    ref: 'Category',
    required: true
  },
  product: {
    type: String,
    ref: 'Product',
    required: true
  },
  supplyQuantity: {
    type: Number,
    required: true
  },
  stationEntryDate: {
    type: Date,
    default: null
  },
  requestedQuantity: {
    type: Number,
    default: null
  },
  receivedQuantity: {
    type: Number,
    default: null
  },
  actualQuantity: {
    type: Number,
    default: null
  },
  unitPrice: {
    type: Number,
    default: null
  },
  totalPrice: {
    type: Number,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'deleted', 'received'],
    default: 'pending'
  },
  note: {
    type: String,
    default: ''
  },
  createdBy: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String
  },
  approvedBy: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String
  }
}, {
  timestamps: true
});

// Add any middleware or methods here

// Create and export the model
export const Supply = mongoose.model<ISupply, ISupplyModel>('Supply', SupplySchema); 