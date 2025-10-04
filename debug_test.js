const http = require('http');

const baseURL = 'http://localhost:5002';
let authToken = null;

async function makeRequest(method, endpoint, data = null, requiresAuth = true) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, baseURL);
    const postData = data ? JSON.stringify(data) : null;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (requiresAuth && authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const options = {
      hostname: url.hostname,
      port: url.port || 5002,
      path: url.pathname + url.search,
      method: method,
      headers: headers
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = body ? JSON.parse(body) : {};
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: jsonData,
            status: res.statusCode
          });
        } catch (error) {
          resolve({
            success: false,
            error: `Parse error: ${error.message}. Body: ${body}`,
            status: res.statusCode
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        status: 0
      });
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function runDebugTests() {
  console.log('=== DEBUG TEST: Customer Creation ===\n');
  
  // 1. Login first
  console.log('1. Login...');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@tradeai.com',
    password: 'Admin@123'
  }, false);
  
  console.log('Login Status:', loginResult.status);
  console.log('Login Success:', loginResult.success);
  if (loginResult.success) {
    authToken = loginResult.data.token;
    console.log('Token obtained:', authToken?.substring(0, 50) + '...\n');
  } else {
    console.log('Login failed:', JSON.stringify(loginResult.error, null, 2));
    return;
  }
  
  // 2. Try to create customer
  console.log('2. Creating customer...');
  const customerData = {
    name: `Debug Customer ${Date.now()}`,
    email: `debug${Date.now()}@test.com`,
    phone: '+27123456789',
    company: 'Debug Company',
    address: {
      street: '123 Test St',
      city: 'Johannesburg',
      state: 'Gauteng',
      country: 'South Africa',
      postalCode: '2000'
    },
    type: 'Corporate',
    status: 'Active',
    channel: 'Direct',
    segment: 'Enterprise'
  };
  
  const customerResult = await makeRequest('POST', '/api/customers', customerData, true);
  console.log('Customer Status:', customerResult.status);
  console.log('Customer Success:', customerResult.success);
  console.log('Customer Response:', JSON.stringify(customerResult.data || customerResult.error, null, 2));
  console.log('');
  
  // 3. Try to create product
  console.log('3. Creating product...');
  const productData = {
    name: `Debug Product ${Date.now()}`,
    sku: `SKU-${Date.now()}`,
    description: 'Debug test product',
    category: 'Electronics',
    type: 'Physical',
    price: 999.99,
    cost: 500.00,
    status: 'Active',
    stockLevel: 100,
    reorderPoint: 20,
    supplier: 'Test Supplier',
    brand: 'Test Brand',
    unit: 'piece'
  };
  
  const productResult = await makeRequest('POST', '/api/products', productData, true);
  console.log('Product Status:', productResult.status);
  console.log('Product Success:', productResult.success);
  console.log('Product Response:', JSON.stringify(productResult.data || productResult.error, null, 2));
  console.log('');
  
  // 4. Try to create promotion
  console.log('4. Creating promotion...');
  const promotionData = {
    name: `Debug Promotion ${Date.now()}`,
    description: 'Debug test promotion',
    type: 'Discount',
    discountType: 'percentage',
    discountValue: 15,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Active',
    conditions: {
      minPurchaseAmount: 1000,
      maxDiscount: 500
    },
    applicableProducts: [],
    applicableCustomers: []
  };
  
  const promotionResult = await makeRequest('POST', '/api/promotions', promotionData, true);
  console.log('Promotion Status:', promotionResult.status);
  console.log('Promotion Success:', promotionResult.success);
  console.log('Promotion Response:', JSON.stringify(promotionResult.data || promotionResult.error, null, 2));
  console.log('');
  
  // 5. Try inventory endpoint
  console.log('5. Getting inventory...');
  const inventoryResult = await makeRequest('GET', '/api/inventory', null, true);
  console.log('Inventory Status:', inventoryResult.status);
  console.log('Inventory Success:', inventoryResult.success);
  console.log('Inventory Response:', JSON.stringify(inventoryResult.data || inventoryResult.error, null, 2));
}

runDebugTests().catch(console.error);
