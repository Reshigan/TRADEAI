/**
 * Global Test Teardown for TRADEAI v2.0
 * Cleans up test environment and data
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  // Launch browser for teardown
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Clean up test data
    console.log('🗑️ Cleaning up test data...');
    await cleanupTestData(page);
    
    console.log('✅ Global test teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

async function cleanupTestData(page: any) {
  // Clean up test products
  await page.evaluate(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/products/', {
        method: 'GET',
        headers: {
          'X-Tenant-Slug': 'test-tenant'
        }
      });
      
      if (response.ok) {
        const products = await response.json();
        for (const product of products.data || []) {
          if (product.sku.startsWith('SAMPLE-') || product.sku.startsWith('TEST-')) {
            await fetch(`http://localhost:8000/api/v1/products/${product.id}`, {
              method: 'DELETE',
              headers: {
                'X-Tenant-Slug': 'test-tenant'
              }
            });
            console.log(`🗑️ Cleaned up test product: ${product.name}`);
          }
        }
      }
    } catch (error) {
      console.log('ℹ️ Product cleanup skipped:', error.message);
    }
  });
  
  // Clean up test customers
  await page.evaluate(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/customers/', {
        method: 'GET',
        headers: {
          'X-Tenant-Slug': 'test-tenant'
        }
      });
      
      if (response.ok) {
        const customers = await response.json();
        for (const customer of customers.data || []) {
          if (customer.email.includes('example.com') || customer.name.includes('Sample')) {
            await fetch(`http://localhost:8000/api/v1/customers/${customer.id}`, {
              method: 'DELETE',
              headers: {
                'X-Tenant-Slug': 'test-tenant'
              }
            });
            console.log(`🗑️ Cleaned up test customer: ${customer.name}`);
          }
        }
      }
    } catch (error) {
      console.log('ℹ️ Customer cleanup skipped:', error.message);
    }
  });
  
  // Clean up test budgets
  await page.evaluate(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/budgets/', {
        method: 'GET',
        headers: {
          'X-Tenant-Slug': 'test-tenant'
        }
      });
      
      if (response.ok) {
        const budgets = await response.json();
        for (const budget of budgets.data || []) {
          if (budget.name.includes('Test') || budget.name.includes('Sample')) {
            await fetch(`http://localhost:8000/api/v1/budgets/${budget.id}`, {
              method: 'DELETE',
              headers: {
                'X-Tenant-Slug': 'test-tenant'
              }
            });
            console.log(`🗑️ Cleaned up test budget: ${budget.name}`);
          }
        }
      }
    } catch (error) {
      console.log('ℹ️ Budget cleanup skipped:', error.message);
    }
  });
  
  // Note: We don't clean up the test tenant and user as they might be needed
  // for subsequent test runs. In a real CI/CD environment, you might want to
  // clean these up as well or use a fresh database for each test run.
  
  console.log('✅ Test data cleanup completed');
}

export default globalTeardown;