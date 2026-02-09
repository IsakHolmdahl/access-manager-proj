#!/bin/bash

# Test script for Parquet Export API
# Usage: ./test_parquet_export.sh

set -e

API_BASE="http://localhost:8090"
ADMIN_KEY="your-secret-admin-key-change-this-in-production"

echo "============================================"
echo "   Parquet Export API - Test Suite"
echo "============================================"
echo ""

# Check if API is running
echo "1. Checking API health..."
HEALTH=$(curl -s "$API_BASE/health")
if echo "$HEALTH" | grep -q "healthy"; then
    echo "   ✓ API is healthy"
else
    echo "   ✗ API is not responding"
    exit 1
fi
echo ""

# Test export with auto-generated filename
echo "2. Testing export with auto-generated filename..."
RESPONSE=$(curl -s -X POST \
    -H "X-Admin-Key: $ADMIN_KEY" \
    "$API_BASE/admin/exports/parquet")

if echo "$RESPONSE" | grep -q "filename"; then
    FILENAME=$(echo "$RESPONSE" | grep -o '"filename":"[^"]*"' | cut -d'"' -f4)
    ROW_COUNT=$(echo "$RESPONSE" | grep -o '"row_count":[0-9]*' | cut -d':' -f2)
    echo "   ✓ Export successful"
    echo "   ✓ Filename: $FILENAME"
    echo "   ✓ Rows exported: $ROW_COUNT"
else
    echo "   ✗ Export failed"
    echo "   Response: $RESPONSE"
    exit 1
fi
echo ""

# Test export with custom filename
echo "3. Testing export with custom filename..."
CUSTOM_NAME="test_$(date +%s)"
RESPONSE=$(curl -s -X POST \
    -H "X-Admin-Key: $ADMIN_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"filename\":\"$CUSTOM_NAME\"}" \
    "$API_BASE/admin/exports/parquet")

if echo "$RESPONSE" | grep -q "$CUSTOM_NAME"; then
    echo "   ✓ Custom filename export successful"
    echo "   ✓ Filename: $CUSTOM_NAME.parquet"
else
    echo "   ✗ Custom filename export failed"
    echo "   Response: $RESPONSE"
    exit 1
fi
echo ""

# Test authorization (should fail without admin key)
echo "4. Testing authorization (should fail)..."
RESPONSE=$(curl -s -X POST "$API_BASE/admin/exports/parquet")
if echo "$RESPONSE" | grep -q "X-Admin-Key"; then
    echo "   ✓ Authorization working correctly (401 returned)"
else
    echo "   ✗ Authorization not working"
    exit 1
fi
echo ""

# List all exported files
echo "5. Listing all exported Parquet files..."
if [ -d "data/parquet" ]; then
    FILE_COUNT=$(ls -1 data/parquet/*.parquet 2>/dev/null | wc -l | xargs)
    echo "   ✓ Found $FILE_COUNT Parquet files in data/parquet/"
    ls -lh data/parquet/*.parquet 2>/dev/null | tail -5 | awk '{print "     " $9 " (" $5 ")"}'
else
    echo "   ✗ Parquet directory not found"
fi
echo ""

# Verify Parquet file validity (requires Docker)
echo "6. Verifying Parquet file validity..."
if command -v docker &> /dev/null; then
    VALIDATION=$(docker exec access-management-api python3 -c "
import pyarrow.parquet as pq
import sys
try:
    table = pq.read_table('data/parquet/$CUSTOM_NAME.parquet')
    print(f'VALID:{len(table)}:{len(table.column_names)}')
except Exception as e:
    print(f'ERROR:{e}')
    sys.exit(1)
" 2>/dev/null)
    
    if echo "$VALIDATION" | grep -q "VALID"; then
        ROWS=$(echo "$VALIDATION" | cut -d':' -f2)
        COLS=$(echo "$VALIDATION" | cut -d':' -f3)
        echo "   ✓ Parquet file is valid"
        echo "   ✓ Contains $ROWS rows and $COLS columns"
    else
        echo "   ✗ Parquet file validation failed"
    fi
else
    echo "   ⚠ Docker not available, skipping validation"
fi
echo ""

echo "============================================"
echo "   All tests passed! ✓"
echo "============================================"
echo ""
echo "Next steps:"
echo "  • View Swagger docs: $API_BASE/docs"
echo "  • View exported files: ls -lh data/parquet/"
echo "  • Read Parquet file: see example below"
echo ""
echo "Python example to read exported data:"
echo "  import pyarrow.parquet as pq"
echo "  table = pq.read_table('data/parquet/$CUSTOM_NAME.parquet')"
echo "  print(table.to_pandas())  # Requires pandas"
