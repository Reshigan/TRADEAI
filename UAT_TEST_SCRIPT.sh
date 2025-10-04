#!/bin/bash

# TradeAI System - Comprehensive User Acceptance Test Script
# Date: 2025-10-03
# Purpose: Critical UAT testing of all system components

set -o pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

# Test results log
TEST_LOG="/tmp/uat_test_results.json"
echo "[]" > $TEST_LOG

# Base URL
BASE_URL="http://localhost:5002"

# Test credentials
ADMIN_EMAIL="admin@tradeai.com"
ADMIN_PASSWORD="Admin@123"
TENANT_ID="68df932521476c523df40bb1"

# Function to log test results
log_test() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    local response="$4"
    
    echo "{\"test\": \"$test_name\", \"status\": \"$status\", \"message\": \"$message\", \"timestamp\": \"$(date -Iseconds)\"}" | jq -s '. + input' $TEST_LOG > /tmp/uat_test_results_tmp.json && mv /tmp/uat_test_results_tmp.json $TEST_LOG
}

# Function to print test header
print_test_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Function to print test result
print_test_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name - $message"
        ((TESTS_PASSED++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗ FAIL${NC}: $test_name - $message"
        ((TESTS_FAILED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: $test_name - $message"
        ((TESTS_WARNING++))
    fi
}

# Function to make authenticated API call
api_call() {
    local method="$1"
    local endpoint="$2"
    local token="$3"
    local data="$4"
    
    if [ -z "$data" ]; then
        curl -s -X "$method" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json"
    else
        curl -s -X "$method" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

#
# ═══════════════════════════════════════════════════════════
# UAT TEST 1: AUTHENTICATION AND AUTHORIZATION
# ═══════════════════════════════════════════════════════════
#

run_auth_tests() {
    print_test_header "UAT Test 1: Authentication and Authorization"
    
    # Test 1.1: Health check
    echo "Test 1.1: Health check endpoint..."
    response=$(curl -s "$BASE_URL/api/health")
    if echo "$response" | jq -e '.status == "OK"' > /dev/null 2>&1; then
        print_test_result "Health Check" "PASS" "Server is running and healthy"
        log_test "Health Check" "PASS" "Server is running and healthy" "$response"
    else
        print_test_result "Health Check" "FAIL" "Server health check failed"
        log_test "Health Check" "FAIL" "Server health check failed" "$response"
    fi
    
    # Test 1.2: Login with valid credentials
    echo "Test 1.2: Login with valid credentials..."
    response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    TOKEN=$(echo "$response" | jq -r '.token // empty')
    
    if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        print_test_result "Login - Valid Credentials" "PASS" "Successfully logged in, received JWT token"
        log_test "Login - Valid Credentials" "PASS" "Successfully logged in" "$response"
        
        # Verify token contains tenantId
        echo "Test 1.2a: Verify JWT token contains tenantId..."
        decoded_payload=$(echo "$TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null)
        if echo "$decoded_payload" | jq -e '.tenantId' > /dev/null 2>&1; then
            tenant_id=$(echo "$decoded_payload" | jq -r '.tenantId')
            print_test_result "JWT Token - tenantId" "PASS" "Token contains tenantId: $tenant_id"
            log_test "JWT Token - tenantId" "PASS" "Token contains tenantId: $tenant_id" "$decoded_payload"
        else
            print_test_result "JWT Token - tenantId" "FAIL" "Token missing tenantId field"
            log_test "JWT Token - tenantId" "FAIL" "Token missing tenantId field" "$decoded_payload"
        fi
    else
        print_test_result "Login - Valid Credentials" "FAIL" "Login failed or no token received"
        log_test "Login - Valid Credentials" "FAIL" "Login failed" "$response"
        return 1
    fi
    
    # Test 1.3: Login with invalid credentials
    echo "Test 1.3: Login with invalid credentials..."
    response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"invalid@test.com","password":"wrongpassword"}')
    
    if echo "$response" | jq -e '.success == false' > /dev/null 2>&1; then
        print_test_result "Login - Invalid Credentials" "PASS" "Correctly rejected invalid credentials"
        log_test "Login - Invalid Credentials" "PASS" "Correctly rejected" "$response"
    else
        print_test_result "Login - Invalid Credentials" "FAIL" "Should reject invalid credentials"
        log_test "Login - Invalid Credentials" "FAIL" "Should reject invalid credentials" "$response"
    fi
    
    # Test 1.4: Access protected route without token
    echo "Test 1.4: Access protected route without token..."
    response=$(curl -s "$BASE_URL/api/users/me")
    
    if echo "$response" | jq -e '.success == false' > /dev/null 2>&1 || echo "$response" | grep -q "error\|unauthorized" 2>/dev/null; then
        print_test_result "Protected Route - No Token" "PASS" "Correctly denied access without token"
        log_test "Protected Route - No Token" "PASS" "Correctly denied access" "$response"
    else
        print_test_result "Protected Route - No Token" "FAIL" "Should deny access without token"
        log_test "Protected Route - No Token" "FAIL" "Should deny access" "$response"
    fi
    
    # Test 1.5: Access protected route with valid token
    echo "Test 1.5: Access protected route with valid token..."
    response=$(api_call "GET" "/api/users/me" "$TOKEN")
    
    if echo "$response" | jq -e '.success == true and .data._id' > /dev/null 2>&1; then
        user_email=$(echo "$response" | jq -r '.data.email')
        print_test_result "Protected Route - Valid Token" "PASS" "Successfully accessed protected route, user: $user_email"
        log_test "Protected Route - Valid Token" "PASS" "Successfully accessed protected route" "$response"
    else
        print_test_result "Protected Route - Valid Token" "FAIL" "Failed to access protected route with valid token"
        log_test "Protected Route - Valid Token" "FAIL" "Failed to access protected route" "$response"
    fi
    
    # Test 1.6: Role-based access control - Admin accessing users list
    echo "Test 1.6: RBAC - Admin accessing users list..."
    response=$(api_call "GET" "/api/users" "$TOKEN")
    
    if echo "$response" | jq -e '.success == true and .data' > /dev/null 2>&1; then
        user_count=$(echo "$response" | jq '.count')
        print_test_result "RBAC - Admin Access" "PASS" "Admin successfully accessed users list ($user_count users)"
        log_test "RBAC - Admin Access" "PASS" "Admin accessed users list" "$response"
    else
        print_test_result "RBAC - Admin Access" "FAIL" "Admin failed to access users list"
        log_test "RBAC - Admin Access" "FAIL" "Admin failed to access users list" "$response"
    fi
    
    # Test 1.7: Token expiration handling
    echo "Test 1.7: Token expiration handling..."
    expired_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid"
    response=$(api_call "GET" "/api/users/me" "$expired_token")
    
    if echo "$response" | jq -e '.success == false' > /dev/null 2>&1 || echo "$response" | grep -q "error\|expired\|invalid" 2>/dev/null; then
        print_test_result "Token Expiration" "PASS" "Correctly rejected expired token"
        log_test "Token Expiration" "PASS" "Correctly rejected expired token" "$response"
    else
        print_test_result "Token Expiration" "WARNING" "Token expiration handling unclear"
        log_test "Token Expiration" "WARNING" "Token expiration handling unclear" "$response"
    fi
    
    echo ""
    echo "Authentication and Authorization tests completed."
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC} | ${RED}Failed: $TESTS_FAILED${NC} | ${YELLOW}Warnings: $TESTS_WARNING${NC}"
}

#
# ═══════════════════════════════════════════════════════════
# UAT TEST 2: TENANT ISOLATION
# ═══════════════════════════════════════════════════════════
#

run_tenant_tests() {
    print_test_header "UAT Test 2: Tenant Isolation and Multi-tenancy"
    
    # Test 2.1: Verify tenant context is set
    echo "Test 2.1: Verify tenant context is set on protected routes..."
    response=$(api_call "GET" "/api/users/me" "$TOKEN")
    
    if echo "$response" | jq -e '.data.tenantId' > /dev/null 2>&1; then
        tenant_id=$(echo "$response" | jq -r '.data.tenantId')
        print_test_result "Tenant Context" "PASS" "User has tenant context: $tenant_id"
        log_test "Tenant Context" "PASS" "Tenant context present" "$response"
    else
        print_test_result "Tenant Context" "FAIL" "User missing tenant context"
        log_test "Tenant Context" "FAIL" "User missing tenant context" "$response"
    fi
    
    # Test 2.2: Verify tenant isolation in queries
    echo "Test 2.2: Verify users are filtered by tenant..."
    response=$(api_call "GET" "/api/users" "$TOKEN")
    
    if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
        # Check all users have the same tenantId
        unique_tenants=$(echo "$response" | jq -r '.data[].tenantId' | sort -u | wc -l)
        if [ "$unique_tenants" = "1" ]; then
            print_test_result "Tenant Isolation - Users" "PASS" "All users belong to same tenant"
            log_test "Tenant Isolation - Users" "PASS" "All users belong to same tenant" "$response"
        else
            print_test_result "Tenant Isolation - Users" "FAIL" "Users from multiple tenants returned"
            log_test "Tenant Isolation - Users" "FAIL" "Users from multiple tenants" "$response"
        fi
    else
        print_test_result "Tenant Isolation - Users" "WARNING" "Could not verify tenant isolation"
        log_test "Tenant Isolation - Users" "WARNING" "Could not verify" "$response"
    fi
    
    # Test 2.3: Attempt to access data from different tenant (should fail)
    echo "Test 2.3: Attempt to access data from different tenant..."
    fake_tenant_id="507f1f77bcf86cd799439999"
    response=$(curl -s "$BASE_URL/api/users/me" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-Tenant-ID: $fake_tenant_id")
    
    # This should still return data for the token's tenant, not the header tenant
    if echo "$response" | jq -e '.data.tenantId' > /dev/null 2>&1; then
        returned_tenant=$(echo "$response" | jq -r '.data.tenantId')
        if [ "$returned_tenant" != "$fake_tenant_id" ]; then
            print_test_result "Tenant Isolation - Cross-tenant Access" "PASS" "Cannot access data from different tenant"
            log_test "Tenant Isolation - Cross-tenant Access" "PASS" "Cross-tenant access denied" "$response"
        else
            print_test_result "Tenant Isolation - Cross-tenant Access" "FAIL" "Cross-tenant access allowed"
            log_test "Tenant Isolation - Cross-tenant Access" "FAIL" "Cross-tenant access allowed" "$response"
        fi
    else
        print_test_result "Tenant Isolation - Cross-tenant Access" "WARNING" "Could not verify cross-tenant isolation"
        log_test "Tenant Isolation - Cross-tenant Access" "WARNING" "Could not verify" "$response"
    fi
    
    echo ""
    echo "Tenant Isolation tests completed."
}

#
# ═══════════════════════════════════════════════════════════
# UAT TEST 3: USER MANAGEMENT
# ═══════════════════════════════════════════════════════════
#

run_user_management_tests() {
    print_test_header "UAT Test 3: User Management"
    
    # Test 3.1: List all users
    echo "Test 3.1: List all users..."
    response=$(api_call "GET" "/api/users" "$TOKEN")
    
    if echo "$response" | jq -e '.success == true and .data' > /dev/null 2>&1; then
        user_count=$(echo "$response" | jq '.count')
        print_test_result "User Management - List Users" "PASS" "Successfully retrieved $user_count users"
        log_test "User Management - List Users" "PASS" "Retrieved users" "$response"
    else
        print_test_result "User Management - List Users" "FAIL" "Failed to retrieve users"
        log_test "User Management - List Users" "FAIL" "Failed to retrieve users" "$response"
    fi
    
    # Test 3.2: Get specific user by ID
    echo "Test 3.2: Get specific user by ID..."
    if [ ! -z "$response" ]; then
        first_user_id=$(echo "$response" | jq -r '.data[0]._id // empty')
        if [ ! -z "$first_user_id" ]; then
            response=$(api_call "GET" "/api/users/$first_user_id" "$TOKEN")
            if echo "$response" | jq -e '.success == true and .data._id' > /dev/null 2>&1; then
                print_test_result "User Management - Get User by ID" "PASS" "Successfully retrieved user details"
                log_test "User Management - Get User by ID" "PASS" "Retrieved user details" "$response"
            else
                print_test_result "User Management - Get User by ID" "FAIL" "Failed to retrieve user details"
                log_test "User Management - Get User by ID" "FAIL" "Failed to retrieve user" "$response"
            fi
        else
            print_test_result "User Management - Get User by ID" "WARNING" "No user ID available for testing"
        fi
    fi
    
    # Test 3.3: Create new user
    echo "Test 3.3: Create new user..."
    new_user_data='{
        "employeeId": "EMP'$(date +%s)'",
        "email": "test.'$(date +%s)'@tradeai.com",
        "password": "Test@123",
        "firstName": "Test",
        "lastName": "User",
        "role": "user",
        "department": "sales"
    }'
    
    response=$(api_call "POST" "/api/users" "$TOKEN" "$new_user_data")
    
    if echo "$response" | jq -e '.success == true and .data._id' > /dev/null 2>&1; then
        NEW_USER_ID=$(echo "$response" | jq -r '.data._id')
        print_test_result "User Management - Create User" "PASS" "Successfully created new user: $NEW_USER_ID"
        log_test "User Management - Create User" "PASS" "Created new user" "$response"
    else
        print_test_result "User Management - Create User" "FAIL" "Failed to create new user"
        log_test "User Management - Create User" "FAIL" "Failed to create user" "$response"
        NEW_USER_ID=""
    fi
    
    # Test 3.4: Update user
    if [ ! -z "$NEW_USER_ID" ]; then
        echo "Test 3.4: Update user..."
        update_data='{"firstName": "Updated", "lastName": "TestUser"}'
        response=$(api_call "PUT" "/api/users/$NEW_USER_ID" "$TOKEN" "$update_data")
        
        if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
            print_test_result "User Management - Update User" "PASS" "Successfully updated user"
            log_test "User Management - Update User" "PASS" "Updated user" "$response"
        else
            print_test_result "User Management - Update User" "FAIL" "Failed to update user"
            log_test "User Management - Update User" "FAIL" "Failed to update user" "$response"
        fi
    fi
    
    # Test 3.5: Validate email uniqueness
    echo "Test 3.5: Validate email uniqueness..."
    duplicate_email_data='{
        "employeeId": "EMP'$(date +%s)'",
        "email": "'$ADMIN_EMAIL'",
        "password": "Test@123",
        "firstName": "Duplicate",
        "lastName": "User",
        "role": "user",
        "department": "sales"
    }'
    
    response=$(api_call "POST" "/api/users" "$TOKEN" "$duplicate_email_data")
    
    if echo "$response" | jq -e '.success == false' > /dev/null 2>&1; then
        print_test_result "User Management - Email Uniqueness" "PASS" "Correctly rejected duplicate email"
        log_test "User Management - Email Uniqueness" "PASS" "Duplicate email rejected" "$response"
    else
        print_test_result "User Management - Email Uniqueness" "FAIL" "Should reject duplicate email"
        log_test "User Management - Email Uniqueness" "FAIL" "Duplicate email not rejected" "$response"
    fi
    
    # Test 3.6: Delete user (soft delete)
    if [ ! -z "$NEW_USER_ID" ]; then
        echo "Test 3.6: Delete user (soft delete)..."
        response=$(api_call "DELETE" "/api/users/$NEW_USER_ID" "$TOKEN")
        
        if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
            print_test_result "User Management - Delete User" "PASS" "Successfully deleted user"
            log_test "User Management - Delete User" "PASS" "Deleted user" "$response"
            
            # Verify user is soft deleted
            response=$(api_call "GET" "/api/users/$NEW_USER_ID" "$TOKEN")
            if echo "$response" | jq -e '.success == false' > /dev/null 2>&1 || \
               echo "$response" | jq -e '.data.isDeleted == true' > /dev/null 2>&1; then
                print_test_result "User Management - Soft Delete Verification" "PASS" "User correctly marked as deleted"
                log_test "User Management - Soft Delete Verification" "PASS" "Soft delete verified" "$response"
            else
                print_test_result "User Management - Soft Delete Verification" "WARNING" "User still accessible after deletion"
                log_test "User Management - Soft Delete Verification" "WARNING" "Soft delete unclear" "$response"
            fi
        else
            print_test_result "User Management - Delete User" "FAIL" "Failed to delete user"
            log_test "User Management - Delete User" "FAIL" "Failed to delete user" "$response"
        fi
    fi
    
    echo ""
    echo "User Management tests completed."
}

#
# ═══════════════════════════════════════════════════════════
# UAT TEST 4: CUSTOMER MANAGEMENT
# ═══════════════════════════════════════════════════════════
#

run_customer_management_tests() {
    print_test_header "UAT Test 4: Customer Management"
    
    # Test 4.1: List all customers
    echo "Test 4.1: List all customers..."
    response=$(api_call "GET" "/api/customers" "$TOKEN")
    
    if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
        customer_count=$(echo "$response" | jq '.data | length')
        print_test_result "Customer Management - List Customers" "PASS" "Successfully retrieved $customer_count customers"
        log_test "Customer Management - List Customers" "PASS" "Retrieved customers" "$response"
    else
        print_test_result "Customer Management - List Customers" "WARNING" "No customers or endpoint not available"
        log_test "Customer Management - List Customers" "WARNING" "Could not retrieve customers" "$response"
    fi
    
    # Test 4.2: Create new customer
    echo "Test 4.2: Create new customer..."
    new_customer_data='{
        "customerCode": "CUST'$(date +%s)'",
        "name": "Test Customer Ltd",
        "type": "retail",
        "status": "active",
        "address": {
            "street": "123 Test Street",
            "city": "Johannesburg",
            "province": "Gauteng",
            "postalCode": "2000",
            "country": "South Africa"
        },
        "contact": {
            "primaryContact": "John Doe",
            "email": "john@testcustomer.com",
            "phone": "+27123456789"
        }
    }'
    
    response=$(api_call "POST" "/api/customers" "$TOKEN" "$new_customer_data")
    
    if echo "$response" | jq -e '.success == true and .data._id' > /dev/null 2>&1; then
        NEW_CUSTOMER_ID=$(echo "$response" | jq -r '.data._id')
        print_test_result "Customer Management - Create Customer" "PASS" "Successfully created customer: $NEW_CUSTOMER_ID"
        log_test "Customer Management - Create Customer" "PASS" "Created customer" "$response"
    else
        print_test_result "Customer Management - Create Customer" "WARNING" "Could not create customer"
        log_test "Customer Management - Create Customer" "WARNING" "Could not create customer" "$response"
        NEW_CUSTOMER_ID=""
    fi
    
    # Test 4.3: Get customer by ID
    if [ ! -z "$NEW_CUSTOMER_ID" ]; then
        echo "Test 4.3: Get customer by ID..."
        response=$(api_call "GET" "/api/customers/$NEW_CUSTOMER_ID" "$TOKEN")
        
        if echo "$response" | jq -e '.success == true and .data._id' > /dev/null 2>&1; then
            print_test_result "Customer Management - Get Customer" "PASS" "Successfully retrieved customer"
            log_test "Customer Management - Get Customer" "PASS" "Retrieved customer" "$response"
        else
            print_test_result "Customer Management - Get Customer" "FAIL" "Failed to retrieve customer"
            log_test "Customer Management - Get Customer" "FAIL" "Failed to retrieve customer" "$response"
        fi
    fi
    
    # Test 4.4: Update customer
    if [ ! -z "$NEW_CUSTOMER_ID" ]; then
        echo "Test 4.4: Update customer..."
        update_data='{"status": "inactive"}'
        response=$(api_call "PUT" "/api/customers/$NEW_CUSTOMER_ID" "$TOKEN" "$update_data")
        
        if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
            print_test_result "Customer Management - Update Customer" "PASS" "Successfully updated customer"
            log_test "Customer Management - Update Customer" "PASS" "Updated customer" "$response"
        else
            print_test_result "Customer Management - Update Customer" "WARNING" "Could not update customer"
            log_test "Customer Management - Update Customer" "WARNING" "Could not update customer" "$response"
        fi
    fi
    
    # Test 4.5: Search customers
    echo "Test 4.5: Search customers..."
    response=$(api_call "GET" "/api/customers?search=Test" "$TOKEN")
    
    if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
        print_test_result "Customer Management - Search" "PASS" "Search functionality working"
        log_test "Customer Management - Search" "PASS" "Search working" "$response"
    else
        print_test_result "Customer Management - Search" "WARNING" "Search not available or failed"
        log_test "Customer Management - Search" "WARNING" "Search unclear" "$response"
    fi
    
    # Test 4.6: Delete customer
    if [ ! -z "$NEW_CUSTOMER_ID" ]; then
        echo "Test 4.6: Delete customer..."
        response=$(api_call "DELETE" "/api/customers/$NEW_CUSTOMER_ID" "$TOKEN")
        
        if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
            print_test_result "Customer Management - Delete" "PASS" "Successfully deleted customer"
            log_test "Customer Management - Delete" "PASS" "Deleted customer" "$response"
        else
            print_test_result "Customer Management - Delete" "WARNING" "Could not delete customer"
            log_test "Customer Management - Delete" "WARNING" "Could not delete customer" "$response"
        fi
    fi
    
    echo ""
    echo "Customer Management tests completed."
}

#
# ═══════════════════════════════════════════════════════════
# UAT TEST 5: DATA VALIDATION AND ERROR HANDLING
# ═══════════════════════════════════════════════════════════
#

run_validation_tests() {
    print_test_header "UAT Test 5: Data Validation and Error Handling"
    
    # Test 5.1: Invalid email format
    echo "Test 5.1: Validation - Invalid email format..."
    invalid_user_data='{
        "employeeId": "EMP999",
        "email": "invalid-email",
        "password": "Test@123",
        "firstName": "Test",
        "lastName": "User",
        "role": "user"
    }'
    
    response=$(api_call "POST" "/api/users" "$TOKEN" "$invalid_user_data")
    
    if echo "$response" | jq -e '.success == false' > /dev/null 2>&1; then
        print_test_result "Validation - Invalid Email" "PASS" "Correctly rejected invalid email"
        log_test "Validation - Invalid Email" "PASS" "Invalid email rejected" "$response"
    else
        print_test_result "Validation - Invalid Email" "FAIL" "Should reject invalid email format"
        log_test "Validation - Invalid Email" "FAIL" "Invalid email not rejected" "$response"
    fi
    
    # Test 5.2: Missing required fields
    echo "Test 5.2: Validation - Missing required fields..."
    incomplete_user_data='{"email": "test@test.com"}'
    
    response=$(api_call "POST" "/api/users" "$TOKEN" "$incomplete_user_data")
    
    if echo "$response" | jq -e '.success == false' > /dev/null 2>&1; then
        print_test_result "Validation - Missing Fields" "PASS" "Correctly rejected incomplete data"
        log_test "Validation - Missing Fields" "PASS" "Incomplete data rejected" "$response"
    else
        print_test_result "Validation - Missing Fields" "FAIL" "Should reject incomplete data"
        log_test "Validation - Missing Fields" "FAIL" "Incomplete data not rejected" "$response"
    fi
    
    # Test 5.3: Weak password validation
    echo "Test 5.3: Validation - Weak password..."
    weak_password_data='{
        "employeeId": "EMP998",
        "email": "test.'$(date +%s)'@test.com",
        "password": "123",
        "firstName": "Test",
        "lastName": "User",
        "role": "user"
    }'
    
    response=$(api_call "POST" "/api/users" "$TOKEN" "$weak_password_data")
    
    if echo "$response" | jq -e '.success == false' > /dev/null 2>&1; then
        print_test_result "Validation - Weak Password" "PASS" "Correctly rejected weak password"
        log_test "Validation - Weak Password" "PASS" "Weak password rejected" "$response"
    else
        print_test_result "Validation - Weak Password" "WARNING" "Weak password validation might be missing"
        log_test "Validation - Weak Password" "WARNING" "Weak password not rejected" "$response"
    fi
    
    # Test 5.4: Invalid MongoDB ObjectID
    echo "Test 5.4: Error Handling - Invalid ObjectID..."
    response=$(api_call "GET" "/api/users/invalid-id" "$TOKEN")
    
    if echo "$response" | jq -e '.success == false' > /dev/null 2>&1; then
        print_test_result "Error Handling - Invalid ID" "PASS" "Correctly handled invalid ID"
        log_test "Error Handling - Invalid ID" "PASS" "Invalid ID handled" "$response"
    else
        print_test_result "Error Handling - Invalid ID" "WARNING" "Invalid ID handling unclear"
        log_test "Error Handling - Invalid ID" "WARNING" "Invalid ID handling unclear" "$response"
    fi
    
    # Test 5.5: 404 Not Found
    echo "Test 5.5: Error Handling - Resource not found..."
    fake_id="507f1f77bcf86cd799439999"
    response=$(api_call "GET" "/api/users/$fake_id" "$TOKEN")
    
    if echo "$response" | jq -e '.success == false' > /dev/null 2>&1; then
        print_test_result "Error Handling - 404" "PASS" "Correctly returned not found error"
        log_test "Error Handling - 404" "PASS" "404 handled correctly" "$response"
    else
        print_test_result "Error Handling - 404" "WARNING" "404 error handling unclear"
        log_test "Error Handling - 404" "WARNING" "404 handling unclear" "$response"
    fi
    
    echo ""
    echo "Data Validation and Error Handling tests completed."
}

