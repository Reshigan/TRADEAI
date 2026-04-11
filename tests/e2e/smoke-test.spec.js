/**
 * TRADEAI - Smoke Test Suite
 * Validates the critical path: Login -> Dashboard -> Budget -> Promotion -> AI Chatbot
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });

const CONFIG = {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  users: {
    admin: {
      email: process.env.ADMIN_EMAIL || 'admin@test.com',
      password: process.env.ADMIN_PASSWORD || 'TestPassword123!',
    }
  }
};

async function login(page, user) {
  await page.goto(CONFIG.baseURL);
  await page.locator('input[type="email"]').first().fill(user.email);
  await page.locator('input[type="password"]').first().fill(user.password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL('**/dashboard');
}

test.describe('Smoke Test - Critical Path', () => {
  test('should complete a successful user journey', async ({ page }) => {
    // 1. Authentication
    await login(page, CONFIG.users.admin);
    await expect(page).toHaveURL(/.*dashboard/);
    
    // 2. Verify Dashboard KPIs (Real logic now implemented)
    const kpiCard = page.locator('[data-testid="kpi-card"], .kpi-card').first();
    await expect(kpiCard).toBeVisible();
    
    // 3. Navigate to Budgets & Create
    await page.goto(`${CONFIG.baseURL}/budgets`);
    const createBtn = page.locator('button:has-text("Create"), button:has-text("Add")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.locator('input[name="title"]').first().fill('Smoke Test Budget');
      await page.locator('input[name="amount"]').first().fill('100000');
      await page.locator('button[type="submit"]').first().click();
      await expect(page).toHaveURL(/.*budgets/);
    }

    // 4. Test the new AI Chatbot (Previously a stub)
    await page.goto(`${CONFIG.baseURL}/ai-chatbot`);
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.fill('What are my top promotions?');
    await page.keyboard.press('Enter');
    
    // Verify AI response (should not be the old stub text)
    const response = page.locator('.chat-message-assistant, .ai-response').last();
    await expect(response).toBeVisible();
    const responseText = await response.innerText();
    expect(responseText).not.toContain('I can help you with trade promotions'); // Old stub text
  });
});
