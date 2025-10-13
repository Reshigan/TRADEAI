#!/bin/bash

# TRADEAI v2.0 - Comprehensive Test Execution Script for 100% Coverage

set -e

echo "🚀 TRADEAI v2.0 - Running Complete Test Suite for 100% Coverage"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
UNIT_TESTS_PASSED=false
INTEGRATION_TESTS_PASSED=false
E2E_TESTS_PASSED=false
COVERAGE_TARGET_MET=false

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to setup test environment
setup_test_environment() {
    print_status "INFO" "Setting up test environment..."
    
    # Check required tools
    if ! command_exists node; then
        print_status "ERROR" "Node.js is not installed"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_status "ERROR" "npm is not installed"
        exit 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "INFO" "Installing dependencies..."
        npm install
    fi
    
    # Setup test database
    export NODE_ENV=test
    export MONGODB_URI="mongodb://localhost:27017/tradeai_test"
    export REDIS_URL="redis://localhost:6379"
    export JWT_SECRET="test-jwt-secret-key-for-testing-only"
    
    print_status "SUCCESS" "Test environment setup complete"
}

# Function to run unit tests
run_unit_tests() {
    print_status "INFO" "Running unit tests..."
    
    # Frontend unit tests
    print_status "INFO" "Running frontend unit tests..."
    cd frontend
    if npm test -- --coverage --watchAll=false --testPathPattern="src/__tests__" --coverageReporters=json-summary --coverageReporters=text; then
        print_status "SUCCESS" "Frontend unit tests passed"
        FRONTEND_UNIT_PASSED=true
    else
        print_status "ERROR" "Frontend unit tests failed"
        FRONTEND_UNIT_PASSED=false
    fi
    cd ..
    
    # Backend unit tests
    print_status "INFO" "Running backend unit tests..."
    cd backend
    if npm test -- --coverage --testPathPattern="src/__tests__" --coverageReporters=json-summary --coverageReporters=text; then
        print_status "SUCCESS" "Backend unit tests passed"
        BACKEND_UNIT_PASSED=true
    else
        print_status "ERROR" "Backend unit tests failed"
        BACKEND_UNIT_PASSED=false
    fi
    cd ..
    
    # Overall unit test status
    if [ "$FRONTEND_UNIT_PASSED" = true ] && [ "$BACKEND_UNIT_PASSED" = true ]; then
        UNIT_TESTS_PASSED=true
        print_status "SUCCESS" "All unit tests passed"
    else
        print_status "ERROR" "Some unit tests failed"
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "INFO" "Running integration tests..."
    
    # Start test services
    print_status "INFO" "Starting test services..."
    docker-compose -f docker-compose.test.yml up -d mongodb redis
    
    # Wait for services to be ready
    sleep 10
    
    # Run integration tests
    if npm run test:integration -- --coverage --coverageReporters=json-summary --coverageReporters=text; then
        print_status "SUCCESS" "Integration tests passed"
        INTEGRATION_TESTS_PASSED=true
    else
        print_status "ERROR" "Integration tests failed"
        INTEGRATION_TESTS_PASSED=false
    fi
    
    # Stop test services
    docker-compose -f docker-compose.test.yml down
}

# Function to run E2E tests
run_e2e_tests() {
    print_status "INFO" "Running end-to-end tests..."
    
    # Start full application stack
    print_status "INFO" "Starting application stack for E2E tests..."
    docker-compose -f docker-compose.test.yml up -d
    
    # Wait for application to be ready
    print_status "INFO" "Waiting for application to be ready..."
    sleep 30
    
    # Health check
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_status "SUCCESS" "Application is ready"
    else
        print_status "ERROR" "Application failed to start"
        docker-compose -f docker-compose.test.yml down
        return 1
    fi
    
    # Run Cypress E2E tests
    if npx cypress run --config baseUrl=http://localhost:3000 --spec "tests/e2e/**/*.cy.js"; then
        print_status "SUCCESS" "E2E tests passed"
        E2E_TESTS_PASSED=true
    else
        print_status "ERROR" "E2E tests failed"
        E2E_TESTS_PASSED=false
    fi
    
    # Stop application stack
    docker-compose -f docker-compose.test.yml down
}

# Function to run performance tests
run_performance_tests() {
    print_status "INFO" "Running performance tests..."
    
    # Start application for performance testing
    docker-compose -f docker-compose.test.yml up -d
    sleep 30
    
    # Run load tests with Artillery
    if command_exists artillery; then
        print_status "INFO" "Running load tests..."
        if artillery run tests/performance/load-test.yml; then
            print_status "SUCCESS" "Performance tests passed"
        else
            print_status "WARNING" "Performance tests showed issues"
        fi
    else
        print_status "WARNING" "Artillery not installed, skipping performance tests"
    fi
    
    # Run Lighthouse performance audit
    if command_exists lighthouse; then
        print_status "INFO" "Running Lighthouse audit..."
        lighthouse http://localhost:3000 --output=json --output-path=./coverage/lighthouse-report.json --chrome-flags="--headless"
        print_status "SUCCESS" "Lighthouse audit completed"
    else
        print_status "WARNING" "Lighthouse not installed, skipping performance audit"
    fi
    
    docker-compose -f docker-compose.test.yml down
}

