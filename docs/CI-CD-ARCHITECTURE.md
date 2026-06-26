# CI/CD Architecture

## Overview

DGA Monitor ใช้ **Git Hook-based CI/CD** แทน GitHub Actions เนื่องจากข้อจำกัดด้าน network และ infrastructure

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Developer Machine                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │  Code Edit   │────▶│  git commit  │────▶│  git push    │   │
│  └──────────────┘     └──────────────┘     └──────┬───────┘   │
───────────────────────────────────────────────────┼───────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Repository                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  pbseiya/calisto-transformer (private)                   │  │
│  │  Branch: main                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                                    │
                                                    │ git pull
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ThinkStation (100.123.214.57)                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  .git/hooks/post-merge (triggered on git pull)           │  │
│  │                                                          │  │
│  │  Step 1: npm run build                                   │  │
│  │     └─ Build Next.js app → .next/standalone              │  │
│  │                                                          │  │
│  │  Step 2: Copy static files                               │  │
│  │     └─ .next/static → .next/standalone/.next/static      │  │
│  │     └─ public → .next/standalone/public                  │  │
│  │                                                          │  │
│  │  Step 3: pm2 restart dga-app                             │  │
│  │     └─ Restart Node.js server (port 3001)                │  │
│  │                                                          │  │
│  │  Step 4: Health check                                    │  │
│  │     └─ curl localhost:3001/dga → expect HTTP 200/307     │  │
│  │                                                          │  │
│  │  Step 5: Playwright screenshot                           │  │
│  │     └─ Login → Click 7d → Capture dashboard              │  │
│  │                                                          │  │
│  │  Step 6: Telegram notification                           │  │
│  │     └─ Send photo + caption to Deployment Alert group    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ──────────────────────────────────────────────────────────┐  │
│  │  Services Running                                        │  │
│  │                                                          │  │
│  │  • PM2: dga-app (Next.js, port 3001)                     │  │
│  │  • Nginx: HTTPS reverse proxy (:443 → :3001)             │  │
│  │  • PostgreSQL: Docker container (postgres_db)            │  │
│  │  • systemd: dga-monitor.service (Python collector)       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                                    │
                                                    │ Telegram API
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Telegram                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Group: Deployment Alert (-1004499459935)                │  │
│  │  Topic: DGA (thread_id: 6)                               │  │
│  │                                                          │  │
│  │  Message: 🚀 DGA Dashboard deployed                      │  │
│  │  Photo: Dashboard screenshot                             │  │
│  │  Caption: Host, Time, Branch, Commit                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Why Git Hook Instead of GitHub Actions?

### Network Constraints
- ThinkStation อยู่หลัง Tailscale VPN (100.123.214.57)
- GitHub Actions runners (Ubuntu cloud) **ไม่สามารถ SSH เข้า ThinkStation ได้โดยตรง**
- ต้องเปิด port forwarding หรือใช้ reverse tunnel → security risk + complexity

### Comparison: Git Hook vs GitHub Actions

| Aspect | Git Hook (Current) | GitHub Actions |
|--------|-------------------|----------------|
| **Trigger** | `git pull` on server | `git push` to GitHub |
| **Runner Location** | On ThinkStation (local) | GitHub cloud (remote) |
| **Network Access** | Direct access to DB, PM2, Nginx | Must SSH through Tailscale |
| **Build Context** | Has node_modules, .env, Docker | Must copy secrets via GitHub Secrets |
| **Screenshot** | Playwright on local Chrome | Must install browsers in runner |
| **Speed** | ~2-3 minutes (local build) | ~5-10 minutes (cloud + SSH) |
| **Security** | No external access needed | Requires SSH keys in GitHub Secrets |
| **Cost** | Free (local resources) | Free tier (2000 min/month) |
| **Complexity** | Simple bash script | YAML workflow + SSH action |

### Why Not Both?
litellm-proxy ใช้ **GitHub Actions + SSH** เพราะ:
- มี Cloudflare Worker (ต้อง deploy จาก cloud)
- มี keys-service Docker container (ต้อง rebuild image)
- Infrastructure อยู่บน asus-z170k ที่ expose SSH port

DGA Monitor ใช้ **Git Hook** เพราะ:
- ทุกอย่างอยู่บน ThinkStation เครื่องเดียว
- ไม่ต้องการ external deployment
- ต้องการ screenshot จาก browser จริงบน server
- ง่ายกว่า — แค่ `git pull` แล้ว hook ทำงานเอง

## Failure Handling

### Build Failure
```bash
npm run build > /tmp/build.log 2>&1 || {
  echo "❌ Build failed"
  cat /tmp/build.log
  exit 1  # Hook stops here, no deploy
}
```
- ถ้า build fail → hook exit ทันที → ไม่ restart PM2 → ไม่ส่ง Telegram
- Log เก็บไว้ที่ `/tmp/build.log` สำหรับ debug

