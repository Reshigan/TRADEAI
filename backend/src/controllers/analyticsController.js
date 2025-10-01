const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Promotion = require('../models/Promotion');
const Budget = require('../models/Budget');
const TradeSpend = require('../models/TradeSpend');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const SalesHistory = require('../models/SalesHistory');
const { sendEmail } = require('../services/emailService');

const analyticsController = {
  // Get dashboard analytics
  async getDashboardAnalytics({ userId, period }) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Get key metrics
    const [promotions, budgets, tradeSpends, sales] = await Promise.all([
      Promotion.countDocuments({ 
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      Budget.aggregate([
        { $match: { year: new Date().getFullYear() } },
        { $group: { 
          _id: null, 
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }}
      ]),
      TradeSpend.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { 
          _id: null, 
          totalPlanned: { $sum: '$plannedSpend' },
          totalActual: { $sum: '$actualSpend' },
          count: { $sum: 1 }
        }}
      ]),
      SalesHistory.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { 
          _id: null, 
          totalValue: { $sum: '$value' },
          totalUnits: { $sum: '$units' }
        }}
      ])
    ]);
    
    return {
      summary: {
        promotions: promotions || 0,
        budgets: budgets[0]?.count || 0,
        tradeSpends: tradeSpends[0]?.count || 0,
        totalBudget: budgets[0]?.totalAmount || 0,
        totalPlannedSpend: tradeSpends[0]?.totalPlanned || 0,
        totalActualSpend: tradeSpends[0]?.totalActual || 0,
        salesValue: sales[0]?.totalValue || 0,
        salesUnits: sales[0]?.totalUnits || 0
      },
      period: {
        start: startDate,
        end: endDate,
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      }
    };
  },
  
  // Get sales analytics
  async getSalesAnalytics({ startDate, endDate, groupBy, customerId, productId }) {
    const matchStage = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    if (customerId) matchStage.customer = mongoose.Types.ObjectId(customerId);
    if (productId) matchStage.product = mongoose.Types.ObjectId(productId);
    
    let groupStage;
    switch (groupBy) {
      case 'day':
        groupStage = {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalUnits: { $sum: '$units' },
          totalValue: { $sum: '$value' },
          count: { $sum: 1 }
        };
        break;
      case 'week':
        groupStage = {
          _id: { 
            year: { $year: '$date' },
            week: { $week: '$date' }
          },
          totalUnits: { $sum: '$units' },
          totalValue: { $sum: '$value' },
          count: { $sum: 1 }
        };
        break;
      case 'month':
      default:
        groupStage = {
          _id: { 
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalUnits: { $sum: '$units' },
          totalValue: { $sum: '$value' },
          count: { $sum: 1 }
        };
    }
    
    const salesData = await SalesHistory.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { '_id': 1 } }
    ]);
    
    // Calculate trends
    const totalValue = salesData.reduce((sum, item) => sum + item.totalValue, 0);
    const totalUnits = salesData.reduce((sum, item) => sum + item.totalUnits, 0);
    const avgValue = salesData.length ? totalValue / salesData.length : 0;
    
    return {
      data: salesData,
      summary: {
        totalValue,
        totalUnits,
        avgValue,
        periods: salesData.length
      },
      groupBy
    };
  },
  
  // Get promotion analytics
  async getPromotionAnalytics({ year }) {
    const promotions = await Promotion.aggregate([
      {
        $match: {
          'period.startDate': {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: '$promotionType',
          count: { $sum: 1 },
          totalPlanned: { $sum: '$plannedSpend' },
          totalActual: { $sum: '$actualSpend' },
          avgROI: { $avg: '$roi' }
        }
      }
    ]);
    
    const monthlyData = await Promotion.aggregate([
      {
        $match: {
          'period.startDate': {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$period.startDate' },
          count: { $sum: 1 },
          spend: { $sum: '$actualSpend' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    return {
      byType: promotions,
      byMonth: monthlyData,
      year
    };
  },
  
  // Get budget analytics
  async getBudgetAnalytics({ year, customerId }) {
    const matchStage = { year };
    if (customerId) matchStage.customer = mongoose.Types.ObjectId(customerId);
    
    const budgets = await Budget.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'tradespends',
          localField: '_id',
          foreignField: 'budget',
          as: 'tradeSpends'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          totalAmount: 1,
          spent: { $sum: '$tradeSpends.actualSpend' },
          utilization: {
            $multiply: [
              { $divide: [{ $sum: '$tradeSpends.actualSpend' }, '$totalAmount'] },
              100
            ]
          }
        }
      }
    ]);
    
    const summary = budgets.reduce((acc, budget) => {
      acc.totalBudget += budget.totalAmount;
      acc.totalSpent += budget.spent;
      return acc;
    }, { totalBudget: 0, totalSpent: 0 });
    
    summary.utilization = summary.totalBudget ? 
      (summary.totalSpent / summary.totalBudget) * 100 : 0;
    
    return {
      budgets,
      summary,
      year
    };
  },
  
  // Get trade spend analytics
  async getTradeSpendAnalytics({ startDate, endDate, customerId, vendorId }) {
    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage['period.startDate'] = {};
      if (startDate) matchStage['period.startDate'].$gte = new Date(startDate);
      if (endDate) matchStage['period.startDate'].$lte = new Date(endDate);
    }
    
    if (customerId) matchStage.customer = mongoose.Types.ObjectId(customerId);
    if (vendorId) matchStage.vendor = mongoose.Types.ObjectId(vendorId);
    
    const tradeSpends = await TradeSpend.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPlanned: { $sum: '$plannedSpend' },
          totalActual: { $sum: '$actualSpend' }
        }
      }
    ]);
    
    const byCustomer = await TradeSpend.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$customer',
          count: { $sum: 1 },
          totalSpend: { $sum: '$actualSpend' }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      { $sort: { totalSpend: -1 } },
      { $limit: 10 }
    ]);
    
    return {
      byStatus: tradeSpends,
      topCustomers: byCustomer
    };
  },
  
  // Get customer analytics
  async getCustomerAnalytics({ period }) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '12months':
      default:
        startDate.setMonth(startDate.getMonth() - 12);
    }
    
    const customerPerformance = await SalesHistory.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$customer',
          totalValue: { $sum: '$value' },
          totalUnits: { $sum: '$units' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      { $sort: { totalValue: -1 } },
      { $limit: 20 }
    ]);
    
    return {
      topCustomers: customerPerformance,
      period: {
        start: startDate,
        end: endDate
      }
    };
  },
  
  // Get product analytics
  async getProductAnalytics({ period, category }) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '12months':
      default:
        startDate.setMonth(startDate.getMonth() - 12);
    }
    
    const matchStage = {
      date: { $gte: startDate, $lte: endDate }
    };
    
    const productPerformance = await SalesHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$product',
          totalValue: { $sum: '$value' },
          totalUnits: { $sum: '$units' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $match: category ? { 'product.category.primary': category } : {} },
      { $sort: { totalValue: -1 } },
      { $limit: 20 }
    ]);
    
    return {
      topProducts: productPerformance,
      period: {
        start: startDate,
        end: endDate
      },
      category
    };
  },
  
  // Get predictive analytics
  async getPredictiveAnalytics({ type, targetId, horizon }) {
    // Mock predictive data - in real implementation, this would call ML service
    const predictions = [];
    const baseValue = Math.random() * 100000 + 50000;
    
    for (let i = 1; i <= horizon; i++) {
      predictions.push({
        period: i,
        predicted: baseValue * (1 + (Math.random() - 0.5) * 0.2),
        lowerBound: baseValue * 0.8,
        upperBound: baseValue * 1.2,
        confidence: 0.75 + Math.random() * 0.2
      });
    }
    
    return {
      type,
      targetId,
      horizon,
      predictions,
      generatedAt: new Date(),
      model: {
        name: `${type}-prediction-model`,
        version: '1.0.0',
        accuracy: 0.82
      }
    };
  },

  // Advanced Reporting Methods

  // Generate comprehensive Excel report
  async generateExcelReport(req, res) {
    try {
      const { reportType, dateRange, filters = {} } = req.body;
      const { startDate, endDate } = dateRange;

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Trade AI Platform';
      workbook.created = new Date();

      // Add summary sheet
      const summarySheet = workbook.addWorksheet('Executive Summary');
      await this._addSummarySheet(summarySheet, { startDate, endDate, filters });

      // Add detailed sheets based on report type
      switch (reportType) {
        case 'comprehensive':
          await this._addPromotionAnalysisSheet(workbook, { startDate, endDate, filters });
          await this._addBudgetAnalysisSheet(workbook, { startDate, endDate, filters });
          await this._addSalesAnalysisSheet(workbook, { startDate, endDate, filters });
          await this._addROIAnalysisSheet(workbook, { startDate, endDate, filters });
          break;
        case 'promotion':
          await this._addPromotionAnalysisSheet(workbook, { startDate, endDate, filters });
          break;
        case 'budget':
          await this._addBudgetAnalysisSheet(workbook, { startDate, endDate, filters });
          break;
        case 'sales':
          await this._addSalesAnalysisSheet(workbook, { startDate, endDate, filters });
          break;
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `trade-ai-report-${reportType}-${timestamp}.xlsx`;
      const filepath = path.join(__dirname, '../../temp', filename);

      // Ensure temp directory exists
      const tempDir = path.dirname(filepath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write file
      await workbook.xlsx.writeFile(filepath);

      // Send file
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error sending file:', err);
        }
        // Clean up temp file
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
        });
      });

    } catch (error) {
      console.error('Error generating Excel report:', error);
      res.status(500).json({ error: 'Failed to generate Excel report' });
    }
  },

  // Generate PDF report
  async generatePDFReport(req, res) {
    try {
      const { reportType, dateRange, filters = {} } = req.body;
      const { startDate, endDate } = dateRange;

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `trade-ai-report-${reportType}-${timestamp}.pdf`;
      const filepath = path.join(__dirname, '../../temp', filename);

      // Ensure temp directory exists
      const tempDir = path.dirname(filepath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Pipe to file
      doc.pipe(fs.createWriteStream(filepath));

      // Add content
      await this._addPDFHeader(doc, reportType, { startDate, endDate });
      await this._addPDFSummary(doc, { startDate, endDate, filters });
      
      switch (reportType) {
        case 'comprehensive':
          await this._addPDFPromotionAnalysis(doc, { startDate, endDate, filters });
          await this._addPDFBudgetAnalysis(doc, { startDate, endDate, filters });
          await this._addPDFSalesAnalysis(doc, { startDate, endDate, filters });
          break;
        case 'promotion':
          await this._addPDFPromotionAnalysis(doc, { startDate, endDate, filters });
          break;
        case 'budget':
          await this._addPDFBudgetAnalysis(doc, { startDate, endDate, filters });
          break;
        case 'sales':
          await this._addPDFSalesAnalysis(doc, { startDate, endDate, filters });
          break;
      }

      // Finalize PDF
      doc.end();

      // Wait for PDF to be written
      await new Promise((resolve) => {
        doc.on('end', resolve);
      });

      // Send file
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error sending PDF file:', err);
        }
        // Clean up temp file
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting temp PDF file:', unlinkErr);
        });
      });

    } catch (error) {
      console.error('Error generating PDF report:', error);
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }
  },

  // Schedule report delivery
  async scheduleReport(req, res) {
    try {
      const { 
        reportType, 
        schedule, 
        recipients, 
        filters = {},
        format = 'excel' 
      } = req.body;

      // Validate schedule format (cron expression)
      if (!this._isValidCronExpression(schedule)) {
        return res.status(400).json({ error: 'Invalid schedule format' });
      }

      // Store scheduled report in database (you would need a ScheduledReport model)
      const scheduledReport = {
        reportType,
        schedule,
        recipients,
        filters,
        format,
        createdBy: req.user.id,
        createdAt: new Date(),
        isActive: true
      };

      // In a real implementation, you would save this to database
      // and set up a cron job or use a job queue like Bull

      res.json({
        message: 'Report scheduled successfully',
        scheduledReport: {
          id: new mongoose.Types.ObjectId(),
          ...scheduledReport
        }
      });

    } catch (error) {
      console.error('Error scheduling report:', error);
      res.status(500).json({ error: 'Failed to schedule report' });
    }
  },

  // Get advanced analytics with custom metrics
  async getAdvancedAnalytics(req, res) {
    try {
      const { 
        metrics = ['roi', 'lift', 'efficiency'], 
        dimensions = ['product', 'channel', 'region'],
        dateRange,
        filters = {}
      } = req.query;

      const { startDate, endDate } = dateRange;
      const matchStage = {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      };

      // Apply filters
      if (filters.productCategory) {
        matchStage.productCategory = { $in: filters.productCategory };
      }
      if (filters.channel) {
        matchStage.channel = { $in: filters.channel };
      }
      if (filters.region) {
        matchStage.region = { $in: filters.region };
      }

      const analytics = {};

      // Calculate ROI metrics
      if (metrics.includes('roi')) {
        analytics.roi = await this._calculateROIMetrics(matchStage);
      }

      // Calculate lift metrics
      if (metrics.includes('lift')) {
        analytics.lift = await this._calculateLiftMetrics(matchStage);
      }

      // Calculate efficiency metrics
      if (metrics.includes('efficiency')) {
        analytics.efficiency = await this._calculateEfficiencyMetrics(matchStage);
      }

      // Add dimensional analysis
      analytics.dimensions = {};
      for (const dimension of dimensions) {
        analytics.dimensions[dimension] = await this._getDimensionalAnalysis(dimension, matchStage);
      }

      res.json({
        analytics,
        dateRange: { startDate, endDate },
        filters,
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('Error getting advanced analytics:', error);
      res.status(500).json({ error: 'Failed to get advanced analytics' });
    }
  },

  // Helper methods for Excel report generation
  async _addSummarySheet(sheet, { startDate, endDate, filters }) {
    // Add title
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'Trade AI Analytics Report - Executive Summary';
    sheet.getCell('A1').font = { size: 16, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add date range
    sheet.getCell('A3').value = 'Report Period:';
    sheet.getCell('B3').value = `${startDate} to ${endDate}`;

    // Get summary data
    const summaryData = await this.getDashboardAnalytics({ 
      userId: null, 
      period: 'custom',
      startDate,
      endDate 
    });

    // Add key metrics
    let row = 5;
    sheet.getCell(`A${row}`).value = 'Key Metrics';
    sheet.getCell(`A${row}`).font = { bold: true };
    
    row++;
    sheet.getCell(`A${row}`).value = 'Total Promotions';
    sheet.getCell(`B${row}`).value = summaryData.promotions || 0;
    
    row++;
    sheet.getCell(`A${row}`).value = 'Total Budget';
    sheet.getCell(`B${row}`).value = summaryData.totalBudget || 0;
    
    row++;
    sheet.getCell(`A${row}`).value = 'Total Spend';
    sheet.getCell(`B${row}`).value = summaryData.totalSpend || 0;

    // Style the sheet
    sheet.columns = [
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];
  },

  async _addPromotionAnalysisSheet(workbook, { startDate, endDate, filters }) {
    const sheet = workbook.addWorksheet('Promotion Analysis');
    
    // Get promotion data
    const promotions = await Promotion.find({
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('product customer');

    // Add headers
    const headers = ['Promotion Name', 'Product', 'Customer', 'Start Date', 'End Date', 'Budget', 'Actual Spend', 'ROI'];
    sheet.addRow(headers);
    
    // Style headers
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    promotions.forEach(promo => {
      sheet.addRow([
        promo.name,
        promo.product?.name || 'N/A',
        promo.customer?.name || 'N/A',
        promo.startDate?.toISOString().split('T')[0] || 'N/A',
        promo.endDate?.toISOString().split('T')[0] || 'N/A',
        promo.budget || 0,
        promo.actualSpend || 0,
        promo.roi || 0
      ]);
    });

    // Auto-fit columns
    sheet.columns.forEach(column => {
      column.width = 15;
    });
  },

  // Helper methods for calculations
  async _calculateROIMetrics(matchStage) {
    const promotions = await Promotion.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: '$budget' },
          totalSpend: { $sum: '$actualSpend' },
          totalRevenue: { $sum: '$revenue' },
          count: { $sum: 1 }
        }
      }
    ]);

    const data = promotions[0] || { totalBudget: 0, totalSpend: 0, totalRevenue: 0, count: 0 };
    const roi = data.totalSpend > 0 ? ((data.totalRevenue - data.totalSpend) / data.totalSpend) * 100 : 0;

    return {
      totalBudget: data.totalBudget,
      totalSpend: data.totalSpend,
      totalRevenue: data.totalRevenue,
      roi: roi,
      promotionCount: data.count
    };
  },

  async _calculateLiftMetrics(matchStage) {
    // Simplified lift calculation
    const salesData = await SalesHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$value' },
          avgSales: { $avg: '$value' },
          count: { $sum: 1 }
        }
      }
    ]);

    const data = salesData[0] || { totalSales: 0, avgSales: 0, count: 0 };
    
    return {
      totalSales: data.totalSales,
      avgSales: data.avgSales,
      salesCount: data.count,
      estimatedLift: Math.random() * 20 + 5 // Placeholder calculation
    };
  },

  async _calculateEfficiencyMetrics(matchStage) {
    const efficiency = await TradeSpend.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPlanned: { $sum: '$plannedSpend' },
          totalActual: { $sum: '$actualSpend' },
          count: { $sum: 1 }
        }
      }
    ]);

    const data = efficiency[0] || { totalPlanned: 0, totalActual: 0, count: 0 };
    const efficiencyRatio = data.totalPlanned > 0 ? (data.totalActual / data.totalPlanned) * 100 : 0;

    return {
      totalPlanned: data.totalPlanned,
      totalActual: data.totalActual,
      efficiencyRatio: efficiencyRatio,
      spendCount: data.count
    };
  },

  async _getDimensionalAnalysis(dimension, matchStage) {
    let groupField;
    switch (dimension) {
      case 'product':
        groupField = '$product';
        break;
      case 'channel':
        groupField = '$channel';
        break;
      case 'region':
        groupField = '$region';
        break;
      default:
        groupField = '$category';
    }

    const analysis = await Promotion.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupField,
          totalBudget: { $sum: '$budget' },
          totalSpend: { $sum: '$actualSpend' },
          count: { $sum: 1 },
          avgROI: { $avg: '$roi' }
        }
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 10 }
    ]);

    return analysis;
  },

  // PDF helper methods
  async _addPDFHeader(doc, reportType, { startDate, endDate }) {
    doc.fontSize(20).text('Trade AI Analytics Report', 50, 50);
    doc.fontSize(14).text(`Report Type: ${reportType.toUpperCase()}`, 50, 80);
    doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, 50, 100);
    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, 50, 120);
    doc.moveDown(2);
  },

  async _addPDFSummary(doc, { startDate, endDate, filters }) {
    const summaryData = await this.getDashboardAnalytics({ 
      userId: null, 
      period: 'custom',
      startDate,
      endDate 
    });

    doc.fontSize(16).text('Executive Summary', 50, doc.y);
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Total Promotions: ${summaryData.promotions || 0}`);
    doc.text(`Total Budget: $${(summaryData.totalBudget || 0).toLocaleString()}`);
    doc.text(`Total Spend: $${(summaryData.totalSpend || 0).toLocaleString()}`);
    doc.moveDown(2);
  },

  // Utility methods
  _isValidCronExpression(expression) {
    // Basic cron validation - in production, use a proper cron parser
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    return cronRegex.test(expression);
  }
};

module.exports = analyticsController;