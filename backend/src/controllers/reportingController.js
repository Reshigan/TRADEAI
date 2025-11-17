const ReportingEngine = require('../services/reportingEngine');
const AdvancedReportingEngine = require('../services/advancedReportingEngine');
const Report = require('../models/Report');
const { asyncHandler } = require('../middleware/asyncHandler');
const { _validateTenant } = require('../middleware/tenantValidation');
const fs = require('fs');
const path = require('path');

/**
 * Reporting Controller
 * Handles advanced report generation and management
 */

class ReportingController {
  constructor() {
    this.reportingEngine = new ReportingEngine();
    this.advancedReportingEngine = AdvancedReportingEngine;
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
  getReportTemplates = asyncHandler((req, res) => {
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
  getScheduledReports = asyncHandler((req, res) => {
    const tenantId = req.tenant.id;

    // Get all scheduled reports for the tenant
    const scheduledReports = Array.from(this.reportingEngine.scheduledReports.values())
      .filter((report) => report.tenantId === tenantId)
      .map((report) => ({
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
  updateScheduledReport = asyncHandler((req, res) => {
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
  deleteScheduledReport = asyncHandler((req, res) => {
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
  getReportStatus = asyncHandler((req, res) => {
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
  downloadReport = asyncHandler((req, res) => {
    const { _reportId } = req.params;

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
  getReportHistory = asyncHandler((req, res) => {
    const _tenantId = req.tenant.id;
    const { page = 1, limit = 20, _reportType, _status } = req.query;

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
  getReportMetrics = asyncHandler((req, res) => {
    const _tenantId = req.tenant.id;

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
  validateReportConfig = asyncHandler((req, res) => {
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
    Object.keys(reportData).forEach((key) => {
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

  // Advanced Reporting Methods

  /**
   * Generate advanced Excel report with custom configuration
   * POST /api/reports/advanced/excel
   */
  generateAdvancedExcelReport = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const {
      reportType,
      title,
      dataSource,
      columns,
      filters = {},
      charts = [],
      formatting = {},
      fileName,
      includeSummary = true
    } = req.body;

    // Validate required fields
    if (!reportType || !dataSource || !columns) {
      return res.status(400).json({
        success: false,
        error: 'reportType, dataSource, and columns are required'
      });
    }

    // Get data for the report
    const data = await this.advancedReportingEngine.getReportData(tenantId, {
      dataSource,
      filters,
      dateRange: filters.dateRange
    });

    // Generate Excel report
    const result = await this.advancedReportingEngine.generateExcelReport(tenantId, {
      reportType,
      title: title || `${reportType} Report`,
      data,
      columns,
      charts,
      formatting,
      fileName: fileName || `${reportType}_${Date.now()}.xlsx`
    }, { includeSummary });

    // Save report record
    const reportRecord = await Report.create({
      company: tenantId,
      name: title || `${reportType} Report`,
      reportType,
      configuration: {
        dataSources: [dataSource],
        filters,
        columns: columns.map((col) => ({
          field: col.key,
          label: col.header,
          type: col.type || 'text'
        }))
      },
      exportSettings: {
        formats: [{ type: 'excel', enabled: true }],
        includeCharts: charts.length > 0
      },
      reportData: {
        data: data.slice(0, 100), // Store sample for preview
        summary: {
          totalRecords: data.length,
          generatedAt: new Date()
        },
        generatedAt: new Date()
      },
      createdBy: userId,
      status: 'active'
    });

    res.json({
      success: true,
      data: {
        reportId: reportRecord._id,
        fileName: result.fileName,
        filePath: result.filePath,
        size: result.size,
        downloadUrl: `/api/reports/download-advanced/${reportRecord._id}`,
        generatedAt: result.generatedAt
      }
    });
  });

  /**
   * Generate advanced PDF report
   * POST /api/reports/advanced/pdf
   */
  generateAdvancedPDFReport = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const {
      reportType,
      title,
      dataSource,
      columns,
      filters = {},
      sections = [],
      charts = [],
      formatting = {},
      fileName,
      includeExecutiveSummary = true
    } = req.body;

    // Validate required fields
    if (!reportType || !dataSource || !columns) {
      return res.status(400).json({
        success: false,
        error: 'reportType, dataSource, and columns are required'
      });
    }

    // Get data for the report
    const data = await this.advancedReportingEngine.getReportData(tenantId, {
      dataSource,
      filters,
      dateRange: filters.dateRange
    });

    // Generate PDF report
    const result = await this.advancedReportingEngine.generatePDFReport(tenantId, {
      reportType,
      title: title || `${reportType} Report`,
      data,
      columns,
      sections,
      charts,
      formatting,
      fileName: fileName || `${reportType}_${Date.now()}.pdf`
    }, { includeExecutiveSummary });

    // Save report record
    const reportRecord = await Report.create({
      company: tenantId,
      name: title || `${reportType} Report`,
      reportType,
      configuration: {
        dataSources: [dataSource],
        filters,
        columns: columns.map((col) => ({
          field: col.key,
          label: col.header,
          type: col.type || 'text'
        }))
      },
      exportSettings: {
        formats: [{ type: 'pdf', enabled: true }],
        includeCharts: charts.length > 0
      },
      reportData: {
        data: data.slice(0, 100), // Store sample for preview
        summary: {
          totalRecords: data.length,
          generatedAt: new Date()
        },
        generatedAt: new Date()
      },
      createdBy: userId,
      status: 'active'
    });

    res.json({
      success: true,
      data: {
        reportId: reportRecord._id,
        fileName: result.fileName,
        filePath: result.filePath,
        size: result.size,
        downloadUrl: `/api/reports/download-advanced/${reportRecord._id}`,
        generatedAt: result.generatedAt
      }
    });
  });

  /**
   * Generate multi-sheet Excel report
   * POST /api/reports/advanced/multi-sheet
   */
  generateMultiSheetReport = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const {
      title,
      sheets,
      fileName
    } = req.body;

    if (!sheets || !Array.isArray(sheets) || sheets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'sheets array is required'
      });
    }

    // Validate each sheet configuration
    for (const sheet of sheets) {
      if (!sheet.name || !sheet.dataSource || !sheet.columns) {
        return res.status(400).json({
          success: false,
          error: 'Each sheet must have name, dataSource, and columns'
        });
      }
    }

    // Generate multi-sheet Excel report
    const result = await this.advancedReportingEngine.generateMultiSheetExcel(tenantId, {
      title: title || 'Multi-Sheet Report',
      sheets,
      fileName: fileName || `multi_sheet_report_${Date.now()}.xlsx`
    });

    // Save report record
    const reportRecord = await Report.create({
      company: tenantId,
      name: title || 'Multi-Sheet Report',
      reportType: 'custom',
      configuration: {
        dataSources: sheets.map((sheet) => sheet.dataSource),
        filters: {},
        multiSheet: true,
        sheets: sheets.map((sheet) => ({
          name: sheet.name,
          dataSource: sheet.dataSource,
          columns: sheet.columns.map((col) => ({
            field: col.key,
            label: col.header,
            type: col.type || 'text'
          }))
        }))
      },
      exportSettings: {
        formats: [{ type: 'excel', enabled: true }],
        includeCharts: false
      },
      reportData: {
        summary: {
          totalSheets: sheets.length,
          generatedAt: new Date()
        },
        generatedAt: new Date()
      },
      createdBy: userId,
      status: 'active'
    });

    res.json({
      success: true,
      data: {
        reportId: reportRecord._id,
        fileName: result.fileName,
        filePath: result.filePath,
        size: result.size,
        sheets: result.sheets,
        downloadUrl: `/api/reports/download-advanced/${reportRecord._id}`,
        generatedAt: result.generatedAt
      }
    });
  });

  /**
   * Create advanced report template
   * POST /api/reports/advanced/templates
   */
  createAdvancedTemplate = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const templateConfig = req.body;

    const result = await this.advancedReportingEngine.createReportTemplate(tenantId, {
      ...templateConfig,
      createdBy: userId
    });

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Generate report from advanced template
   * POST /api/reports/advanced/templates/:templateId/generate
   */
  generateFromAdvancedTemplate = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { templateId } = req.params;
    const parameters = req.body;

    const result = await this.advancedReportingEngine.generateFromTemplate(
      tenantId,
      templateId,
      parameters
    );

    res.json({
      success: true,
      data: {
        ...result,
        downloadUrl: `/api/reports/download-file?path=${encodeURIComponent(result.filePath)}`
      }
    });
  });

  /**
   * Schedule advanced report
   * POST /api/reports/advanced/schedule
   */
  scheduleAdvancedReport = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const userId = req.user._id;
    const scheduleConfig = req.body;

    const result = await this.advancedReportingEngine.scheduleReport(tenantId, {
      ...scheduleConfig,
      createdBy: userId
    });

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Download advanced report file
   * GET /api/reports/download-advanced/:id
   */
  downloadAdvancedReport = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const report = await Report.findOne({
      _id: id,
      company: tenantId,
      isActive: true
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // For this demo, we'll look for the file in the temp directory
    const fileName = `${report.reportType}_${report._id}.xlsx`;
    const filePath = path.join(process.cwd(), 'temp', fileName);

    try {
      await fs.promises.access(filePath);

      // Update download count
      await report.updatePerformance('export');

      res.download(filePath, fileName);
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'Report file not found'
      });
    }
  });

  /**
   * Download file by path (for template-generated reports)
   * GET /api/reports/download-file
   */
  downloadFileByPath = asyncHandler(async (req, res) => {
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    try {
      await fs.promises.access(filePath);
      const fileName = path.basename(filePath);
      res.download(filePath, fileName);
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
  });

  /**
   * Get advanced report templates
   * GET /api/reports/advanced/templates
   */
  getAdvancedTemplates = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const {
      page = 1,
      limit = 20,
      category,
      search
    } = req.query;

    const query = {
      company: tenantId,
      isTemplate: true,
      isActive: true
    };

    if (category) query.templateCategory = category;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { templateTags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { 'performance.popularityScore': -1, createdAt: -1 },
      populate: [
        { path: 'createdBy', select: 'firstName lastName email' }
      ]
    };

    const templates = await Report.paginate(query, options);

    res.json({
      success: true,
      data: templates
    });
  });

  /**
   * Get advanced report statistics
   * GET /api/reports/advanced/stats
   */
  getAdvancedReportStats = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;

    const stats = await Report.aggregate([
      { $match: { company: tenantId, isActive: true } },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          totalViews: { $sum: '$performance.viewCount' },
          totalExports: { $sum: '$performance.exportCount' },
          activeScheduled: {
            $sum: {
              $cond: [
                { $and: ['$schedule.isScheduled', '$schedule.isActive'] },
                1,
                0
              ]
            }
          },
          templates: {
            $sum: { $cond: ['$isTemplate', 1, 0] }
          }
        }
      }
    ]);

    const reportsByType = await Report.aggregate([
      { $match: { company: tenantId, isActive: true } },
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 },
          avgViews: { $avg: '$performance.viewCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const popularReports = await Report.getPopularReports(tenantId, 5);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalReports: 0,
          totalViews: 0,
          totalExports: 0,
          activeScheduled: 0,
          templates: 0
        },
        reportsByType,
        popularReports
      }
    });
  });

  /**
   * Export data in various formats
   * POST /api/enterprise/reports/export
   */
  exportData = asyncHandler(async (req, res) => {
    const tenantId = req.tenant.id;
    const { format, dataType, parameters } = req.body;

    if (!format || !dataType) {
      return res.status(400).json({
        success: false,
        error: 'Format and data type are required'
      });
    }

    const result = await this.reportingEngine.generateExcelReport(
      tenantId,
      dataType,
      { ...parameters, format }
    );

    if (result.success) {
      res.download(result.filePath, result.fileName, (err) => {
        if (err) {
          console.error('Export download error:', err);
        }
        setTimeout(() => {
          if (fs.existsSync(result.filePath)) {
            fs.unlinkSync(result.filePath);
          }
        }, 5000);
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to export data'
      });
    }
  });
}

module.exports = new ReportingController();
