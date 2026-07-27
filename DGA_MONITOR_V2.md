# DGA Monitor v2 - Enhanced Reliability

## 📋 ภาพรวม

Data Collector v2 พร้อมระบบ reliable ที่ปรับปรุงจาก v1

## ✨ ฟีเจอร์ใหม่

### 1. Retry Mechanism with Exponential Backoff
- **Max Retries:** 3 ครั้ง (configurable)
- **Backoff:** 1s → 2s → 4s (exponential)
- **Max Delay:** 30 วินาที
- **Config:**
  ```bash
  MAX_RETRIES=3
  RETRY_BASE_DELAY=1.0
  RETRY_MAX_DELAY=30.0
  ```

### 2. Data Validation
- **Range Checking:**
  - Hydrogen: 0-2000 ppm
  - Carbon Monoxide: 0-3000 ppm
  - Water Content: 0-50 ppm
- **Required Fields:** device_name, timestamp, hydrogen, carbonmonoxide, water_content
- **Validation Errors:** บันทึก log และ skip invalid data

### 3. Health Check API
- **Port:** 8081 (configurable)
- **Endpoints:**
  - `GET /health` - System status
  - `GET /devices` - Device list
  - `GET /metrics` - Prometheus-style metrics
- **Example:**
  ```bash
  curl http://localhost:8081/health
  ```

### 4. Alerting System
- **Platform:** Telegram
- **Trigger:** 3 consecutive failures (configurable)
- **Alert Types:**
  - Device failure alerts
  - System status alerts
- **Config:**
  ```bash
  ALERT_ENABLED=true
  TELEGRAM_BOT_TOKEN=your_token
  TELEGRAM_CHAT_ID=your_chat_id
  ALERT_THRESHOLD=3
  ```

### 5. Connection Pooling
- **Pool Size:** 5 connections (configurable)
- **Benefits:**
  - ลด connection overhead
  - เพิ่ม performance
  - จัดการ connection อัตโนมัติ

### 6. Health Tracker
- **Metrics:**
  - Total reads
  - Successful reads
  - Failed reads
  - Success rate (%)
  - Uptime (seconds)
  - Per-device failure count
  - Last success timestamp

## 🚀 Installation

### 1. Install Dependencies
```bash
pip install pymodbus psycopg2-binary python-dotenv fastapi uvicorn httpx playwright
```

### 2. Configure Environment
```bash
# .env file
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dga_monitor
DB_USER=postgres
DB_PASSWORD=postgres

# Alerting (optional)
ALERT_ENABLED=true
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Retry settings
MAX_RETRIES=3
RETRY_BASE_DELAY=1.0
RETRY_MAX_DELAY=30.0

# Health check
HEALTH_CHECK_PORT=8081
```

### 3. Install Systemd Service
```bash
sudo cp dga-monitor-v2.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable dga-monitor-v2
sudo systemctl start dga-monitor-v2
```

### 4. Verify
```bash
# Check service status
sudo systemctl status dga-monitor-v2

# Check health
curl http://localhost:8081/health

# Check logs
tail -f dga_monitor_v2.log
```

## 📊 Health Check API

### GET /health
```json
{
  "status": "healthy",
  "uptime_seconds": 3600,
  "total_reads": 1000,
  "successful_reads": 995,
  "failed_reads": 5,
  "success_rate": 99.5,
  "unhealthy_devices": [],
  "device_failures": {
    "DA115": 0,
    "KT1A": 0
  },
  "last_success": {
    "DA115": "2026-07-27T15:00:00",
    "KT1A": "2026-07-27T15:00:00"
  }
}
```

### GET /metrics
```json
{
  "dga_monitor_uptime_seconds": 3600,
  "dga_monitor_total_reads": 1000,
  "dga_monitor_successful_reads": 995,
  "dga_monitor_failed_reads": 5,
  "dga_monitor_success_rate": 99.5
}
```

## 🔧 Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `POLL_INTERVAL` | 15 | Poll interval (seconds) |
| `MAX_RETRIES` | 3 | Max retry attempts |
| `RETRY_BASE_DELAY` | 1.0 | Initial retry delay (seconds) |
| `RETRY_MAX_DELAY` | 30.0 | Maximum retry delay (seconds) |
| `DB_POOL_SIZE` | 5 | Database connection pool size |
| `ALERT_ENABLED` | true | Enable alerting |
| `ALERT_THRESHOLD` | 3 | Consecutive failures before alert |
| `HEALTH_CHECK_PORT` | 8081 | Health check API port |

