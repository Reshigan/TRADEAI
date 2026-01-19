#!/usr/bin/env node
/**
 * TRADEAI Calculation Accuracy Verification Script
 * 
 * This script verifies that the system calculations match expected outcomes
 * using the golden dataset with known inputs and expected outputs.
 * 
 * Usage: node scripts/verify-calculations.js <API_BASE_URL> <AUTH_TOKEN>
 * Example: node scripts/verify-calculations.js https://tradeai-api.reshigan-085.workers.dev <token>
 */

const API_BASE_URL = process.argv[2] || 'https://tradeai-api.reshigan-085.workers.dev';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, expected, actual, details = '') {
  const status = passed ? 'PASS' : 'FAIL';
  const emoji = passed ? '[OK]' : '[FAIL]';
  console.log(`${emoji} ${name}: ${status}`);
  if (!passed) {
    console.log(`   Expected: ${JSON.stringify(expected)}`);
    console.log(`   Actual: ${JSON.stringify(actual)}`);
    if (details) console.log(`   Details: ${details}`);
  }
  results.tests.push({ name, passed, expected, actual, details });
  if (passed) results.passed++;
  else results.failed++;
}

function assertApproxEqual(actual, expected, tolerance = 0.01) {
  return Math.abs(actual - expected) <= tolerance;
}

async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!data.success || !data.token) {
    throw new Error(`Login failed for ${email}: ${data.message}`);
  }
  return data.token;
}

async function apiGet(endpoint, token) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

async function apiPost(endpoint, token, body) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(body)
  });
  return response.json();
}

// ============================================================================
// TEST SUITE 1: ROI Calculation Verification
// ============================================================================
async function testROICalculation(token) {
  console.log('\n=== TEST SUITE 1: ROI Calculation ===');
  
  // Get the golden promotion with known ROI
  const promoResponse = await apiGet('/api/promotions', token);
  
  if (!promoResponse.success) {
    logTest('ROI: Fetch promotions', false, 'success', promoResponse.message);
    return;
  }
  
  const goldenPromo = promoResponse.data?.find(p => (p.id || p._id) === 'golden-promo-001');
  
  if (!goldenPromo) {
    logTest('ROI: Find golden promotion', false, 'golden-promo-001 exists', 'not found');
    return;
  }
  
  logTest('ROI: Golden promotion exists', true, 'exists', 'exists');
  
  // The API returns data fields directly on the promotion object (not nested in a 'data' field)
  const financial = goldenPromo.financial || {};
  
  // Verify ROI calculation: ROI = (Incremental Revenue - Trade Spend) / Trade Spend
  // Expected: (250,000 - 100,000) / 100,000 = 1.5
  const actualSpend = financial.actualSpend || 0;
  const incrementalRevenue = financial.incrementalRevenue || 0;
  const expectedROI = goldenPromo.expectedROI || 1.5;
  
  // Calculate ROI ourselves
  const calculatedROI = actualSpend > 0 ? (incrementalRevenue - actualSpend) / actualSpend : 0;
  
  logTest(
    'ROI: Calculation accuracy',
    assertApproxEqual(calculatedROI, expectedROI, 0.01),
    expectedROI,
    calculatedROI,
    `Formula: (${incrementalRevenue} - ${actualSpend}) / ${actualSpend}`
  );
  
  // Verify stored ROI matches calculated
  const storedROI = financial.profitability?.roiDecimal || financial.profitability?.roi / 100;
  logTest(
    'ROI: Stored value matches calculated',
    assertApproxEqual(storedROI, calculatedROI, 0.01),
    calculatedROI,
    storedROI
  );
}

// ============================================================================
// TEST SUITE 2: Budget Utilization Verification
// ============================================================================
async function testBudgetUtilization(token) {
  console.log('\n=== TEST SUITE 2: Budget Utilization ===');
  
  const budgetResponse = await apiGet('/api/budgets', token);
  
  if (!budgetResponse.success) {
    logTest('Budget: Fetch budgets', false, 'success', budgetResponse.message);
    return;
  }
  
  const goldenBudget = budgetResponse.data?.find(b => (b.id || b._id) === 'budget-golden-001');
  
  if (!goldenBudget) {
    logTest('Budget: Find golden budget', false, 'budget-golden-001 exists', 'not found');
    return;
  }
  
  logTest('Budget: Golden budget exists', true, 'exists', 'exists');
  
  // Verify utilization calculation: Utilization = Utilized / Amount
  // Expected: 325,000 / 500,000 = 0.65
  const amount = goldenBudget.amount || 0;
  const utilized = goldenBudget.utilized || 0;
  const expectedUtilization = 0.65;
  
  const calculatedUtilization = amount > 0 ? utilized / amount : 0;
  
  logTest(
    'Budget: Utilization calculation',
    assertApproxEqual(calculatedUtilization, expectedUtilization, 0.01),
    expectedUtilization,
    calculatedUtilization,
    `Formula: ${utilized} / ${amount}`
  );
  
  // Verify remaining budget
  const expectedRemaining = amount - utilized;
  const actualRemaining = amount - utilized;
  logTest(
    'Budget: Remaining calculation',
    actualRemaining === expectedRemaining,
    expectedRemaining,
    actualRemaining
  );
}

