#!/bin/bash

# Quick Test Script for Trade Monitoring System
# This script tests the basic functionality without needing a token

echo "=========================================="
echo "Trade Monitoring System - Quick Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Server Health Check
echo "Test 1: Checking server health..."
HEALTH=$(curl -s http://localhost:8901/)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Server is running${NC}"
    echo "  Response: $(echo $HEALTH | jq -r '.message' 2>/dev/null || echo $HEALTH)"
else
    echo -e "${RED}✗ Server is not responding${NC}"
    exit 1
fi
echo ""

# Test 2: Check if monitoring endpoints exist
echo "Test 2: Checking monitoring endpoints..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8901/api/trade/monitors/status)
if [ "$STATUS_CODE" == "401" ] || [ "$STATUS_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Monitor status endpoint exists${NC}"
    echo "  (Returns $STATUS_CODE - authentication required)"
else
    echo -e "${RED}✗ Monitor status endpoint not found (HTTP $STATUS_CODE)${NC}"
fi
echo ""

# Instructions for full testing
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Get your auth token by logging in:"
echo "   ${YELLOW}curl -X POST http://localhost:8901/api/auth/login \\${NC}"
echo "   ${YELLOW}  -H 'Content-Type: application/json' \\${NC}"
echo "   ${YELLOW}  -d '{\"email\":\"your@email.com\",\"password\":\"your_password\"}'${NC}"
echo ""
echo "2. Run the full test suite:"
echo "   ${YELLOW}cd backend/test${NC}"
echo "   ${YELLOW}node testMonitor.js YOUR_AUTH_TOKEN${NC}"
echo ""
echo "3. Or test manually with curl:"
echo "   ${YELLOW}curl http://localhost:8901/api/trade/monitors/status \\${NC}"
echo "   ${YELLOW}  -H 'Authorization: Bearer YOUR_TOKEN'${NC}"
echo ""
echo "=========================================="
echo "Server is ready for testing!"
echo "=========================================="

