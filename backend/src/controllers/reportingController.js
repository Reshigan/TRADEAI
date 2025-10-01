const ReportingEngine = require('../services/reportingEngine');
const { asyncHandler } = require('../middleware/asyncHandler');
const { validateTenant } = require('../middleware/tenantValidation');
const fs = require('fs');

/**
 * Reporting Controller
 * Handles advanced report generation and management
 */

class ReportingController {
  constructor() {
    this.reportingEngine = new ReportingEngine();
  }

  /**
   * Generate Excel report
   * POST /api/reports/excel
   */
  generateExcelReport = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { reportType, parameters } = req.body;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        error: 'Report type is required'
      });
    }

    const result = await this.reportingEngine.generateExcelReport(
      tenantId,
      reportType,
      parameters || {}
    );

    if (result.success) {
      res.download(result.filePath, result.fileName, (err) => {
        if (err) {
          console.error('Excel report download error:', err);
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
        error: 'Excel report generation failed'
      });
    }
  });

  /**
   * Generate PDF report
   * POST /api/reports/pdf
   */
  generatePDFReport = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { reportType, parameters } = req.body;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        error: 'Report type is required'
      });
    }

    const result = await this.reportingEngine.generatePDFReport(
      tenantId,
      reportType,
      parameters || {}
    );

    if (result.success) {
      res.download(result.filePath, result.fileName, (err) => {
        if (err) {
          console.error('PDF report download error:', err);
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
        error: 'PDF report generation failed'
      });
    }
  });

  /**
   * Create custom report
   * POST /api/reports/custom
   */
  createCustomReport = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const reportConfig = req.body;

    if (!reportConfig.name || !reportConfig.metrics || !reportConfig.dimensions) {
      return res.status(400).json({
        success: false,
        error: 'Report name, metrics, and dimensions are required'
      });
    }

    const result = await this.reportingEngine.createCustomReport(
      tenantId,
      reportConfig
    );

    if (result.filePath) {
      // If a file was generated, send it as download
      res.download(result.filePath, result.fileName, (err) => {
        if (err) {
          console.error('Custom report download error:', err);
        }
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(result.filePath)) {
            fs.unlinkSync(result.filePath);
          }
        }, 5000);
      });
    } else {
      // Return data directly
      res.json({
        success: true,
        data: result
      });
    }
  });

  /**
   * Schedule recurring report
   * POST /api/reports/schedule
   */
  scheduleReport = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const scheduleConfig = req.body;

    if (!scheduleConfig.reportType || !scheduleConfig.schedule || !scheduleConfig.recipients) {
      return res.status(400).json({
        success: false,
        error: 'Report type, schedule, and recipients are required'
      });
    }

    const result = await this.reportingEngine.scheduleReport(
      tenantId,
      scheduleConfig
    );

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Get available report templates
   * GET /api/reports/templates
   */
  getReportTemplates = asyncHandler(async (req, res) => {
    const templates = this.reportingEngine.getReportTemplates();

    res.json({
      success: true,
      data: templates
    });
  });

  /**
   * Execute scheduled report
   * POST /api/reports/execute/:scheduleId
   */
  executeScheduledReport = asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;

    const result = await this.reportingEngine.executeScheduledReport(scheduleId);

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Get scheduled reports
   * GET /api/reports/scheduled
   */
  getScheduledReports = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;

    // Get all scheduled reports for the tenant
    const scheduledReports = Array.from(this.reportingEngine.scheduledReports.values())
      .filter(report => report.tenantId === tenantId)
      .map(report => ({
        id: report.id,
        name: report.name,
        reportType: report.reportType,
        schedule: report.schedule,
        recipients: report.recipients,
        format: report.format,
        isActive: report.isActive,
        lastRun: report.lastRun,
        nextRun: report.nextRun,
        createdAt: report.createdAt
      }));

    res.json({
      success: true,
      data: scheduledReports
    });
  });

  /**
   * Update scheduled report
   * PUT /api/reports/scheduled/:scheduleId
   */
  updateScheduledReport = asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;
    const updates = req.body;

    const scheduledReport = this.reportingEngine.scheduledReports.get(scheduleId);
    
    if (!scheduledReport) {
      return res.status(404).json({
        success: false,
        error: 'Scheduled report not found'
      });
    }

    // Update the scheduled report
    Object.assign(scheduledReport, updates);
    
    // Recalculate next run if schedule changed
    if (updates.schedule) {
      scheduledReport.nextRun = this.reportingEngine.calculateNextRun(updates.schedule);
    }

    res.json({
      success: true,
      data: {
        id: scheduledReport.id,
        message: 'Scheduled report updated successfully',
        nextRun: scheduledReport.nextRun
      }
    });
  });

  /**
   * Delete scheduled report
   * DELETE /api/reports/scheduled/:scheduleId
   */
  deleteScheduledReport = asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;

    const deleted = this.reportingEngine.scheduledReports.delete(scheduleId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Scheduled report not found'
      });
    }

    res.json({
      success: true,
      message: 'Scheduled report deleted successfully'
    });
  });

  /**
   * Get report generation status
   * GET /api/reports/status/:reportId
   */
  getReportStatus = asyncHandler(async (req, res) => {
    const { reportId } = req.params;

    // This would typically check a job queue for report generation status
    // For now, returning mock status
    const status = {
      reportId,
      status: 'completed', // pending, generating, completed, failed
      progress: 100,
      startTime: new Date(Date.now() - 30000),
      endTime: new Date(),
      downloadUrl: `/api/reports/download/${reportId}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    res.json({
      success: true,
      data: status
    });
  });

  /**
   * Download generated report
   * GET /api/reports/download/:reportId
   */
  downloadReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;

    // This would typically retrieve the file path from a database or cache
    // For now, returning error as files are cleaned up immediately after generation
    res.status(404).json({
      success: false,
      error: 'Report file not found or has expired'
    });
  });

  /**
   * Get report history
   * GET /api/reports/history
   */
  getReportHistory = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { page = 1, limit = 20, reportType, status } = req.query;

    // This would typically query a database for report history
    // For now, returning mock history
    const history = [
      {
        id: 'report_001',
        name: 'Customer Performance Report',
        reportType: 'customer_performance',
        format: 'excel',
        status: 'completed',
        generatedAt: new Date(Date.now() - 3600000),
        generatedBy: req.user?.name || 'System',
        parameters: {
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-31'
          }
        }
      },
      {
        id: 'report_002',
        name: 'Promotion ROI Analysis',
        reportType: 'promotion_roi',
        format: 'pdf',
        status: 'completed',
        generatedAt: new Date(Date.now() - 7200000),
        generatedBy: req.user?.name || 'System',
        parameters: {
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-31'
          },
          includeForecasting: true
        }
      }
    ];

    res.json({
      success: true,
      data: {
        reports: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: history.length,
          pages: Math.ceil(history.length / limit)
        }
      }
    });
  });

  /**
   * Get report metrics and analytics
   * GET /api/reports/metrics
   */
  getReportMetrics = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;

    // Mock report metrics
    const metrics = {
      totalReports: 156,
      reportsThisMonth: 23,
      scheduledReports: 8,
      activeSchedules: 6,
      mostPopularReportType: 'customer_performance',
      averageGenerationTime: 45, // seconds
      reportsByType: {
        customer_performance: 45,
        product_performance: 38,
        promotion_roi: 32,
        trade_spend: 28,
        custom: 13
      },
      reportsByFormat: {
        excel: 89,
        pdf: 67
      },
      recentActivity: [
        {
          action: 'generated',
          reportType: 'customer_performance',
          timestamp: new Date(Date.now() - 1800000)
        },
        {
          action: 'scheduled',
          reportType: 'promotion_roi',
          timestamp: new Date(Date.now() - 3600000)
        }
      ]
    };

    res.json({
      success: true,
      data: metrics
    });
  });

  /**
   * Validate report configuration
   * POST /api/reports/validate
   */
  validateReportConfig = asyncHandler(async (req, res) => {
    const reportConfig = req.body;

    try {
      this.reportingEngine.validateReportConfig(reportConfig);
      
      res.json({
        success: true,
        message: 'Report configuration is valid',
        data: {
          estimatedRecords: 1000,
          estimatedGenerationTime: 30, // seconds
          supportedFormats: ['excel', 'pdf', 'json']
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Preview report data
   * POST /api/reports/preview
   */
  previewReportData = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { reportType, parameters } = req.body;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        error: 'Report type is required'
      });
    }

    // Get a sample of the report data
    const reportData = await this.reportingEngine.getReportData(
      tenantId,
      reportType,
      parameters || {}
    );

    // Return a preview with limited data
    const preview = {};
    Object.keys(reportData).forEach(key => {
      if (Array.isArray(reportData[key])) {
        preview[key] = reportData[key].slice(0, 10); // First 10 records
      } else {
        preview[key] = reportData[key];
      }
    });

    res.json({
      success: true,
      data: {
        preview,
        totalRecords: Object.values(reportData)
          .filter(Array.isArray)
          .reduce((sum, arr) => sum + arr.length, 0)
      }
    });
  });
}

module.exports = new ReportingController();