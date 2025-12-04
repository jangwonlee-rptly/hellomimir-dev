#!/bin/bash
# Test script for backend ingestion

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
CRON_SECRET="${CRON_SECRET:-your-secret}"

echo -e "${YELLOW}Testing hellomimir FastAPI Backend${NC}"
echo "Backend URL: $BACKEND_URL"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}[1/3] Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "$HEALTH_RESPONSE"
    exit 1
fi
echo ""

# Test 2: Status Check
echo -e "${YELLOW}[2/3] Testing status endpoint...${NC}"
STATUS_RESPONSE=$(curl -s "$BACKEND_URL/internal/status")
if echo "$STATUS_RESPONSE" | grep -q '"database_connected":true'; then
    echo -e "${GREEN}✓ Status check passed (database connected)${NC}"
else
    echo -e "${RED}✗ Status check failed (database not connected)${NC}"
    echo "$STATUS_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Daily Ingestion (with test date to avoid affecting production)
echo -e "${YELLOW}[3/3] Testing daily ingestion...${NC}"
TEST_DATE="2025-12-04"
echo "Using test date: $TEST_DATE"

INGEST_RESPONSE=$(curl -s -X POST "$BACKEND_URL/internal/papers/daily" \
    -H "Content-Type: application/json" \
    -H "X-Cron-Secret: $CRON_SECRET" \
    -d "{\"date\": \"$TEST_DATE\"}")

if echo "$INGEST_RESPONSE" | grep -q '"message"'; then
    echo -e "${GREEN}✓ Ingestion endpoint responded${NC}"

    # Check if any fields succeeded
    if echo "$INGEST_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ At least one field ingested successfully${NC}"
    else
        echo -e "${YELLOW}⚠ No successful ingestions (this might be expected if papers already exist)${NC}"
    fi

    # Show summary
    SUCCESS_COUNT=$(echo "$INGEST_RESPONSE" | grep -o '"success_count":[0-9]*' | cut -d: -f2)
    FAIL_COUNT=$(echo "$INGEST_RESPONSE" | grep -o '"fail_count":[0-9]*' | cut -d: -f2)
    echo "Summary: $SUCCESS_COUNT succeeded, $FAIL_COUNT failed"
else
    echo -e "${RED}✗ Ingestion failed${NC}"
    echo "$INGEST_RESPONSE"
    exit 1
fi
echo ""

echo -e "${GREEN}All tests passed!${NC}"
echo ""
echo "You can now:"
echo "  - View API docs: $BACKEND_URL/docs"
echo "  - Run ingestion for today: curl -X POST $BACKEND_URL/internal/papers/daily -H 'X-Cron-Secret: $CRON_SECRET'"
echo "  - Check logs: docker logs <container-name>"
