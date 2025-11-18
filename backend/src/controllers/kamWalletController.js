const KAMWallet = require('../models/KAMWallet');
const { validationResult } = require('express-validator');

// Get all wallets for a KAM
exports.getWallets = async (req, res) => {
  try {
    const { userId, status, startDate, endDate } = req.query;
    
    const query = { tenantId: req.user.company };
    
    if (userId) {
      query.userId = userId;
    } else if (req.user.role === 'key_account_manager') {
      query.userId = req.user._id;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query['period.startDate'] = { $lte: new Date(endDate) };
      query['period.endDate'] = { $gte: new Date(startDate) };
    }
    
    const wallets = await KAMWallet.find(query)
      .populate('userId', 'name email')
      .populate('allocations.customerId', 'name code')
      .sort({ 'period.startDate': -1 });
    
    res.json(wallets);
  } catch (error) {
    console.error('Error fetching KAM wallets:', error);
    res.status(500).json({ message: 'Failed to fetch wallets', error: error.message });
  }
};

// Get wallet by ID
exports.getWallet = async (req, res) => {
  try {
    const wallet = await KAMWallet.findOne({
      _id: req.params.id,
      tenantId: req.user.company
    })
      .populate('userId', 'name email role')
      .populate('allocations.customerId', 'name code');
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    res.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Failed to fetch wallet', error: error.message });
  }
};

// Create new wallet
exports.createWallet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { userId, period, totalAllocation, currency } = req.body;
    
    const wallet = new KAMWallet({
      tenantId: req.user.company,
      userId,
      period,
      totalAllocation,
      currency: currency || 'ZAR',
      allocations: [],
      status: 'active'
    });
    
    await wallet.save();
    
    res.status(201).json(wallet);
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ message: 'Failed to create wallet', error: error.message });
  }
};

// Allocate to customer
exports.allocateToCustomer = async (req, res) => {
  try {
    const { customerId, amount, notes } = req.body;
    
    const wallet = await KAMWallet.findOne({
      _id: req.params.id,
      tenantId: req.user.company
    });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    // Check if KAM is authorized
    if (req.user.role === 'key_account_manager' && wallet.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to allocate from this wallet' });
    }
    
    if (!wallet.canAllocate(amount)) {
      return res.status(400).json({ 
        message: 'Insufficient wallet balance',
        remainingBalance: wallet.remainingBalance,
        requestedAmount: amount
      });
    }
    
    await wallet.allocateToCustomer(customerId, amount, notes);
    
    await wallet.populate('allocations.customerId', 'name code');
    
    res.json(wallet);
  } catch (error) {
    console.error('Error allocating to customer:', error);
    res.status(500).json({ message: 'Failed to allocate', error: error.message });
  }
};

// Record usage
exports.recordUsage = async (req, res) => {
  try {
    const { customerId, amount } = req.body;
    
    const wallet = await KAMWallet.findOne({
      _id: req.params.id,
      tenantId: req.user.company
    });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    await wallet.recordUsage(customerId, amount);
    
    await wallet.populate('allocations.customerId', 'name code');
    
    res.json(wallet);
  } catch (error) {
    console.error('Error recording usage:', error);
    res.status(400).json({ message: 'Failed to record usage', error: error.message });
  }
};

// Get wallet balance
exports.getBalance = async (req, res) => {
  try {
    const wallet = await KAMWallet.findOne({
      _id: req.params.id,
      tenantId: req.user.company
    });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    res.json({
      totalAllocation: wallet.totalAllocation,
      totalUsed: wallet.totalUsed,
      remainingBalance: wallet.remainingBalance,
      status: wallet.status,
      currency: wallet.currency
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ message: 'Failed to fetch balance', error: error.message });
  }
};

// Get allocations for a specific customer
exports.getCustomerAllocations = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const wallets = await KAMWallet.find({
      tenantId: req.user.company,
      'allocations.customerId': customerId,
      status: 'active'
    })
      .populate('userId', 'name email')
      .populate('allocations.customerId', 'name code');
    
    const allocations = wallets.flatMap(wallet => 
      wallet.allocations
        .filter(alloc => alloc.customerId._id.toString() === customerId)
        .map(alloc => ({
          walletId: wallet._id,
          kam: wallet.userId,
          allocatedAmount: alloc.allocatedAmount,
          usedAmount: alloc.usedAmount,
          remainingAmount: alloc.allocatedAmount - alloc.usedAmount,
          allocatedDate: alloc.allocatedDate,
          notes: alloc.notes,
          currency: wallet.currency
        }))
    );
    
    res.json(allocations);
  } catch (error) {
    console.error('Error fetching customer allocations:', error);
    res.status(500).json({ message: 'Failed to fetch allocations', error: error.message });
  }
};

// Update wallet status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const wallet = await KAMWallet.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.company },
      { status },
      { new: true }
    )
      .populate('userId', 'name email')
      .populate('allocations.customerId', 'name code');
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    res.json(wallet);
  } catch (error) {
    console.error('Error updating wallet status:', error);
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};
