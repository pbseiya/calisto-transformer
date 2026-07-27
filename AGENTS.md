# DGA Monitoring System - Agent Guidelines

**สำหรับ AI Agent ใดๆ ที่จะพัฒนาโปรเจคนี้ (Claude, Hermes, OpenCode, Cursor, etc.)**

---

##  📋 Project Overview

ระบบ DGA (Dissolved Gas Analysis) Monitoring สำหรับตรวจสอบหม้อแปลงไฟฟ้า

### Components
- **Frontend:** Next.js 16.2.9 (React 18, TypeScript)
- **Backend:** FastAPI (Python 3.12)
- **Database:** PostgreSQL
- **Deployment:** PM2 + Nginx on ThinkStation (100.123.214.57)

### URLs
- Production: https://100.123.214.57/dga
- API Docs: http://localhost:8000/docs (via SSH)

---

##  CRITICAL RULES (Must Follow)

### 🚫 NEVER DO

1. **NEVER push without pulling first**
   ```bash
   # WRONG
   git add -A && git commit && git push
   
   # CORRECT
   git pull origin main  # ก่อนเสมอ
   git add -A && git commit && git push
   ```

2. **NEVER deploy without testing**
   ```bash
   # WRONG
   npm run build && pm2 restart
   
   # CORRECT
   npm run build 2>&1 | grep "Type error" && exit 1  # Check for errors
   # Test on production
   curl -k https://100.123.214.57/dga/  # Verify HTTP 200/302/308
   pm2 restart dga-app
   ```

3. **NEVER use mock/random data in production**
   - Backend API ต้อง return ข้อมูลจริงจาก database
   - Calendar heatmap ต้องใช้ `model.detect()` ไม่ใช่ `random.randint()`

4. **NEVER commit TypeScript type errors**
   - Build ต้องผ่าน 100% ไม่มี "Type error" เลย
   - ใช้ `Number(value)` cast สำหรับ recharts formatters

5. **NEVER have duplicate routers in FastAPI**
   - routes.py ต้องมี `router = APIRouter()` แค่ **1 ครั้ง** เท่านั้น
   - เพิ่ม endpoint โดยใช้ `@router.get(...)` ไม่ใช่สร้าง router ใหม่

### ✅ MUST DO

1. **ALWAYS run tests before commit**
   ```bash
   # Frontend
   cd dga-nextjs
   npm run build  # Must pass with no TypeScript errors
   
   # Backend
   cd ../dga-anomaly-detection
   python3 -m pytest tests/ -v  # All tests must pass
   ```

2. **ALWAYS verify production after deploy**
   ```bash
   # Quick check
   curl -k https://100.123.214.57/dga/
   
   # Full verification
   python3 /tmp/verify_production.py  # Playwright test
   ```

3. **ALWAYS sync between machines**
   ```bash
   # เมื่อจะเริ่มทำงาน
   ./scripts/dga-workflow.sh start
   
   # เมื่อจะเลิกทำงาน
   ./scripts/dga-workflow.sh finish
   ```

---

##  🔄 Development Workflow

### Scenario 1: Start Working
```bash
cd ~/projects/calisto-transformer
./scripts/dga-workflow.sh start   # Pull latest from GitHub

# Work on code...

./scripts/dga-workflow.sh finish  # Commit + push before leaving
```

### Scenario 2: Deploy Changes
```bash
# Option A: Deploy from laptop (via SSH)
./scripts/dga-workflow.sh deploy

# Option B: Deploy from ThinkStation directly
ssh seiya@100.123.214.57
cd ~/projects/calisto-transformer/dga-nextjs
npm run build
pm2 restart dga-app
```

### Scenario 3: Hotfix
```bash
# Fix the bug
git add -A
git commit -m "fix: critical bug description"
git push origin main

# Deploy immediately
./scripts/dga-workflow.sh deploy

# Verify
curl -k https://100.123.214.57/dga/
```

---

##  📁 File Structure

