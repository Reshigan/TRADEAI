const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Customer = require('../models/Customer');

router.get('/', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Admin or Manager role required.' });
    }

    const users = await User.find({
      tenantId,
      role: 'kam',
      isActive: true
    })
      .populate('assignedCustomers', 'name code customerType')
      .select('firstName lastName email assignedCustomers');

    res.json({ users });
  } catch (error) {
    console.error('Get customer assignments error:', error);
    res.status(500).json({ message: 'Error fetching customer assignments', error: error.message });
  }
});

router.post('/assign', protect, async (req, res) => {
  try {
    const { userId, customerIds } = req.body;
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Admin or Manager role required.' });
    }

    if (!userId || !customerIds || !Array.isArray(customerIds)) {
      return res.status(400).json({ message: 'Invalid request. userId and customerIds array required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'kam') {
      return res.status(400).json({ message: 'User must have KAM role' });
    }

    const customers = await Customer.find({
      _id: { $in: customerIds },
      tenantId: req.user.tenantId
    });

    if (customers.length !== customerIds.length) {
      return res.status(400).json({ message: 'Some customers not found' });
    }

    user.assignedCustomers = customerIds;
    await user.save();

    const updatedUser = await User.findById(userId)
      .populate('assignedCustomers', 'name code customerType')
      .select('firstName lastName email assignedCustomers');

    res.json({
      message: 'Customers assigned successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Assign customers error:', error);
    res.status(500).json({ message: 'Error assigning customers', error: error.message });
  }
});

router.post('/unassign', protect, async (req, res) => {
  try {
    const { userId, customerId } = req.body;
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Admin or Manager role required.' });
    }

    if (!userId || !customerId) {
      return res.status(400).json({ message: 'Invalid request. userId and customerId required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.assignedCustomers = user.assignedCustomers.filter(
      c => c.toString() !== customerId.toString()
    );
    await user.save();

    const updatedUser = await User.findById(userId)
      .populate('assignedCustomers', 'name code customerType')
      .select('firstName lastName email assignedCustomers');

    res.json({
      message: 'Customer unassigned successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Unassign customer error:', error);
    res.status(500).json({ message: 'Error unassigning customer', error: error.message });
  }
});

router.get('/unassigned', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Admin or Manager role required.' });
    }

    const users = await User.find({
      tenantId,
      role: 'kam',
      isActive: true
    }).select('assignedCustomers');

    const assignedCustomerIds = users.reduce((acc, user) => {
      return acc.concat(user.assignedCustomers || []);
    }, []);

    const unassignedCustomers = await Customer.find({
      tenantId,
      _id: { $nin: assignedCustomerIds }
    }).select('name code customerType tier');

    res.json({ customers: unassignedCustomers });
  } catch (error) {
    console.error('Get unassigned customers error:', error);
    res.status(500).json({ message: 'Error fetching unassigned customers', error: error.message });
  }
});

module.exports = router;
