const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tradeai.gonxt.tech';
const TEST_USER = {
  email: 'admin@pomades.demo',
  password: 'Demo@123'
};

test('Debug Dashboard detailed', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
  await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check for AppBar (MegaMenu uses AppBar)
  const appBars = await page.locator('header[class*="MuiAppBar"]').count();
  console.log('🔍 AppBar count:', appBars);
  
  // Check for any element with data-testid
  const testIds = await page.locator('[data-testid]').count();
  console.log('🔍 Elements with data-testid:', testIds);
  
  // List all data-testid values
  const allTestIds = await page.locator('[data-testid]').evaluateAll(elements => 
    elements.map(el => el.getAttribute('data-testid'))
  );
  console.log('🔍 All data-testid values:', allTestIds);
  
  // Check if MegaMenu text exists
  const hasPlanText = await page.locator('text=Plan').count();
  const hasExecuteText = await page.locator('text=Execute').count();
  console.log('🔍 Has "Plan" text:', hasPlanText);
  console.log('🔍 Has "Execute" text:', hasExecuteText);
  
  // Check for navigation elements
  const navElements = await page.locator('nav, [role="navigation"]').count();
  console.log('🔍 Navigation elements:', navElements);
});
