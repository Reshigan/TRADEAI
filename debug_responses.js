const axios = require('axios');

const BASE_URL = 'http://localhost:5002';
let authToken = null;

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@tradeai.com',
      password: 'Admin@123'
    });
    authToken = response.data.data?.token || response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCustomerCreation() {
  try {
    const customerData = {
      name: `Debug Customer ${Date.now()}`,
      code: `CUST${Date.now()}`.substring(0, 20),
      sapCustomerId: `SAP-${Date.now()}`,
      customerType: 'retailer',
      channel: 'modern_trade',
      tier: 'standard',
      status: 'active',
      contacts: [{
        name: 'John Doe',
        position: 'Manager',
        email: `test${Date.now()}@customer.com`,
        phone: '+27123456789',
        isPrimary: true
      }],
      address: {
        street: '123 Test Street',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        country: 'South Africa'
      }
    };

    const response = await axios.post(`${BASE_URL}/api/customers`, customerData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('\n🔍 CUSTOMER CREATION RESPONSE:');
    console.log('Full response.data:', JSON.stringify(response.data, null, 2));
    console.log('\nChecking ID paths:');
    console.log('  response.data._id:', response.data._id);
    console.log('  response.data.id:', response.data.id);
    console.log('  response.data.data:', typeof response.data.data);
    console.log('  response.data.data._id:', response.data.data?._id);
    console.log('  response.data.data.id:', response.data.data?.id);
    console.log('  response.data.data.customer:', typeof response.data.data?.customer);
    console.log('  response.data.data.customer._id:', response.data.data?.customer?._id);
    
  } catch (error) {
    console.error('❌ Customer creation failed:', error.response?.data || error.message);
  }
}

async function testProductCreation() {
  try {
    const productData = {
      name: `Debug Product ${Date.now()}`,
      sku: `SKU${Date.now()}`.substring(0, 20),
      sapMaterialId: `MAT-${Date.now()}`,
      productType: 'own_brand',
      description: 'Debug test product',
      category: {
        primary: 'Electronics'
      },
      brand: {
        name: 'Test Brand',
        owner: 'company'
      },
      attributes: {
        weight: 1.5,
        weightUnit: 'kg',
        unitsPerCase: 12
      },
      pricing: {
        listPrice: 999.99,
        cost: 500.00
      },
      status: 'active',
      inventory: {
        trackInventory: true,
        stockLevel: 100,
        reorderPoint: 20
      }
    };

    const response = await axios.post(`${BASE_URL}/api/products`, productData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('\n🔍 PRODUCT CREATION RESPONSE:');
    console.log('Full response.data:', JSON.stringify(response.data, null, 2));
    console.log('\nChecking ID paths:');
    console.log('  response.data._id:', response.data._id);
    console.log('  response.data.id:', response.data.id);
    console.log('  response.data.data:', typeof response.data.data);
    console.log('  response.data.data._id:', response.data.data?._id);
    console.log('  response.data.data.id:', response.data.data?.id);
    console.log('  response.data.data.product:', typeof response.data.data?.product);
    console.log('  response.data.data.product._id:', response.data.data?.product?._id);
    
  } catch (error) {
    console.error('❌ Product creation failed:', error.response?.data || error.message);
  }
}

async function testInventoryEndpoint() {
  try {
    const response = await axios.get(`${BASE_URL}/api/inventory`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('\n🔍 INVENTORY ENDPOINT RESPONSE:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Inventory endpoint failed:', error.response?.status, error.response?.data || error.message);
  }
}

async function main() {
  console.log('🔍 DEBUGGING API RESPONSE STRUCTURES\n');
  
  const loggedIn = await login();
  if (!loggedIn) {
    return;
  }

  await testCustomerCreation();
  await testProductCreation();
  await testInventoryEndpoint();
}

main();
