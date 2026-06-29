# DGA Monitor

Modbus DGA (Dissolved Gas Analysis) monitoring system for power transformers.

## Overview

Collects real-time dissolved gas analysis data from industrial monitoring devices via Modbus TCP every 15 seconds. Stores data in PostgreSQL for historical analysis and visualization through a Next.js dashboard with automated CI/CD pipeline.

## Architecture

```
[Modbus Devices] → [Python Collector (15s)] → [PostgreSQL]
                                                      ↓
                                               [Next.js Dashboard]
                                                      ↓
                                               [Nginx Reverse Proxy]
                                                      ↓
                                               [Browser / Telegram Bot]
```

## System Components

### 1. Data Collection (`dga_monitor.py`)
- Python daemon running as systemd service (`dga-monitor.service`)
- Polls 20+ devices every 15 seconds via Modbus TCP
- Stores raw readings in `dga_readings` table
- Aggregation script (`dga_aggregate.py`) runs via cron every 15 minutes to create 15-min summaries in `dga_readings_15min`

### 2. API Layer (Next.js 14)
- **`/api/readings`** - Historical data with 15-min gap filling for chart display
- **`/api/readings/now`** - Latest reading per device (for RealtimeTable component)
- **`/api/statistics`** - Aggregate statistics (mean/min/max/stdev)
- **`/api/devices`** - Device list from database
- **`/api/auth/login`** - IRPC Active Directory authentication

### 3. Frontend Dashboard
- **Charts**: Chart.js 4.x with date-fns adapter (zoom/pan, time-range aware axis labels)
- **RealtimeTable**: Live-updating table fetching from `/api/readings/now` every 15s
- **Filters**: Time range (15m/1h/6h/24h/7d/30d/custom), data source (raw/summary), smart mode
- **Smart Mode**: Auto-extends time range when no data found in selected range
- **Password Toggle**: Show/hide password on login page (eye icon)

### 4. CI/CD Pipeline
- **GitHub Actions**: Lint + type check + build + 34 unit tests on every push/PR
- **Git Hook**: Auto build + deploy + SIT + screenshot + Telegram alert on `git pull`
- **Health Monitor**: Cron every 5 minutes checks dashboard health
- **Unit Tests**: 34 tests covering timezone, gap filling, API queries, statistics

### 5. Infrastructure
- **PM2**: Process manager for Next.js app (port 3001)
- **Nginx**: HTTPS reverse proxy with self-signed certs
- **Systemd**: Auto-restart for Python collector (10s failure delay)
- **Post-merge Git Hook**: Auto build + deploy + Telegram notification on `git pull`

### 5. Anomaly Detection API (FastAPI)
- **Base URL**: `https://100.123.214.57/dga-api`
- **Swagger UI**: `https://100.123.214.57/dga-api/docs`
- **ReDoc**: `https://100.123.214.57/dga-api/redoc`
- **OpenAPI JSON**: `https://100.123.214.57/dga-api/openapi.json`
- **Endpoints**:
  - `GET /health` - Health check
  - `GET /devices` - List all devices
  - `GET /anomaly?device=DA115` - Detect anomalies
  - `GET /drift?device=DA115` - Detect drift
  - `GET /trend?device=DA115` - Detect trend
  - `POST /retrain` - Retrain baseline model
- **Model**: Hybrid Z-Score v1 (21 devices)
- **PM2 Service**: `dga-anomaly-api` (port 8000)

## Database Schema

### `dga_readings` (Raw)
Stores individual device polls every 15 seconds.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `device_name` | VARCHAR(50) | Device identifier |
| `timestamp` | TIMESTAMP | Reading time |
| `hydrogen` | INTEGER | H2 concentration (ppm) |
| `carbonmonoxide` | INTEGER | CO concentration (ppm) |
| `water_content` | INTEGER | WC concentration (ppm) |
| `h2_alarm_lv1` | BOOLEAN | H2 warning level |
| `h2_alarm_lv2` | BOOLEAN | H2 danger level |
| `co_alarm_lv1` | BOOLEAN | CO warning level |
| `co_alarm_lv2` | BOOLEAN | CO danger level |
| `wc_alarm_lv1` | BOOLEAN | WC warning level |
| `wc_alarm_lv2` | BOOLEAN | WC danger level |

