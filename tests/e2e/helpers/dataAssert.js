/**
 * Data Assertion Utilities for E2E Tests
 * Validates data accuracy between UI and API
 */

const { expect } = require('@playwright/test');
const { UiParser } = require('./uiParse');

class DataAssert {
  /**
   * Compare two numbers with tolerance
   */
  static numbersMatch(actual, expected, tolerance = 0.01) {
    const diff = Math.abs(actual - expected);
    return diff <= tolerance;
  }

  /**
   * Compare two percentages with tolerance
   */
  static percentsMatch(actual, expected, tolerance = 0.1) {
    return this.numbersMatch(actual, expected, tolerance);
  }

  /**
   * Compare two dates (day precision)
   */
  static datesMatch(actual, expected) {
    if (!actual || !expected) return actual === expected;
    
    const d1 = UiParser.normalizeDate(actual);
    const d2 = UiParser.normalizeDate(expected);
    
    return d1?.getTime() === d2?.getTime();
  }

  /**
   * Assert KPI value matches API value
   */
  static async expectKpiMatches(options) {
    const { locator, apiValue, tolerance = 0.01, label = 'KPI' } = options;
    
    const uiValue = await UiParser.parseKpiValue(locator);
    const matches = this.numbersMatch(uiValue, apiValue, tolerance);
    
    expect(matches, `${label}: UI value ${uiValue} should match API value ${apiValue} (tolerance: ${tolerance})`).toBeTruthy();
    
    return { uiValue, apiValue, matches };
  }

  /**
   * Assert table data matches API data
   */
  static async expectTableMatchesApi(options) {
    const {
      tableLocator,
      apiRows,
      keys,
      toleranceMap = {},
      orderBy = null,
      label = 'Table'
    } = options;
    
    const uiRows = await UiParser.parseTable(tableLocator);
    
    expect(uiRows.length, `${label}: Row count mismatch`).toBe(apiRows.length);
    
    const sortedUiRows = orderBy ? [...uiRows].sort((a, b) => a[orderBy] > b[orderBy] ? 1 : -1) : uiRows;
    const sortedApiRows = orderBy ? [...apiRows].sort((a, b) => a[orderBy] > b[orderBy] ? 1 : -1) : apiRows;
    
    const mismatches = [];
    
    for (let i = 0; i < sortedUiRows.length; i++) {
      const uiRow = sortedUiRows[i];
      const apiRow = sortedApiRows[i];
      
      for (const key of keys) {
        const uiValue = uiRow[key];
        const apiValue = apiRow[key];
        const tolerance = toleranceMap[key];
        
        let matches = false;
        
        if (tolerance !== undefined) {
          const uiNum = UiParser.parseCurrency(uiValue);
          const apiNum = typeof apiValue === 'number' ? apiValue : UiParser.parseCurrency(apiValue);
          matches = this.numbersMatch(uiNum, apiNum, tolerance);
        } else {
          matches = String(uiValue).trim() === String(apiValue).trim();
        }
        
        if (!matches) {
          mismatches.push({
            row: i,
            key,
            uiValue,
            apiValue,
            tolerance
          });
        }
      }
    }
    
    if (mismatches.length > 0) {
      console.error(`${label} mismatches:`, JSON.stringify(mismatches, null, 2));
    }
    
    expect(mismatches.length, `${label}: Found ${mismatches.length} mismatches`).toBe(0);
    
    return { uiRows: sortedUiRows, apiRows: sortedApiRows, mismatches };
  }

  /**
   * Assert list matches API data
   */
  static async expectListMatchesApi(options) {
    const { listLocator, apiItems, label = 'List' } = options;
    
    const uiItems = await UiParser.parseList(listLocator);
    
    expect(uiItems.length, `${label}: Item count mismatch`).toBe(apiItems.length);
    
    for (let i = 0; i < uiItems.length; i++) {
      expect(uiItems[i], `${label}: Item ${i} mismatch`).toBe(apiItems[i]);
    }
    
    return { uiItems, apiItems };
  }

  /**
   * Assert currency value matches with tolerance
   */
  static expectCurrencyMatches(uiValue, apiValue, tolerance = 0.01, label = 'Currency') {
    const uiNum = UiParser.parseCurrency(uiValue);
    const apiNum = typeof apiValue === 'number' ? apiValue : UiParser.parseCurrency(apiValue);
    
    const matches = this.numbersMatch(uiNum, apiNum, tolerance);
    
    expect(matches, `${label}: UI ${uiNum} should match API ${apiNum} (tolerance: ${tolerance})`).toBeTruthy();
    
    return { uiNum, apiNum, matches };
  }

  /**
   * Assert percentage value matches with tolerance
   */
  static expectPercentMatches(uiValue, apiValue, tolerance = 0.1, label = 'Percentage') {
    const uiNum = UiParser.parsePercent(uiValue);
    const apiNum = typeof apiValue === 'number' ? apiValue : UiParser.parsePercent(apiValue);
    
    const matches = this.percentsMatch(uiNum, apiNum, tolerance);
    
    expect(matches, `${label}: UI ${uiNum}% should match API ${apiNum}% (tolerance: ${tolerance}%)`).toBeTruthy();
    
    return { uiNum, apiNum, matches };
  }

  /**
   * Assert date matches
   */
  static expectDateMatches(uiValue, apiValue, label = 'Date') {
    const uiDate = UiParser.parseDate(uiValue);
    const apiDate = UiParser.parseDate(apiValue);
    
    const matches = this.datesMatch(uiDate, apiDate);
    
    expect(matches, `${label}: UI ${uiDate} should match API ${apiDate}`).toBeTruthy();
    
    return { uiDate, apiDate, matches };
  }

  /**
   * Assert aggregation matches (sum, avg, etc.)
   */
  static expectAggregationMatches(options) {
    const { uiValue, apiValues, aggregation = 'sum', tolerance = 0.01, label = 'Aggregation' } = options;
    
    let expectedValue;
    
    switch (aggregation) {
      case 'sum':
        expectedValue = apiValues.reduce((sum, val) => sum + val, 0);
        break;
      case 'avg':
        expectedValue = apiValues.reduce((sum, val) => sum + val, 0) / apiValues.length;
        break;
      case 'min':
        expectedValue = Math.min(...apiValues);
        break;
      case 'max':
        expectedValue = Math.max(...apiValues);
        break;
      case 'count':
        expectedValue = apiValues.length;
        break;
      default:
        throw new Error(`Unknown aggregation: ${aggregation}`);
    }
    
    const uiNum = typeof uiValue === 'number' ? uiValue : UiParser.parseCurrency(uiValue);
    const matches = this.numbersMatch(uiNum, expectedValue, tolerance);
    
    expect(matches, `${label}: UI ${uiNum} should match ${aggregation}(${apiValues.length} values) = ${expectedValue} (tolerance: ${tolerance})`).toBeTruthy();
    
    return { uiValue: uiNum, expectedValue, matches };
  }
}

module.exports = { DataAssert };