### Health Check Failure
```bash
if curl -sf http://localhost:3001/dga > /dev/null 2>&1; then
  echo "✅ Dashboard running"
else
  echo "❌ Dashboard not responding"
  exit 1  # Hook stops, no Telegram sent
fi
```
- ถ้า PM2 restart แล้ว health check fail → hook exit → ไม่ส่ง Telegram
- ต้องเช็ค `pm2 logs dga-app` ด้วยตัวเอง

### Screenshot Failure (Non-blocking)
```bash
node dga-screenshot.js "$SCREENSHOT" 2>/dev/null || {
  echo "⚠️ Screenshot failed"
  SCREENSHOT=""  # Continue without screenshot
}
```
- ถ้า Playwright fail → ส่ง Telegram แบบ text-only (ไม่มีรูป)
- ไม่หยุด workflow

### Telegram API Failure (Non-blocking)
```bash
curl -s "https://api.telegram.org/bot..." || {
  echo "⚠️ Telegram notification failed"
  # Continue — deploy สำเร็จแล้ว
}
```
- ถ้า Telegram API down → deploy ยังสำเร็จอยู่
- แค่ไม่มีการแจ้งเตือน

## Rollback Strategy

### Manual Rollback
```bash
# 1. Checkout previous commit
git checkout HEAD~1

# 2. Rebuild
cd dga-nextjs
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone

# 3. Restart
pm2 restart dga-app
```

### Git Revert
```bash
# Revert last commit
git revert HEAD

# Push to trigger hook
git push origin main

# On ThinkStation
git pull  # Hook will auto-deploy reverted version
```

## Monitoring

### Hook Logs
```bash
# Check hook execution log
tail -f /tmp/dga-hook.log

# Check PM2 logs
pm2 logs dga-app --lines 50

# Check build logs
tail -f /tmp/build.log
```

### Telegram Notifications
- ทุก deployment ที่สำเร็จ → ส่งรูป + caption ไปกลุ่ม
- ถ้าไม่ได้รับ notification → เช็ค:
  1. `git pull` ทำงานไหม?
  2. Hook file มี execute permission ไหม? (`ls -la .git/hooks/post-merge`)
  3. Telegram bot token ยัง valid ไหม?

## Security Considerations

### Bot Token in Hook
- Bot token (`8749140014:AAExxdykao56dzA26lmkf4zyOsUbN0w8sE8`) hardcode ใน hook
- **Risk**: ถ้า repo leak → token leak
- **Mitigation**: 
  - Repo เป็น private
  - Token ใช้ได้เฉพาะส่งข้อความไป group ที่กำหนด
  - ควรย้ายไป environment variable ในอนาคต

### SSH Keys
- ไม่ใช้ SSH keys ใน CI/CD (ต่างจาก litellm-proxy)
- Hook รันบน server โดยตรง → ไม่ต้อง SSH เข้าตัวเอง

### Database Credentials
- `.env.production` มี DB password → **untracked** (อยู่ใน .gitignore)
- ต้อง copy manually ตอน setup ครั้งแรก
- **TODO**: Rotate credentials ที่เคย commit ใน git history

## Future Improvements

### 1. Environment-based Config
```bash
# Move bot token to environment
export TELEGRAM_BOT_TOKEN="..."
export TELEGRAM_CHAT_ID="-1004499459935"
export TELEGRAM_THREAD_ID="6"
```

### 2. Structured Logging
```bash
# Use JSON logs for better parsing
echo '{"timestamp":"2026-06-25T23:00:00Z","level":"info","message":"Build started"}' >> /var/log/dga-deploy.json
```

### 3. Slack/Discord Webhook (Alternative)
```bash
# Support multiple notification channels
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"DGA Deployed"}' \
    $SLACK_WEBHOOK_URL
fi
```

### 4. Automated Rollback on Health Check Failure
```bash
# If health check fails, auto-rollback to previous version
if ! curl -sf http://localhost:3001/dga > /dev/null; then
  echo "❌ Health check failed, rolling back..."
  pm2 restart dga-app --update-env  # Use previous .next/standalone
  exit 1
fi
```

### 5. GitHub Actions Hybrid (Optional)
```yaml
# .github/workflows/deploy.yml
name: Deploy DGA
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: SSH to ThinkStation
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.THINKSTATION_IP }}
          username: seiya
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ~/projects/calisto-transformer
            git pull origin main
            # Hook will trigger automatically
```

## References

- [Post-merge Hook Documentation](https://git-scm.com/docs/githooks#_post_merge)
- [PM2 Process Management](https://pm2.keymetrics.io/docs/usage/process-management/)
- [Playwright Screenshot](https://playwright.dev/docs/api/class-page#page-screenshot)
- [Telegram Bot API](https://core.telegram.org/bots/api#sendphoto)
- [litellm-proxy CI/CD](https://github.com/pbseiya/litellm-proxy/blob/main/.github/workflows/deploy.yml) — สำหรับเปรียบเทียบ
