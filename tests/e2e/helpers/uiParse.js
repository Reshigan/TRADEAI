/**
 * UI Parsing Utilities for E2E Tests
 * Extracts and normalizes data from UI elements
 */

class UiParser {
  /**
   * Parse currency string to number
   * Handles: R 1,234.56, $1,234.56, 1234.56, etc.
   */
  static parseCurrency(str) {
    if (!str) return 0;
    
    const cleaned = String(str)
      .replace(/[R$€£¥,\s]/g, '') // Remove currency symbols, commas, spaces
      .replace(/[()]/g, '-')       // Convert (123) to -123
      .trim();
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Parse percentage string to number
   * Handles: 12.34%, 12.34, etc.
   */
  static parsePercent(str) {
    if (!str) return 0;
    
    const cleaned = String(str)
      .replace(/%/g, '')
      .trim();
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Parse date string to Date object
   * Normalizes to UTC
   */
  static parseDate(str) {
    if (!str) return null;
    
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Parse table to array of objects
   * @param {Locator} tableLocator - Playwright locator for table
   * @returns {Promise<Array<Object>>} Array of row objects
   */
  static async parseTable(tableLocator) {
    const rows = [];
    
    const headerCells = await tableLocator.locator('thead th, thead td').allTextContents();
    const headers = headerCells.map(h => h.trim());
    
    if (headers.length === 0) {
      return rows;
    }
    
    const dataRows = await tableLocator.locator('tbody tr');
    const rowCount = await dataRows.count();
    
    for (let i = 0; i < rowCount; i++) {
      const row = {};
      const cells = await dataRows.nth(i).locator('td').allTextContents();
      
      headers.forEach((header, idx) => {
        if (idx < cells.length) {
          row[header] = cells[idx].trim();
        }
      });
      
      rows.push(row);
    }
    
    return rows;
  }

  /**
   * Parse KPI card value
   * @param {Locator} cardLocator - Playwright locator for KPI card
   * @returns {Promise<Object>} { label, value, change }
   */
  static async parseKpiCard(cardLocator) {
    const label = await cardLocator.locator('[class*="label"], [class*="title"], h6, h5').first().textContent().catch(() => '');
    const value = await cardLocator.locator('[class*="value"], [class*="amount"], h3, h4').first().textContent().catch(() => '');
    const change = await cardLocator.locator('[class*="change"], [class*="trend"]').first().textContent().catch(() => '');
    
    return {
      label: label.trim(),
      value: value.trim(),
      change: change.trim()
    };
  }

  /**
   * Extract numeric value from KPI card
   */
  static async parseKpiValue(cardLocator) {
    const kpi = await this.parseKpiCard(cardLocator);
    return this.parseCurrency(kpi.value);
  }

  /**
   * Parse list items to array
   */
  static async parseList(listLocator) {
    const items = await listLocator.locator('li, [role="listitem"]').allTextContents();
    return items.map(item => item.trim());
  }

  /**
   * Round number to specified decimal places
   */
  static round(num, decimals = 2) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Normalize date to UTC midnight
   */
  static normalizeDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  /**
   * Parse filter values from UI
   */
  static async parseFilters(page) {
    const filters = {};
    
    const selects = await page.locator('select, [role="combobox"]').all();
    for (const select of selects) {
      const label = await select.getAttribute('aria-label') || await select.getAttribute('name') || '';
      const value = await select.inputValue().catch(() => '');
      if (label) {
        filters[label] = value;
      }
    }
    
    return filters;
  }
}

module.exports = { UiParser };
