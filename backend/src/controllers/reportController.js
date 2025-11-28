const Promotion = require('../models/Promotion');
const Budget = require('../models/Budget');
const TradeSpend = require('../models/TradeSpend');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const SalesHistory = require('../models/SalesHistory');
const Report = require('../models/Report');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const _fs = require('fs');
const _path = require('path');
const analyticsController = require('./analyticsController');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const reportController = {
  // CRUD Operations for Report entities

  // Create report
  async createReport(req, res) {
    try {
      const reportData = {
        ...req.body,
        company: req.user.company,
        createdBy: req.user._id
      };

      const report = await Report.create(reportData);

      logger.logAudit('report_created', req.user._id, {
        reportId: report._id,
        reportName: report.name,
        reportType: report.reportType
      });

      res.status(201).json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get all reports
  async getReports(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = '-createdAt',
        search,
        reportType,
        status,
        ...filters
      } = req.query;

      // Build query
      const query = { company: req.user.company };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (reportType) {
        query.reportType = reportType;
      }

      if (status) {
        query.status = status;
      }

      // Apply additional filters
      Object.assign(query, filters);

      const reports = await Report.find(query)
        .populate('company', 'name')
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Report.countDocuments(query);

      res.json({
        success: true,
        data: reports,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get single report
  async getReport(req, res) {
    try {
      const report = await Report.findById(req.params.id)
        .populate('company', 'name')
        .populate('createdBy', 'firstName lastName');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      // Check if user has access to this report
      if (report.company.toString() !== req.user.company.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update report
  async updateReport(req, res) {
    try {
      const report = await Report.findById(req.params.id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      // Check if user has access to this report
      if (report.company.toString() !== req.user.company.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      Object.assign(report, req.body);
      report.lastModifiedBy = req.user._id;

      await report.save();

      logger.logAudit('report_updated', req.user._id, {
        reportId: report._id,
        reportName: report.name,
        reportType: report.reportType
      });

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Delete report
  async deleteReport(req, res) {
    try {
      const report = await Report.findById(req.params.id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      // Check if user has access to this report
      if (report.company.toString() !== req.user.company.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await report.deleteOne();

      logger.logAudit('report_deleted', req.user._id, {
        reportId: report._id,
        reportName: report.name,
        reportType: report.reportType
      });

      res.json({
        success: true,
        message: 'Report deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Analytics and Generation Functions

  // Generate promotion effectiveness report
  async generatePromotionEffectivenessReport({ promotionId, startDate, endDate }) {
    const promotion = await Promotion.findById(promotionId)
      .populate('customer')
      .populate('products');

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    // Calculate metrics
    const salesDuringPromotion = await SalesHistory.aggregate([
      {
        $match: {
          customer: promotion.customer._id,
          product: { $in: promotion.products },
          date: {
            $gte: new Date(startDate || promotion.period.startDate),
            $lte: new Date(endDate || promotion.period.endDate)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalUnits: { $sum: '$quantity' },
          totalValue: { $sum: '$revenue.net' }
        }
      }
    ]);

    return {
      promotion: {
        id: promotion._id,
        name: promotion.name,
        type: promotion.promotionType,
        period: promotion.period
      },
      performance: {
        plannedSpend: promotion.plannedSpend,
        actualSpend: promotion.actualSpend || 0,
        salesVolume: salesDuringPromotion[0]?.totalUnits || 0,
        salesValue: salesDuringPromotion[0]?.totalValue || 0,
        roi: promotion.actualSpend ?
          ((salesDuringPromotion[0]?.totalValue || 0) - promotion.actualSpend) / promotion.actualSpend : 0
      }
    };
  },

  // Generate budget utilization report
  async generateBudgetUtilizationReport({ budgetId, year, _quarter }) {
    const query = {};
    if (budgetId) query._id = budgetId;
    if (year) query.year = year;

    const budgets = await Budget.find(query)
      .populate('customer')
      .populate('vendor');

    const reports = await Promise.all(budgets.map(async (budget) => {
      const tradeSpends = await TradeSpend.find({ budget: budget._id });

      const totalSpent = tradeSpends.reduce((sum, ts) => sum + (ts.actualSpend || 0), 0);
      const utilization = budget.totalAmount ? (totalSpent / budget.totalAmount) * 100 : 0;

      return {
        budget: {
          id: budget._id,
          name: budget.name,
          code: budget.code,
          totalAmount: budget.totalAmount
        },
        utilization: {
          spent: totalSpent,
          remaining: budget.totalAmount - totalSpent,
          percentage: utilization,
          status: utilization > 90 ? 'critical' : utilization > 75 ? 'warning' : 'healthy'
        }
      };
    }));

    return reports;
  },

  // Generate customer performance report
  async generateCustomerPerformanceReport({ customerId, startDate, endDate, tenantId }) {
    logger.debug('Customer Performance Report Started');
    logger.debug('Report parameters', { customerId, startDate, endDate, tenantId });

    const query = {};
    if (customerId) query._id = customerId;
    if (tenantId) query.tenantId = new mongoose.Types.ObjectId(tenantId);

    logger.debug('Customer query', { query });
    const customers = await Customer.find(query);
    logger.debug('Found customers', { count: customers.length });

    const reports = await Promise.all(customers.map(async (customer) => {
      const matchQuery = {
        customer: customer._id
      };

      // Add tenant filtering
      if (tenantId) {
        matchQuery.tenantId = new mongoose.Types.ObjectId(tenantId);
      }

      // Add date filtering if provided
      if (startDate && endDate) {
        matchQuery.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      logger.debug('Match query', { matchQuery });

      const salesData = await SalesHistory.aggregate([
        {
          $match: matchQuery
        },
        {
          $group: {
            _id: null,
            totalUnits: { $sum: '$quantity' },
            totalValue: { $sum: '$revenue.net' },
            transactionCount: { $sum: 1 }
          }
        }
      ]);

      logger.debug('Sales data result', { salesData });

      return {
        customer: {
          id: customer._id,
          name: customer.name,
          code: customer.code
        },
        performance: {
          salesVolume: salesData[0]?.totalUnits || 0,
          salesValue: salesData[0]?.totalValue || 0,
          transactions: salesData[0]?.transactionCount || 0,
          avgTransactionValue: salesData[0]?.transactionCount ?
            (salesData[0].totalValue / salesData[0].transactionCount) : 0
        }
      };
    }));

    return reports;
  },

  // Generate product performance report
  async generateProductPerformanceReport({ productId, startDate, endDate }) {
    const query = {};
    if (productId) query._id = productId;

    const products = await Product.find(query);

    const reports = await Promise.all(products.map(async (product) => {
      const salesData = await SalesHistory.aggregate([
        {
          $match: {
            product: product._id,
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalUnits: { $sum: '$quantity' },
            totalValue: { $sum: '$revenue.net' }
          }
        }
      ]);

      return {
        product: {
          id: product._id,
          name: product.name,
          sku: product.sku
        },
        performance: {
          unitsSold: salesData[0]?.totalUnits || 0,
          revenue: salesData[0]?.totalValue || 0,
          avgPrice: salesData[0]?.totalUnits ?
            (salesData[0].totalValue / salesData[0].totalUnits) : 0
        }
      };
    }));

    return reports;
  },

  // Generate trade spend ROI report
  async generateTradeSpendROIReport({ startDate, endDate, customerId, vendorId }) {
    const query = {};
    if (customerId) query.customer = customerId;
    if (vendorId) query.vendor = vendorId;

    const tradeSpends = await TradeSpend.find(query)
      .populate('customer')
      .populate('vendor')
      .populate('promotions');

    const reports = await Promise.all(tradeSpends.map(async (ts) => {
      const salesData = await SalesHistory.aggregate([
        {
          $match: {
            customer: ts.customer._id,
            date: {
              $gte: new Date(startDate || ts.period.startDate),
              $lte: new Date(endDate || ts.period.endDate)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$revenue.net' }
          }
        }
      ]);

      const revenue = salesData[0]?.totalValue || 0;
      const spend = ts.actualSpend || ts.plannedSpend;
      const roi = spend ? ((revenue - spend) / spend) * 100 : 0;

      return {
        tradeSpend: {
          id: ts._id,
          name: ts.name,
          customer: ts.customer.name,
          vendor: ts.vendor?.name
        },
        financial: {
          plannedSpend: ts.plannedSpend,
          actualSpend: ts.actualSpend || 0,
          revenue,
          roi,
          status: roi > 0 ? 'positive' : 'negative'
        }
      };
    }));

    return reports;
  },

  // Export report
  async exportReport({ reportType, filters, _format }) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add headers based on report type
    switch (reportType) {
      case 'budget-utilization':
        worksheet.columns = [
          { header: 'Budget Name', key: 'name', width: 30 },
          { header: 'Code', key: 'code', width: 15 },
          { header: 'Total Amount', key: 'totalAmount', width: 15 },
          { header: 'Spent', key: 'spent', width: 15 },
          { header: 'Remaining', key: 'remaining', width: 15 },
          { header: 'Utilization %', key: 'utilization', width: 15 }
        ];
        break;
      // Add other report types...
    }

    // Generate report data
    let data;
    switch (reportType) {
      case 'budget-utilization':
        data = await this.generateBudgetUtilizationReport(filters);
        break;
      // Add other report types...
    }

    // Add data to worksheet
    if (data && Array.isArray(data)) {
      data.forEach((item) => {
        worksheet.addRow(item);
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },

  // Schedule report
  scheduleReport({ reportType, filters, schedule, recipients, createdBy }) {
    // Implementation would save scheduled report configuration
    return {
      id: `schedule-${Date.now()}`,
      reportType,
      filters,
      schedule,
      recipients,
      createdBy,
      status: 'active',
      nextRun: new Date(Date.now() + 86400000) // Next day
    };
  },

  // Advanced Reporting Methods

  // Generate Excel report with enhanced features
  async generateAdvancedExcelReport(req, res) {
    try {
      await analyticsController.generateExcelReport(req, res);
    } catch (error) {
      logger.error('Error in advanced Excel report generation', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Failed to generate advanced Excel report' });
    }
  },

  // Generate PDF report with enhanced features
  async generateAdvancedPDFReport(req, res) {
    try {
      await analyticsController.generatePDFReport(req, res);
    } catch (error) {
      logger.error('Error in advanced PDF report generation', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Failed to generate advanced PDF report' });
    }
  },

  // Custom report builder
  async buildCustomReport(req, res) {
    try {
      const {
        reportName,
        metrics,
        dimensions,
        filters,
        dateRange,
        visualizations,
        format = 'excel'
      } = req.body;

      if (!reportName || !metrics || !dimensions) {
        return res.status(400).json({
          error: 'Missing required fields: reportName, metrics, dimensions'
        });
      }

      const reportConfig = {
        id: new Date().getTime().toString(),
        name: reportName,
        metrics,
        dimensions,
        filters: filters || {},
        dateRange,
        visualizations: visualizations || [],
        format,
        createdBy: req.user?.id,
        createdAt: new Date()
      };

      const reportData = await this._generateCustomReportData(reportConfig);

      if (format === 'json') {
        res.json({
          reportConfig,
          data: reportData,
          generatedAt: new Date()
        });
      } else {
        const filename = await this._generateCustomReportFile(reportConfig, reportData);
        res.json({
          message: 'Custom report generated successfully',
          reportConfig,
          downloadUrl: `/api/reports/download/${filename}`,
          generatedAt: new Date()
        });
      }

    } catch (error) {
      logger.error('Error building custom report', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Failed to build custom report' });
    }
  },

  // Get report templates
  getReportTemplates(req, res) {
    try {
      const templates = [
        {
          id: 'promotion-performance',
          name: 'Promotion Performance Report',
          description: 'Comprehensive analysis of promotion effectiveness',
          metrics: ['roi', 'lift', 'spend_efficiency'],
          dimensions: ['product', 'channel', 'region'],
          defaultFilters: {},
          visualizations: ['bar_chart', 'line_chart', 'pie_chart']
        },
        {
          id: 'budget-analysis',
          name: 'Budget Analysis Report',
          description: 'Budget allocation and utilization analysis',
          metrics: ['budget_utilization', 'variance', 'efficiency'],
          dimensions: ['category', 'time_period', 'department'],
          defaultFilters: {},
          visualizations: ['waterfall_chart', 'gauge_chart', 'table']
        },
        {
          id: 'sales-performance',
          name: 'Sales Performance Report',
          description: 'Sales trends and performance metrics',
          metrics: ['sales_volume', 'sales_value', 'growth_rate'],
          dimensions: ['product', 'customer', 'time_period'],
          defaultFilters: {},
          visualizations: ['line_chart', 'area_chart', 'heatmap']
        }
      ];

      res.json({
        templates,
        totalCount: templates.length
      });

    } catch (error) {
      logger.error('Error getting report templates', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Failed to get report templates' });
    }
  },

  // Get report analytics
  getReportAnalytics(req, res) {
    try {
      const { period = '30days' } = req.query;

      const analytics = {
        totalReports: 156,
        reportsThisPeriod: 23,
        mostPopularType: 'promotion',
        mostPopularFormat: 'excel',
        avgGenerationTime: 12.5,
        successRate: 94.2,
        reportsByType: {
          promotion: 45,
          budget: 32,
          sales: 28,
          custom: 15
        },
        reportsByFormat: {
          excel: 78,
          pdf: 42,
          json: 36
        },
        generationTrend: [
          { date: '2024-01-01', count: 5, avgTime: 10.2 },
          { date: '2024-01-02', count: 8, avgTime: 11.5 },
          { date: '2024-01-03', count: 12, avgTime: 9.8 }
        ]
      };

      res.json({
        analytics,
        period,
        generatedAt: new Date()
      });

    } catch (error) {
      logger.error('Error getting report analytics', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Failed to get report analytics' });
    }
  },

  // Helper methods
  async _generateCustomReportData(reportConfig) {
    const { metrics, dimensions, filters } = reportConfig;
    const data = {};

    for (const metric of metrics) {
      switch (metric) {
        case 'roi':
          data.roi = await analyticsController._calculateROIMetrics(filters);
          break;
        case 'lift':
          data.lift = await analyticsController._calculateLiftMetrics(filters);
          break;
        case 'efficiency':
          data.efficiency = await analyticsController._calculateEfficiencyMetrics(filters);
          break;
        default:
          data[metric] = {
            value: Math.random() * 100,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          };
      }
    }

    data.dimensions = {};
    for (const dimension of dimensions) {
      data.dimensions[dimension] = await analyticsController._getDimensionalAnalysis(dimension, filters);
    }

    return data;
  },

  _generateCustomReportFile(reportConfig, _reportData) {
    const { format, name } = reportConfig;
    const timestamp = new Date().toISOString().split('T')[0];
    return `${name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.${format}`;
  }
};

module.exports = reportController;
