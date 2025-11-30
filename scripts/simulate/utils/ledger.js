/**
 * Ledger - Single source of truth for simulation data
 * Tracks all entities created and expected calculations
 */

const fs = require('fs');
const path = require('path');

class Ledger {
  constructor(runId, companyType) {
    this.runId = runId;
    this.companyType = companyType;
    this.data = {
      runId,
      companyType,
      startTime: new Date().toISOString(),
      entities: {
        users: [],
        products: [],
        customers: [],
        budgets: [],
        promotions: [],
        claims: [],
        transactions: [],
        tradeSpends: [],
        tradingTerms: []
      },
      calculations: {
        budgetUtilization: {},
        promotionROI: {},
        claimTotals: {},
        forecastAccuracy: {}
      },
      kpis: {},
      errors: []
    };
  }

  addEntity(type, entity) {
    if (!this.data.entities[type]) {
      this.data.entities[type] = [];
    }
    this.data.entities[type].push(entity);
  }

  addCalculation(type, key, value) {
    if (!this.data.calculations[type]) {
      this.data.calculations[type] = {};
    }
    this.data.calculations[type][key] = value;
  }

  addKPI(name, value) {
    this.data.kpis[name] = value;
  }

  addError(error) {
    this.data.errors.push({
      timestamp: new Date().toISOString(),
      error: error.message || error,
      stack: error.stack
    });
  }

  getEntityCount(type) {
    return this.data.entities[type]?.length || 0;
  }

  getEntity(type, id) {
    return this.data.entities[type]?.find(e => e._id === id || e.id === id);
  }

  getAllEntities(type) {
    return this.data.entities[type] || [];
  }

  save(outputDir) {
    this.data.endTime = new Date().toISOString();
    const duration = new Date(this.data.endTime) - new Date(this.data.startTime);
    this.data.durationMs = duration;

    const dir = path.join(outputDir, this.runId, this.companyType);
    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, 'ledger.json');
    fs.writeFileSync(filePath, JSON.stringify(this.data, null, 2));

    return filePath;
  }

  static load(runId, companyType, outputDir) {
    const filePath = path.join(outputDir, runId, companyType, 'ledger.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const ledger = new Ledger(runId, companyType);
    ledger.data = data;
    return ledger;
  }
}

module.exports = Ledger;
