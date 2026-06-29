#!/bin/bash
# SIT (System Integration Test)
# รันทดสอบหลัง deploy เพื่อตรวจสอบว่า system ทำงานครบทุกส่วน

set -e

REPO_DIR="/home/seiya/projects/calisto-transformer"
DGA_DIR="$REPO_DIR/dga-nextjs"
COOKIE_FILE="/tmp/sit-test-cookie.txt"

log() {
  echo "[$(date '+%H:%M:%S')] $1"
}

success() {
  log "✅ $1"
}

fail() {
  log "❌ $1"
  return 1
}

# Cleanup
rm -f "$COOKIE_FILE"

# 1. Login เพื่อขอ cookie
log "🔐 Authenticating..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/dga/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"dga2024"}' \
  -c "$COOKIE_FILE")

if [ "$HTTP_CODE" = "200" ] && [ -f "$COOKIE_FILE" ]; then
  success "Login OK (HTTP $HTTP_CODE)"
else
  fail "Login failed (HTTP $HTTP_CODE)"
  exit 1
fi

# 2. ทดสอบ API endpoints
log "🔌 Testing API endpoints..."

if curl -sf -b "$COOKIE_FILE" http://localhost:3001/dga/api/devices > /dev/null; then
  success "GET /api/devices"
else
  fail "GET /api/devices failed"
fi

if curl -sf -b "$COOKIE_FILE" "http://localhost:3001/dga/api/readings/now?devices=DA115" > /dev/null; then
  success "GET /api/readings/now"
else
  fail "GET /api/readings/now failed"
fi

# 3. ทดสอบ frontend (follow redirects)
log "🌐 Testing frontend..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L -b "$COOKIE_FILE" http://localhost:3001/dga)
if [ "$HTTP_CODE" = "200" ]; then
  success "Frontend accessible (HTTP $HTTP_CODE)"
else
  fail "Frontend returned HTTP $HTTP_CODE"
fi

# 4. ทดสอบข้อมูลจาก API
log " Testing data integrity..."

DEVICES_COUNT=$(curl -sf -b "$COOKIE_FILE" http://localhost:3001/dga/api/devices | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('devices',[])))")
if [ "$DEVICES_COUNT" -gt 0 ]; then
  success "Devices API returned $DEVICES_COUNT devices"
else
  fail "Devices API returned 0 devices"
fi

# ตรวจสอบว่ามีข้อมูลจริงจาก readings API
READINGS_CHECK=$(curl -sf -b "$COOKIE_FILE" "http://localhost:3001/dga/api/readings/now?devices=DA115" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('success') and len(data.get('data', [])) > 0:
    print('OK')
else:
    print('FAIL')
")

if [ "$READINGS_CHECK" = "OK" ]; then
  success "Readings API returned valid data"
else
  fail "Readings API returned empty/invalid data"
fi

# Cleanup
rm -f "$COOKIE_FILE"

# 5. ทดสอบ Anomaly Detection API
log "🤖 Testing Anomaly Detection API..."
if bash "$REPO_DIR/tests/sit-anomaly.sh"; then
  success "Anomaly API SIT passed"
else
  fail "Anomaly API SIT failed"
  exit 1
fi

log "✅ All SIT tests passed"