# Function to run security tests
run_security_tests() {
    print_status "INFO" "Running security tests..."
    
    # Start application for security testing
    docker-compose -f docker-compose.test.yml up -d
    sleep 30
    
    # Run OWASP ZAP security scan
    if command_exists zap-baseline.py; then
        print_status "INFO" "Running OWASP ZAP security scan..."
        if zap-baseline.py -t http://localhost:3000 -J zap-report.json; then
            print_status "SUCCESS" "Security scan completed"
        else
            print_status "WARNING" "Security scan found issues"
        fi
    else
        print_status "WARNING" "OWASP ZAP not installed, skipping security tests"
    fi
    
    # Run npm audit
    print_status "INFO" "Running npm security audit..."
    npm audit --audit-level=high
    
    docker-compose -f docker-compose.test.yml down
}

# Function to validate coverage
validate_coverage() {
    print_status "INFO" "Validating test coverage..."
    
    # Merge coverage reports
    if command_exists nyc; then
        print_status "INFO" "Merging coverage reports..."
        nyc merge coverage coverage/merged-coverage.json
        nyc report --reporter=html --reporter=text --reporter=json-summary --temp-dir=coverage
    fi
    
    # Check coverage thresholds
    if [ -f "coverage/coverage-summary.json" ]; then
        # Extract coverage percentages using node
        COVERAGE_LINES=$(node -e "
            const coverage = require('./coverage/coverage-summary.json');
            console.log(coverage.total.lines.pct);
        ")
        
        COVERAGE_FUNCTIONS=$(node -e "
            const coverage = require('./coverage/coverage-summary.json');
            console.log(coverage.total.functions.pct);
        ")
        
        COVERAGE_BRANCHES=$(node -e "
            const coverage = require('./coverage/coverage-summary.json');
            console.log(coverage.total.branches.pct);
        ")
        
        COVERAGE_STATEMENTS=$(node -e "
            const coverage = require('./coverage/coverage-summary.json');
            console.log(coverage.total.statements.pct);
        ")
        
        print_status "INFO" "Coverage Results:"
        print_status "INFO" "  Lines: ${COVERAGE_LINES}%"
        print_status "INFO" "  Functions: ${COVERAGE_FUNCTIONS}%"
        print_status "INFO" "  Branches: ${COVERAGE_BRANCHES}%"
        print_status "INFO" "  Statements: ${COVERAGE_STATEMENTS}%"
        
        # Check if all coverage types meet 100% threshold
        if (( $(echo "$COVERAGE_LINES >= 100" | bc -l) )) && \
           (( $(echo "$COVERAGE_FUNCTIONS >= 100" | bc -l) )) && \
           (( $(echo "$COVERAGE_BRANCHES >= 100" | bc -l) )) && \
           (( $(echo "$COVERAGE_STATEMENTS >= 100" | bc -l) )); then
            COVERAGE_TARGET_MET=true
            print_status "SUCCESS" "100% test coverage achieved! 🎉"
        else
            print_status "ERROR" "Coverage target of 100% not met"
            
            # Show which areas need improvement
            if (( $(echo "$COVERAGE_LINES < 100" | bc -l) )); then
                print_status "WARNING" "Line coverage needs improvement: ${COVERAGE_LINES}%"
            fi
            if (( $(echo "$COVERAGE_FUNCTIONS < 100" | bc -l) )); then
                print_status "WARNING" "Function coverage needs improvement: ${COVERAGE_FUNCTIONS}%"
            fi
            if (( $(echo "$COVERAGE_BRANCHES < 100" | bc -l) )); then
                print_status "WARNING" "Branch coverage needs improvement: ${COVERAGE_BRANCHES}%"
            fi
            if (( $(echo "$COVERAGE_STATEMENTS < 100" | bc -l) )); then
                print_status "WARNING" "Statement coverage needs improvement: ${COVERAGE_STATEMENTS}%"
            fi
        fi
    else
        print_status "ERROR" "Coverage summary not found"
    fi
}

# Function to generate test report
generate_test_report() {
    print_status "INFO" "Generating comprehensive test report..."
    
    # Create report directory
    mkdir -p reports
    
    # Generate HTML report
    cat > reports/test-report.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TRADEAI v2.0 - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background: #e8f5e8; border-color: #4caf50; }
        .error { background: #ffeaea; border-color: #f44336; }
        .warning { background: #fff3cd; border-color: #ffc107; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f5f5f5; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TRADEAI v2.0 - Comprehensive Test Report</h1>
        <p>Generated on: $(date)</p>
    </div>
    
    <div class="section $([ "$UNIT_TESTS_PASSED" = true ] && echo "success" || echo "error")">
        <h2>Unit Tests</h2>
        <p>Status: $([ "$UNIT_TESTS_PASSED" = true ] && echo "✅ PASSED" || echo "❌ FAILED")</p>
    </div>
    
    <div class="section $([ "$INTEGRATION_TESTS_PASSED" = true ] && echo "success" || echo "error")">
        <h2>Integration Tests</h2>
        <p>Status: $([ "$INTEGRATION_TESTS_PASSED" = true ] && echo "✅ PASSED" || echo "❌ FAILED")</p>
    </div>
    
    <div class="section $([ "$E2E_TESTS_PASSED" = true ] && echo "success" || echo "error")">
        <h2>End-to-End Tests</h2>
        <p>Status: $([ "$E2E_TESTS_PASSED" = true ] && echo "✅ PASSED" || echo "❌ FAILED")</p>
    </div>
    
    <div class="section $([ "$COVERAGE_TARGET_MET" = true ] && echo "success" || echo "error")">
        <h2>Test Coverage</h2>
        <p>Target: 100% coverage across all metrics</p>
        <p>Status: $([ "$COVERAGE_TARGET_MET" = true ] && echo "✅ TARGET MET" || echo "❌ TARGET NOT MET")</p>
        <div class="metric">Lines: ${COVERAGE_LINES:-0}%</div>
        <div class="metric">Functions: ${COVERAGE_FUNCTIONS:-0}%</div>
        <div class="metric">Branches: ${COVERAGE_BRANCHES:-0}%</div>
        <div class="metric">Statements: ${COVERAGE_STATEMENTS:-0}%</div>
    </div>
</body>
</html>
EOF
    
    print_status "SUCCESS" "Test report generated: reports/test-report.html"
}

# Function to cleanup
cleanup() {
    print_status "INFO" "Cleaning up test environment..."
    
    # Stop any running containers
    docker-compose -f docker-compose.test.yml down > /dev/null 2>&1 || true
    
    # Clean up temporary files
    rm -f *.log
    
    print_status "SUCCESS" "Cleanup completed"
}

# Main execution
main() {
    # Setup trap for cleanup
    trap cleanup EXIT
    
    print_status "INFO" "Starting comprehensive test suite execution..."
    
    # Setup environment
    setup_test_environment
    
    # Run all test suites
    run_unit_tests
    run_integration_tests
    run_e2e_tests
    
    # Optional tests (don't fail the build)
    run_performance_tests || true
    run_security_tests || true
    
    # Validate coverage
    validate_coverage
    
    # Generate report
    generate_test_report
    
    # Final status
    echo ""
    echo "=================================================================="
    print_status "INFO" "Test Suite Execution Summary:"
    echo "=================================================================="
    
    print_status "$([ "$UNIT_TESTS_PASSED" = true ] && echo "SUCCESS" || echo "ERROR")" "Unit Tests: $([ "$UNIT_TESTS_PASSED" = true ] && echo "PASSED" || echo "FAILED")"
    print_status "$([ "$INTEGRATION_TESTS_PASSED" = true ] && echo "SUCCESS" || echo "ERROR")" "Integration Tests: $([ "$INTEGRATION_TESTS_PASSED" = true ] && echo "PASSED" || echo "FAILED")"
    print_status "$([ "$E2E_TESTS_PASSED" = true ] && echo "SUCCESS" || echo "ERROR")" "E2E Tests: $([ "$E2E_TESTS_PASSED" = true ] && echo "PASSED" || echo "FAILED")"
    print_status "$([ "$COVERAGE_TARGET_MET" = true ] && echo "SUCCESS" || echo "ERROR")" "100% Coverage: $([ "$COVERAGE_TARGET_MET" = true ] && echo "ACHIEVED" || echo "NOT ACHIEVED")"
    
    echo ""
    
    # Overall result
    if [ "$UNIT_TESTS_PASSED" = true ] && [ "$INTEGRATION_TESTS_PASSED" = true ] && [ "$E2E_TESTS_PASSED" = true ] && [ "$COVERAGE_TARGET_MET" = true ]; then
        print_status "SUCCESS" "🎉 ALL TESTS PASSED WITH 100% COVERAGE! TRADEAI v2.0 IS READY FOR PRODUCTION! 🎉"
        exit 0
    else
        print_status "ERROR" "❌ Some tests failed or coverage target not met. Please review and fix issues."
        exit 1
    fi
}

# Run main function
main "$@"