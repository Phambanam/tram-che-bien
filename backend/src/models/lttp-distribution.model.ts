import mongoose from 'mongoose'

const lttpDistributionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  lttpItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LTTPItem',
    required: true
  },
  
  // Thông tin chung
  totalSuggestedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  totalActualQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Phân bổ cho Thứ đoàn 1
  unit1: {
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    suggestedQuantity: { type: Number, default: 0 },
    actualQuantity: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    personnelCount: { type: Number, default: 0 },
    notes: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'distributed', 'completed'],
      default: 'pending'
    },
    distributedAt: { type: Date },
    distributedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Phân bổ cho Thứ đoàn 2
  unit2: {
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    suggestedQuantity: { type: Number, default: 0 },
    actualQuantity: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    personnelCount: { type: Number, default: 0 },
    notes: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'distributed', 'completed'],
      default: 'pending'
    },
    distributedAt: { type: Date },
    distributedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Phân bổ cho Thứ đoàn 3
  unit3: {
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    suggestedQuantity: { type: Number, default: 0 },
    actualQuantity: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    personnelCount: { type: Number, default: 0 },
    notes: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'distributed', 'completed'],
      default: 'pending'
    },
    distributedAt: { type: Date },
    distributedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Phân bổ cho Lễ đoàn hộ
  ceremonyUnit: {
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    suggestedQuantity: { type: Number, default: 0 },
    actualQuantity: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    personnelCount: { type: Number, default: 0 },
    notes: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'distributed', 'completed'],
      default: 'pending'
    },
    distributedAt: { type: Date },
    distributedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Trạng thái phân bổ tổng thể
  overallStatus: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  // Approval workflow
  approvalFlow: {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    approvalNotes: { type: String }
  },
  
  // Distribution tracking
  distribution: {
    startedAt: { type: Date },
    completedAt: { type: Date },
    distributionNotes: { type: String },
    issues: [{
      type: { type: String, enum: ['shortage', 'quality', 'logistics', 'other'] },
      description: { type: String },
      reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reportedAt: { type: Date, default: Date.now },
      resolved: { type: Boolean, default: false },
      resolution: { type: String }
    }]
  },
  
  // Financial tracking
  budget: {
    allocatedAmount: { type: Number, default: 0 },
    actualAmount: { type: Number, default: 0 },
    variance: { type: Number, default: 0 },
    budgetPeriod: { type: String }, // 'daily', 'weekly', 'monthly'
  },
  
  // Quality assurance
  qualityCheck: {
    checked: { type: Boolean, default: false },
    checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkedAt: { type: Date },
    qualityRating: { type: Number, min: 1, max: 5 },
    qualityNotes: { type: String }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
})

// Indexes
lttpDistributionSchema.index({ date: 1, lttpItemId: 1 }, { unique: true })
lttpDistributionSchema.index({ date: 1 })
lttpDistributionSchema.index({ lttpItemId: 1 })
lttpDistributionSchema.index({ overallStatus: 1 })
lttpDistributionSchema.index({ 'unit1.status': 1 })
lttpDistributionSchema.index({ 'unit2.status': 1 })
lttpDistributionSchema.index({ 'unit3.status': 1 })
lttpDistributionSchema.index({ 'ceremonyUnit.status': 1 })

// Pre-save middleware to calculate totals
lttpDistributionSchema.pre('save', function(next) {
  // Calculate total actual quantity and amount
  this.totalActualQuantity = 
    this.unit1.actualQuantity + 
    this.unit2.actualQuantity + 
    this.unit3.actualQuantity + 
    this.ceremonyUnit.actualQuantity
  
  this.totalAmount = 
    this.unit1.amount + 
    this.unit2.amount + 
    this.unit3.amount + 
    this.ceremonyUnit.amount
  
  // Calculate budget variance
  this.budget.variance = this.budget.actualAmount - this.budget.allocatedAmount
  
  // Update overall status based on unit statuses
  const unitStatuses = [
    this.unit1.status,
    this.unit2.status,
    this.unit3.status,
    this.ceremonyUnit.status
  ]
  
  if (unitStatuses.every(status => status === 'completed')) {
    this.overallStatus = 'completed'
    this.distribution.completedAt = new Date()
  } else if (unitStatuses.some(status => ['distributed', 'completed'].includes(status))) {
    this.overallStatus = 'in_progress'
    if (!this.distribution.startedAt) {
      this.distribution.startedAt = new Date()
    }
  }
  
  // Increment version on updates
  if (!this.isNew) {
    this.version += 1
  }
  
  next()
})

// Methods
lttpDistributionSchema.methods.calculateDistributionEfficiency = function() {
  const suggested = this.totalSuggestedQuantity
  const actual = this.totalActualQuantity
  return suggested > 0 ? (actual / suggested) * 100 : 0
}

lttpDistributionSchema.methods.getUnitDistribution = function(unitName) {
  switch (unitName.toLowerCase()) {
    case 'unit1':
    case 'thứ đoàn 1':
      return this.unit1
    case 'unit2':
    case 'thứ đoàn 2':
      return this.unit2
    case 'unit3':
    case 'thứ đoàn 3':
      return this.unit3
    case 'ceremony':
    case 'lễ đoàn hộ':
      return this.ceremonyUnit
    default:
      return null
  }
}

lttpDistributionSchema.methods.markUnitAsDistributed = function(unitName, distributedBy, receivedBy) {
  const unit = this.getUnitDistribution(unitName)
  if (unit) {
    unit.status = 'distributed'
    unit.distributedAt = new Date()
    unit.distributedBy = distributedBy
    unit.receivedBy = receivedBy
  }
}

export const LTTPDistribution = mongoose.model('LTTPDistribution', lttpDistributionSchema) 