### calisto-transformer (Frontend)
```
dga-nextjs/
├── app/
│   ├── page.tsx                    # Main dashboard
│   ├── anomaly-history/page.tsx    # History page
│   └── api/chat/message/route.ts   # ChatBot API
── components/
│   ├── ControlChartsTabs.tsx       # 3-tier charts (CRITICAL)
│   ├── AnomalyGaugeTimeline.tsx    # Multi-device gauges
│   ├── AnomalySummaryPanel.tsx     # Recent anomalies
│   ├── CalendarHeatmap.tsx         # Monthly heatmap
│   └── ChatBotWidget.tsx           # Azure OpenAI chatbot
── lib/
│   └── dga-api.ts                  # API client
└── tests/
    └── anomaly-components.spec.ts  # Playwright tests
```

### dga-anomaly-detection (Backend)
```
api/app/
├── api/
│   └── routes.py                   # ALL endpoints (CRITICAL)
── models/
│   └── hybrid_zscore.py            # Z-score model
├── telegram_alert.py               # Telegram notifications
── config.py                       # Settings
scripts/
└── auto_retrain_baseline.py        # Weekly retrain
```

---

##  🧪 Testing Requirements

### Before Every Commit
1. **Frontend:** `npm run build` must pass with NO TypeScript errors
2. **Backend:** All pytest tests must pass
3. **Production:** Manual verification via Playwright or curl

### Critical Test Cases
- Dashboard loads without React errors
- All 3 control charts render (Shewhart, CUSUM, Reference)
- CUSUM shows UCL at 5σ·h and Warning at 3σ·h
- Multi-device tooltip works
- Calendar heatmap shows real data (not random)

---

##  ⚠️ Common Pitfalls

### 1. TypeScript + Recharts Type Errors
**Problem:** `formatter={(value: number) => ...}` causes build failure  
**Solution:** Use `formatter={(value) => \`${Number(value).toFixed(2)}σ\`}`

### 2. Pydantic Model Access
**Problem:** `scores.get('h2_zscore')` on Pydantic object → AttributeError  
**Solution:** Use `getattr(detection.details, 'h2_zscore', 0)` or `detection.details.h2_zscore`

### 3. Duplicate Router Declarations
**Problem:** Multiple `router = APIRouter()` in routes.py → All endpoints return 404  
**Solution:** Only ONE `router = APIRouter()` at the top of routes.py

### 4. Fetching All Devices
**Problem:** `Promise.allSettled(devices.map(...))` fetches all 22 devices → 404 flood  
**Solution:** Fetch only selected device(s) with error handling

### 5. CUSUM Chart Misunderstanding
**Problem:** Adding LCL to CUSUM chart (confusing)  
**Solution:** CUSUM+ is one-sided (floor at 0), only UCL needed

---

##  🚀 Deployment Procedure

### Step 1: Build & Verify
```bash
cd ~/projects/calisto-transformer/dga-nextjs
npm run build 2>&1 | tee /tmp/build.log

# Check for errors
grep -E "Type error|error TS" /tmp/build.log && exit 1
grep "✓ Compiled successfully" /tmp/build.log || exit 1
```

### Step 2: Deploy to ThinkStation
```bash
# From laptop
ssh seiya@100.123.214.57
cd ~/projects/calisto-transformer
git pull origin main

cd dga-nextjs
npm run build

# Restart PM2
pm2 restart dga-app

# Wait for startup
sleep 10

# Verify
curl -k https://100.123.214.57/dga/
```

### Step 3: Production Verification
```bash
# Quick check
curl -k -o /dev/null -w '%{http_code}' https://100.123.214.57/dga/
# Should return 308 (redirect to /dga/login)

# Full verification
python3 << 'PYEOF'
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--ignore-certificate-errors'])
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto('https://100.123.214.57/dga/login')
    page.fill('#username', 'admin')
    page.fill('#password', 'dga2024')
    page.click('button:has-text("Sign In")')
    page.wait_for_load_state('networkidle', timeout=60000)
    page.wait_for_timeout(10000)
    
    checks = {
        'No React crash': page.evaluate('!document.body.textContent.includes("Minified React error")'),
        'Charts render': page.evaluate("document.querySelectorAll('.recharts-wrapper').length") >= 3,
        'CUSUM UCL': page.evaluate("document.body.textContent.includes('UCL 5σ·h')"),
    }
    
    for k, v in checks.items():
        print(f"  {'✅' if v else ''} {k}")
    
    browser.close()
PYEOF
```

