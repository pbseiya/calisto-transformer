# DGA Next.js Dashboard

Real-time DGA monitoring dashboard built with Next.js 14, Chart.js, and PostgreSQL.

## Quick Start

```bash
cd dga-nextjs
npm install
npm run dev
```

Open [http://localhost:3000/dga](http://localhost:3000/dga)

## Production Build

```bash
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone
pm2 restart dga-app
```

## API Endpoints

### GET `/dga/api/devices`
Returns list of configured devices.
```json
{ "success": true, "devices": [{ "name": "DA115", "ip": "10.31.204.5", "type": "DA" }] }
```

### GET `/dga/api/readings?devices=DA115&start=...&end=...&source=summary`
Historical data with 15-minute gap filling.
- `source`: `summary` (default) or `raw`
- `start`/`end`: ISO timestamps (converted to Bangkok local time server-side)
- Returns array with one row per 15-min slot per device (null for missing slots)

### GET `/dga/api/readings/now?devices=DA115,DA08`
Latest reading per device from raw table. Used by RealtimeTable component.
```json
{
  "success": true,
  "data": [
    { "device_name": "DA115", "timestamp": "2026-06-25T21:08:38+07:00", "h2": 1219, "co": 555, "wc": 9 }
  ],
  "count": 1
}
```

### GET `/dga/api/statistics?devices=DA115&start=...&end=...`
Aggregate statistics (mean/min/max/stdev/alarm counts) per device.

### POST `/dga/api/auth/login`
IRPC Active Directory authentication with fallback to admin/dga2024.
```json
{ "username": "admin", "password": "dga2024" }
```

### POST `/dga/api/auth/logout`
Clears session cookie.

## Components

### Chart.tsx
Chart.js wrapper with:
- Time-range aware axis labels (`HH:mm` for 24h, `MMM d HH:mm` for 7d/30d)
- Dynamic Y-axis scaling via `suggestedMax` calculation
- Zoom/pan via chartjs-plugin-zoom
- Threshold lines (warning/danger)
- `spanGaps: false` to break lines at null data points

### RealtimeTable.tsx
Live-updating table that fetches from `/api/readings/now` every 15 seconds.
- Shows H2, CO, WC values with color-coded status (green/yellow/red)
- Independent from chart data source

### DataTable.tsx
Static table using data from `/api/readings` (historical). Used for time-range filtered views.

### DeviceFilter.tsx
Multi-select dropdown for device selection.

### TimeRangeFilter.tsx
Buttons for time range selection (15m/1h/6h/24h/7d/30d/custom).

### StatsPanel.tsx
Statistics display (avg/min/max/stdev/alarm counts).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DB_PASSWORD` | Database password |
| `NEXTAUTH_SECRET` | Session encryption key |
| `NEXTAUTH_URL` | Base URL for auth callbacks |
| `DGA_USERNAME` | Fallback admin username |
| `DGA_PASSWORD` | Fallback admin password |
| `TELEGRAM_BOT_TOKEN` | Bot token for notifications |
| `TELEGRAM_CHAT_ID` | Telegram chat/group ID |
| `IRPC_AUTH_URL` | IRPC AD authentication endpoint |

## Deployment

Managed by PM2 via `ecosystem.config.js`. Auto-deploy triggered by post-merge git hook (build + restart + Telegram notification).

## Notes

- Port 3001 (not 3000 — port 3000 used by other apps)
- Self-signed SSL at `/etc/nginx/ssl/server.{crt,key}`
- Timezone: Asia/Bangkok (UTC+7) throughout
