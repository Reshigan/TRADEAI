const BulkOperationsService = require('../services/bulkOperationsService');
const { asyncHandler } = require('../middleware/asyncHandler');
const { _validateTenant } = require('../middleware/tenantValidation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Bulk Operations Controller
 * Handles Excel/CSV import/export and bulk data operations
 */

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'temp', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

class BulkOperationsController {
  constructor() {
    this.bulkService = new BulkOperationsService();
  }

  /**
   * Import data from Excel/CSV file
   * POST /api/bulk/import
   */
  importData = [
    upload.single('file'),
    asyncHandler(async (req, res) => {
      const tenantId = req.tenant.id;
      const { modelType, updateExisting, ignoreErrors } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'File is required'
        });
      }

      if (!modelType) {
        return res.status(400).json({
          success: false,
          error: 'Model type is required (customer, product, promotion)'
        });
      }

      try {
        const result = await this.bulkService.importData(
          tenantId,
          req.file.path,
          modelType,
          {
            updateExisting: updateExisting === 'true',
            ignoreErrors: ignoreErrors === 'true'
          }
        );

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          success: true,
          data: result
        });

      } catch (error) {
        // Clean up uploaded file on error
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw error;
      }
    })
  ];

  /**
   * Export data to Excel/CSV
   * GET /api/bulk/export/:modelType
   */
  exportData = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { modelType } = req.params;
    const { format, includeHierarchy, ...filters } = req.query;

    const result = await this.bulkService.exportData(
      tenantId,
      modelType,
      filters,
      {
        format: format || 'xlsx',
        includeHierarchy: includeHierarchy === 'true'
      }
    );

    if (result.success) {
      // Send file as download
      res.download(result.filePath, result.fileName || `${modelType}_export.${format || 'xlsx'}`, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(result.filePath)) {
            fs.unlinkSync(result.filePath);
          }
        }, 5000);
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Export failed'
      });
    }
  });

  /**
   * Bulk update records
   * PUT /api/bulk/update/:modelType
   */
  bulkUpdate = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { modelType } = req.params;
    const { updates, upsert } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Updates array is required'
      });
    }

    const result = await this.bulkService.bulkUpdate(
      tenantId,
      modelType,
      updates,
      { upsert: upsert === true }
    );

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Bulk delete records
   * DELETE /api/bulk/delete/:modelType
   */
  bulkDelete = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { modelType } = req.params;
    const { ids, softDelete } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'IDs array is required'
      });
    }

    const result = await this.bulkService.bulkDelete(
      tenantId,
      modelType,
      ids,
      { softDelete: softDelete !== false }
    );

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Synchronize data with external system
   * POST /api/bulk/sync/:modelType
   */
  syncData = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { modelType } = req.params;
    const { externalData, syncKey, createMissing } = req.body;

    if (!Array.isArray(externalData) || externalData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'External data array is required'
      });
    }

    const result = await this.bulkService.syncData(
      tenantId,
      modelType,
      externalData,
      {
        syncKey: syncKey || 'code',
        createMissing: createMissing !== false
      }
    );

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Generate import template
   * GET /api/bulk/template/:modelType
   */
  generateTemplate = asyncHandler(async (req, res) => {
    const { modelType } = req.params;
    const { format, includeExamples } = req.query;

    const result = await this.bulkService.generateTemplate(
      modelType,
      {
        format: format || 'xlsx',
        includeExamples: includeExamples === 'true'
      }
    );

    if (result.success) {
      const fileName = `${modelType}_template.${result.format}`;

      res.download(result.filePath, fileName, (err) => {
        if (err) {
          console.error('Template download error:', err);
        }
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(result.filePath)) {
            fs.unlinkSync(result.filePath);
          }
        }, 5000);
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Template generation failed'
      });
    }
  });

  /**
   * Validate import file without importing
   * POST /api/bulk/validate
   */
  validateImport = [
    upload.single('file'),
    asyncHandler(async (req, res) => {
      const tenantId = req.tenant.id;
      const { modelType } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'File is required'
        });
      }

      if (!modelType) {
        return res.status(400).json({
          success: false,
          error: 'Model type is required'
        });
      }

      try {
        // Parse file
        const data = await this.bulkService.parseFile(req.file.path);

        // Validate data
        const validation = await this.bulkService.validateData(data, modelType, tenantId);

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          success: true,
          data: {
            totalRecords: data.length,
            validRecords: validation.validRecords.length,
            invalidRecords: validation.errors.length,
            errors: validation.errors.slice(0, 100), // Limit errors in response
            sample: validation.validRecords.slice(0, 5) // Show sample of valid records
          }
        });

      } catch (error) {
        // Clean up uploaded file on error
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw error;
      }
    })
  ];

  /**
   * Get bulk operation status
   * GET /api/bulk/status/:operationId
   */
  getOperationStatus = asyncHandler(async (req, res) => {
    const { operationId } = req.params;
    const BulkOperation = require('../models/BulkOperation');

    const operation = await BulkOperation.findOne({ operationId })
      .populate('userId', 'firstName lastName email');

    if (!operation) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found'
      });
    }

    const status = {
      operationId: operation.operationId,
      operation: operation.operation,
      modelType: operation.modelType,
      status: operation.status,
      progress: operation.progress,
      startTime: operation.startTime,
      endTime: operation.endTime,
      duration: operation.duration,
      results: operation.results,
      errors: operation.errors,
      user: operation.userId ? `${operation.userId.firstName} ${operation.userId.lastName}` : 'System'
    };

    res.json({
      success: true,
      data: status
    });
  });

  /**
   * Get supported model types and their fields
   * GET /api/bulk/models
   */
  getSupportedModels = asyncHandler((req, res) => {
    const models = {
      customer: {
        name: 'Customer',
        description: 'Customer master data',
        fields: this.bulkService.getModelFields('customer'),
        supportedOperations: ['import', 'export', 'update', 'delete', 'sync']
      },
      product: {
        name: 'Product',
        description: 'Product master data',
        fields: this.bulkService.getModelFields('product'),
        supportedOperations: ['import', 'export', 'update', 'delete', 'sync']
      },
      promotion: {
        name: 'Promotion',
        description: 'Promotion data',
        fields: this.bulkService.getModelFields('promotion'),
        supportedOperations: ['import', 'export', 'update', 'delete']
      }
    };

    res.json({
      success: true,
      data: models
    });
  });

  /**
   * Get bulk operation history
   * GET /api/bulk/history
   */
  getOperationHistory = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { page = 1, limit = 20, operation, modelType, status } = req.query;
    const BulkOperation = require('../models/BulkOperation');

    const query = { companyId: tenantId };
    if (operation) query.operation = operation;
    if (modelType) query.modelType = modelType;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [operations, total] = await Promise.all([
      BulkOperation.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BulkOperation.countDocuments(query)
    ]);

    const history = operations.map((op) => ({
      id: op.operationId,
      operation: op.operation,
      modelType: op.modelType,
      status: op.status,
      recordsProcessed: op.results?.processed || 0,
      recordsSuccessful: op.results?.successful || 0,
      recordsFailed: op.results?.failed || 0,
      startTime: op.startTime,
      endTime: op.endTime,
      duration: op.duration,
      user: op.userId ? `${op.userId.firstName} ${op.userId.lastName}` : 'System'
    }));

    res.json({
      success: true,
      data: {
        operations: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  });

  /**
   * Cancel bulk operation
   * POST /api/bulk/cancel/:operationId
   */
  cancelOperation = asyncHandler(async (req, res) => {
    const { operationId } = req.params;
    const BulkOperation = require('../models/BulkOperation');

    const operation = await BulkOperation.findOne({ operationId });

    if (!operation) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found'
      });
    }

    if (operation.status === 'completed' || operation.status === 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel a completed or failed operation'
      });
    }

    await operation.cancel(req.user._id);

    res.json({
      success: true,
      message: `Operation ${operationId} cancelled successfully`,
      data: {
        operationId,
        status: 'cancelled'
      }
    });
  });
}

module.exports = new BulkOperationsController();