#
# ═══════════════════════════════════════════════════════════
# UAT TEST 6: API PERFORMANCE AND RELIABILITY
# ═══════════════════════════════════════════════════════════
#

run_performance_tests() {
    print_test_header "UAT Test 6: API Performance and Reliability"
    
    # Test 6.1: Response time - Health check
    echo "Test 6.1: Performance - Health check response time..."
    start_time=$(date +%s%3N)
    response=$(curl -s "$BASE_URL/api/health")
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    if [ $response_time -lt 1000 ]; then
        print_test_result "Performance - Health Check" "PASS" "Response time: ${response_time}ms (< 1s)"
        log_test "Performance - Health Check" "PASS" "Response time: ${response_time}ms" "$response"
    else
        print_test_result "Performance - Health Check" "WARNING" "Response time: ${response_time}ms (>= 1s)"
        log_test "Performance - Health Check" "WARNING" "Slow response: ${response_time}ms" "$response"
    fi
    
    # Test 6.2: Response time - Login
    echo "Test 6.2: Performance - Login response time..."
    start_time=$(date +%s%3N)
    response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    if [ $response_time -lt 2000 ]; then
        print_test_result "Performance - Login" "PASS" "Response time: ${response_time}ms (< 2s)"
        log_test "Performance - Login" "PASS" "Response time: ${response_time}ms" "$response"
    else
        print_test_result "Performance - Login" "WARNING" "Response time: ${response_time}ms (>= 2s)"
        log_test "Performance - Login" "WARNING" "Slow response: ${response_time}ms" "$response"
    fi
    
    # Test 6.3: Response time - List users
    echo "Test 6.3: Performance - List users response time..."
    start_time=$(date +%s%3N)
    response=$(api_call "GET" "/api/users" "$TOKEN")
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    if [ $response_time -lt 2000 ]; then
        print_test_result "Performance - List Users" "PASS" "Response time: ${response_time}ms (< 2s)"
        log_test "Performance - List Users" "PASS" "Response time: ${response_time}ms" "$response"
    else
        print_test_result "Performance - List Users" "WARNING" "Response time: ${response_time}ms (>= 2s)"
        log_test "Performance - List Users" "WARNING" "Slow response: ${response_time}ms" "$response"
    fi
    
    # Test 6.4: Concurrent requests handling
    echo "Test 6.4: Performance - Concurrent requests (10 parallel)..."
    start_time=$(date +%s%3N)
    for i in {1..10}; do
        curl -s "$BASE_URL/api/health" > /dev/null &
    done
    wait
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    if [ $response_time -lt 3000 ]; then
        print_test_result "Performance - Concurrent Requests" "PASS" "10 concurrent requests completed in ${response_time}ms"
        log_test "Performance - Concurrent Requests" "PASS" "Concurrent handling: ${response_time}ms" ""
    else
        print_test_result "Performance - Concurrent Requests" "WARNING" "10 concurrent requests took ${response_time}ms"
        log_test "Performance - Concurrent Requests" "WARNING" "Slow concurrent handling: ${response_time}ms" ""
    fi
    
    echo ""
    echo "API Performance and Reliability tests completed."
}

