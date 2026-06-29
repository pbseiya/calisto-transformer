#!/bin/bash
# SIT: Anomaly Detection API tests
# Tests real HTTP calls against the deployed anomaly API
set -euo pipefail

API_BASE="https://100.123.214.57/dga-api"
PASS=0
FAIL=0

pass() { echo "  ✅ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ $1: $2"; FAIL=$((FAIL + 1)); }

echo ""
echo "=== Anomaly Detection API SIT ==="

# Test 1: Health endpoint
echo ""
echo "1. Health Check"
RESP=$(curl -sk "$API_BASE/health" 2>/dev/null)
if echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['status']=='healthy'; assert d['devices_loaded']==21" 2>/dev/null; then
  pass "Health endpoint returns healthy with 21 devices"
else
  fail "Health endpoint" "$RESP"
fi

# Test 2: Devices endpoint
echo ""
echo "2. List Devices"
RESP=$(curl -sk "$API_BASE/devices" 2>/dev/null)
if echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['count']==21; assert 'DA115' in d['devices']" 2>/dev/null; then
  pass "Devices endpoint returns 21 devices including DA115"
else
  fail "Devices endpoint" "$RESP"
fi

# Test 3: Anomaly endpoint (normal device)
echo ""
echo "3. Anomaly Detection (DA115)"
RESP=$(curl -sk "$API_BASE/anomaly?device=DA115&hours=24" 2>/dev/null)
if echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['device']=='DA115'; assert 'is_anomaly' in d; assert 'details' in d" 2>/dev/null; then
  pass "Anomaly endpoint returns valid response for DA115"
else
  fail "Anomaly endpoint" "$RESP"
fi

# Test 4: Anomaly endpoint (invalid device)
echo ""
echo "4. Anomaly Detection (invalid device)"
HTTP_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "$API_BASE/anomaly?device=INVALID" 2>/dev/null)
if [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "404" ]; then
  pass "Anomaly endpoint rejects invalid device (HTTP $HTTP_CODE)"
else
  fail "Anomaly endpoint invalid device" "Expected 422/404, got $HTTP_CODE"
fi

# Test 5: Drift endpoint
echo ""
echo "5. Drift Detection (DA115)"
RESP=$(curl -sk "$API_BASE/drift?device=DA115" 2>/dev/null)
if echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['device']=='DA115'; assert 'drift_detected' in d; assert 'gases' in d" 2>/dev/null; then
  pass "Drift endpoint returns valid response for DA115"
else
  fail "Drift endpoint" "$RESP"
fi

# Test 6: Trend endpoint
echo ""
echo "6. Trend Detection (DA115)"
RESP=$(curl -sk "$API_BASE/trend?device=DA115&window_days=90" 2>/dev/null)
if echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['device']=='DA115'; assert d['period_days']==90; assert 'gases' in d" 2>/dev/null; then
  pass "Trend endpoint returns valid response for DA115"
else
  fail "Trend endpoint" "$RESP"
fi

# Test 7: Swagger UI
echo ""
echo "7. Swagger UI"
HTTP_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "$API_BASE/docs" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  pass "Swagger UI accessible (HTTP $HTTP_CODE)"
else
  fail "Swagger UI" "Expected 200, got $HTTP_CODE"
fi

# Test 8: OpenAPI JSON
echo ""
echo "8. OpenAPI JSON"
HTTP_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "$API_BASE/openapi.json" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  pass "OpenAPI JSON accessible (HTTP $HTTP_CODE)"
else
  fail "OpenAPI JSON" "Expected 200, got $HTTP_CODE"
fi

# Summary
echo ""
echo "=== Anomaly API SIT Summary ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo "  Total:  $((PASS + FAIL))"

if [ "$FAIL" -gt 0 ]; then
  echo "  ❌ Anomaly API SIT FAILED"
  exit 1
else
  echo "  ✅ Anomaly API SIT PASSED"
  exit 0
fi