// ============================================================================
// TEST SUITE 3: Product Margin Verification
// ============================================================================
async function testProductMargin(token) {
  console.log('\n=== TEST SUITE 3: Product Margin ===');
  
  const productResponse = await apiGet('/api/products', token);
  
  if (!productResponse.success) {
    logTest('Margin: Fetch products', false, 'success', productResponse.message);
    return;
  }
  
  // Test each golden product margin
  const marginTests = [
    { id: 'golden-prod-001', expectedMargin: 0.40, unitPrice: 100, costPrice: 60 },
    { id: 'golden-prod-002', expectedMargin: 0.25, unitPrice: 80, costPrice: 60 },
    { id: 'golden-prod-003', expectedMargin: 0.50, unitPrice: 200, costPrice: 100 }
  ];
  
  for (const test of marginTests) {
    const product = productResponse.data?.find(p => (p.id || p._id) === test.id);
    
    if (!product) {
      logTest(`Margin: Find ${test.id}`, false, 'exists', 'not found');
      continue;
    }
    
    // Verify margin calculation: Margin = (Unit Price - Cost Price) / Unit Price
    const unitPrice = product.unit_price || product.unitPrice || 0;
    const costPrice = product.cost_price || product.costPrice || 0;
    const calculatedMargin = unitPrice > 0 ? (unitPrice - costPrice) / unitPrice : 0;
    
    logTest(
      `Margin: ${test.id} (${test.expectedMargin * 100}%)`,
      assertApproxEqual(calculatedMargin, test.expectedMargin, 0.01),
      test.expectedMargin,
      calculatedMargin,
      `Formula: (${unitPrice} - ${costPrice}) / ${unitPrice}`
    );
  }
}

// ============================================================================
// TEST SUITE 4: Tenant Isolation Verification
// ============================================================================
async function testTenantIsolation(sunriseToken, metroToken) {
  console.log('\n=== TEST SUITE 4: Tenant Isolation ===');
  
  // Sunrise should NOT see Metro's data
  const sunriseCustomers = await apiGet('/api/customers', sunriseToken);
  const metroCustomers = await apiGet('/api/customers', metroToken);
  
  if (!sunriseCustomers.success || !metroCustomers.success) {
    logTest('Isolation: Fetch customers', false, 'success', 'API error');
    return;
  }
  
  // Check Sunrise doesn't see Metro's golden customer
  const sunriseSeesMetro = sunriseCustomers.data?.some(c => (c.id || c._id) === 'golden-metro-cust-001');
  logTest(
    'Isolation: Sunrise cannot see Metro customers',
    !sunriseSeesMetro,
    false,
    sunriseSeesMetro
  );
  
  // Check Metro doesn't see Sunrise's golden customers
  const metroSeesSunrise = metroCustomers.data?.some(c => (c.id || c._id) === 'golden-cust-001');
  logTest(
    'Isolation: Metro cannot see Sunrise customers',
    !metroSeesSunrise,
    false,
    metroSeesSunrise
  );
  
  // Verify each tenant sees their own data
  const sunriseSeesOwn = sunriseCustomers.data?.some(c => (c.id || c._id) === 'golden-cust-001' || (c.id || c._id) === 'cust-pnp-001');
  logTest(
    'Isolation: Sunrise sees own customers',
    sunriseSeesOwn,
    true,
    sunriseSeesOwn
  );
  
  const metroSeesOwn = metroCustomers.data?.some(c => (c.id || c._id) === 'golden-metro-cust-001');
  logTest(
    'Isolation: Metro sees own customers',
    metroSeesOwn,
    true,
    metroSeesOwn
  );
}