#
# ═══════════════════════════════════════════════════════════
# GENERATE FINAL REPORT
# ═══════════════════════════════════════════════════════════
#

generate_final_report() {
    print_test_header "UAT Test Results Summary"
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ Tests Passed:   $TESTS_PASSED${NC}"
    echo -e "${RED}✗ Tests Failed:   $TESTS_FAILED${NC}"
    echo -e "${YELLOW}⚠ Warnings:       $TESTS_WARNING${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    
    TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNING))
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    
    echo ""
    echo "Total Tests: $TOTAL_TESTS"
    echo "Success Rate: $SUCCESS_RATE%"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All critical tests passed!${NC}"
    else
        echo -e "${RED}✗ Some tests failed. Please review the results.${NC}"
    fi
    
    echo ""
    echo "Detailed test results saved to: $TEST_LOG"
    echo ""
}

#
# ═══════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════
#

main() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════════"
    echo "  TradeAI System - Comprehensive User Acceptance Testing  "
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')                      "
    echo "═══════════════════════════════════════════════════════════"
    echo -e "${NC}"
    
    # Run all test suites
    run_auth_tests
    run_tenant_tests
    run_user_management_tests
    run_customer_management_tests
    run_validation_tests
    run_performance_tests
    
    # Generate final report
    generate_final_report
}

# Execute main function
main