---

##  📚 Lessons Learned

### Bug: Production Down for 2 Hours (2025-07-22)
**Root Cause:** TypeScript type error in CUSUM chart formatter  
**Impact:** 138 PM2 restarts, 502 errors  
**Fix:** Removed type annotation, used `Number()` cast  
**Prevention:** Always check FULL build output, not just last 5 lines

### Bug: All API Endpoints Return 404 (2025-07-22)
**Root Cause:** 5 duplicate `router = APIRouter()` declarations  
**Impact:** Frontend couldn't fetch any data  
**Fix:** Kept only 1 router declaration  
**Prevention:** Search for duplicate router declarations before commit

### Bug: Calendar Shows False Anomalies (2025-07-16)
**Root Cause:** Using `random.randint()` instead of real data  
**Impact:** Users saw red/yellow cells every day  
**Fix:** Changed to `model.detect()`  
**Prevention:** Never use mock data in production code

---

##  🔐 Security Notes

### Credentials (NEVER COMMIT)
- **Azure OpenAI Key:** `/dga-api/chat/message` reads from env
- **Telegram Bot Token:** Hardcoded in `telegram_alert.py` (TODO: move to env)
- **Database Password:** In `config.py` (TODO: use env variable)

### VPN Requirement
- Azure OpenAI endpoint requires GlobalProtect VPN
- Without VPN: ChatBot returns 502 error
- Consider Azure API Management for public access in future

---

##  📞 Support

### Logs
```bash
# Frontend
tail -f ~/.pm2/logs/dga-app-error.log

# Backend
tail -f ~/.pm2/logs/dga-anomaly-api-error.log

# Cron jobs
tail -f ~/logs/dga_weekly.log
```

### Monitoring
```bash
# Check services
pm2 list

# Check API
curl http://localhost:8000/health
curl http://localhost:8000/devices

# Check frontend
curl -k https://100.123.214.57/dga/
```

### Backup Locations
```bash
# Baseline backups
~/projects/dga-anomaly-detection/models_hybrid/*.backup.*

# Crontab backup
/tmp/crontab.backup
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-07-22  
**Maintained By:** Pongsak (lead developer)

**For questions or clarifications, check commit history or logs.**

---

##  🔗 Cross-Repo Workflow (CRITICAL)

โปรเจคนี้มี **2 repos** ที่ต้อง sync กันเสมอ:

| Repo | Branch | Location |
|------|--------|----------|
| **calisto-transformer** (Frontend) | `main` | `~/projects/calisto-transformer/` |
| **dga-anomaly-detection** (Backend) | `master` | `~/projects/dga-anomaly-detection/` |

###  Golden Rules

1. **ALWAYS pull ก่อนเริ่มทำงาน** — จาก GitHub หรือจากเครื่องอื่น
2. **ALWAYS push เมื่อเลิกทำงาน** — เพื่อให้เครื่องอื่น pull ได้
3. **NEVER commit โดยไม่ pull ก่อน** — จะเกิด conflict
4. **NEVER deploy โดยไม่ test ก่อน** — production จะพัง

###  Workflow Commands

ใช้ script เดียวกันจาก repo ไหนก็ได้:
```bash
./scripts/dga-workflow.sh <command>
```

| Command | Shortcut | Action |
|---------|----------|--------|
| `start` | `x` | Pull ทั้ง 2 repos จาก GitHub |
| `finish` | `save` | Commit + push ทั้ง 2 repos |
| `deploy` | - | Build + restart PM2 on ThinkStation |
| `status` | `st` | แสดงสถานะทั้ง 2 repos |
| `test` | `t` | รัน tests ทั้ง frontend + backend |
| `sync` | `reset` | Force sync กับ GitHub (ทำลาย local changes) |

###  Typical Workflow

```bash
# 1. เริ่มทำงาน (เครื่องไหนก็ได้)
./scripts/dga-workflow.sh start

