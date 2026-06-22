# DGA Monitor

Modbus DGA (Dissolved Gas Analysis) monitoring system for power transformers.

## Overview

Pulls real-time data from DGA devices (DA115, KT1A, KT2A, KT3A) via Modbus TCP every 15 seconds and stores in PostgreSQL for historical analysis.

## Register Map (Verified)

| Block | Parameter | Function | Address |
|-------|-----------|----------|---------|
| B-1 | Hydrogen | 04 IR | 2 |
| B-2 | Carbonmonoxide | 04 IR | 20 |
| B-3 | Water Content | 04 IR | 5 |
| B-4 | H2 alarm lv1 | 02 DI | 0 |
| B-5 | H2 alarm lv.2 | 02 DI | 1 |
| B-6 | CO alarm lv.1 | 02 DI | 2 |
| B-7 | CO alarm lv.2 | 02 DI | 3 |
| B-8 | WC alarm lv.1 | 02 DI | 4 |
| B-9 | WC alarm lv.2 | 02 DI | 5 |

## Installation

### 1. Clone repository

```bash
cd ~/projects
git clone <repository-url>
cd calisto-transformer
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Setup database

```bash
python3 setup_db.py
```

### 5. Run monitor

```bash
python3 dga_monitor.py
```

## Running as systemd service

```bash
sudo cp dga-monitor.service /etc/systemd/system/
sudo systemctl enable dga-monitor
sudo systemctl start dga-monitor
sudo systemctl status dga-monitor
```

## Querying data

### Latest readings

```sql
SELECT * FROM latest_readings;
```

### Historical data

```sql
SELECT * FROM dga_readings 
WHERE device_name = 'DA115' 
ORDER BY timestamp DESC 
LIMIT 100;
```

### Daily average

```sql
SELECT 
    device_name,
    DATE(timestamp) as date,
    AVG(hydrogen) as avg_h2,
    AVG(carbonmonoxide) as avg_co,
    AVG(water_content) as avg_wc
FROM dga_readings
GROUP BY device_name, DATE(timestamp)
ORDER BY date DESC;
```

## Files

- `dga_monitor.py` - Main monitoring script
- `setup_db.py` - Database setup script
- `requirements.txt` - Python dependencies
- `.env.example` - Environment configuration template
- `dga-monitor.service` - systemd service file

## Documentation

- [Testing Report](docs/TESTING_REPORT.md) — Full test results, register map verification, gateway config corrections, DGA standards

## Notes

- Dashboard at http://10.31.37.21/smcc/meterrealtime.php refreshes every 15 minutes
- This monitor polls every 15 seconds for higher resolution data
- Gateway config at http://10.29.82.42/ needs correction (see [Testing Report](docs/TESTING_REPORT.md))
