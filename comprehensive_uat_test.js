#!/usr/bin/env node

/**
 * Comprehensive UAT Test Suite for TRADEAI Production Deployment
 * Tests all critical functionality and API endpoints
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://tradeai.gonxt.tech';
const API_URL = `${BASE_URL}/api`;

// Test results storage
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data,
                    url: url
                });
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// Test function wrapper
async function runTest(testName, testFunction) {
    try {
        console.log(`🧪 Running: ${testName}`);
        const result = await testFunction();
        if (result.success) {
            console.log(`✅ PASSED: ${testName}`);
            testResults.passed++;
        } else {
            console.log(`❌ FAILED: ${testName} - ${result.message}`);
            testResults.failed++;
        }
        testResults.tests.push({
            name: testName,
            success: result.success,
            message: result.message,
            details: result.details || {}
        });
    } catch (error) {
        console.log(`❌ ERROR: ${testName} - ${error.message}`);
        testResults.failed++;
        testResults.tests.push({
            name: testName,
            success: false,
            message: error.message,
            details: { error: error.stack }
        });
    }
}

// Test 1: Website Accessibility
async function testWebsiteAccessibility() {
    const response = await makeRequest(BASE_URL);
    return {
        success: response.statusCode === 200,
        message: `Website returned status ${response.statusCode}`,
        details: {
            statusCode: response.statusCode,
            contentLength: response.data.length,
            hasHTML: response.data.includes('<html')
        }
    };
}

// Test 2: SSL Certificate
async function testSSLCertificate() {
    const response = await makeRequest(BASE_URL);
    return {
        success: response.statusCode === 200 && BASE_URL.startsWith('https'),
        message: `SSL certificate ${BASE_URL.startsWith('https') ? 'working' : 'not configured'}`,
        details: {
            protocol: BASE_URL.startsWith('https') ? 'HTTPS' : 'HTTP',
            statusCode: response.statusCode
        }
    };
}

// Test 3: API Health Check
async function testAPIHealth() {
    const response = await makeRequest(`${API_URL}/health`);
    let healthData = {};
    try {
        healthData = JSON.parse(response.data);
    } catch (e) {
        healthData = { error: 'Invalid JSON response' };
    }
    
    return {
        success: response.statusCode === 200 && healthData.status === 'ok',
        message: `API health check ${healthData.status === 'ok' ? 'passed' : 'failed'}`,
        details: {
            statusCode: response.statusCode,
            response: healthData
        }
    };
}

// Test 4: Login Endpoint
async function testLoginEndpoint() {
    const loginData = JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
    });
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
        },
        body: loginData
    };
    
    const response = await makeRequest(`${API_URL}/auth/login`, options);
    let responseData = {};
    try {
        responseData = JSON.parse(response.data);
    } catch (e) {
        responseData = { error: 'Invalid JSON response' };
    }
    
    return {
        success: response.statusCode === 400 || response.statusCode === 401,
        message: `Login endpoint responding correctly (${response.statusCode})`,
        details: {
            statusCode: response.statusCode,
            response: responseData
        }
    };
}

// Test 5: Static Assets Loading
async function testStaticAssets() {
    const response = await makeRequest(BASE_URL);
    const html = response.data;
    
    // Extract JavaScript and CSS file references
    const jsMatches = html.match(/src="([^"]*\.js)"/g) || [];
    const cssMatches = html.match(/href="([^"]*\.css)"/g) || [];
    
    let assetsLoaded = 0;
    let totalAssets = 0;
    
    // Test JavaScript files
    for (const match of jsMatches) {
        const src = match.match(/src="([^"]*)"/)[1];
        if (src.startsWith('/')) {
            totalAssets++;
            try {
                const assetResponse = await makeRequest(`${BASE_URL}${src}`);
                if (assetResponse.statusCode === 200) {
                    assetsLoaded++;
                }
            } catch (e) {
                // Asset failed to load
            }
        }
    }
    
    // Test CSS files
    for (const match of cssMatches) {
        const href = match.match(/href="([^"]*)"/)[1];
        if (href.startsWith('/')) {
            totalAssets++;
            try {
                const assetResponse = await makeRequest(`${BASE_URL}${href}`);
                if (assetResponse.statusCode === 200) {
                    assetsLoaded++;
                }
            } catch (e) {
                // Asset failed to load
            }
        }
    }
    
    return {
        success: assetsLoaded === totalAssets && totalAssets > 0,
        message: `Static assets: ${assetsLoaded}/${totalAssets} loaded successfully`,
        details: {
            totalAssets,
            assetsLoaded,
            jsFiles: jsMatches.length,
            cssFiles: cssMatches.length
        }
    };
}

// Test 6: API Endpoints Availability
async function testAPIEndpoints() {
    const endpoints = [
        '/api/companies',
        '/api/customers',
        '/api/products',
        '/api/promotions',
        '/api/budgets',
        '/api/trade-spends',
        '/api/reports'
    ];
    
    let workingEndpoints = 0;
    const endpointResults = {};
    
    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(`${BASE_URL}${endpoint}`);
            // Accept 200, 401 (unauthorized), or 403 (forbidden) as working endpoints
            if ([200, 401, 403].includes(response.statusCode)) {
                workingEndpoints++;
                endpointResults[endpoint] = { status: 'working', code: response.statusCode };
            } else {
                endpointResults[endpoint] = { status: 'error', code: response.statusCode };
            }
        } catch (error) {
            endpointResults[endpoint] = { status: 'error', error: error.message };
        }
    }
    
    return {
        success: workingEndpoints >= endpoints.length * 0.8, // 80% success rate
        message: `API endpoints: ${workingEndpoints}/${endpoints.length} working`,
        details: {
            totalEndpoints: endpoints.length,
            workingEndpoints,
            results: endpointResults
        }
    };
}

// Test 7: Environment Variables Check
async function testEnvironmentVariables() {
    const response = await makeRequest(BASE_URL);
    const html = response.data;
    
    // Check if there are any localhost references in the HTML
    const localhostRefs = (html.match(/localhost/g) || []).length;
    const hasProductionAPI = html.includes('tradeai.gonxt.tech') || !html.includes('localhost:5002');
    
    return {
        success: localhostRefs === 0 && hasProductionAPI,
        message: `Environment variables ${localhostRefs === 0 ? 'properly configured' : 'contain localhost references'}`,
        details: {
            localhostReferences: localhostRefs,
            hasProductionAPI,
            htmlLength: html.length
        }
    };
}

// Test 8: WebSocket Connection Test
async function testWebSocketConnection() {
    // Since we can't easily test WebSocket in Node.js without additional libraries,
    // we'll check if the WebSocket URL is properly configured in the HTML
    const response = await makeRequest(BASE_URL);
    const html = response.data;
    
    const hasWebSocketConfig = html.includes('wss://') || html.includes('ws://');
    const hasProductionWS = html.includes('wss://tradeai.gonxt.tech') || !html.includes('ws://localhost');
    
    return {
        success: hasWebSocketConfig && hasProductionWS,
        message: `WebSocket configuration ${hasProductionWS ? 'properly set for production' : 'needs fixing'}`,
        details: {
            hasWebSocketConfig,
            hasProductionWS
        }
    };
}

// Test 9: CORS Headers
async function testCORSHeaders() {
    const response = await makeRequest(`${API_URL}/health`);
    const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-methods': response.headers['access-control-allow-methods'],
        'access-control-allow-headers': response.headers['access-control-allow-headers']
    };
    
    const hasCORS = corsHeaders['access-control-allow-origin'] !== undefined;
    
    return {
        success: hasCORS,
        message: `CORS headers ${hasCORS ? 'properly configured' : 'missing'}`,
        details: {
            corsHeaders,
            hasCORS
        }
    };
}

// Test 10: Performance Check
async function testPerformance() {
    const startTime = Date.now();
    const response = await makeRequest(BASE_URL);
    const loadTime = Date.now() - startTime;
    
    const isPerformant = loadTime < 3000; // Less than 3 seconds
    
    return {
        success: isPerformant,
        message: `Page load time: ${loadTime}ms ${isPerformant ? '(Good)' : '(Slow)'}`,
        details: {
            loadTime,
            threshold: 3000,
            contentSize: response.data.length
        }
    };
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Comprehensive UAT Testing for TRADEAI Production');
    console.log('=' .repeat(60));
    
    await runTest('Website Accessibility', testWebsiteAccessibility);
    await runTest('SSL Certificate', testSSLCertificate);
    await runTest('API Health Check', testAPIHealth);
    await runTest('Login Endpoint', testLoginEndpoint);
    await runTest('Static Assets Loading', testStaticAssets);
    await runTest('API Endpoints Availability', testAPIEndpoints);
    await runTest('Environment Variables', testEnvironmentVariables);
    await runTest('WebSocket Configuration', testWebSocketConnection);
    await runTest('CORS Headers', testCORSHeaders);
    await runTest('Performance Check', testPerformance);
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 UAT TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Production deployment is ready for go-live.');
    } else {
        console.log('\n⚠️  Some tests failed. Please review and fix issues before go-live.');
        console.log('\nFailed Tests:');
        testResults.tests
            .filter(test => !test.success)
            .forEach(test => {
                console.log(`  - ${test.name}: ${test.message}`);
            });
    }
    
    // Save detailed results to file
    const fs = require('fs');
    fs.writeFileSync('uat_test_results.json', JSON.stringify(testResults, null, 2));
    console.log('\n📄 Detailed results saved to: uat_test_results.json');
    
    return testResults;
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { runAllTests, testResults };