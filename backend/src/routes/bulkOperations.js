const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const Budget = require('../models/Budget');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: '/tmp/uploads/' });

router.post('/import/customers', protect, upload.single('file'), async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Admin or Manager role required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let lineNumber = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        lineNumber++;
        try {
          results.push({
            tenantId: req.user.tenantId,
            name: data.name,
            code: data.code || `CUST-${Date.now()}-${lineNumber}`,
            customerType: data.customerType || 'retailer',
            tier: data.tier || 'bronze',
            paymentTerms: data.paymentTerms || 'NET30',
            creditLimit: parseFloat(data.creditLimit) || 0,
            currency: data.currency || 'ZAR',
            status: data.status || 'active'
          });
        } catch (error) {
          errors.push({ line: lineNumber, error: error.message });
        }
      })
      .on('end', async () => {
        try {
          if (results.length > 0) {
            const inserted = await Customer.insertMany(results, { ordered: false });
            
            fs.unlinkSync(req.file.path);

            res.json({
              message: 'Bulk import completed',
              imported: inserted.length,
              errors: errors.length,
              errorDetails: errors
            });
          } else {
            fs.unlinkSync(req.file.path);
            res.status(400).json({ message: 'No valid records to import', errors });
          }
        } catch (error) {
          fs.unlinkSync(req.file.path);
          res.status(500).json({ message: 'Error importing customers', error: error.message });
        }
      });
  } catch (error) {
    console.error('Bulk import customers error:', error);
    res.status(500).json({ message: 'Error processing bulk import', error: error.message });
  }
});

router.post('/import/products', protect, upload.single('file'), async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Admin or Manager role required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let lineNumber = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        lineNumber++;
        try {
          results.push({
            tenantId: req.user.tenantId,
            name: data.name,
            code: data.code || `PROD-${Date.now()}-${lineNumber}`,
            category: data.category || 'General',
            brand: data.brand || 'Generic',
            pricing: {
              listPrice: parseFloat(data.listPrice) || 0,
              costPrice: parseFloat(data.costPrice) || 0,
              currency: data.currency || 'ZAR'
            },
            status: data.status || 'active'
          });
        } catch (error) {
          errors.push({ line: lineNumber, error: error.message });
        }
      })
      .on('end', async () => {
        try {
          if (results.length > 0) {
            const inserted = await Product.insertMany(results, { ordered: false });
            
            fs.unlinkSync(req.file.path);

            res.json({
              message: 'Bulk import completed',
              imported: inserted.length,
              errors: errors.length,
              errorDetails: errors
            });
          } else {
            fs.unlinkSync(req.file.path);
            res.status(400).json({ message: 'No valid records to import', errors });
          }
        } catch (error) {
          fs.unlinkSync(req.file.path);
          res.status(500).json({ message: 'Error importing products', error: error.message });
        }
      });
  } catch (error) {
    console.error('Bulk import products error:', error);
    res.status(500).json({ message: 'Error processing bulk import', error: error.message });
  }
});

router.get('/export/customers', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const customers = await Customer.find({ tenantId }).lean();

    if (customers.length === 0) {
      return res.status(404).json({ message: 'No customers found' });
    }

    const headers = ['name', 'code', 'customerType', 'tier', 'paymentTerms', 'creditLimit', 'currency', 'status'];
    let csv = headers.join(',') + '\n';

    customers.forEach(customer => {
      const row = headers.map(header => {
        const value = customer[header] || '';
        return `"${value}"`;
      });
      csv += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
    res.send(csv);
  } catch (error) {
    console.error('Bulk export customers error:', error);
    res.status(500).json({ message: 'Error exporting customers', error: error.message });
  }
});

router.get('/export/products', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const products = await Product.find({ tenantId }).lean();

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    const headers = ['name', 'code', 'category', 'brand', 'listPrice', 'costPrice', 'currency', 'status'];
    let csv = headers.join(',') + '\n';

    products.forEach(product => {
      const row = [
        product.name || '',
        product.code || '',
        product.category || '',
        product.brand || '',
        product.pricing?.listPrice || 0,
        product.pricing?.costPrice || 0,
        product.pricing?.currency || 'ZAR',
        product.status || 'active'
      ];
      csv += row.map(v => `"${v}"`).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    res.send(csv);
  } catch (error) {
    console.error('Bulk export products error:', error);
    res.status(500).json({ message: 'Error exporting products', error: error.message });
  }
});

router.post('/update/status', protect, async (req, res) => {
  try {
    const { type, ids, status } = req.body;
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Admin or Manager role required.' });
    }

    if (!type || !ids || !Array.isArray(ids) || !status) {
      return res.status(400).json({ message: 'Invalid request. Type, ids array, and status required.' });
    }

    let Model;
    switch (type) {
      case 'customer':
        Model = Customer;
        break;
      case 'product':
        Model = Product;
        break;
      case 'promotion':
        Model = Promotion;
        break;
      case 'budget':
        Model = Budget;
        break;
      default:
        return res.status(400).json({ message: 'Invalid type' });
    }

    const result = await Model.updateMany(
      { _id: { $in: ids }, tenantId: req.user.tenantId },
      { $set: { status } }
    );

    res.json({
      message: 'Bulk update completed',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update status error:', error);
    res.status(500).json({ message: 'Error performing bulk update', error: error.message });
  }
});

// Bulk delete
router.post('/delete', protect, async (req, res) => {
  try {
    const { type, ids } = req.body;
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    if (!type || !ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Invalid request. Type and ids array required.' });
    }

    let Model;
    switch (type) {
      case 'customer':
        Model = Customer;
        break;
      case 'product':
        Model = Product;
        break;
      case 'promotion':
        Model = Promotion;
        break;
      case 'budget':
        Model = Budget;
        break;
      default:
        return res.status(400).json({ message: 'Invalid type' });
    }

    const result = await Model.deleteMany({
      _id: { $in: ids },
      tenantId: req.user.tenantId
    });

    res.json({
      message: 'Bulk delete completed',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Error performing bulk delete', error: error.message });
  }
});

module.exports = router;
