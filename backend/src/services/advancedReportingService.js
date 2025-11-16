/**
 * Advanced Reporting Service
 * Phase 3 - Advanced Features
 *
 * Features:
 * - PDF report generation
 * - Excel export with formatting
 * - Scheduled reports
 * - Custom report templates
 * - Multi-format export (CSV, JSON, XML)
 * - Report history & versioning
 */

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');
const { safeNumber, formatCurrency } = require('../../utils/safeNumbers');

class AdvancedReportingService {

  constructor() {
    this.reportsDir = path.join(__dirname, '../../../reports');
    this.ensureReportsDirectory();
  }

  /**
   * Ensure reports directory exists
   */
  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate Excel report with advanced formatting
   */
  async generateExcelReport(reportData, options = {}) {
    const {
      filename = 'report.xlsx',
      sheetName = 'Report',
      title = 'TRADEAI Report',
      includeCharts = false
    } = options;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      // Set workbook properties
      workbook.creator = 'TRADEAI';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Title row
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = title;
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF0066CC' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
      worksheet.getRow(1).height = 30;

      // Metadata row
      worksheet.getCell('A2').value = 'Generated:';
      worksheet.getCell('B2').value = new Date();
      worksheet.getCell('B2').numFmt = 'yyyy-mm-dd hh:mm:ss';
      worksheet.getRow(2).height = 20;

      // Empty row
      worksheet.addRow([]);

      // Add data based on report type
      if (reportData.type === 'budget_variance') {
        this.addBudgetVarianceData(worksheet, reportData);
      } else if (reportData.type === 'customer_segmentation') {
        this.addCustomerSegmentationData(worksheet, reportData);
      } else if (reportData.type === 'promotion_roi') {
        this.addPromotionROIData(worksheet, reportData);
      } else if (reportData.type === 'accrual_variance') {
        this.addAccrualVarianceData(worksheet, reportData);
      } else {
        // Generic data table
        this.addGenericData(worksheet, reportData);
      }

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        let maxLength = 10;
        column.eachCell({ includeEmpty: false }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      // Save file
      const filepath = path.join(this.reportsDir, filename);
      await workbook.xlsx.writeFile(filepath);

      logger.info('Excel report generated', { filename, type: reportData.type });

      return {
        filename,
        filepath,
        size: fs.statSync(filepath).size,
        format: 'xlsx'
      };

    } catch (error) {
      logger.error('Error generating Excel report', { error: error.message });
      throw error;
    }
  }

