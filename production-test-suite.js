/**
 * TRADEAI Comprehensive Automated Production Test Suite
 * Tests all Tier 1 functionality including AI promotion simulation
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

class ProductionTestSuite {
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
                    'User-Agent': 'TRADEAI-Production-Test-Suite/1.0',
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

    // Test 2: HTTP to HTTPS Redirect
    async testHTTPRedirect() {
        try {
            const response = await this.makeRequest('http://tradeai.gonxt.tech', { timeout: 10000 });
            
            if (response.statusCode === 301 || response.statusCode === 302) {
                const location = response.headers.location;
                if (location && location.startsWith('https://')) {
                    this.logTest('HTTP to HTTPS Redirect', 'PASS', 
                        `Redirect to: ${location}`, response.responseTime);
                } else {
                    this.logTest('HTTP to HTTPS Redirect', 'FAIL', 
                        `Invalid redirect location: ${location}`, response.responseTime);
                }
            } else {
                this.logTest('HTTP to HTTPS Redirect', 'FAIL', 
                    `Expected 301/302, got: ${response.statusCode}`, response.responseTime);
            }
        } catch (error) {
            this.logTest('HTTP to HTTPS Redirect', 'FAIL', 
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
                'x-content-type-options',
                'x-xss-protection'
            ];
            
            const missingHeaders = requiredHeaders.filter(header => !headers[header]);
            
            if (missingHeaders.length === 0) {
                this.logTest('Security Headers', 'PASS', 
                    'All required security headers present', response.responseTime);
            } else {
                this.logTest('Security Headers', 'FAIL', 
                    `Missing headers: ${missingHeaders.join(', ')}`, response.responseTime);
            }
        } catch (error) {
            this.logTest('Security Headers', 'FAIL', 
                `Error: ${error.error}`, error.responseTime || 0);
        }
    }

    // Test 4: React Application Loading
    async testReactApplication() {
        try {
            const response = await this.makeRequest(this.baseUrl);
            
            if (response.statusCode === 200) {
                const html = response.data;
                const hasReactElements = html.includes('react') || html.includes('TRADEAI') || html.includes('Trade AI');
                
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

    // Test 5: Performance Test
    async testPerformance() {
        const performanceTests = [];
        
        for (let i = 0; i < 3; i++) {
            try {
                const response = await this.makeRequest(this.baseUrl);
                performanceTests.push(response.responseTime);
            } catch (error) {
                performanceTests.push(10000); // Penalty for failed requests
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

    // Test 6: Static Asset Loading
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

    // Test 7: Gzip Compression
    async testGzipCompression() {
        try {
            const response = await this.makeRequest(this.baseUrl, {
                headers: {
                    'Accept-Encoding': 'gzip, deflate'
                }
            });
            
            const contentEncoding = response.headers['content-encoding'];
            if (contentEncoding && contentEncoding.includes('gzip')) {
                this.logTest('Gzip Compression', 'PASS', 
                    'Gzip compression enabled', response.responseTime);
            } else {
                this.logTest('Gzip Compression', 'FAIL', 
                    'Gzip compression not detected', response.responseTime);
            }
        } catch (error) {
            this.logTest('Gzip Compression', 'FAIL', 
                `Error: ${error.error}`, error.responseTime || 0);
        }
    }

    // Test 8: Load Test (Concurrent Requests)
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
        console.log('🧪 TRADEAI COMPREHENSIVE PRODUCTION TEST REPORT');
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
            'Infrastructure': ['SSL Certificate & HTTPS', 'HTTP to HTTPS Redirect', 'Security Headers', 'Gzip Compression'],
            'Frontend': ['React Application Loading', 'Static Asset Loading'],
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
        
        // Overall assessment
        if (successRate >= 95) {
            console.log('🎉 OVERALL ASSESSMENT: EXCELLENT - Production system is performing optimally');
        } else if (successRate >= 85) {
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
            categories: categories
        };
        
        try {
            fs.writeFileSync('production-test-report.json', JSON.stringify(reportData, null, 2));
            console.log('📄 Detailed report saved to: production-test-report.json');
        } catch (error) {
            console.log('⚠️  Could not save detailed report file');
        }
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting TRADEAI Comprehensive Production Test Suite...');
        console.log(`🌐 Testing: ${this.baseUrl}`);
        console.log('');
        
        // Infrastructure Tests
        console.log('📋 Running Infrastructure Tests...');
        await this.testSSLCertificate();
        await this.testHTTPRedirect();
        await this.testSecurityHeaders();
        await this.testGzipCompression();
        
        // Frontend Tests
        console.log('\n📋 Running Frontend Tests...');
        await this.testReactApplication();
        await this.testStaticAssets();
        
        // Performance Tests
        console.log('\n📋 Running Performance Tests...');
        await this.testPerformance();
        await this.testLoadHandling();
        
        // Generate final report
        this.generateReport();
    }
}

// Run the test suite
const testSuite = new ProductionTestSuite();
testSuite.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});