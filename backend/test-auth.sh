#!/bin/bash

echo "========================================="
echo "TRADEAI Production Backend - Auth Test"
echo "========================================="
echo ""

BASE_URL="https://localhost:5000"

echo "1. Testing Health Check..."
curl -k -s $BASE_URL/api/health | jq '.status, .features, .database'
echo ""

echo "2. Testing Login with Admin Credentials..."
LOGIN_RESPONSE=$(curl -k -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@trade-ai.com", "password": "Admin@123456"}')

echo "$LOGIN_RESPONSE" | jq '{success, message, user: .data.user}'
echo ""

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.tokens.accessToken')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.tokens.refreshToken')

echo "3. Testing Token Verification..."
curl -k -s $BASE_URL/api/auth/verify \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '{success, valid, user: .data.user}'
echo ""

echo "4. Testing Protected Dashboard Endpoint..."
curl -k -s $BASE_URL/api/analytics/dashboard \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '{success, summary: .data.summary, topCustomers: .data.topCustomers[0:2]}'
echo ""

echo "5. Testing Invalid Password..."
curl -k -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@trade-ai.com", "password": "wrongpassword"}' | jq '{success, error, code}'
echo ""

echo "6. Testing Registration..."
curl -k -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@trade-ai.com",
    "username": "testuser",
    "password": "Test@123456",
    "firstName": "Test",
    "lastName": "User"
  }' | jq '{success, message, user: .data.user}'
echo ""

echo "7. Testing Token Refresh..."
curl -k -s -X POST $BASE_URL/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" | jq '{success, message}'
echo ""

echo "8. Testing Logout..."
curl -k -s -X POST $BASE_URL/api/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '{success, message}'
echo ""

echo "========================================="
echo "Test Complete!"
echo "========================================="
