const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Models
const TradeSpend = require('../models/TradeSpend');
const Promotion = require('../models/Promotion');
const SalesHistory = require('../models/SalesHistory');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Report = require('../models/Report');

/**
 * Advanced Reporting Engine
 * Handles Excel/PDF generation, custom report builder, and scheduled reports
 */
class AdvancedReportingEngine {
  constructor() {
    this.reportTemplates = new Map();
    this.scheduledReports = new Map();
    this.reportQueue = [];
    this.isProcessing = false;

    // Initialize default templates
    this.initializeDefaultTemplates();
  }

  /**
   * Generate Excel report
   */
  async generateExcelReport(tenantId, reportConfig, options = {}) {
    try {
      const {
        reportType,
        title,
        data,
        columns,
        charts = [],
        formatting = {},
        fileName
      } = reportConfig;

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'TradeAI Analytics';
      workbook.created = new Date();

      // Add main data sheet
      const worksheet = workbook.addWorksheet(title || 'Report');

      // Apply styling
      this.applyExcelStyling(worksheet, formatting);

      // Add header
      if (title) {
        worksheet.mergeCells(`A1:${this.getColumnLetter(columns.length)}1`);
        const titleCell = worksheet.getCell('A1');
        titleCell.value = title;
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };
      }

      // Add column headers
      const headerRow = worksheet.addRow(columns.map((col) => col.header));
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows
      data.forEach((row) => {
        const dataRow = columns.map((col) => {
          const value = this.getNestedValue(row, col.key);
          return this.formatCellValue(value, col.type);
        });
        worksheet.addRow(dataRow);
      });

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        column.width = Math.max(column.width || 10, 15);
      });

      // Add charts if specified
      if (charts.length > 0) {
        await this.addExcelCharts(workbook, charts, data);
      }

      // Add summary sheet if needed
      if (options.includeSummary) {
        await this.addSummarySheet(workbook, data, reportType);
      }

      // Generate file
      const filePath = path.join(process.cwd(), 'temp', fileName || `report_${Date.now()}.xlsx`);
      await workbook.xlsx.writeFile(filePath);

      return {
        success: true,
        filePath,
        fileName: path.basename(filePath),
        size: (await fs.stat(filePath)).size,
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('Excel report generation error:', error);
      throw error;
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDFReport(tenantId, reportConfig, options = {}) {
    try {
      const {
        reportType,
        title,
        data,
        sections = [],
        charts = [],
        formatting = {},
        fileName
      } = reportConfig;

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: title || 'TradeAI Report',
          Author: 'TradeAI Analytics',
          Subject: `${reportType} Report`,
          CreationDate: new Date()
        }
      });

      const filePath = path.join(process.cwd(), 'temp', fileName || `report_${Date.now()}.pdf`);
      doc.pipe(require('fs').createWriteStream(filePath));

      // Add header
      this.addPDFHeader(doc, title, tenantId);

      // Add executive summary
      if (options.includeExecutiveSummary) {
        this.addExecutiveSummary(doc, data, reportType);
      }

      // Add sections
      for (const section of sections) {
        await this.addPDFSection(doc, section, data);
      }

      // Add charts
      if (charts.length > 0) {
        await this.addPDFCharts(doc, charts, data);
      }

      // Add data tables
      this.addPDFDataTable(doc, data, reportConfig.columns || []);

      // Add footer
      this.addPDFFooter(doc);

      // Finalize PDF
      doc.end();

      // Wait for file to be written
      await new Promise((resolve) => {
        doc.on('end', resolve);
      });

      return {
        success: true,
        filePath,
        fileName: path.basename(filePath),
        size: (await fs.stat(filePath)).size,
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('PDF report generation error:', error);
      throw error;
    }
  }

  /**
   * Create custom report template
   */
  async createReportTemplate(tenantId, templateConfig) {
    try {
      const {
        name,
        description,
        reportType,
        dataSource,
        columns,
        filters,
        charts,
        formatting,
        schedule
      } = templateConfig;

      const template = {
        id: `template_${Date.now()}`,
        tenantId,
        name,
        description,
        reportType,
        dataSource,
        columns,
        filters,
        charts,
        formatting,
        schedule,
        createdAt: new Date(),
        isActive: true
      };

      // Save template to database
      const savedTemplate = await Report.create({
        tenantId,
        name,
        type: 'template',
        config: template,
        isActive: true
      });

      // Cache template
      this.reportTemplates.set(template.id, template);

      return {
        success: true,
        templateId: template.id,
        template: savedTemplate
      };

    } catch (error) {
      logger.error('Create report template error:', error);
      throw error;
    }
  }

  /**
   * Generate report from template
   */
  async generateFromTemplate(tenantId, templateId, parameters = {}) {
    try {
      // Get template
      let template = this.reportTemplates.get(templateId);
      if (!template) {
        const dbTemplate = await Report.findOne({
          tenantId,
          'config.id': templateId,
          type: 'template',
          isActive: true
        });
        if (!dbTemplate) {
          throw new Error('Template not found');
        }
        template = dbTemplate.config;
        this.reportTemplates.set(templateId, template);
      }

      // Apply parameters to template
      const reportConfig = this.applyParametersToTemplate(template, parameters);

      // Get data based on template configuration
      const data = await this.getReportData(tenantId, reportConfig);

      // Generate report based on requested format
      const format = parameters.format || 'excel';
      let result;

      if (format === 'pdf') {
        result = await this.generatePDFReport(tenantId, {
          ...reportConfig,
          data
        });
      } else {
        result = await this.generateExcelReport(tenantId, {
          ...reportConfig,
          data
        });
      }

      // Save report record
      await Report.create({
        tenantId,
        name: `${template.name} - ${new Date().toISOString().split('T')[0]}`,
        type: 'generated',
        templateId: template.id,
        filePath: result.filePath,
        fileName: result.fileName,
        format,
        parameters,
        generatedAt: new Date(),
        isActive: true
      });

      return result;

    } catch (error) {
      logger.error('Generate from template error:', error);
      throw error;
    }
  }

  /**
   * Schedule report generation
   */
  async scheduleReport(tenantId, scheduleConfig) {
    try {
      const {
        templateId,
        schedule, // cron expression
        recipients,
        parameters = {},
        isActive = true
      } = scheduleConfig;

      const scheduledReport = {
        id: `scheduled_${Date.now()}`,
        tenantId,
        templateId,
        schedule,
        recipients,
        parameters,
        isActive,
        createdAt: new Date(),
        lastRun: null,
        nextRun: this.calculateNextRun(schedule)
      };

      // Save to database
      await Report.create({
        tenantId,
        name: `Scheduled Report - ${templateId}`,
        type: 'scheduled',
        config: scheduledReport,
        isActive: true
      });

      // Add to scheduler
      this.scheduledReports.set(scheduledReport.id, scheduledReport);

      return {
        success: true,
        scheduledReportId: scheduledReport.id,
        nextRun: scheduledReport.nextRun
      };

    } catch (error) {
      logger.error('Schedule report error:', error);
      throw error;
    }
  }

  /**
   * Get report data based on configuration
   */
  async getReportData(tenantId, reportConfig) {
    try {
      const { dataSource, filters = {}, dateRange } = reportConfig;

      let data = [];

      switch (dataSource) {
        case 'trade_spend':
          data = await this.getTradeSpendData(tenantId, filters, dateRange);
          break;
        case 'promotions':
          data = await this.getPromotionData(tenantId, filters, dateRange);
          break;
        case 'sales_history':
          data = await this.getSalesHistoryData(tenantId, filters, dateRange);
          break;
        case 'customers':
          data = await this.getCustomerData(tenantId, filters);
          break;
        case 'products':
          data = await this.getProductData(tenantId, filters);
          break;
        case 'analytics':
          data = await this.getAnalyticsData(tenantId, filters, dateRange);
          break;
        default:
          throw new Error(`Unsupported data source: ${dataSource}`);
      }

      return data;

    } catch (error) {
      logger.error('Get report data error:', error);
      throw error;
    }
  }

  /**
   * Multi-sheet Excel report generation
   */
  async generateMultiSheetExcel(tenantId, reportConfig) {
    try {
      const { sheets, title, fileName } = reportConfig;

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'TradeAI Analytics';
      workbook.created = new Date();

      // Generate each sheet
      for (const sheetConfig of sheets) {
        const data = await this.getReportData(tenantId, sheetConfig);
        const worksheet = workbook.addWorksheet(sheetConfig.name);

        // Add sheet title
        if (sheetConfig.title) {
          worksheet.mergeCells(`A1:${this.getColumnLetter(sheetConfig.columns.length)}1`);
          const titleCell = worksheet.getCell('A1');
          titleCell.value = sheetConfig.title;
          titleCell.font = { size: 14, bold: true };
          titleCell.alignment = { horizontal: 'center' };
        }

        // Add headers
        const headerRow = worksheet.addRow(sheetConfig.columns.map((col) => col.header));
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        // Add data
        data.forEach((row) => {
          const dataRow = sheetConfig.columns.map((col) => {
            const value = this.getNestedValue(row, col.key);
            return this.formatCellValue(value, col.type);
          });
          worksheet.addRow(dataRow);
        });

        // Auto-fit columns
        worksheet.columns.forEach((column) => {
          column.width = Math.max(column.width || 10, 15);
        });
      }

      // Add summary sheet
      const summarySheet = workbook.addWorksheet('Summary');
      this.addSummaryToSheet(summarySheet, sheets);

      // Generate file
      const filePath = path.join(process.cwd(), 'temp', fileName || `multi_sheet_report_${Date.now()}.xlsx`);
      await workbook.xlsx.writeFile(filePath);

      return {
        success: true,
        filePath,
        fileName: path.basename(filePath),
        size: (await fs.stat(filePath)).size,
        sheets: sheets.length + 1, // +1 for summary
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('Multi-sheet Excel generation error:', error);
      throw error;
    }
  }

  // Helper methods for data retrieval

  getTradeSpendData(tenantId, filters, dateRange) {
    const query = { tenantId };

    if (dateRange) {
      query.createdAt = {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      };
    }

    return TradeSpend.find(query)
      .populate('promotionId', 'name type')
      .populate('customerId', 'name code')
      .populate('productId', 'name code')
      .lean();
  }

  getPromotionData(tenantId, filters, dateRange) {
    const query = { tenantId };

    if (dateRange) {
      query.$or = [
        { startDate: { $gte: new Date(dateRange.startDate), $lte: new Date(dateRange.endDate) } },
        { endDate: { $gte: new Date(dateRange.startDate), $lte: new Date(dateRange.endDate) } }
      ];
    }

    return Promotion.find(query)
      .populate('customers', 'name code')
      .populate('products', 'name code')
      .lean();
  }

  getSalesHistoryData(tenantId, filters, dateRange) {
    const query = { tenantId };

    if (dateRange) {
      query.date = {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      };
    }

    return SalesHistory.find(query)
      .populate('customerId', 'name code')
      .populate('productId', 'name code')
      .lean();
  }

  getCustomerData(tenantId, filters) {
    return Customer.find({ tenantId, isActive: true })
      .lean();
  }

  getProductData(tenantId, _filters) {
    return Product.find({ tenantId, isActive: true })
      .lean();
  }

  getAnalyticsData(tenantId, _filters, _dateRange) {
    // This would integrate with the advanced analytics engine
    // For now, return aggregated data
    const pipeline = [
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
      {
        $group: {
          _id: '$customerId',
          totalRevenue: { $sum: '$revenue' },
          totalVolume: { $sum: '$volume' },
          transactionCount: { $sum: 1 }
        }
      }
    ];

    return SalesHistory.aggregate(pipeline);
  }

  // Helper methods for formatting and styling

  applyExcelStyling(worksheet, formatting) {
    if (formatting.headerStyle) {
      // Apply header styling
    }
    if (formatting.dataStyle) {
      // Apply data styling
    }
  }

  getColumnLetter(columnNumber) {
    let letter = '';
    while (columnNumber > 0) {
      columnNumber--;
      letter = String.fromCharCode(65 + (columnNumber % 26)) + letter;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return letter;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  formatCellValue(value, type) {
    if (value === null || value === undefined) return '';

    switch (type) {
      case 'currency':
        return typeof value === 'number' ? value.toFixed(2) : value;
      case 'percentage':
        return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : value;
      case 'date':
        return value instanceof Date ? value.toISOString().split('T')[0] : value;
      default:
        return value;
    }
  }

  // PDF helper methods

  addPDFHeader(doc, title, _tenantId) {
    doc.fontSize(20).text(title || 'TradeAI Report', 50, 50);
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 80);
    doc.moveDown();
  }

  addExecutiveSummary(doc, data, reportType) {
    doc.fontSize(16).text('Executive Summary', 50, doc.y);
    doc.moveDown();

    // Add summary content based on report type
    const summary = this.generateExecutiveSummary(data, reportType);
    doc.fontSize(12).text(summary, 50, doc.y);
    doc.moveDown();
  }

  addPDFSection(doc, section, data) {
    doc.fontSize(14).text(section.title, 50, doc.y);
    doc.moveDown();

    if (section.content) {
      doc.fontSize(12).text(section.content, 50, doc.y);
      doc.moveDown();
    }
  }

  addPDFDataTable(doc, data, columns) {
    if (!data.length) return;

    doc.fontSize(14).text('Data Table', 50, doc.y);
    doc.moveDown();

    // Simple table implementation
    const tableTop = doc.y;
    const itemHeight = 20;

    // Headers
    columns.forEach((col, i) => {
      doc.fontSize(10).text(col.header, 50 + (i * 100), tableTop, { width: 90 });
    });

    // Data rows (limit to first 20 for PDF)
    data.slice(0, 20).forEach((row, rowIndex) => {
      const y = tableTop + ((rowIndex + 1) * itemHeight);
      columns.forEach((col, colIndex) => {
        const value = this.getNestedValue(row, col.key);
        doc.fontSize(9).text(
          this.formatCellValue(value, col.type).toString().substring(0, 15),
          50 + (colIndex * 100),
          y,
          { width: 90 }
        );
      });
    });
  }

  addPDFFooter(doc) {
    doc.fontSize(10).text(
      'Generated by TradeAI Analytics Platform',
      50,
      doc.page.height - 50
    );
  }

  // Utility methods

  initializeDefaultTemplates() {
    // Initialize common report templates
    const defaultTemplates = [
      {
        id: 'trade_spend_summary',
        name: 'Trade Spend Summary',
        reportType: 'trade_spend',
        dataSource: 'trade_spend',
        columns: [
          { key: 'promotionId.name', header: 'Promotion', type: 'text' },
          { key: 'customerId.name', header: 'Customer', type: 'text' },
          { key: 'plannedAmount', header: 'Planned Amount', type: 'currency' },
          { key: 'actualAmount', header: 'Actual Amount', type: 'currency' },
          { key: 'status', header: 'Status', type: 'text' }
        ]
      },
      {
        id: 'promotion_performance',
        name: 'Promotion Performance',
        reportType: 'promotions',
        dataSource: 'promotions',
        columns: [
          { key: 'name', header: 'Promotion Name', type: 'text' },
          { key: 'type', header: 'Type', type: 'text' },
          { key: 'startDate', header: 'Start Date', type: 'date' },
          { key: 'endDate', header: 'End Date', type: 'date' },
          { key: 'status', header: 'Status', type: 'text' }
        ]
      }
    ];

    defaultTemplates.forEach((template) => {
      this.reportTemplates.set(template.id, template);
    });
  }

  applyParametersToTemplate(template, parameters) {
    // Apply dynamic parameters to template
    const config = { ...template };

    if (parameters.dateRange) {
      config.dateRange = parameters.dateRange;
    }

    if (parameters.filters) {
      config.filters = { ...config.filters, ...parameters.filters };
    }

    if (parameters.title) {
      config.title = parameters.title;
    }

    return config;
  }

  calculateNextRun(_cronExpression) {
    // Simple next run calculation - in production, use a proper cron library
    const now = new Date();
    return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next day for demo
  }

  generateExecutiveSummary(data, reportType) {
    switch (reportType) {
      case 'trade_spend':
        return `This report analyzes trade spend data across ${data.length} records. Key insights include budget utilization, promotion effectiveness, and spending patterns.`;
      case 'promotions':
        return `This report covers ${data.length} promotions, analyzing their performance, ROI, and impact on sales.`;
      default:
        return `This report provides comprehensive analysis of ${data.length} data points.`;
    }
  }

  addSummaryToSheet(worksheet, sheets) {
    worksheet.addRow(['Report Summary']);
    worksheet.addRow(['Generated:', new Date().toISOString()]);
    worksheet.addRow(['Total Sheets:', sheets.length]);
    worksheet.addRow([]);

    sheets.forEach((sheet, index) => {
      worksheet.addRow([`Sheet ${index + 1}:`, sheet.name]);
    });
  }

  addExcelCharts(workbook, charts, data) {
    // Chart implementation would go here
    // This is a placeholder for chart functionality
  }

  addPDFCharts(_doc, _charts, data) {
    // PDF chart implementation would go here
    // This is a placeholder for chart functionality
  }

  addSummarySheet(workbook, data, reportType) {
    const summarySheet = workbook.addWorksheet('Summary');

    summarySheet.addRow(['Report Summary']);
    summarySheet.addRow(['Report Type:', reportType]);
    summarySheet.addRow(['Generated:', new Date().toISOString()]);
    summarySheet.addRow(['Total Records:', data.length]);

    // Add type-specific summary
    if (reportType === 'trade_spend') {
      const totalPlanned = data.reduce((sum, item) => sum + (item.plannedAmount || 0), 0);
      const totalActual = data.reduce((sum, item) => sum + (item.actualAmount || 0), 0);

      summarySheet.addRow(['Total Planned Amount:', totalPlanned]);
      summarySheet.addRow(['Total Actual Amount:', totalActual]);
      summarySheet.addRow(['Variance:', totalActual - totalPlanned]);
    }
  }
}

module.exports = new AdvancedReportingEngine();
