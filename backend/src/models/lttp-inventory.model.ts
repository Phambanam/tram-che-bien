import mongoose from 'mongoose'

const lttpInventorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  lttpItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LTTPItem',
    required: true
  },
  
  // Ngày trước chuyển qua
  previousDay: {
    quantity: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    expiryDate: { type: Date }
  },
  
  // Nhập trong ngày
  input: {
    quantity: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    invoiceNumber: { type: String },
    supplierId: { type: String },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiryDate: { type: Date },
    notes: { type: String }
  },
  
  // Xuất trong ngày
  output: {
    quantity: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    distributedTo: [{
      unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
      quantity: { type: Number },
      amount: { type: Number },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      purpose: { type: String } // 'meal', 'processing', 'backup'
    }],
    expiryDate: { type: Date },
    notes: { type: String }
  },
  
  // Tồn cuối ngày
  endOfDay: {
    quantity: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    expiryDate: { type: Date }
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['Tốt', 'Bình thường', 'Sắp hết hạn', 'Hết hạn', 'Hỏng'],
    default: 'Tốt'
  },
  
  // Quality check
  qualityCheck: {
    checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkedAt: { type: Date },
    condition: { type: String, enum: ['Tốt', 'Khá', 'Trung bình', 'Kém'] },
    notes: { type: String }
  },
  
  // Alerts
  alerts: [{
    type: { type: String, enum: ['expiry_warning', 'low_stock', 'quality_issue'] },
    message: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    createdAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false }
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
lttpInventorySchema.index({ date: 1, lttpItemId: 1 }, { unique: true })
lttpInventorySchema.index({ date: 1 })
lttpInventorySchema.index({ lttpItemId: 1 })
lttpInventorySchema.index({ status: 1 })
lttpInventorySchema.index({ 'endOfDay.expiryDate': 1 })

// Pre-save middleware to calculate end of day values
lttpInventorySchema.pre('save', function(next) {
  // Calculate end of day quantity and amount
  this.endOfDay.quantity = this.previousDay.quantity + this.input.quantity - this.output.quantity
  this.endOfDay.amount = this.previousDay.amount + this.input.amount - this.output.amount
  
  // Determine expiry date (earliest expiry from available stock)
  const expiryDates = [this.previousDay.expiryDate, this.input.expiryDate].filter(date => date)
  if (expiryDates.length > 0) {
    this.endOfDay.expiryDate = new Date(Math.min(...expiryDates.map(d => d.getTime())))
  }
  
  // Auto-update status based on expiry date
  if (this.endOfDay.expiryDate) {
    const today = new Date()
    const daysUntilExpiry = Math.ceil((this.endOfDay.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      this.status = 'Hết hạn'
    } else if (daysUntilExpiry <= 3) {
      this.status = 'Sắp hết hạn'
    } else if (daysUntilExpiry <= 7) {
      this.status = 'Bình thường'
    } else {
      this.status = 'Tốt'
    }
  }
  
  next()
})

// Methods
lttpInventorySchema.methods.calculateTurnoverRate = function() {
  const totalInput = this.input.quantity + this.previousDay.quantity
  return totalInput > 0 ? (this.output.quantity / totalInput) * 100 : 0
}

lttpInventorySchema.methods.generateExpiryAlert = function() {
  if (this.endOfDay.expiryDate) {
    const today = new Date()
    const daysUntilExpiry = Math.ceil((this.endOfDay.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry <= 1 && daysUntilExpiry >= 0) {
      this.alerts.push({
        type: 'expiry_warning',
        message: `Sản phẩm sẽ hết hạn trong ${daysUntilExpiry} ngày`,
        severity: 'critical'
      })
    } else if (daysUntilExpiry <= 3) {
      this.alerts.push({
        type: 'expiry_warning',
        message: `Sản phẩm sẽ hết hạn trong ${daysUntilExpiry} ngày`,
        severity: 'high'
      })
    }
  }
}

export const LTTPInventory = mongoose.model('LTTPInventory', lttpInventorySchema) 