## 📊 Data Collection Performance

### Raw Data Frequency
- **Per Device Interval:** 31.7 วินาที
- **System-wide Interval:** 1.5 วินาที (21 devices)
- **Readings per Device per Hour:** 113 readings
- **Total Readings per Hour:** 2,376 readings

### Detection Speed
- **Best Case:** 15 วินาที (ค่าผิดปกติเกิดก่อน poll)
- **Worst Case:** 46.7 วินาที (ต้องรอ collect ครั้งถัดไป)
- **Average:** 30.85 วินาที

### Noise Filtering
- **Min Readings:** 3 readings ติดกัน (≈ 95 วินาที)
- **Min Z-Score:** 3.5σ (สูงกว่า threshold 3.0σ)
- **Min Duration:** 30 วินาที
- **Noise Reduction:** 98.4%

### Detection Scenarios
| Scenario | Detection Time | Description |
|----------|----------------|-------------|
| Single spike | 100% blocked | Noise filter ทำงาน |
| Short spike (2 readings) | 100% blocked | Noise filter ทำงาน |
| Sustained anomaly (3+ readings) | ~95 วินาที | 3 × 31.7s |
| Gradual increase | When z≥3.5σ | ขึ้นอยู่กับ rate of change |

## 📈 Monitoring

### Prometheus Metrics
```
dga_monitor_uptime_seconds
dga_monitor_total_reads
dga_monitor_successful_reads
dga_monitor_failed_reads
dga_monitor_success_rate
```

### Log Files
- `dga_monitor_v2.log` - Main log
- `dga_monitor_v2_error.log` - Error log

### Systemd Journal
```bash
journalctl -u dga-monitor-v2 -f
```

## 🆚 Comparison with v1

| Feature | v1 | v2 |
|---------|----|----|
| Retry mechanism | ❌ | ✅ Exponential backoff |
| Data validation | ❌ | ✅ Range checking |
| Health check API | ❌ | ✅ FastAPI |
| Alerting | ❌ | ✅ Telegram |
| Connection pooling | ❌ | ✅ psycopg2 pool |
| Health tracking | ❌ | ✅ Per-device metrics |
| Circuit breaker | ❌ | ❌ (future) |
| Message queue | ❌ | ❌ (future) |

## 🐛 Troubleshooting

### Service won't start
```bash
# Check logs
journalctl -u dga-monitor-v2 -n 50

# Check permissions
ls -la /home/seiya/projects/calisto-transformer/dga_monitor_v2.py
```

### Health check not responding
```bash
# Check if port is listening
netstat -tlnp | grep 8081

# Check firewall
sudo ufw status
```

### High failure rate
```bash
# Check device connectivity
ping 10.31.204.5

# Check gateway
curl http://10.29.82.42

# Check database
psql -h localhost -U postgres -d dga_monitor -c "SELECT COUNT(*) FROM dga_readings WHERE timestamp > NOW() - INTERVAL '1 hour';"
```

## 📝 Migration from v1

### 1. Stop v1 service
```bash
sudo systemctl stop dga-monitor
```

### 2. Backup configuration
```bash
cp .env .env.backup
```

### 3. Start v2 service
```bash
sudo systemctl start dga-monitor-v2
```

### 4. Verify
```bash
curl http://localhost:8081/health
```

## 🧪 Test Results

### Reliability Tests
All tests passing ✅

**Test Coverage:**
- ✅ Data validation: Range checking (H2, CO, WC)
- ✅ Health tracking: Success/failure metrics
- ✅ Retry mechanism: Exponential backoff (3 retries)
- ✅ Alerting system: Telegram integration
- ✅ Failure scenarios: Device down, recovery, validation

**Test Files:**
- `test_reliability.py` - Unit tests for reliability features
- `test_telegram_alert.py` - Real Telegram alert integration
- `test_failure_scenario.py` - Device failure simulation

**Run Tests:**
```bash
cd ~/projects/calisto-transformer
python3 test_reliability.py
python3 test_telegram_alert.py
python3 test_failure_scenario.py
```

## 🔮 Future Enhancements

- [ ] Circuit breaker pattern
- [ ] Message queue (Redis/RabbitMQ)
- [ ] Dead letter queue
- [ ] Prometheus exporter
- [ ] Grafana dashboard
- [ ] Data quality checks
- [ ] Automatic device discovery
