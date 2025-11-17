/**
 * POS Import Routes
 * File upload and data import endpoints
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const posImportController = require('../controllers/posImportController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/pos-imports');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Apply authentication to all routes
router.use(authenticateToken);

// Upload and preview file
router.post('/upload',
  authorize('user', 'manager', 'admin'),
  upload.single('file'),
  posImportController.uploadAndPreview
);

// Validate import data
router.post('/validate',
  authorize('user', 'manager', 'admin'),
  posImportController.validateImport
);

// Confirm and execute import
router.post('/confirm',
  authorize('manager', 'admin'),
  posImportController.confirmImport
);

// Get import job status
router.get('/status/:jobId',
  posImportController.getImportStatus
);

// Get import history
router.get('/history',
  posImportController.getImportHistory
);

// Download template
router.get('/template',
  posImportController.downloadTemplate
);

// Cancel import
router.delete('/:jobId',
  authorize('manager', 'admin'),
  posImportController.cancelImport
);

module.exports = router;
