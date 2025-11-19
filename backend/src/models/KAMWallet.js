const mongoose = require('mongoose');

const kamWalletSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  totalAllocation: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'ZAR'
  },
  allocations: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    allocatedAmount: {
      type: Number,
      required: true,
      min: 0
    },
    usedAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    allocatedDate: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  status: {
    type: String,
    enum: ['active', 'exhausted', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

kamWalletSchema.index({ tenantId: 1, userId: 1, 'period.startDate': 1 });

kamWalletSchema.virtual('totalUsed').get(function () {
  return this.allocations.reduce((sum, alloc) => sum + alloc.usedAmount, 0);
});

kamWalletSchema.virtual('remainingBalance').get(function () {
  return this.totalAllocation - this.totalUsed;
});

kamWalletSchema.methods.canAllocate = function (amount) {
  return this.remainingBalance >= amount;
};

kamWalletSchema.methods.allocateToCustomer = function (customerId, amount, notes = '') {
  if (!this.canAllocate(amount)) {
    throw new Error('Insufficient wallet balance');
  }

  const existingAllocation = this.allocations.find(
    (alloc) => alloc.customerId.toString() === customerId.toString()
  );

  if (existingAllocation) {
    existingAllocation.allocatedAmount += amount;
    existingAllocation.notes = notes || existingAllocation.notes;
  } else {
    this.allocations.push({
      customerId,
      allocatedAmount: amount,
      usedAmount: 0,
      notes
    });
  }

  if (this.remainingBalance === 0) {
    this.status = 'exhausted';
  }

  return this.save();
};

kamWalletSchema.methods.recordUsage = function (customerId, amount) {
  const allocation = this.allocations.find(
    (alloc) => alloc.customerId.toString() === customerId.toString()
  );

  if (!allocation) {
    throw new Error('No allocation found for this customer');
  }

  if (allocation.usedAmount + amount > allocation.allocatedAmount) {
    throw new Error('Usage exceeds allocated amount');
  }

  allocation.usedAmount += amount;

  if (this.remainingBalance === 0) {
    this.status = 'exhausted';
  }

  return this.save();
};

const KAMWallet = mongoose.model('KAMWallet', kamWalletSchema);

module.exports = KAMWallet;
