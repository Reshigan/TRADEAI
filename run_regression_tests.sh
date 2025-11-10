#!/bin/bash
# TradeAI Automated Regression Test Suite

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║        TradeAI Automated Regression Test Suite                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Started: $(date)"
echo ""

# Configuration
RESULTS_DIR="test_results_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Test 1: Quick Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Quick Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
bash test_live_server.sh > "$RESULTS_DIR/health_check.log" 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Health Check PASSED"
else
    echo "❌ Health Check FAILED"
fi
echo ""

# Test 2: Functional Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Full System Functional Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
timeout 300 python full_system_functional_test.py > "$RESULTS_DIR/functional_test.log" 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Functional Test PASSED"
else
    echo "❌ Functional Test FAILED"
fi
echo ""

# Test 3: CRUD Operations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  CRUD Operations Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
timeout 600 python complete_crud_test_all_modules.py > "$RESULTS_DIR/crud_test.log" 2>&1
if [ $? -eq 0 ]; then
    echo "✅ CRUD Test PASSED"
else
    echo "❌ CRUD Test FAILED"
fi
echo ""

# Test 4: Performance Test
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Performance Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
# Quick performance check
START_TIME=$(date +%s%3N)
curl -s -o /dev/null -w "%{time_total}" https://tradeai.gonxt.tech > "$RESULTS_DIR/performance.log"
END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))
echo "Page load time: ${DURATION}ms"
if [ $DURATION -lt 2000 ]; then
    echo "✅ Performance Test PASSED"
else
    echo "❌ Performance Test FAILED"
fi
echo ""

# Generate Summary Report
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Count results
PASSED=$(grep -c "✅" "$RESULTS_DIR/"*.log 2>/dev/null || echo 0)
FAILED=$(grep -c "❌" "$RESULTS_DIR/"*.log 2>/dev/null || echo 0)
TOTAL=$((PASSED + FAILED))

echo "Total Tests: $TOTAL"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""
echo "Results saved to: $RESULTS_DIR"
echo ""
echo "Completed: $(date)"

# Exit with appropriate code
if [ $FAILED -eq 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ ALL TESTS PASSED"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ SOME TESTS FAILED - CHECK LOGS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi
