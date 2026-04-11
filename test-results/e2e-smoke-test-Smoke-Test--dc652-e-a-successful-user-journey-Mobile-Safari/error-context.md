# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/smoke-test.spec.js >> Smoke Test - Critical Path >> should complete a successful user journey
- Location: tests/e2e/smoke-test.spec.js:28:3

# Error details

```
Error: page.goto: Could not connect to localhost: Connection refused
Call log:
  - navigating to "http://localhost:3001/", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * TRADEAI - Smoke Test Suite
  3  |  * Validates the critical path: Login -> Dashboard -> Budget -> Promotion -> AI Chatbot
  4  |  */
  5  | const { test, expect } = require('@playwright/test');
  6  | const path = require('path');
  7  | require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });
  8  | 
  9  | const CONFIG = {
  10 |   baseURL: process.env.BASE_URL || 'http://localhost:3000',
  11 |   users: {
  12 |     admin: {
  13 |       email: process.env.ADMIN_EMAIL || 'admin@test.com',
  14 |       password: process.env.ADMIN_PASSWORD || 'TestPassword123!',
  15 |     }
  16 |   }
  17 | };
  18 | 
  19 | async function login(page, user) {
> 20 |   await page.goto(CONFIG.baseURL);
     |              ^ Error: page.goto: Could not connect to localhost: Connection refused
  21 |   await page.locator('input[type="email"]').first().fill(user.email);
  22 |   await page.locator('input[type="password"]').first().fill(user.password);
  23 |   await page.locator('button[type="submit"]').first().click();
  24 |   await page.waitForURL('**/dashboard');
  25 | }
  26 | 
  27 | test.describe('Smoke Test - Critical Path', () => {
  28 |   test('should complete a successful user journey', async ({ page }) => {
  29 |     // 1. Authentication
  30 |     await login(page, CONFIG.users.admin);
  31 |     await expect(page).toHaveURL(/.*dashboard/);
  32 |     
  33 |     // 2. Verify Dashboard KPIs (Real logic now implemented)
  34 |     const kpiCard = page.locator('[data-testid="kpi-card"], .kpi-card').first();
  35 |     await expect(kpiCard).toBeVisible();
  36 |     
  37 |     // 3. Navigate to Budgets & Create
  38 |     await page.goto(`${CONFIG.baseURL}/budgets`);
  39 |     const createBtn = page.locator('button:has-text("Create"), button:has-text("Add")').first();
  40 |     if (await createBtn.isVisible()) {
  41 |       await createBtn.click();
  42 |       await page.locator('input[name="title"]').first().fill('Smoke Test Budget');
  43 |       await page.locator('input[name="amount"]').first().fill('100000');
  44 |       await page.locator('button[type="submit"]').first().click();
  45 |       await expect(page).toHaveURL(/.*budgets/);
  46 |     }
  47 | 
  48 |     // 4. Test the new AI Chatbot (Previously a stub)
  49 |     await page.goto(`${CONFIG.baseURL}/ai-chatbot`);
  50 |     const chatInput = page.locator('textarea, input[type="text"]').first();
  51 |     await chatInput.fill('What are my top promotions?');
  52 |     await page.keyboard.press('Enter');
  53 |     
  54 |     // Verify AI response (should not be the old stub text)
  55 |     const response = page.locator('.chat-message-assistant, .ai-response').last();
  56 |     await expect(response).toBeVisible();
  57 |     const responseText = await response.innerText();
  58 |     expect(responseText).not.toContain('I can help you with trade promotions'); // Old stub text
  59 |   });
  60 | });
  61 | 
```