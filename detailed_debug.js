const http = require('http');

const TOKEN_HOLDER = { token: null };

function makeRequest(method, path, data = null, useAuth = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (useAuth && TOKEN_HOLDER.token) {
      options.headers['Authorization'] = `Bearer ${TOKEN_HOLDER.token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            data: responseData,
            error: 'Failed to parse JSON response'
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('\n=== DETAILED DEBUG TEST ===\n');
  
  // 1. Login
  console.log('1. Testing Login...');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@tradeai.com',
    password: 'admin123'
  });
  console.log('Login Response:', JSON.stringify(loginResult, null, 2));
  
  if (loginResult.success && loginResult.data.token) {
    TOKEN_HOLDER.token = loginResult.data.token;
    console.log('✅ Token obtained\n');
  } else {
    console.log('❌ Login failed\n');
    return;
  }

  // 2. Create Customer
  console.log('2. Testing Customer Creation...');
  const customerData = {
    name: `Test Customer ${Date.now()}`,
    code: `CUST${Date.now()}`.substring(0, 20),
    sapCustomerId: `SAP-${Date.now()}`,
    customerType: 'retailer',
    channel: 'modern_trade',
    tier: 'standard',
    status: 'active'
  };
  console.log('Customer Data:', JSON.stringify(customerData, null, 2));
  
  const customerResult = await makeRequest('POST', '/api/customers', customerData, true);
  console.log('Customer Response:', JSON.stringify(customerResult, null, 2));
  console.log('');

  // 3. Create Product
  console.log('3. Testing Product Creation...');
  const productData = {
    name: `Test Product ${Date.now()}`,
    sku: `SKU${Date.now()}`.substring(0, 20),
    sapMaterialId: `MAT-${Date.now()}`,
    productType: 'own_brand',
    status: 'active'
  };
  console.log('Product Data:', JSON.stringify(productData, null, 2));
  
  const productResult = await makeRequest('POST', '/api/products', productData, true);
  console.log('Product Response:', JSON.stringify(productResult, null, 2));
  console.log('');

  // 4. Create Promotion
  console.log('4. Testing Promotion Creation...');
  const promotionData = {
    promotionId: `PROMO-${Date.now()}`,
    name: `UAT Promotion ${Date.now()}`,
    promotionType: 'price_discount',
    period: {
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    status: 'draft'
  };
  console.log('Promotion Data:', JSON.stringify(promotionData, null, 2));
  
  const promotionResult = await makeRequest('POST', '/api/promotions', promotionData, true);
  console.log('Promotion Response:', JSON.stringify(promotionResult, null, 2));
  console.log('');

  // 5. Test Inventory List
  console.log('5. Testing Inventory List...');
  const inventoryResult = await makeRequest('GET', '/api/inventory', null, true);
  console.log('Inventory Response:', JSON.stringify(inventoryResult, null, 2));
  console.log('');

  console.log('\n=== DEBUG TEST COMPLETE ===\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
