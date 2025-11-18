const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Super admin only routes
router.use(authorize(['super_admin']));

// Get all companies
router.get('/', companyController.getCompanies);

// Get company statistics
router.get('/stats', companyController.getCompanyStats);

// Get single company
router.get('/:id', companyController.getCompany);

// Create new company
router.post('/', companyController.createCompany);

// Update company
router.put('/:id', companyController.updateCompany);

// Delete company (soft delete)
router.delete('/:id', companyController.deleteCompany);

// Toggle company status
router.patch('/:id/toggle-status', companyController.toggleCompanyStatus);

// Create company administrator
router.post('/:id/admin', companyController.createCompanyAdmin);

module.exports = router;
