const ExcelJS = require('exceljs');
const logger = require('../utils/logger');

/**
 * Export Service
 * Handles data export to Excel format with professional formatting
 */
class ExportService {
  /**
   * Apply standard header styling
   */
  styleHeader(worksheet, headerRow) {
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E7D32' } // Green color
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;
    
    // Add borders
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }

  /**
   * Auto-fit column widths
   */
  autoFitColumns(worksheet) {
    worksheet.columns.forEach(column => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: false }, cell => {
        const length = cell.value ? cell.value.toString().length : 10;
        if (length > maxLength) maxLength = length;
      });
      column.width = Math.min(maxLength + 2, 50); // Max 50 chars wide
    });
  }

  /**
   * Add company header
   */
  addCompanyHeader(worksheet, companyName, title, range) {
    worksheet.mergeCells(range);
    const headerCell = worksheet.getCell(range.split(':')[0]);
    headerCell.value = `${companyName} - ${title}`;
    headerCell.font = { size: 16, bold: true, color: { argb: 'FF2E7D32' } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  /**
   * Add timestamp
   */
  addTimestamp(worksheet, range) {
    worksheet.mergeCells(range);
    const cell = worksheet.getCell(range.split(':')[0]);
    cell.value = `Generated: ${new Date().toLocaleString()}`;
    cell.font = { size: 10, italic: true };
    cell.alignment = { horizontal: 'center' };
  }

  /**
   * Export customers to Excel
   */
  async exportCustomers(customers, companyName = 'TradeAI') {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Customers');

      // Add company header
      this.addCompanyHeader(worksheet, companyName, 'Customers Export', 'A1:J1');
      
      // Add timestamp
      this.addTimestamp(worksheet, 'A2:J2');

      // Add empty row
      worksheet.addRow([]);

      // Headers
      const headerRow = worksheet.addRow([
        'Customer Code',
        'Customer Name',
        'Type',
        'Region',
        'Contact Name',
        'Contact Email',
        'Contact Phone',
        'Status',
        'Created Date',
        'Budget (R)'
      ]);
      
      this.styleHeader(worksheet, headerRow);

      // Data rows
      customers.forEach(customer => {
        const row = worksheet.addRow([
          customer.code || '',
          customer.name || '',
          customer.type || '',
          customer.region || '',
          customer.contactName || '',
          customer.contactEmail || '',
          customer.contactPhone || '',
          customer.status || 'active',
          customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '',
          customer.totalBudget || 0
        ]);

        // Format currency column
        row.getCell(10).numFmt = 'R #,##0.00';
      });

      // Auto-fit columns
      this.autoFitColumns(worksheet);

      // Add summary footer
      const summaryRow = worksheet.addRow([]);
      summaryRow.getCell(1).value = 'Total Customers:';
      summaryRow.getCell(1).font = { bold: true };
      summaryRow.getCell(2).value = customers.length;
      summaryRow.getCell(2).font = { bold: true };

      logger.info('Customers exported to Excel', { count: customers.length });
      return workbook;
    } catch (error) {
      logger.error('Error exporting customers:', error);
      throw error;
    }
  }

  /**
   * Export products to Excel
   */
  async exportProducts(products, companyName = 'TradeAI') {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products');

      // Add headers
      this.addCompanyHeader(worksheet, companyName, 'Products Export', 'A1:L1');
      this.addTimestamp(worksheet, 'A2:L2');
      worksheet.addRow([]);

      // Column headers
      const headerRow = worksheet.addRow([
        'SKU',
        'Product Name',
        'Brand',
        'Category',
        'Subcategory',
        'Pack Size',
        'Unit Price (R)',
        'Unit Cost (R)',
        'Margin %',
        'Stock Status',
        'Active',
        'Created Date'
      ]);
      
      this.styleHeader(worksheet, headerRow);

      // Data rows
      products.forEach(product => {
        const margin = product.unitPrice && product.unitCost 
          ? ((product.unitPrice - product.unitCost) / product.unitPrice * 100).toFixed(2)
          : 0;

        const row = worksheet.addRow([
          product.sku || '',
          product.name || '',
          product.brand || '',
          product.category || '',
          product.subcategory || '',
          product.packSize || '',
          product.unitPrice || 0,
          product.unitCost || 0,
          margin,
          product.stockStatus || 'In Stock',
          product.isActive ? 'Yes' : 'No',
          product.createdAt ? new Date(product.createdAt).toLocaleDateString() : ''
        ]);

        // Format currency columns
        row.getCell(7).numFmt = 'R #,##0.00';
        row.getCell(8).numFmt = 'R #,##0.00';
        row.getCell(9).numFmt = '0.00"%"';
      });

      this.autoFitColumns(worksheet);

      // Summary
      const summaryRow = worksheet.addRow([]);
      summaryRow.getCell(1).value = 'Total Products:';
      summaryRow.getCell(1).font = { bold: true };
      summaryRow.getCell(2).value = products.length;
      summaryRow.getCell(2).font = { bold: true };

      logger.info('Products exported to Excel', { count: products.length });
      return workbook;
    } catch (error) {
      logger.error('Error exporting products:', error);
      throw error;
    }
  }

  /**
   * Export promotions to Excel
   */
  async exportPromotions(promotions, companyName = 'TradeAI') {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Promotions');

      this.addCompanyHeader(worksheet, companyName, 'Promotions Export', 'A1:L1');
      this.addTimestamp(worksheet, 'A2:L2');
      worksheet.addRow([]);

      const headerRow = worksheet.addRow([
        'Promotion ID',
        'Name',
        'Type',
        'Status',
        'Customer',
        'Product',
        'Start Date',
        'End Date',
        'Discount %',
        'Budget (R)',
        'Spent (R)',
        'ROI %'
      ]);
      
      this.styleHeader(worksheet, headerRow);

      promotions.forEach(promo => {
        const row = worksheet.addRow([
          promo.promotionId || promo._id,
          promo.name || '',
          promo.type || '',
          promo.status || '',
          promo.customer?.name || promo.customerName || '',
          promo.product?.name || promo.productName || '',
          promo.startDate ? new Date(promo.startDate).toLocaleDateString() : '',
          promo.endDate ? new Date(promo.endDate).toLocaleDateString() : '',
          promo.discountPercentage || 0,
          promo.budget || 0,
          promo.spent || 0,
          promo.roi || 0
        ]);

        row.getCell(9).numFmt = '0.00"%"';
        row.getCell(10).numFmt = 'R #,##0.00';
        row.getCell(11).numFmt = 'R #,##0.00';
        row.getCell(12).numFmt = '0.00"%"';
      });

      this.autoFitColumns(worksheet);

      const summaryRow = worksheet.addRow([]);
      summaryRow.getCell(1).value = 'Total Promotions:';
      summaryRow.getCell(1).font = { bold: true };
      summaryRow.getCell(2).value = promotions.length;
      summaryRow.getCell(2).font = { bold: true };

      logger.info('Promotions exported to Excel', { count: promotions.length });
      return workbook;
    } catch (error) {
      logger.error('Error exporting promotions:', error);
      throw error;
    }
  }

  /**
   * Export budgets to Excel
   */
  async exportBudgets(budgets, companyName = 'TradeAI') {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Budgets');

      this.addCompanyHeader(worksheet, companyName, 'Budgets Export', 'A1:J1');
      this.addTimestamp(worksheet, 'A2:J2');
      worksheet.addRow([]);

      const headerRow = worksheet.addRow([
        'Budget ID',
        'Name',
        'Type',
        'Customer',
        'Total Budget (R)',
        'Allocated (R)',
        'Spent (R)',
        'Remaining (R)',
        'Utilization %',
        'Status'
      ]);
      
      this.styleHeader(worksheet, headerRow);

      budgets.forEach(budget => {
        const remaining = (budget.totalBudget || 0) - (budget.spent || 0);
        const utilization = budget.totalBudget ? ((budget.spent / budget.totalBudget) * 100).toFixed(2) : 0;

        const row = worksheet.addRow([
          budget.budgetId || budget._id,
          budget.name || '',
          budget.type || '',
          budget.customer?.name || budget.customerName || '',
          budget.totalBudget || 0,
          budget.allocated || 0,
          budget.spent || 0,
          remaining,
          utilization,
          budget.status || 'active'
        ]);

        row.getCell(5).numFmt = 'R #,##0.00';
        row.getCell(6).numFmt = 'R #,##0.00';
        row.getCell(7).numFmt = 'R #,##0.00';
        row.getCell(8).numFmt = 'R #,##0.00';
        row.getCell(9).numFmt = '0.00"%"';
      });

      this.autoFitColumns(worksheet);

      logger.info('Budgets exported to Excel', { count: budgets.length });
      return workbook;
    } catch (error) {
      logger.error('Error exporting budgets:', error);
      throw error;
    }
  }

  /**
   * Export transactions to Excel
   */
  async exportTransactions(transactions, companyName = 'TradeAI') {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Transactions');

      this.addCompanyHeader(worksheet, companyName, 'Transactions Export', 'A1:K1');
      this.addTimestamp(worksheet, 'A2:K2');
      worksheet.addRow([]);

      const headerRow = worksheet.addRow([
        'Transaction ID',
        'Type',
        'Date',
        'Customer',
        'Product',
        'Promotion',
        'Amount (R)',
        'Quantity',
        'Status',
        'Reference',
        'Created Date'
      ]);
      
      this.styleHeader(worksheet, headerRow);

      transactions.forEach(txn => {
        worksheet.addRow([
          txn.transactionId || txn._id,
          txn.type || '',
          txn.date ? new Date(txn.date).toLocaleDateString() : '',
          txn.customer?.name || txn.customerName || '',
          txn.product?.name || txn.productName || '',
          txn.promotion?.name || txn.promotionName || '',
          txn.amount || 0,
          txn.quantity || 0,
          txn.status || '',
          txn.reference || '',
          txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : ''
        ]);
      });

      // Format amount column
      worksheet.getColumn(7).numFmt = 'R #,##0.00';

      this.autoFitColumns(worksheet);

      logger.info('Transactions exported to Excel', { count: transactions.length });
      return workbook;
    } catch (error) {
      logger.error('Error exporting transactions:', error);
      throw error;
    }
  }

  /**
   * Export generic data to Excel
   */
  async exportGeneric(data, headers, sheetName, companyName = 'TradeAI') {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      const colCount = headers.length;
      const lastCol = String.fromCharCode(64 + colCount); // A=65, B=66, etc.

      this.addCompanyHeader(worksheet, companyName, `${sheetName} Export`, `A1:${lastCol}1`);
      this.addTimestamp(worksheet, `A2:${lastCol}2`);
      worksheet.addRow([]);

      const headerRow = worksheet.addRow(headers);
      this.styleHeader(worksheet, headerRow);

      data.forEach(row => {
        worksheet.addRow(row);
      });

      this.autoFitColumns(worksheet);

      logger.info(`${sheetName} exported to Excel`, { count: data.length });
      return workbook;
    } catch (error) {
      logger.error(`Error exporting ${sheetName}:`, error);
      throw error;
    }
  }
}

module.exports = new ExportService();
