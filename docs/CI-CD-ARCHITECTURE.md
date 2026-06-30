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

## Testing Strategy

DGA Monitor มีระบบทดสอบ 3 ชั้น (Unit → SIT → CI/CD) ที่ทำงานร่วมกันเพื่อให้มั่นใจว่าการเปลี่ยนแปลงจะไม่ทำให้ระบบ production พัง

### Test Pyramid

```
         ┌─────────┐
         │   E2E   │  (Playwright) ← ยังไม่มี
        ┌┴─────────┐
        │    SIT    │  (13 tests) ← ✅ มีแล้ว
       ┌┴───────────┴┐
       │ Unit Tests  │  (53 tests) ← ✅ มีแล้ว
       └─────────────┘
```

### Unit Tests

รันด้วย **Vitest** (fast, ~100ms) ทุกครั้งที่ `npm test`

| Test Suite | Tests | Coverage | File |
|------------|-------|----------|------|
| `timezone.test.ts` | 10 | UTC ↔ Bangkok conversion, 15-min rounding | `__tests__/lib/timezone.test.ts` |
| `gapFill.test.ts` | 9 | 15-min slot filling, null handling | `__tests__/lib/gapFill.test.ts` |
| `readingsNow.test.ts` | 8 | DISTINCT ON query + response format | `__tests__/lib/readingsNow.test.ts` |
| `statistics.test.ts` | 7 | Aggregate functions + parameter binding | `__tests__/lib/statistics.test.ts` |
| `dga-api.test.ts` | 19 | Anomaly API client (mocked fetch) | `__tests__/lib/dga-api.test.ts` |
| **Total** | **53** | **+55% coverage** | |

**Run:**
```bash
cd dga-nextjs
npm test                    # all unit tests
npm test -- dga-api.test.ts # specific file
```

### SIT (System Integration Tests)

2 scripts ที่รัน real HTTP calls ต่อ production environment:

**`tests/sit.sh` (Dashboard — 5 tests)**

| # | Test | Status |
|---|------|--------|
| 1 | Login authentication | ✅ |
| 2 | GET /api/devices | ✅ |
| 3 | GET /api/readings/now | ✅ |
| 4 | GET /dga (frontend) | ✅ |
| 5 | Data integrity check | ✅ |

**`tests/sit-anomaly.sh` (Anomaly API — 8 tests)**

| # | Test | Status |
|---|------|--------|
| 1 | Health endpoint (21 devices) | ✅ |
| 2 | Devices endpoint | ✅ |
| 3 | Anomaly detection | ✅ |
| 4 | Anomaly (invalid device → 404) | ✅ |
| 5 | Drift detection | ✅ |
| 6 | Trend detection | ✅ |
| 7 | Swagger UI accessible | ✅ |
| 8 | OpenAPI JSON accessible | ✅ |

**Run:**
```bash
# Dashboard SIT
bash tests/sit.sh

# Anomaly API SIT only
bash tests/sit-anomaly.sh
```

### CI/CD Pipeline

มีทั้งหมด 4 จุดที่ runs tests อัตโนมัติ:

| Trigger | ทำอะไร | ผลลัพธ์ |
|---------|--------|---------|
| `git push` | GitHub Actions: lint + type + build + **53 unit tests** | PR status ✅/❌ |
| `git pull` (ThinkStation) | Post-merge hook: build + deploy + **SIT 13 tests** + screenshot + Telegram | Deploy or fail |
| Cron `*/5 * * * *` | Health monitor: HTTP + PM2 + API checks | Telegram alert if down |
| Manual | `npm test` + `bash tests/sit.sh` | Local verification |

รวมทั้งหมด:
- **Unit tests:** 53 tests (ทุก push + ทุก pull)
- **SIT tests:** 13 tests (ทุก pull)
- **Health checks:** ทุก 5 นาที (ต่อเนื่อง)

### Test Data Strategy

| Test Type | ข้อมูล | หมายเหตุ |
|-----------|--------|---------|
| Unit | Mock data (TS interfaces) | ไม่ต้องต่อ DB/server |
| Unit (dga-api) | Mock `fetch` API | Simulate network conditions |
| SIT | Live data จาก `dga_readings_15min` | ใช้ device `DA115` เป็น test target |
| SIT | Live API responses | Verify response structure |

### Adding New Tests

**Unit test (เพิ่มไฟล์ใหม่ใน `__tests__/lib/`):**
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../lib/myModule';

describe('myModule', () => {
  it('should do X', () => {
    expect(myFunction(input)).toBe(expected);
  });
});
```

**SIT test (เพิ่มใน `tests/sit.sh`):**
```bash
RESP=$(curl -sf http://localhost:3001/dga/api/my-endpoint)
if echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success']" 2>/dev/null; then
  success "GET /api/my-endpoint"
else
  fail "GET /api/my-endpoint"
fi
```

### Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Unit tests | 53 tests / 5 files | 70+ tests |
| SIT tests | 13 tests / 2 scripts | 20+ tests |
| Critical paths | 100% | 100% |
| lib/ functions | 80%+ | 90%+ |
| E2E tests | 0 | 3+ user flows |

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

## Adding New Tests

### Unit test (เพิ่มไฟล์ใหม่ใน `__tests__/lib/`):
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../lib/myModule';

describe('myModule', () => {
  it('should do X', () => {
    expect(myFunction(input)).toBe(expected);
  });
});
```

### SIT test (เพิ่มใน `tests/sit.sh`):
```bash
RESP=$(curl -sf http://localhost:3001/dga/api/my-endpoint)
if echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success']" 2>/dev/null; then
  success "GET /api/my-endpoint"
else
  fail "GET /api/my-endpoint"
fi
```

## Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Unit tests | 53 tests / 5 files | 70+ tests |
| SIT tests | 13 tests / 2 scripts | 20+ tests |
| Critical paths | 100% | 100% |
| E2E tests | 0 | 3+ user flows |

## References

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [PM2 Process Management](https://pm2.keymetrics.io/docs/usage/process-management/)
- [Nginx Reverse Proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)

