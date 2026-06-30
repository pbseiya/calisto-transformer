#!/bin/bash
# Health monitoring script - runs every 5 minutes via cron
# Checks DGA dashboard health AND anomaly detection
# Alerts via Telegram if issues found or anomalies detected

BOT_TOKEN="8749140014:AAExxdykao56dzA26lmkf4zyOsUbN0w8sE8"
CHAT_ID="-1004499459935"
THREAD_ID="6"
LOG="/tmp/dga-health-monitor.log"
COOKIE_FILE="/tmp/health-monitor-cookie.txt"
ALERT_STATE_FILE="/tmp/dga-health-alert-state.txt"
ANOMALY_ALERT_STATE="/tmp/dga-anomaly-alert-state.txt"
ANOMALY_API="http://localhost:8000/anomaly"

# All devices to check for anomalies
DEVICES="DA115,DA08,DA09,DA10,DA04,DA05,DA07,11BAT01,12BAT01,15BAT01,16BAT01,34BAT02,KT1A,KT2A,KT3A,TR_1A,TR_1B,TR_1D-VSD,TR_B2-1001,TR_B2-1002,ENB-101-A,ENB-101-B"

# Check if we already sent an alert (avoid spam)
ALERT_SENT="false"
if [ -f "$ALERT_STATE_FILE" ]; then
  ALERT_SENT=$(cat "$ALERT_STATE_FILE")
fi

send_alert() {
  local message="$1"
  curl -s "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "message_thread_id=${THREAD_ID}" \
    -d "text=${message}" \
    -d "parse_mode=HTML" >> "$LOG" 2>&1
}

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"
}

# ============================================
# Part 1: Health Check
# ============================================
log "=== Health Check Start ==="
rm -f "$COOKIE_FILE"
ISSUES=""

# Check 1: Dashboard HTTP
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L http://localhost:3001/dga 2>/dev/null)
if [ "$HTTP_CODE" != "200" ]; then
  ISSUES="${ISSUES}Dashboard HTTP $HTTP_CODE (expected 200)\n"
fi

# Check 2: PM2 process
if ! pm2 list 2>/dev/null | grep -q "dga-app.*online"; then
  ISSUES="${ISSUES}PM2 dga-app not online\n"
fi

# Check 3: API endpoints (need login first)
LOGIN_OK=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/dga/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"dga2024"}' \
  -c "$COOKIE_FILE" 2>/dev/null)

if [ "$LOGIN_OK" = "200" ]; then
  DEVICES_OK=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_FILE" http://localhost:3001/dga/api/devices 2>/dev/null)
  if [ "$DEVICES_OK" != "200" ]; then
    ISSUES="${ISSUES}API /devices returned $DEVICES_OK\n"
  fi

  READINGS_OK=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_FILE" "http://localhost:3001/dga/api/readings/now?devices=DA115" 2>/dev/null)
  if [ "$READINGS_OK" != "200" ]; then
    ISSUES="${ISSUES}API /readings/now returned $READINGS_OK\n"
  fi
else
  ISSUES="${ISSUES}Login failed (HTTP $LOGIN_OK)\n"
fi

rm -f "$COOKIE_FILE"

# ============================================
# Part 2: Anomaly Detection
# ============================================
log "=== Anomaly Detection Start ==="
ANOMALIES_FOUND=""

for device in $(echo "$DEVICES" | tr ',' ' '); do
  response=$(curl -s "$ANOMALY_API?device=$device" 2>/dev/null)
  
  if echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('is_anomaly') else 1)" 2>/dev/null; then
    severity=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('severity','unknown'))" 2>/dev/null)
    confidence=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('confidence',0))" 2>/dev/null)
    h2_zscore=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('details',{}).get('h2_zscore',0))" 2>/dev/null)
    co_zscore=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('details',{}).get('co_zscore',0))" 2>/dev/null)
    
    ANOMALIES_FOUND="${ANOMALIES_FOUND}• <b>$device</b> - Severity: $severity, Confidence: $confidence\n"
    ANOMALIES_FOUND="${ANOMALIES_FOUND}  H2 Z-Score: $h2_zscore | CO Z-Score: $co_zscore\n"
    
    log "⚠️ Anomaly detected: $device (severity=$severity, confidence=$confidence)"
  fi
done

# ============================================
# Part 3: Send Alerts
# ============================================
if [ -n "$ISSUES" ] || [ -n "$ANOMALIES_FOUND" ]; then
  # Something is wrong or anomaly detected
  if [ "$ALERT_SENT" = "false" ]; then
    MSG="🚨 <b>DGA Alert</b>\n\n"
    MSG+="⏱️ Time: $(date '+%Y-%m-%d %H:%M:%S')\n"
    MSG+="🖥️ Host: $(hostname)\n\n"
    
    if [ -n "$ISSUES" ]; then
      MSG+="<b>Health Issues:</b>\n$ISSUES\n"
    fi
    
    if [ -n "$ANOMALIES_FOUND" ]; then
      MSG+="<b>Anomalies Detected:</b>\n$ANOMALIES_FOUND\n"
    fi
    
    MSG+="🔗 Dashboard: https://100.123.214.57/dga"
    
    send_alert "$MSG"
    echo "true" > "$ALERT_STATE_FILE"
    log " Alert sent"
  else
    log "⚠️ Issues persist (alert already sent): $ISSUES $ANOMALIES_FOUND"
  fi
else
  # Everything OK
  if [ "$ALERT_SENT" = "true" ]; then
    MSG="✅ <b>DGA Health Check RECOVERED</b>\n\n"
    MSG+="⏱️ Time: $(date '+%Y-%m-%d %H:%M:%S')\n"
    MSG+="🖥️ Host: $(hostname)\n\n"
    MSG+="All systems operational.\n"
    MSG+="🔗 https://100.123.214.57/dga"
    
    send_alert "$MSG"
    echo "false" > "$ALERT_STATE_FILE"
    log "✅ Recovery alert sent"
  else
    log "✅ All checks passed, no anomalies"
  fi
fi

log "=== Health Check End ===\n"
