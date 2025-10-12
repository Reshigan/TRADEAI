/**
 * TRADEAI Extended Automated Production Test Suite
 * Comprehensive testing including AI promotion simulation and backend APIs
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

class ExtendedProductionTestSuite {
    constructor() {
        this.baseUrl = 'https://tradeai.gonxt.tech';
        this.apiUrl = 'https://tradeai.gonxt.tech/api';
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            tests: []
        };
        this.startTime = Date.now();
    }

    // Test result logging
    logTest(testName, status, details = '', responseTime = 0) {
        const result = {
            name: testName,
            status: status,
            details: details,
            responseTime: responseTime,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.tests.push(result);
        this.testResults.total++;
        
        if (status === 'PASS') {
            this.testResults.passed++;
            console.log(`✅ ${testName} - PASSED (${responseTime}ms)`);
            if (details) console.log(`   ${details}`);
        } else {
            this.testResults.failed++;
            console.log(`❌ ${testName} - FAILED (${responseTime}ms)`);
            if (details) console.log(`   ${details}`);
        }
    }

    // HTTP request helper
    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const protocol = url.startsWith('https') ? https : http;
            
            const requestOptions = {
                method: options.method || 'GET',
                headers: {
                    'User-Agent': 'TRADEAI-Extended-Test-Suite/1.0',
                    'Accept': 'application/json',
                    ...options.headers
                },
                timeout: options.timeout || 30000
            };

            const req = protocol.request(url, requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data,
                        responseTime: responseTime
                    });
                });
            });

            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                reject({ error: error.message, responseTime });
            });

            req.on('timeout', () => {
                req.destroy();
                const responseTime = Date.now() - startTime;
                reject({ error: 'Request timeout', responseTime });
            });

            if (options.body) {
                req.write(options.body);
            }

            req.end();
        });
    }

    // Test 1: SSL Certificate and HTTPS
    async testSSLCertificate() {
        try {
            const response = await this.makeRequest(this.baseUrl);
            
            if (response.statusCode === 200) {
                this.logTest('SSL Certificate & HTTPS', 'PASS', 
                    `HTTPS working, Status: ${response.statusCode}`, response.responseTime);
            } else {
                this.logTest('SSL Certificate & HTTPS', 'FAIL', 
                    `Unexpected status: ${response.statusCode}`, response.responseTime);
            }
        } catch (error) {
            this.logTest('SSL Certificate & HTTPS', 'FAIL', 
                `Error: ${error.error}`, error.responseTime || 0);
        }
    }

    // Test 2: React Application Loading
    async testReactApplication() {
        try {
            const response = await this.makeRequest(this.baseUrl);
            
            if (response.statusCode === 200) {
                const html = response.data;
                const hasReactElements = html.includes('TRADE AI') || html.includes('Trade AI') || html.includes('TRADEAI');
                
                if (hasReactElements) {
                    this.logTest('React Application Loading', 'PASS', 
                        'React application loaded successfully', response.responseTime);
                } else {
                    this.logTest('React Application Loading', 'FAIL', 
                        'React application content not found', response.responseTime);
                }
            } else {
                this.logTest('React Application Loading', 'FAIL', 
                    `HTTP ${response.statusCode}`, response.responseTime);
            }
        } catch (error) {
            this.logTest('React Application Loading', 'FAIL', 
                `Error: ${error.error}`, error.responseTime || 0);
        }
    }

    // Test 3: Security Headers
    async testSecurityHeaders() {
        try {
            const response = await this.makeRequest(this.baseUrl);
            const headers = response.headers;
            
            const requiredHeaders = [
                'strict-transport-security',
                'x-frame-options',
                'x-content-type-options'
            ];
            
            const presentHeaders = requiredHeaders.filter(header => headers[header]);
            
            if (presentHeaders.length >= 2) {
                this.logTest('Security Headers', 'PASS', 
                    `${presentHeaders.length}/${requiredHeaders.length} security headers present`, response.responseTime);
            } else {
                this.logTest('Security Headers', 'FAIL', 
                    `Only ${presentHeaders.length}/${requiredHeaders.length} security headers present`, response.responseTime);
            }
        } catch (error) {
            this.logTest('Security Headers', 'FAIL', 
                `Error: ${error.error}`, error.responseTime || 0);
        }
    }

    // Test 4: Backend API Health Check
    async testAPIHealth() {
        try {
            const response = await this.makeRequest(`${this.apiUrl}/health`);
            
            if (response.statusCode === 200) {
                try {
                    const data = JSON.parse(response.data);
                    if (data.status === 'healthy' || data.status === 'ok') {
                        this.logTest('Backend API Health', 'PASS', 
                            `API healthy, version: ${data.version || 'unknown'}`, response.responseTime);
                    } else {
                        this.logTest('Backend API Health', 'FAIL', 
                            `API status: ${data.status}`, response.responseTime);
                    }
                } catch (parseError) {
                    // If not JSON, check if it's a simple text response
                    if (response.data.includes('healthy') || response.data.includes('ok')) {
                        this.logTest('Backend API Health', 'PASS', 
                            'API responding with health status', response.responseTime);
                    } else {
                        this.logTest('Backend API Health', 'FAIL', 
                            'Invalid health response format', response.responseTime);
                    }
                }
            } else {
                this.logTest('Backend API Health', 'FAIL', 
                    `HTTP ${response.statusCode}`, response.responseTime);
            }
        } catch (error) {
            this.logTest('Backend API Health', 'FAIL', 
                `Error: ${error.error}`, error.responseTime || 0);
        }
    }

    // Test 5: Backend API Root Endpoint
    async testAPIRoot() {
        try {
            const response = await this.makeRequest(`${this.apiUrl}`);
            
            if (response.statusCode === 200) {
                try {
                    const data = JSON.parse(response.data);
                    if (data.message && (data.message.includes('TRADEAI') || data.message.includes('API'))) {
                        this.logTest('Backend API Root', 'PASS', 
                            `API responding: ${data.message.substring(0, 50)}...`, response.responseTime);
                    } else {
                        this.logTest('Backend API Root', 'FAIL', 
                            'Unexpected API response format', response.responseTime);
                    }
                } catch (parseError) {
                    // Check if it's a valid response even if not JSON
                    if (response.data.includes('TRADEAI') || response.data.includes('API')) {
                        this.logTest('Backend API Root', 'PASS', 
                            'API responding with valid content', response.responseTime);
                    } else {
                        this.logTest('Backend API Root', 'FAIL', 
                            'Invalid API response format', response.responseTime);
                    }
                }
            } else {
                this.logTest('Backend API Root', 'FAIL', 
                    `HTTP ${response.statusCode}`, response.responseTime);
            }
        } catch (error) {
            this.logTest('Backend API Root', 'FAIL', 
                `Error: ${error.error}`, error.responseTime || 0);
        }
    }

    // Test 6: AI Promotion Model Status
    async testAIModelStatus() {
        try {
            const response = await this.makeRequest(`${this.apiUrl}/ai-promotion/model-status`);
            
            if (response.statusCode === 200) {
                try {
                    const data = JSON.parse(response.data);
                    if (data.success && data.data && data.data.aiService) {
                        const aiStatus = data.data.aiService.status;
                        const llmStatus = data.data.llmService ? data.data.llmService.status : 'unknown';
                        this.logTest('AI Model Status', 'PASS', 
                            `AI Service: ${aiStatus}, LLM: ${llmStatus}`, response.responseTime);
                    } else {
                        this.logTest('AI Model Status', 'FAIL', 
                            'Invalid AI model status response structure', response.responseTime);
                    }
                } catch (parseError) {
                    this.logTest('AI Model Status', 'FAIL', 
                        'Invalid JSON response from AI model status', response.responseTime);
                }
            } else if (response.statusCode === 404) {
                this.logTest('AI Model Status', 'FAIL', 
                    'AI promotion endpoints not available', response.responseTime);
            } else {
                this.logTest('AI Model Status', 'FAIL', 
                    `HTTP ${response.statusCode}`, response.responseTime);
            }
        } catch (error) {
            this.logTest('AI Model Status', 'FAIL', 
                `Error: ${error.error}`, error.responseTime || 0);
        }
    }

    // Test 7: AI Promotion Simulation
    async testAIPromotionSimulation() {
        try {
            const testData = {
                productId: 'TEST_PROD_001',
                productName: 'Test Premium Beverage',
                category: 'beverages',
                currentPrice: 4.99,
                proposedPrice: 3.99,
                expectedUplift: 25,
                duration: 14
            };

            const response = await this.makeRequest(`${this.apiUrl}/ai-promotion/run-simulation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData),
                timeout: 45000
            });
            
            if (response.statusCode === 200) {
                try {
                    const data = JSON.parse(response.data);
                    if (data.success && data.data) {
                        const hasValidation = data.data.originalPromotion && data.data.originalPromotion.validation;
                        const hasSuggestions = data.data.aiSuggestions && data.data.aiSuggestions.suggestions;
                        
                        if (hasValidation && hasSuggestions) {
                            const validation = data.data.originalPromotion.validation;
                            const suggestions = data.data.aiSuggestions.suggestions;
                            this.logTest('AI Promotion Simulation', 'PASS', 
                                `Validation: ${validation.isValid}, Suggestions: ${suggestions.length}`, response.responseTime);
                        } else {
                            this.logTest('AI Promotion Simulation', 'FAIL', 
                                'Incomplete simulation response structure', response.responseTime);
                        }
                    } else {
                        this.logTest('AI Promotion Simulation', 'FAIL', 
                            'Invalid simulation response format', response.responseTime);
                    }
                } catch (parseError) {
                    this.logTest('AI Promotion Simulation', 'FAIL', 
                        'Invalid JSON response from simulation', response.responseTime);
                }
            } else if (response.statusCode === 404) {
                this.logTest('AI Promotion Simulation', 'FAIL', 
                    'AI promotion simulation endpoint not available', response.responseTime);
            } else {
                this.logTest('AI Promotion Simulation', 'FAIL', 
                    `HTTP ${response.statusCode}`, response.responseTime);
            }
        } catch (error) {
            this.logTest('AI Promotion Simulation', 'FAIL', 
                `Error: ${error.error}`, error.responseTime || 0);
        }
    }

    // Test 8: Static Asset Loading
    async testStaticAssets() {
        try {
            const response = await this.makeRequest(`${this.baseUrl}/static/js/main.3708d4b0.js`);
            
            if (response.statusCode === 200) {
                this.logTest('Static Asset Loading', 'PASS', 
                    'JavaScript bundle loaded successfully', response.responseTime);
            } else {
                this.logTest('Static Asset Loading', 'FAIL', 
                    `HTTP ${response.statusCode}`, response.responseTime);
            }
        } catch (error) {
            this.logTest('Static Asset Loading', 'FAIL', 
                `Error: ${error.error}`, error.responseTime || 0);
        }
    }

    // Test 9: Performance Test
    async testPerformance() {
        const performanceTests = [];
        
        for (let i = 0; i < 3; i++) {
            try {
                const response = await this.makeRequest(this.baseUrl);
                performanceTests.push(response.responseTime);
            } catch (error) {
                performanceTests.push(5000); // Penalty for failed requests
            }
        }
        
        const avgResponseTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
        
        if (avgResponseTime < 2000) {
            this.logTest('Performance Test', 'PASS', 
                `Average response time: ${avgResponseTime.toFixed(0)}ms`, avgResponseTime);
        } else {
            this.logTest('Performance Test', 'FAIL', 
                `Slow response time: ${avgResponseTime.toFixed(0)}ms`, avgResponseTime);
        }
    }

    // Test 10: Load Test (Concurrent Requests)
    async testLoadHandling() {
        const concurrentRequests = 5;
        const promises = [];
        
        for (let i = 0; i < concurrentRequests; i++) {
            promises.push(this.makeRequest(this.baseUrl));
        }
        
        try {
            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.statusCode === 200).length;
            const successRate = (successful / concurrentRequests) * 100;
            
            if (successRate >= 80) {
                this.logTest('Load Handling Test', 'PASS', 
                    `${successful}/${concurrentRequests} requests successful (${successRate.toFixed(1)}%)`, 0);
            } else {
                this.logTest('Load Handling Test', 'FAIL', 
                    `Only ${successful}/${concurrentRequests} requests successful (${successRate.toFixed(1)}%)`, 0);
            }
        } catch (error) {
            this.logTest('Load Handling Test', 'FAIL', 
                `Error during load test: ${error.message}`, 0);
        }
    }

    // Generate comprehensive test report
    generateReport() {
        const totalTime = Date.now() - this.startTime;
        const successRate = (this.testResults.passed / this.testResults.total) * 100;
        
        console.log('\n' + '='.repeat(80));
        console.log('🧪 TRADEAI EXTENDED PRODUCTION TEST REPORT');
        console.log('='.repeat(80));
        console.log(`📊 Test Summary:`);
        console.log(`   Total Tests: ${this.testResults.total}`);
        console.log(`   Passed: ${this.testResults.passed}`);
        console.log(`   Failed: ${this.testResults.failed}`);
        console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
        console.log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`);
        console.log('');
        
        // Categorize results
        const categories = {
            'Infrastructure': ['SSL Certificate & HTTPS', 'Security Headers'],
            'Frontend': ['React Application Loading', 'Static Asset Loading'],
            'Backend API': ['Backend API Health', 'Backend API Root'],
            'AI Features': ['AI Model Status', 'AI Promotion Simulation'],
            'Performance': ['Performance Test', 'Load Handling Test']
        };
        
        Object.entries(categories).forEach(([category, tests]) => {
            console.log(`📋 ${category}:`);
            tests.forEach(testName => {
                const test = this.testResults.tests.find(t => t.name === testName);
                if (test) {
                    const status = test.status === 'PASS' ? '✅' : '❌';
                    console.log(`   ${status} ${testName} (${test.responseTime}ms)`);
                    if (test.details) {
                        console.log(`      ${test.details}`);
                    }
                }
            });
            console.log('');
        });
        
        // Feature-specific assessment
        const infraTests = this.testResults.tests.filter(t => categories['Infrastructure'].includes(t.name));
        const frontendTests = this.testResults.tests.filter(t => categories['Frontend'].includes(t.name));
        const backendTests = this.testResults.tests.filter(t => categories['Backend API'].includes(t.name));
        const aiTests = this.testResults.tests.filter(t => categories['AI Features'].includes(t.name));
        const perfTests = this.testResults.tests.filter(t => categories['Performance'].includes(t.name));

        console.log('📈 Feature Assessment:');
        console.log(`   Infrastructure: ${infraTests.filter(t => t.status === 'PASS').length}/${infraTests.length} ✅`);
        console.log(`   Frontend: ${frontendTests.filter(t => t.status === 'PASS').length}/${frontendTests.length} ✅`);
        console.log(`   Backend API: ${backendTests.filter(t => t.status === 'PASS').length}/${backendTests.length} ✅`);
        console.log(`   AI Features: ${aiTests.filter(t => t.status === 'PASS').length}/${aiTests.length} ✅`);
        console.log(`   Performance: ${perfTests.filter(t => t.status === 'PASS').length}/${perfTests.length} ✅`);
        console.log('');
        
        // Overall assessment
        if (successRate >= 90) {
            console.log('🎉 OVERALL ASSESSMENT: EXCELLENT - Production system is performing optimally');
        } else if (successRate >= 80) {
            console.log('✅ OVERALL ASSESSMENT: GOOD - Production system is stable with minor issues');
        } else if (successRate >= 70) {
            console.log('⚠️  OVERALL ASSESSMENT: FAIR - Production system needs attention');
        } else {
            console.log('❌ OVERALL ASSESSMENT: POOR - Production system requires immediate attention');
        }
        
        console.log('');
        console.log(`🌐 Production URL: ${this.baseUrl}`);
        console.log(`📅 Test Date: ${new Date().toISOString()}`);
        console.log('='.repeat(80));
        
        // Save detailed report to file
        const reportData = {
            summary: {
                total: this.testResults.total,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                successRate: successRate,
                totalTime: totalTime,
                timestamp: new Date().toISOString()
            },
            tests: this.testResults.tests,
            categories: categories,
            featureAssessment: {
                infrastructure: `${infraTests.filter(t => t.status === 'PASS').length}/${infraTests.length}`,
                frontend: `${frontendTests.filter(t => t.status === 'PASS').length}/${frontendTests.length}`,
                backend: `${backendTests.filter(t => t.status === 'PASS').length}/${backendTests.length}`,
                ai: `${aiTests.filter(t => t.status === 'PASS').length}/${aiTests.length}`,
                performance: `${perfTests.filter(t => t.status === 'PASS').length}/${perfTests.length}`
            }
        };
        
        try {
            fs.writeFileSync('extended-production-test-report.json', JSON.stringify(reportData, null, 2));
            console.log('📄 Detailed report saved to: extended-production-test-report.json');
        } catch (error) {
            console.log('⚠️  Could not save detailed report file');
        }
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting TRADEAI Extended Production Test Suite...');
        console.log(`🌐 Testing: ${this.baseUrl}`);
        console.log('');
        
        // Infrastructure Tests
        console.log('📋 Running Infrastructure Tests...');
        await this.testSSLCertificate();
        await this.testSecurityHeaders();
        
        // Frontend Tests
        console.log('\n📋 Running Frontend Tests...');
        await this.testReactApplication();
        await this.testStaticAssets();
        
        // Backend API Tests
        console.log('\n📋 Running Backend API Tests...');
        await this.testAPIHealth();
        await this.testAPIRoot();
        
        // AI Feature Tests
        console.log('\n📋 Running AI Feature Tests...');
        await this.testAIModelStatus();
        await this.testAIPromotionSimulation();
        
        // Performance Tests
        console.log('\n📋 Running Performance Tests...');
        await this.testPerformance();
        await this.testLoadHandling();
        
        // Generate final report
        this.generateReport();
    }
}

// Run the test suite
const testSuite = new ExtendedProductionTestSuite();
testSuite.runAllTests().catch(error => {
    console.error('Extended test suite failed:', error);
    process.exit(1);
});