  /**
   * Add budget variance data to worksheet
   */
  addBudgetVarianceData(worksheet, reportData) {
    const startRow = 4;

    // Headers
    const headerRow = worksheet.getRow(startRow);
    headerRow.values = ['Budget', 'Amount', 'Actual', 'Variance', 'Variance %', 'Status'];
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Data rows
    reportData.budgets.forEach((budget, index) => {
      const row = worksheet.getRow(startRow + 1 + index);
      row.values = [
        budget.budgetName,
        budget.amounts.budget,
        budget.amounts.actual,
        budget.amounts.variance,
        budget.percentages.variance,
        budget.status
      ];

      // Format currency columns
      row.getCell(2).numFmt = '_("ZAR"* #,##0.00_);_("ZAR"* (#,##0.00);_("ZAR"* "-"??_);_(@_)';
      row.getCell(3).numFmt = '_("ZAR"* #,##0.00_);_("ZAR"* (#,##0.00);_("ZAR"* "-"??_);_(@_)';
      row.getCell(4).numFmt = '_("ZAR"* #,##0.00_);_("ZAR"* (#,##0.00);_("ZAR"* "-"??_);_(@_)';
      row.getCell(5).numFmt = '0.00"%"';

      // Color code status
      const statusCell = row.getCell(6);
      if (budget.status === 'over_budget') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
        statusCell.font = { color: { argb: 'FFFFFFFF' } };
      } else if (budget.status === 'at_risk') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } };
      } else if (budget.status === 'healthy') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } };
      }
    });

    // Summary row
    const summaryRow = worksheet.getRow(startRow + 1 + reportData.budgets.length + 1);
    summaryRow.values = [
      'TOTAL',
      reportData.summary.totalBudget,
      reportData.summary.totalActual,
      reportData.summary.totalVariance,
      reportData.summary.variancePercent,
      ''
    ];
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    };
  }

  /**
   * Add customer segmentation data to worksheet
   */
  addCustomerSegmentationData(worksheet, reportData) {
    const startRow = 4;

    // Headers
    const headerRow = worksheet.getRow(startRow);
    headerRow.values = ['Customer', 'Segment', 'Revenue', 'Revenue %', 'Transactions', 'Avg Order Value'];
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Data rows
    reportData.customers.forEach((customer, index) => {
      const row = worksheet.getRow(startRow + 1 + index);
      row.values = [
        customer.customerName,
        customer.segment,
        customer.revenue,
        customer.revenuePercent,
        customer.transactionCount,
        customer.avgTransactionValue
      ];

      // Format
      row.getCell(3).numFmt = '_("ZAR"* #,##0.00_);_("ZAR"* (#,##0.00);_("ZAR"* "-"??_);_(@_)';
      row.getCell(4).numFmt = '0.00"%"';
      row.getCell(6).numFmt = '_("ZAR"* #,##0.00_);_("ZAR"* (#,##0.00);_("ZAR"* "-"??_);_(@_)';

      // Color code segments
      const segmentCell = row.getCell(2);
      if (customer.segment === 'A') {
        segmentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } };
      } else if (customer.segment === 'B') {
        segmentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      } else if (customer.segment === 'C') {
        segmentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } };
      }
    });
  }

  /**
   * Add promotion ROI data to worksheet
   */
  addPromotionROIData(worksheet, reportData) {
    const startRow = 4;

    // Headers
    const headerRow = worksheet.getRow(startRow);
    headerRow.values = ['Promotion', 'Type', 'Cost', 'Revenue', 'ROI %', 'Effectiveness', 'Grade'];
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Data rows
    reportData.promotions.forEach((promo, index) => {
      const row = worksheet.getRow(startRow + 1 + index);
      row.values = [
        promo.promotion.name,
        promo.promotion.type,
        promo.costs.totalBudget,
        promo.sales.promotion.revenue,
        promo.performance.roi,
        promo.performance.effectivenessScore,
        promo.rating.grade
      ];

      // Format
      row.getCell(3).numFmt = '_("ZAR"* #,##0.00_);_("ZAR"* (#,##0.00);_("ZAR"* "-"??_);_(@_)';
      row.getCell(4).numFmt = '_("ZAR"* #,##0.00_);_("ZAR"* (#,##0.00);_("ZAR"* "-"??_);_(@_)';
      row.getCell(5).numFmt = '0.00"%"';

      // Color code grade
      const gradeCell = row.getCell(7);
      if (promo.rating.grade === 'A') {
        gradeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } };
      } else if (promo.rating.grade === 'B') {
        gradeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
      } else if (promo.rating.grade === 'C') {
        gradeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      } else if (promo.rating.grade === 'D') {
        gradeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } };
      } else {
        gradeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
      }
    });
  }

  /**
   * Add accrual variance data to worksheet
   */
  addAccrualVarianceData(worksheet, reportData) {
    const startRow = 4;

    // Headers
    const headerRow = worksheet.getRow(startRow);
    headerRow.values = ['Accrual #', 'Type', 'Customer', 'Accrual', 'Actual', 'Variance', 'Variance %', 'Status'];
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Data rows
    reportData.allAccruals.forEach((accrual, index) => {
      const row = worksheet.getRow(startRow + 1 + index);
      row.values = [
        accrual.accrualNumber,
        accrual.accrualType,
        accrual.customer,
        accrual.accrualAmount,
        accrual.actualAmount,
        accrual.variance,
        accrual.variancePercent,
        accrual.status
      ];

      // Format
      row.getCell(4).numFmt = '_("ZAR"* #,##0.00_);_("ZAR"* (#,##0.00);_("ZAR"* "-"??_);_(@_)';
      row.getCell(5).numFmt = '_("ZAR"* #,##0.00_);_("ZAR"* (#,##0.00);_("ZAR"* "-"??_);_(@_)';
      row.getCell(6).numFmt = '_("ZAR"* #,##0.00_);_("ZAR"* (#,##0.00);_("ZAR"* "-"??_);_(@_)';
      row.getCell(7).numFmt = '0.00"%"';
    });
  }

  /**
   * Add generic data to worksheet
   */
  addGenericData(worksheet, reportData) {
    if (!reportData.data || reportData.data.length === 0) return;

    const startRow = 4;
    const firstItem = reportData.data[0];
    const columns = Object.keys(firstItem);

    // Headers
    const headerRow = worksheet.getRow(startRow);
    headerRow.values = columns;
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Data rows
    reportData.data.forEach((item, index) => {
      const row = worksheet.getRow(startRow + 1 + index);
      row.values = columns.map((col) => item[col]);
    });
  }

  /**
   * Generate CSV export
   */
  async generateCSVReport(reportData, options = {}) {
    const { filename = 'report.csv' } = options;

    try {
      if (!reportData.data || reportData.data.length === 0) {
        throw new Error('No data to export');
      }

      const firstItem = reportData.data[0];
      const columns = Object.keys(firstItem);

      // Create CSV content
      let csv = `${columns.join(',')}\n`;

      reportData.data.forEach((item) => {
        const row = columns.map((col) => {
          const value = item[col];
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csv += `${row.join(',')}\n`;
      });

      // Save file
      const filepath = path.join(this.reportsDir, filename);
      fs.writeFileSync(filepath, csv);

      logger.info('CSV report generated', { filename });

      return {
        filename,
        filepath,
        size: fs.statSync(filepath).size,
        format: 'csv'
      };

    } catch (error) {
      logger.error('Error generating CSV report', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDFReport(reportData, options = {}) {
    const { filename = 'report.pdf', title = 'TRADEAI Report' } = options;

    try {
      const doc = new PDFDocument({ margin: 50 });
      const filepath = path.join(this.reportsDir, filename);
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Title
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();

      // Metadata
      doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });
      doc.moveDown(2);

      // Content based on report type
      if (reportData.summary) {
        doc.fontSize(14).text('Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(10);

        Object.entries(reportData.summary).forEach(([key, value]) => {
          if (typeof value === 'number') {
            doc.text(`${key}: ${value.toLocaleString()}`);
          } else {
            doc.text(`${key}: ${value}`);
          }
        });

        doc.moveDown(2);
      }

      // Data table (simplified for PDF)
      if (reportData.data && reportData.data.length > 0) {
        doc.fontSize(14).text('Details', { underline: true });
        doc.moveDown();
        doc.fontSize(8);

        reportData.data.slice(0, 50).forEach((item, index) => {
          doc.text(`${index + 1}. ${JSON.stringify(item, null, 2)}`);
          doc.moveDown(0.5);

          // New page every 10 items
          if ((index + 1) % 10 === 0 && index < reportData.data.length - 1) {
            doc.addPage();
          }
        });
      }

      // Footer
      doc.fontSize(8).text('Generated by TRADEAI - Trade Spend Analytics Platform', {
        align: 'center'
      });

      doc.end();

      // Wait for file to be written
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      logger.info('PDF report generated', { filename });

      return {
        filename,
        filepath,
        size: fs.statSync(filepath).size,
        format: 'pdf'
      };

    } catch (error) {
      logger.error('Error generating PDF report', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete report file
   */
  deleteReport(filename) {
    try {
      const filepath = path.join(this.reportsDir, filename);

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        logger.info('Report deleted', { filename });
        return true;
      }

      return false;

    } catch (error) {
      logger.error('Error deleting report', { filename, error: error.message });
      throw error;
    }
  }

  /**
   * List available reports
   */
  listReports() {
    try {
      const files = fs.readdirSync(this.reportsDir);

      const reports = files.map((filename) => {
        const filepath = path.join(this.reportsDir, filename);
        const stats = fs.statSync(filepath);

        return {
          filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          format: path.extname(filename).substring(1)
        };
      });

      return reports;

    } catch (error) {
      logger.error('Error listing reports', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AdvancedReportingService();
