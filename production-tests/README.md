# TRADEAI Production Testing Suite

Comprehensive automated testing and monitoring framework for the TRADEAI production environment.

## 🚀 Quick Start

### Installation
```bash
cd production-tests
npm run install-deps
```

### Run Tests
```bash
# Full test suite
npm test

# Health monitoring only
npm run test:health

# Continuous monitoring
npm run test:continuous
```

## 📋 Test Suites

### 1. System Health Tests
- Backend server health check
- Frontend accessibility verification
- Database connectivity validation

### 2. Authentication Tests
- Login endpoint functionality
- Protected route access validation
- Token-based authentication

### 3. API Endpoint Tests
- All major API endpoints
- Response validation
- Performance monitoring

### 4. Data Validation Tests
- Trading terms data integrity
- Promotions data validation
- Customer and product data checks

### 5. Performance Tests
- Page load performance
- API response times
- System resource utilization

### 6. Error Handling Tests
- Invalid endpoint handling
- Unauthorized access responses
- Graceful error management

## 🔍 Monitoring

### Health Monitor
Lightweight continuous monitoring:
```bash
node health-monitor.js --continuous
```

Features:
- Real-time system health checks
- Automatic alert generation
- Performance metrics tracking
- Status logging and reporting

### Alert System
- Configurable failure thresholds
- Automatic alert generation
- File-based alert logging
- Email notifications (configurable)

## 📊 Reports

### Test Reports
- Detailed JSON reports with timestamps
- Success/failure rates
- Performance metrics
- Error details and stack traces

### Health Status
- Real-time system status
- Historical performance data
- Trend analysis
- Uptime statistics

## ⚙️ Configuration

Edit configuration in test files:

```javascript
const CONFIG = {
    BASE_URL: 'https://tradeai.gonxt.tech',
    BACKEND_URL: 'http://localhost:3000',
    TIMEOUT: 10000,
    PERFORMANCE_THRESHOLD: 2000,
    TEST_USER: {
        email: 'admin@demo.com',
        password: 'Admin@123'
    }
};
```

## 🔧 Customization

### Adding New Tests
```javascript
const customSuite = new TestSuite('Custom Tests');

customSuite.addTest('My Custom Test', async () => {
    // Test implementation
    return { success: true, details: {} };
});
```

### Custom Monitoring
```javascript
const { runHealthCheck } = require('./health-monitor');

// Custom monitoring logic
setInterval(async () => {
    const status = await runHealthCheck();
    // Custom actions based on status
}, 30000);
```

## 📈 Success Criteria

- **Excellent**: 95%+ success rate
- **Good**: 85-94% success rate
- **Acceptable**: 70-84% success rate
- **Needs Attention**: <70% success rate

## 🚨 Alerts

Alerts are triggered when:
- 3+ consecutive health check failures
- Critical API endpoints are down
- Performance degrades below thresholds
- Authentication systems fail

## 📝 Logs

All logs include:
- Timestamp
- Log level (INFO, WARN, ERROR, ALERT)
- Detailed messages
- Performance metrics
- Error stack traces

## 🔄 Continuous Integration

Integrate with CI/CD pipelines:
```bash
# In your CI/CD script
npm test
if [ $? -eq 0 ]; then
    echo "All tests passed - deployment approved"
else
    echo "Tests failed - deployment blocked"
    exit 1
fi
```

## 📞 Support

For issues or questions:
1. Check the latest test reports
2. Review health monitor logs
3. Examine error details in JSON reports
4. Contact the development team with specific error messages

## 🔐 Security

- Test credentials are configurable
- No sensitive data in logs
- Secure token handling
- Protected endpoint testing

## 📋 Maintenance

Regular maintenance tasks:
- Update test credentials
- Review performance thresholds
- Clean up old report files
- Update API endpoint tests
- Validate alert configurations