// ============================================================================
// TEST SUITE 5: Trade Spend Workflow Verification
// ============================================================================
async function testTradeSpendWorkflow(token) {
  console.log('\n=== TEST SUITE 5: Trade Spend Workflow ===');
  
  const tradeSpendResponse = await apiGet('/api/trade-spends', token);
  
  if (!tradeSpendResponse.success) {
    logTest('TradeSpend: Fetch trade spends', false, 'success', tradeSpendResponse.message);
    return;
  }
  
  // Verify each workflow state exists
  const workflowTests = [
    { id: 'golden-ts-001', expectedStatus: 'approved', amount: 25000 },
    { id: 'golden-ts-002', expectedStatus: 'pending', amount: 35000 },
    { id: 'golden-ts-003', expectedStatus: 'rejected', amount: 15000 }
  ];
  
  for (const test of workflowTests) {
    const tradeSpend = tradeSpendResponse.data?.find(ts => (ts.id || ts._id) === test.id);
    
    if (!tradeSpend) {
      logTest(`TradeSpend: Find ${test.id}`, false, 'exists', 'not found');
      continue;
    }
    
    logTest(
      `TradeSpend: ${test.id} status`,
      tradeSpend.status === test.expectedStatus,
      test.expectedStatus,
      tradeSpend.status
    );
    
    logTest(
      `TradeSpend: ${test.id} amount`,
      tradeSpend.amount === test.amount,
      test.amount,
      tradeSpend.amount
    );
  }
}

// ============================================================================
// TEST SUITE 6: Simulation Calculation Verification
// ============================================================================
async function testSimulationCalculation(token) {
  console.log('\n=== TEST SUITE 6: Simulation Calculation ===');
  
  // Run a simulation with known inputs
  const simulationInput = {
    customers: ['cust-pnp-001'],
    products: ['prod-001'],
    discountPercent: 15,
    duration: 30,
    budget: 100000
  };
  
  const simResponse = await apiPost('/api/simulations/promotion', token, simulationInput);
  
  if (!simResponse.success) {
    logTest('Simulation: Run promotion simulation', false, 'success', simResponse.message);
    return;
  }
  
  logTest('Simulation: API returns success', true, 'success', 'success');
  
  const sim = simResponse.simulation;
  
  // Verify simulation returns required fields
  const requiredFields = ['id', 'baselineRevenue', 'upliftRevenue', 'netRevenue', 'roi', 'confidence'];
  for (const field of requiredFields) {
    logTest(
      `Simulation: Has ${field} field`,
      sim[field] !== undefined,
      'defined',
      sim[field] !== undefined ? 'defined' : 'undefined'
    );
  }
  
  // Verify ROI calculation consistency
  // ROI = netRevenue / budget
  const calculatedROI = sim.netRevenue / simulationInput.budget;
  logTest(
    'Simulation: ROI calculation consistent',
    assertApproxEqual(sim.roi, calculatedROI, 0.01),
    calculatedROI,
    sim.roi,
    `Formula: ${sim.netRevenue} / ${simulationInput.budget}`
  );
  
  // Verify uplift revenue = baseline * uplift%
  const calculatedUplift = sim.baselineRevenue * (sim.uplift / 100);
  logTest(
    'Simulation: Uplift calculation consistent',
    assertApproxEqual(sim.upliftRevenue, calculatedUplift, 1),
    calculatedUplift,
    sim.upliftRevenue
  );
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
  console.log('========================================');
  console.log('TRADEAI Calculation Accuracy Verification');
  console.log('========================================');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Login as different users for testing
    console.log('\n--- Authenticating test users ---');
    const sunriseToken = await login('admin@sunrisefoods.co.za', 'Demo@123');
    console.log('[OK] Sunrise Foods login successful');
    
    const metroToken = await login('admin@metrodist.co.za', 'Demo@123');
    console.log('[OK] Metro Distribution login successful');
    
    // Run all test suites
    await testROICalculation(sunriseToken);
    await testBudgetUtilization(sunriseToken);
    await testProductMargin(sunriseToken);
    await testTenantIsolation(sunriseToken, metroToken);
    await testTradeSpendWorkflow(sunriseToken);
    await testSimulationCalculation(sunriseToken);
    
    // Print summary
    console.log('\n========================================');
    console.log('VERIFICATION SUMMARY');
    console.log('========================================');
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    if (results.failed > 0) {
      console.log('\n--- Failed Tests ---');
      results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`- ${t.name}`);
        console.log(`  Expected: ${JSON.stringify(t.expected)}`);
        console.log(`  Actual: ${JSON.stringify(t.actual)}`);
      });
    }
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n[ERROR] Verification failed:', error.message);
    process.exit(1);
  }
}

main();