### `dga_readings_15min` (Summary)
Aggregated 15-minute windows with statistics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `device_name` | VARCHAR(50) | Device identifier |
| `window_start` | TIMESTAMP | Window start (Asia/Bangkok) |
| `window_end` | TIMESTAMP | Window end |
| `sample_count` | INTEGER | Number of raw readings |
| `h2_mean` | REAL | Average H2 |
| `h2_median` | REAL | Median H2 |
| `h2_stdev` | REAL | Std deviation H2 |
| `h2_min` | INTEGER | Minimum H2 |
| `h2_max` | INTEGER | Maximum H2 |
| `h2_first` | INTEGER | First H2 value in window |
| `h2_last` | INTEGER | Last H2 value in window |
| `co_*` | (same as h2) | CO statistics |
| `wc_*` | (same as h2) | WC statistics |
| `h2_alarm_count` | INTEGER | Warning alarms in window |
| `co_alarm_count` | INTEGER | Warning alarms in window |
| `wc_alarm_count` | INTEGER | Warning alarms in window |

## CI/CD Pipeline Status

### Automated Workflow
```
Developer: git push → main
         ↓
GitHub Actions (Cloud) — Automatic
   ├─ Lint
   ├─ Type Check
   ├─ Build Test
   └─ Unit Tests (34 tests)
         ↓
Developer: ssh → ThinkStation → git pull
         ↓
Post-Merge Hook — Automatic
   ├─ npm run build
   ├─ pm2 restart (deploy)
   ├─ Health check
   ├─ SIT (System Integration Test)
   ├─ Playwright Screenshot
   └─ Telegram Alert ✅/❌
         ↓
Health Monitor Cron — Every 5 minutes
   ├─ Check dashboard HTTP
   ├─ Check PM2 status
   ├─ Check API endpoints
   └─ Telegram Alert 🚨/✅ (if down/recovery)
```

### Alert Triggers

| Event | Alert | Via |
|-------|-------|-----|
| `git push` → CI fail | ✅ | GitHub PR status |
| `git pull` → Build fail | ✅ | Telegram  |
| `git pull` → Deploy fail | ✅ | Telegram 🚨 |
| `git pull` → SIT fail | ✅ | Telegram 🚨 |
| Web down (no deploy) | ✅ | Telegram every 5 min |
| Web recovery | ✅ | Telegram ✅ |

### Unit Tests (34 tests)

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| timezone.test.ts | 10 | UTC → Bangkok conversion |
| gapFill.test.ts | 9 | 15-min slot filling logic |
| readingsNow.test.ts | 8 | DISTINCT ON query + response |
| statistics.test.ts | 7 | Aggregate functions + params |
| **Total** | **34** | **+40% coverage** |

## Key Technical Challenges Solved

### Timezone Handling
- Database stores `timestamp without time zone` in Asia/Bangkok local time
- `pg` Node.js driver interprets ISO strings with `Z` suffix as UTC
- **Solution**: Convert ISO timestamps to Bangkok local time strings in JavaScript before query
- File: `lib/timezone.ts` - `toBangkokLocal()` function
- Pool uses `SET TIME ZONE 'Asia/Bangkok'` on every connection

### 15-Minute Window Alignment
- Summary table uses windows aligned to HH:00/HH:15/HH:30/HH:45
- API gap-filling must round start time DOWN to nearest 15-minute boundary
- File: `lib/gapFill.ts` - `fillGaps()` function

### Chart.js Y-Axis Scaling
- `bounds: 'data'` alone doesn't scale high-value devices (DA115 ~1221 ppm)
- **Solution**: Dynamic `suggestedMax` calculation from actual data
- File: `components/Chart.tsx`