# 2. แก้ code
# ... edit files ...

# 3. ทดสอบ
./scripts/dga-workflow.sh test

# 4. Deploy (ถ้าต้องการ)
./scripts/dga-workflow.sh deploy

# 5. เสร็จแล้ว push กลับ GitHub
./scripts/dga-workflow.sh finish
```

###  Scenario: ทำงานสลับ 2 เครื่อง

```
┌─────────────┐     push      ┌──────     pull     ┌─────────────┐
│   Laptop    │ ───────────> │GitHub│ ───────────> │ ThinkStation│
│  (Latitude) │               │ main │               │  (seiya)    │
│             │ <──────────── │      │ <──────────── │             │
└─────────────┘     pull      └──────┘     push     └─────────────┘
```

**ตัวอย่าง:**
```bash
# เช้า: ทำงานที่ ThinkStation
./scripts/dga-workflow.sh start   # Pull จาก GitHub
# แก้ code, test, deploy...
./scripts/dga-workflow.sh finish  # Push กลับ GitHub

# บ่าย: ย้ายมาทำงานที่ Laptop
./scripts/dga-workflow.sh start   # Pull code จาก ThinkStation
# ทำงานต่อ...
./scripts/dga-workflow.sh finish  # Push กลับ GitHub
```

###  Deployment Checklist

ก่อน deploy ต้องผ่านทั้ง 3 ข้อ:
```bash
# 1. Build ต้องผ่าน (ไม่มี Type error)
cd dga-nextjs && npm run build 2>&1 | grep -E "Type error|✓ Compiled"

# 2. Tests ต้องผ่าน
python3 -m pytest tests/ -v  # Backend
npx playwright test          # Frontend (optional)

# 3. Production ต้อง UP หลัง restart
curl -k https://100.123.214.57/dga/  # ต้องได้ HTTP 200/302/308
```

###  Emergency: Production พัง

```bash
# 1. เช็ค PM2
pm2 list
pm2 logs dga-app --lines 50

# 2. ถ้า build พัง → rebuild
cd ~/projects/calisto-transformer/dga-nextjs
npm run build
pm2 restart dga-app

# 3. ถ้า API พัง → restart
pm2 restart dga-anomaly-api

# 4. Verify
curl -k https://100.123.214.57/dga/
```

###  File Locations Reference

**Frontend (calisto-transformer):**
```
dga-nextjs/
├── app/page.tsx                          # Main dashboard
├── components/
│   ├── ControlChartsTabs.tsx             # 3-tier charts
│   ├── AnomalyGaugeTimeline.tsx          # Multi-device gauges
│   ── AnomalySummaryPanel.tsx           # Recent anomalies
└── tests/anomaly-components.spec.ts      # Playwright tests
```

**Backend (dga-anomaly-detection):**
```
api/app/
├── api/routes.py                         # ALL endpoints
├── models/hybrid_zscore.py               # Z-score model
└── telegram_alert.py                     # Telegram notifications
```

**Scripts (shared via symlink):**
```
calisto-transformer/scripts/
└── dga-workflow.sh                       # Main workflow script
    ↑
dga-anomaly-detection/scripts/
└── dga-workflow.sh -> (symlink)          # Points to above
```

###  Common Mistakes to Avoid

1. **Duplicate `router = APIRouter()`** ใน routes.py → ทุก endpoint return 404
2. **TypeScript type annotation ใน recharts formatter** → Build fail → 502
3. **Pydantic model access ด้วย `.get()`** → AttributeError (ใช้ `getattr` แทน)
4. **Fetch ทุก 22 devices พร้อมกัน** → 404 flood (fetch เฉพาะ selected devices)
5. **CUSUM มี LCL** → ผิดหลักสถิติ (CUSUM+ เป็น one-sided, floor ที่ 0)

---

**EOF**

echo "✅ Cross-repo workflow section created ($(wc -l < /tmp/cross-repo-section.md) lines)"