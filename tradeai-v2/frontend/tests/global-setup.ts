/**
 * Global Test Setup for TRADEAI v2.0
 * Prepares test environment and data
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for backend to be ready
    console.log('⏳ Waiting for backend API...');
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await page.goto('http://localhost:8000/api/v1/health/');
        if (response?.status() === 200) {
          console.log('✅ Backend API is ready');
          break;
        }
      } catch (error) {
        console.log(`⏳ Backend not ready, retrying... (${retries} attempts left)`);
        await page.waitForTimeout(2000);
        retries--;
      }
    }
    
    if (retries === 0) {
      throw new Error('❌ Backend API failed to start');
    }
    
    // Wait for frontend to be ready
    console.log('⏳ Waiting for frontend...');
    retries = 30;
    while (retries > 0) {
      try {
        const response = await page.goto('http://localhost:3000');
        if (response?.status() === 200) {
          console.log('✅ Frontend is ready');
          break;
        }
      } catch (error) {
        console.log(`⏳ Frontend not ready, retrying... (${retries} attempts left)`);
        await page.waitForTimeout(2000);
        retries--;
      }
    }
    
    if (retries === 0) {
      throw new Error('❌ Frontend failed to start');
    }
    
    // Setup test data
    console.log('📊 Setting up test data...');
    await setupTestData(page);
    
    console.log('✅ Global test setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestData(page: any) {
  // Create test tenant
  await page.evaluate(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/tenants/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': 'test-tenant'
        },
        body: JSON.stringify({
          name: 'Test Tenant',
          slug: 'test-tenant',
          domain: 'test.example.com',
          is_active: true,
          contact_email: 'test@example.com'
        })
      });
      
      if (response.ok) {
        console.log('✅ Test tenant created');
      } else {
        console.log('ℹ️ Test tenant already exists or creation skipped');
      }
    } catch (error) {
      console.log('ℹ️ Tenant creation skipped:', error.message);
    }
  });
  
  // Create test user
  await page.evaluate(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': 'test-tenant'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword123',
          full_name: 'Test User',
          is_active: true
        })
      });
      
      if (response.ok) {
        console.log('✅ Test user created');
      } else {
        console.log('ℹ️ Test user already exists or creation skipped');
      }
    } catch (error) {
      console.log('ℹ️ User creation skipped:', error.message);
    }
  });
  
  // Create sample products for testing
  const sampleProducts = [
    {
      name: 'Sample Product 1',
      sku: 'SAMPLE-001',
      description: 'First sample product for testing',
      category: 'Electronics',
      brand: 'TestBrand',
      unit_price: 99.99,
      cost_price: 60.00,
      currency: 'USD',
      status: 'active'
    },
    {
      name: 'Sample Product 2',
      sku: 'SAMPLE-002',
      description: 'Second sample product for testing',
      category: 'Clothing',
      brand: 'TestBrand',
      unit_price: 49.99,
      cost_price: 25.00,
      currency: 'USD',
      status: 'active'
    }
  ];
  
  for (const product of sampleProducts) {
    await page.evaluate(async (productData) => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/products/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Slug': 'test-tenant'
          },
          body: JSON.stringify(productData)
        });
        
        if (response.ok) {
          console.log(`✅ Sample product ${productData.name} created`);
        }
      } catch (error) {
        console.log(`ℹ️ Product creation skipped: ${error.message}`);
      }
    }, product);
  }
  
  // Create sample customers
  const sampleCustomers = [
    {
      name: 'Sample Customer 1',
      email: 'customer1@example.com',
      phone: '+1234567890',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      postal_code: '12345',
      customer_type: 'retail',
      status: 'active'
    },
    {
      name: 'Sample Customer 2',
      email: 'customer2@example.com',
      phone: '+1234567891',
      address: '456 Test Avenue',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      postal_code: '12346',
      customer_type: 'wholesale',
      status: 'active'
    }
  ];
  
  for (const customer of sampleCustomers) {
    await page.evaluate(async (customerData) => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/customers/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Slug': 'test-tenant'
          },
          body: JSON.stringify(customerData)
        });
        
        if (response.ok) {
          console.log(`✅ Sample customer ${customerData.name} created`);
        }
      } catch (error) {
        console.log(`ℹ️ Customer creation skipped: ${error.message}`);
      }
    }, customer);
  }
  
  console.log('✅ Test data setup completed');
}

export default globalSetup;