### Time Range Axis Labels
- Default `displayFormats.hour` shows `HH:mm` only (no date)
- **Solution**: Dynamic `displayFormats` based on timeRange prop (`MMM d HH:mm` for 7d/30d)
- Files: `components/Chart.tsx`, `app/page.tsx`

### Real-Time Data Visibility
- Old DataTable pulled from summary table (missing unaggregated devices)
- **Solution**: New endpoint `/api/readings/now` queries raw table with `DISTINCT ON`
- Files: `lib/readingsNow.ts`, `components/RealtimeTable.tsx`

### CSS Not Loading (White/Black Screen)
- Missing `basePath: '/dga'` in next.config.js
- Root `package-lock.json` confused Next.js workspace root
- **Solution**: Add basePath + remove root package-lock.json
- File: `next.config.js`

## CI/CD Pipeline

### Automated Workflow

```
Developer: git push → main
         ↓
GitHub Actions (Cloud) — Automatic
   ├─ Lint
   ├─ Type Check
   ├─ Build Test
   └─ Unit Tests (34 tests)
         ↓
Developer: ssh → ThinkStation → git pull
         ↓
Post-Merge Hook — Automatic
   ├─ npm run build
   ├─ pm2 restart (deploy)
   ├─ Health check
   ├─ SIT (System Integration Test)
   ├─ Playwright Screenshot
   └─ Telegram Alert ✅/❌
         ↓
Health Monitor Cron — Every 5 minutes
   ├─ Check dashboard HTTP
   ├─ Check PM2 status
   ├─ Check API endpoints
   └─ Telegram Alert 🚨/✅ (if down/recovery)
```

### Alert Triggers

| Event | Alert | Via |
|-------|-------|-----|
| `git push` → CI fail | ✅ | GitHub PR status |
| `git pull` → Build fail | ✅ | Telegram 🚨 |
| `git pull` → Deploy fail | ✅ | Telegram 🚨 |
| `git pull` → SIT fail | ✅ | Telegram 🚨 |
| Web down (no deploy) | ✅ | Telegram every 5 min |
| Web recovery | ✅ | Telegram ✅ |

### Unit Tests (34 tests)

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| timezone.test.ts | 10 | UTC → Bangkok conversion |
| gapFill.test.ts | 9 | 15-min slot filling logic |
| readingsNow.test.ts | 8 | DISTINCT ON query + response |
| statistics.test.ts | 7 | Aggregate functions + params |
| **Total** | **34** | **+40% coverage** |

## Deployment

### Initial Setup (Thinkstation)
```bash
cd ~/projects
git clone <repository-url>
cd calisto-transformer

# Install dependencies
cd dga-nextjs
npm install

# Copy environment
cp .env.example .env.production
# Edit .env.production: DATABASE_URL, DB_PASSWORD, TELEGRAM_BOT_TOKEN, IRPC_AUTH_URL

# Build
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

### Auto-Deploy Hook
Post-merge hook (`.git/hooks/post-merge`) triggers on every `git pull`:
1. `npm run build`
2. Copy static files to standalone
3. `pm2 restart dga-app`
4. Health check (`curl localhost:3001/dga`)
5. SIT test (`bash tests/sit.sh`)
6. Take dashboard screenshot via Playwright
7. Send photo + caption to Telegram group "Deployment Alert" → DGA topic

### Telegram Notifications
- **Bot**: Think-Hermes-ProjectB (`8749140014:AAExxdykao56dzA26lmkf4zyOsUbN0w8sE8`)
- **Supergroup**: Deployment Alert (`-1004499459935`)
- **Topic**: DGA (thread_id: `6`)

## Query Examples

### Latest readings per device
```sql
SELECT DISTINCT ON (device_name)
  device_name, timestamp, hydrogen, carbonmonoxide, water_content
FROM dga_readings
ORDER BY device_name, timestamp DESC;
```

### 15-min summary for last 7 days
```sql
SELECT device_name, window_start, h2_mean, h2_max, co_mean, wc_mean
FROM dga_readings_15min
WHERE device_name IN ('DA115', 'DA08')
  AND window_start >= NOW() - INTERVAL '7 days'
