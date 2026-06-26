#!/bin/bash
# Health monitoring script - runs every 5 minutes via cron
# Checks if DGA dashboard is alive and alerts if down

BOT_TOKEN="8749140014:AAExxdykao56dzA26lmkf4zyOsUbN0w8sE8"
CHAT_ID="-1004499459935"
THREAD_ID="6"
LOG="/tmp/dga-health-monitor.log"
COOKIE_FILE="/tmp/health-monitor-cookie.txt"
ALERT_STATE_FILE="/tmp/dga-health-alert-state.txt"

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

# Initialize
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
  # Check devices API
  DEVICES_OK=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_FILE" http://localhost:3001/dga/api/devices 2>/dev/null)
  if [ "$DEVICES_OK" != "200" ]; then
    ISSUES="${ISSUES}API /devices returned $DEVICES_OK\n"
  fi

  # Check readings API
  READINGS_OK=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_FILE" "http://localhost:3001/dga/api/readings/now?devices=DA115" 2>/dev/null)
  if [ "$READINGS_OK" != "200" ]; then
    ISSUES="${ISSUES}API /readings/now returned $READINGS_OK\n"
  fi
else
  ISSUES="${ISSUES}Login failed (HTTP $LOGIN_OK)\n"
fi

# Cleanup
rm -f "$COOKIE_FILE"

# Decision: alert or recovery
if [ -n "$ISSUES" ]; then
  # Something is wrong
  if [ "$ALERT_SENT" = "false" ]; then
    # First time detecting issue - send alert
    MSG="🚨 <b>DGA Health Check FAILED</b>

⏱️ Time: $(date '+%Y-%m-%d %H:%M:%S')
🖥️ Host: $(hostname)

Issues:
$ISSUES
🔗 URL: https://10.28.15.77/dga"

    send_alert "$MSG"
    echo "true" > "$ALERT_STATE_FILE"
    log "ALERT SENT: $ISSUES"
  else
    log "Issue persists (alert already sent): $ISSUES"
  fi
else
  # Everything is OK
  if [ "$ALERT_SENT" = "true" ]; then
    # Recovery - send recovery message
    MSG="✅ <b>DGA Health Check RECOVERED</b>

⏱️ Time: $(date '+%Y-%m-%d %H:%M:%S')
🖥️ Host: $(hostname)

All systems operational.
🔗 URL: https://10.28.15.77/dga"

    send_alert "$MSG"
    echo "false" > "$ALERT_STATE_FILE"
    log "RECOVERY: All checks passed"
  else
    log "OK: All checks passed"
  fi
fi
