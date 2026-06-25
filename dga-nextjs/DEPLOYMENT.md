# DGA Deployment Guide

## Infrastructure

- **Host**: seiya-ThinkStation (100.123.214.57 via Tailscale, 10.28.15.77 local)
- **OS**: Ubuntu Linux
- **Node.js**: 20 (installed directly on host — Docker builds fail due to TLS timeouts)
- **PostgreSQL**: Docker container `postgres_db`
- **Process Manager**: PM2
- **Web Server**: Nginx (HTTPS reverse proxy)
- **SSL**: Self-signed cert at `/etc/nginx/ssl/server.{crt,key}`

## Services

### Python Collector (`dga-monitor.service`)
```bash
sudo systemctl status dga-monitor
sudo journalctl -u dga-monitor -f
```
- Polls devices every 15s via Modbus TCP
- Logs to `/var/log/dga_monitor.log` (or stdout)
- Auto-restart on failure (10s delay)

### Next.js Dashboard (PM2)
```bash
pm2 status
pm2 logs dga-app
pm2 restart dga-app
```
- Runs on port 3001
- Managed via `ecosystem.config.js`

### Nginx
```bash
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx
```
- Reverse proxy: `https://10.28.15.77/dga` → `http://localhost:3001/dga`
- IP allow: 10.28.0.0/16, 10.29.0.0/16, 100.64.0.0/10 (Tailscale), 192.168.0.0/16 (VPN)

## Deployment Workflow

### Manual Deploy
```bash
cd ~/projects/calisto-transformer/dga-nextjs
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone
pm2 restart dga-app
```

### Auto-Deploy (Git Hook)
Post-merge hook at `.git/hooks/post-merge` triggers on every `git pull`:
1. `npm run build`
2. Copy static files to standalone
3. `pm2 restart dga-app`
4. Health check (`curl localhost:3001/dga`)
5. Take dashboard screenshot via Playwright
6. Send photo + caption to Telegram

### Telegram Notifications
- **Bot**: Think-Hermes-ProjectB (`8749140014:AAExxdykao56dzA26lmkf4zyOsUbN0w8sE8`)
- **Supergroup**: Deployment Alert (`-1004499459935`)
- **Topic**: DGA (thread_id: `6`)

## Database

### Connection
```
postgresql://postgres:mysecretpassword@localhost:5432/dga_monitor
```

### Tables
- `dga_readings` — Raw 15s readings (retention: 3 months)
- `dga_readings_15min` — 15-min aggregated summaries (retention: 5 years)

### Aggregation
Cron job runs `dga_aggregate.py` every 15 minutes to populate summary table.

## Troubleshooting

### API returns null data
- Check timezone: DB stores Bangkok local time, pg driver may interpret as UTC
- Fix: `toBangkokLocal()` in `app/api/readings/route.ts`

### Chart Y-axis capped at 500 ppm
- DA115 has values ~1221 ppm (above IEC danger level)
- Fix: `suggestedMax` calculation in `components/Chart.tsx`

### Real-Time Data table shows dashes
- Old DataTable pulled from summary table (missing unaggregated devices)
- Fix: Use `/api/readings/now` endpoint + `RealtimeTable.tsx`

### PM2 restart count increasing
- Check logs: `pm2 logs dga-app --lines 50`
- Common: `host.docker.internal` DNS failure (Docker-specific hostname)
- Fix: Use `localhost` in DATABASE_URL

### Build fails with exit 0 but no standalone output
- Check for TypeScript errors: `npm run build` output
- Common: `normalized: true` in Chart.js config causes silent failure
- Fix: Remove invalid Chart.js options

## Backup

Database backup script runs daily via cron:
```bash
docker exec postgres_db pg_dump -U postgres dga_monitor > /backup/dga_monitor_$(date +%Y%m%d).sql
```
