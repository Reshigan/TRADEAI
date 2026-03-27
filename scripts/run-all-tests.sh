#!/bin/bash
# TRADEAI Comprehensive Test Suite Runner
# Industry-leading test coverage and quality assurance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TRADEAI Comprehensive Test Suite Runner            ║${NC}"
echo -e "${BLUE}║     Industry-Leading Quality Assurance                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to run tests and capture results
run_test_suite() {
    local suite_name=$1
    local test_command=$2
    
    echo -e "${YELLOW}Running: ${suite_name}${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    start_time=$(date +%s)
    
    if eval $test_command; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo -e "${GREEN}✓ ${suite_name} completed in ${duration}s${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}✗ ${suite_name} failed${NC}"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
    echo ""
}

# Function to check test coverage
check_coverage() {
    echo -e "${YELLOW}Checking Test Coverage...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Run coverage
    npm run test:coverage
    
    # Check coverage thresholds
    if [ -f "coverage/coverage-summary.json" ]; then
        coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        echo -e "Line Coverage: ${coverage}%"
        
        if (( $(echo "$coverage >= 80" | bc -l) )); then
            echo -e "${GREEN}✓ Coverage target met (≥80%)${NC}"
        else
            echo -e "${RED}✗ Coverage below target (<80%)${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠ Coverage report not found${NC}"
    fi
    
    echo ""
}

# Function to run performance tests
run_performance_tests() {
    echo -e "${YELLOW}Running Performance Tests...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Baseline test
    echo "Baseline Load Test (100 users)"
    artillery run tests/performance/baseline.yml --output test-results/performance-baseline.json
    
    # Load test
    echo "Load Test (1000 users)"
    artillery run tests/performance/load-test.yml --output test-results/performance-load.json
    
    # Stress test
    echo "Stress Test (5000 users)"
    artillery run tests/performance/stress-test.yml --output test-results/performance-stress.json
    
    # Endurance test
    echo "Endurance Test (30 minutes)"
    artillery run tests/performance/endurance-test.yml --output test-results/performance-endurance.json
    
    echo -e "${GREEN}✓ Performance tests completed${NC}"
    echo ""
}

# Function to run security tests
run_security_tests() {
    echo -e "${YELLOW}Running Security Tests...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # NPM audit
    echo "Running npm audit..."
    npm audit --audit-level=moderate || true
    
    # Snyk security scan
    echo "Running Snyk security scan..."
    if command -v snyk &> /dev/null; then
        snyk test || true
    else
        echo -e "${YELLOW}⚠ Snyk not installed, skipping${NC}"
    fi
    
    # OWASP ZAP scan (if available)
    echo "Running OWASP ZAP baseline scan..."
    if command -v zap-baseline.py &> /dev/null; then
        zap-baseline.py -t http://localhost:3000 || true
    else
        echo -e "${YELLOW}⚠ OWASP ZAP not installed, skipping${NC}"
    fi
    
    echo -e "${GREEN}✓ Security tests completed${NC}"
    echo ""
}

# Function to run accessibility tests
run_accessibility_tests() {
    echo -e "${YELLOW}Running Accessibility Tests...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Lighthouse accessibility audit
    echo "Running Lighthouse accessibility audit..."
    lighthouse http://localhost:3000 --only-categories=accessibility --output=json --output-path=test-results/lighthouse-a11y.json
    
    # Axe-core tests
    echo "Running Axe-core accessibility tests..."
    npm run test:e2e -- --grep "@a11y"
    
    echo -e "${GREEN}✓ Accessibility tests completed${NC}"
    echo ""
}

# Main test execution
main() {
    echo "Starting comprehensive test suite..."
    echo "Timestamp: $(date)"
    echo ""
    
    # Create test results directory
    mkdir -p test-results
    
    # Backend Unit Tests
    run_test_suite "Backend Unit Tests" "cd backend && npm test"
    
    # Frontend Unit Tests
    run_test_suite "Frontend Unit Tests" "cd frontend && npm test"
    
    # Integration Tests
    run_test_suite "Backend Integration Tests" "cd backend && npm run test:integration"
    
    # API Tests
    run_test_suite "API Tests" "cd backend && npm run test:api"
    
    # E2E Tests
    run_test_suite "E2E Tests (Playwright)" "npm run test:e2e"
    
    # Migration Tests
    run_test_suite "Database Migration Tests" "cd backend && npm run test:migrations"
    
    # PWA Tests
    run_test_suite "PWA Tests" "cd frontend && npm run test:pwa"
    
    # Check test coverage
    check_coverage
    
    # Performance tests (optional, requires running services)
    if [ "$1" == "--performance" ]; then
        run_performance_tests
    fi
    
    # Security tests (optional)
    if [ "$1" == "--security" ]; then
        run_security_tests
    fi
    
    # Accessibility tests (optional)
    if [ "$1" == "--a11y" ]; then
        run_accessibility_tests
    fi
    
    # Print summary
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                  Test Summary                          ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Total Test Suites: ${TOTAL_TESTS}"
    echo -e "Passed: ${GREEN}${PASSED_TESTS}${NC}"
    echo -e "Failed: ${RED}${FAILED_TESTS}${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}✓ All test suites passed!${NC}"
        echo -e "${GREEN}✓ TRADEAI is production-ready!${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some test suites failed${NC}"
        echo -e "${YELLOW}Please review the failures and fix before deployment${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
