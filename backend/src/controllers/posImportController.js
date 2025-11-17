/**
 * POS Import Controller
 * Handles file uploads and POS data import
 */

const posImportService = require('../services/posImportService');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');

// Store import jobs in memory (in production, use Redis)
const importJobs = new Map();

/**
 * Upload and preview POS data file
 */
exports.uploadAndPreview = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  const filePath = req.file.path;
  const fileType = path.extname(req.file.originalname).slice(1).toLowerCase();

  try {
    // Parse file
    const data = await posImportService.parseFile(filePath, fileType);

    // Preview first 10 rows
    const preview = data.slice(0, 10);

    // Detect columns
    const columns = Object.keys(preview[0] || {});

    // Store file info for later import
    const jobId = `import-${Date.now()}`;
    importJobs.set(jobId, {
      filePath,
      fileType,
      totalRows: data.length,
      uploadedAt: new Date(),
      tenantId: req.user.tenantId,
      userId: req.user._id,
      status: 'pending'
    });

    res.json({
      success: true,
      data: {
        jobId,
        preview,
        columns,
        totalRows: data.length,
        fileInfo: {
          name: req.file.originalname,
          size: req.file.size,
          type: fileType
        }
      }
    });

  } catch (error) {
    // Clean up file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return next(new AppError(`File processing failed: ${error.message}`, 400));
  }
});

/**
 * Validate import data
 */
exports.validateImport = asyncHandler(async (req, res, next) => {
  const { jobId } = req.body;

  const job = importJobs.get(jobId);
  if (!job) {
    return next(new AppError('Import job not found', 404));
  }

  // Parse file again
  const data = await posImportService.parseFile(job.filePath, job.fileType);

  // Validate all rows
  const validation = await posImportService.validateData(data, req.user.tenantId);

  // Update job
  importJobs.set(jobId, {
    ...job,
    validation,
    status: 'validated'
  });

  res.json({
    success: true,
    data: validation
  });
});

/**
 * Confirm and execute import
 */
exports.confirmImport = asyncHandler(async (req, res, next) => {
  const { jobId } = req.body;

  const job = importJobs.get(jobId);
  if (!job) {
    return next(new AppError('Import job not found', 404));
  }

  if (job.status !== 'validated') {
    return next(new AppError('Import must be validated first', 400));
  }

  // Update job status
  importJobs.set(jobId, {
    ...job,
    status: 'processing',
    startedAt: new Date()
  });

  // Start import in background
  setImmediate(async () => {
    try {
      // Parse file
      const data = await posImportService.parseFile(job.filePath, job.fileType);

      // Validate
      const validation = await posImportService.validateData(data, job.tenantId);

      if (!validation.isValid && validation.validRows.length === 0) {
        importJobs.set(jobId, {
          ...job,
          status: 'failed',
          error: 'No valid rows to import',
          completedAt: new Date()
        });
        return;
      }

      // Import valid rows
      const result = await posImportService.importData(
        validation.validRows,
        job.tenantId,
        job.userId,
        (progress) => {
          // Update progress
          importJobs.set(jobId, {
            ...job,
            status: 'processing',
            progress
          });
        }
      );

      // Aggregate to sales history
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await posImportService.aggregateToSalesHistory(
        thirtyDaysAgo,
        now,
        job.tenantId
      );

      // Update job as completed
      importJobs.set(jobId, {
        ...job,
        status: 'completed',
        result,
        completedAt: new Date()
      });

      // Clean up file
      if (fs.existsSync(job.filePath)) {
        fs.unlinkSync(job.filePath);
      }

    } catch (error) {
      importJobs.set(jobId, {
        ...job,
        status: 'failed',
        error: error.message,
        completedAt: new Date()
      });
    }
  });

  // Return immediately
  res.json({
    success: true,
    message: 'Import started',
    data: {
      jobId,
      status: 'processing'
    }
  });
});

/**
 * Get import job status
 */
exports.getImportStatus = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;

  const job = importJobs.get(jobId);
  if (!job) {
    return next(new AppError('Import job not found', 404));
  }

  res.json({
    success: true,
    data: {
      jobId,
      status: job.status,
      progress: job.progress,
      result: job.result,
      validation: job.validation,
      error: job.error,
      uploadedAt: job.uploadedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    }
  });
});

/**
 * Get import history
 */
exports.getImportHistory = asyncHandler(async (req, res, next) => {
  const tenantId = req.user.tenantId;

  const history = Array.from(importJobs.entries())
    .filter(([_, job]) => job.tenantId === tenantId)
    .map(([jobId, job]) => ({
      jobId,
      status: job.status,
      totalRows: job.totalRows,
      result: job.result,
      uploadedAt: job.uploadedAt,
      completedAt: job.completedAt
    }))
    .sort((a, b) => b.uploadedAt - a.uploadedAt);

  res.json({
    success: true,
    data: history
  });
});

/**
 * Download import template
 */
exports.downloadTemplate = asyncHandler(async (req, res, next) => {
  const template = posImportService.generateTemplate();

  // Convert to CSV
  const csvContent = [
    template.headers.join(','),
    ...template.sampleData.map((row) =>
      template.headers.map((header) => row[header] || '').join(',')
    )
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${template.filename}`);
  res.send(csvContent);
});

/**
 * Cancel import job
 */
exports.cancelImport = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;

  const job = importJobs.get(jobId);
  if (!job) {
    return next(new AppError('Import job not found', 404));
  }

  if (job.status === 'completed' || job.status === 'failed') {
    return next(new AppError('Cannot cancel completed or failed job', 400));
  }

  // Clean up file
  if (fs.existsSync(job.filePath)) {
    fs.unlinkSync(job.filePath);
  }

  // Update job
  importJobs.set(jobId, {
    ...job,
    status: 'cancelled',
    completedAt: new Date()
  });

  res.json({
    success: true,
    message: 'Import cancelled'
  });
});

module.exports = exports;
