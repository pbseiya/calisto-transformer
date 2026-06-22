#!/bin/bash
# DGA System Health Check with Telegram Alert

ENV_FILE="/home/seiya/projects/calisto-transformer/.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

LOG_FILE="/home/seiya/projects/calisto-transformer/system_health.log"
ALERT_LOG="/home/seiya/projects/calisto-transformer/system_alerts.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

send_telegram() {
    local message="$1"
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        -d "text=${message}" \
        -d "parse_mode=HTML" > /dev/null
}

LAST_ALERT_HOUR=$(grep -c "$(date '+%Y-%m-%d %H')" ${ALERT_LOG} 2>/dev/null || echo "0")
if [ "${LAST_ALERT_HOUR}" -gt 3 ]; then
    exit 0
fi

echo "=== Health Check: ${TIMESTAMP} ===" >> ${LOG_FILE}

if ! systemctl is-active --quiet dga-monitor.service; then
    send_telegram "🔴 <b>DGA Monitor DOWN</b>\nService หยุดทำงาน\nเวลา: ${TIMESTAMP}"
    echo 'seiya1234' | sudo -S systemctl restart dga-monitor.service
    echo "[${TIMESTAMP}] CRITICAL: dga-monitor.service DOWN" >> ${ALERT_LOG}
fi

if ! docker ps | grep -q postgres_db; then
    send_telegram "🔴 <b>PostgreSQL DOWN</b>\nContainer หยุดทำงาน\nเวลา: ${TIMESTAMP}"
    docker start postgres_db
    echo "[${TIMESTAMP}] CRITICAL: postgres_db DOWN" >> ${ALERT_LOG}
fi

if ! docker ps | grep -q dga-dashboard; then
    send_telegram "🔴 <b>Dashboard DOWN</b>\nContainer หยุดทำงาน\nเวลา: ${TIMESTAMP}"
    cd /home/seiya/projects/calisto-transformer/dga-nextjs && docker compose up -d
    echo "[${TIMESTAMP}] CRITICAL: dga-dashboard DOWN" >> ${ALERT_LOG}
fi

RECENT_COUNT=$(docker exec postgres_db psql -U postgres -d dga_monitor -t -c "SELECT COUNT(*) FROM dga_readings WHERE timestamp > NOW() - INTERVAL '30 minutes'")
if [ "${RECENT_COUNT}" -lt 50 ]; then
    send_telegram "⚠️ <b>ข้อมูลขาดหาย</b>\nไม่มีการบันทึกข้อมูลใหม่ในช่วง 30 นาที\nจำนวน records: ${RECENT_COUNT}\nเวลา: ${TIMESTAMP}"
    echo "[${TIMESTAMP}] WARNING: Low data: ${RECENT_COUNT}" >> ${ALERT_LOG}
fi

find /home/seiya/projects/calisto-transformer -name "*.log" -mtime +30 -delete 2>/dev/null