ORDER BY device_name, window_start DESC;
```

### Devices with active alarms
```sql
SELECT device_name, MAX(timestamp) as last_seen,
       MAX(h2_alarm_lv2) as h2_danger,
       MAX(co_alarm_lv2) as co_danger
FROM dga_readings
GROUP BY device_name
HAVING MAX(h2_alarm_lv2) = true OR MAX(co_alarm_lv2) = true;
```

## Known Issues

### Device Name Mismatch
- Config: `DA115`, `DA08`, `11BAT01`, `DA04`, `DA05`, `DA07`, `DA09`, `12BAT01`, `15BAT01`, `16BAT01`, `34BAT02`, `KT1A`, `KT2A`, `KT3A`, `TR_1A`, `TR_1B`, `TR_1D-VSD`, `TR_B2-1001`, `TR_B2-1002`, `ENB-101-A`, `ENB-101-B`, `09BAT02`
- Actual on-bus names may differ (check `dga_monitor.py` device list)
- Currently unconfigured devices (09BAT02, TR_B2-1001, TR_B2-1002): configured but not responding on Modbus bus

### Data Retention
- Raw data (`dga_readings`): 3 months
- Summary data (`dga_readings_15min`): 5 years
- Auto-cleanup via cron job

### SSL Certificate
- Self-signed certificate at `/etc/nginx/ssl/server.{crt,key}`
- Browser will show "Not secure" warning — expected for internal use

## File Structure
```
calisto-transformer/
├── README.md
├── .github/workflows/ci.yml       # GitHub Actions CI
├── .gitignore
├── .git/hooks/
│   └── post-merge                 # Auto deploy hook
├── dga_next.sh                    # Helper script (kill + copy + restart)
├── dga-monitor.service            # systemd unit for Python collector
├── dga_aggregate.py               # Cron script for 15-min aggregation
── dga_monitor.py                 # Main Python collector
├── tests/
│   ├── sit.sh                     # System Integration Test
│   └── health_monitor.sh          # Health monitoring cron
├── docs/
│   ├── CI-CD-ARCHITECTURE.md      # CI/CD architecture docs
│   └── TESTING_REPORT.md          # Original test documentation
├── dga-nextjs/
│   ├── README.md                  # Next.js app docs
│   ├── next.config.js             # Next.js config (basePath: '/dga')
│   ├── ecosystem.config.js        # PM2 configuration
│   ├── dga-screenshot.js          # Playwright screenshot script
│   ├── lib/
│   │   ├── db.ts                  # Database pool
│   │   ├── timezone.ts            # Timezone conversion
│   │   ├── gapFill.ts             # Gap filling logic
│   │   ├── readingsNow.ts         # Latest readings query
│   │   └── statistics.ts          # Statistics query
│   ├── __tests__/lib/
│   │   ├── timezone.test.ts       # 10 tests
│   │   ├── gapFill.test.ts        # 9 tests
│   │   ├── readingsNow.test.ts    # 8 tests
│   │   └── statistics.test.ts     # 7 tests
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/              # Login/logout endpoints
│   │   │   ├── devices/           # Device list
│   │   │   ├── readings/          # Historical + now
│   │   │   │   └── now/route.ts   # Latest per device
│   │   │   └── statistics/        # Aggregate stats
│   │   ├── login/                 # Login page (with password toggle)
│   │   └── page.tsx               # Main dashboard
│   ── components/
│       ├── Chart.tsx              # Chart.js wrapper
│       ├── DataTable.tsx          # Static table (unused)
│       ├── DeviceFilter.tsx       # Multi-select device dropdown
│       ├── RealtimeTable.tsx      # Live-updating table
│       ├── StatsPanel.tsx         # Statistics display
│       └── TimeRangeFilter.tsx    # Time range buttons
```

## References
- [Testing Report](docs/TESTING_REPORT.md) — Modbus register map verification, DGA standards
- [CI/CD Architecture](docs/CI-CD-ARCHITECTURE.md) — CI/CD pipeline documentation
