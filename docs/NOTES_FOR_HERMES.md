# 📋 สิ่งที่ต้องรู้ก่อนเริ่มทำงาน (อ่านก่อน AGENTS.md)

**สำหรับ:** Hermes Agent (Project-B) บน ThinkStation (seiya)  
**วันที่:** 2025-07-27

---

## ⚠️ ข้อจำกัดสำคัญ: DCL + Tailscale

### สถาปัตยกรรมการ sync

```
┌────────────       push        ┌────────┐       pull       ┌─────────────┐
│   Laptop   │  ───────────────> │GitHub  │ ───────────────> │ ThinkStation│
│ (Latitude) │    (ทำได้)        │ main/  │    (ทำได้)        │   (seiya)   │
└────────────┘                   │ master │                   └─────────────┘
       ^                              │                              │
       │                              │                              │
       │     ทิศทางนี้ใช้ไม่ได้       │                              │
       │    (DCL policy บล็อค)         │                              │
       └──────────────────────────────┘──────────────────────────────┘
                 SSH เข้า Latitude ไม่ได้จาก ThinkStation
```

**สรุปสั้น:**
- ✅ **Laptop → ThinkStation:** ได้ (SSH ผ่าน Tailscale)
- ❌ **ThinkStation → Laptop:** ไม่ได้ (DCL policy)
- ✅ **ทั้ง 2 เครื่อง → GitHub:** ได้
- ดังนั้น ThinkStation ต้องพึ่ง GitHub เป็นสื่อกลางเท่านั้น

---

## 🔄 Workflow ที่ถูกต้องสำหรับ ThinkStation

### ✅ DO: "Pull จาก GitHub → ทำงาน → Push กลับ GitHub"

```bash
# เมื่อเริ่มทำงาน
cd ~/projects/calisto-transformer
./scripts/dga-workflow.sh start    # git pull จาก GitHub

# แก้ code, test, deploy...
npm run build && pm2 restart dga-app

# เมื่อเลิกทำงาน (สำคัญมาก!)
./scripts/dga-workflow.sh finish   # git commit + push ไป GitHub
```

### ❌ DON'T: สมมติว่า laptop จะ pull เอง

- **อย่าคิดว่า** laptop จะ sync มาหาเอง
- **ต้อง push กลับ GitHub ทุกครั้ง** ที่เลิกทำงาน
- ถ้าลืม push → laptop จะทำงานจาก code เก่า → เกิด conflict ตอน push ครั้งถัดไป

---

## 📌 กฎเหล็ก 5 ข้อ

1. **เริ่มทำงาน → `start` เสมอ** — pull code ใหม่จาก GitHub
2. **เลิกทำงาน → `finish` เสมอ** — push กลับ GitHub ก่อนปิดเครื่อง
3. **อย่าแก้ไฟล์ที่ laptop กำลังทำงานอยู่พร้อมกัน** — ใช้ lock ด้วย Git
4. **อย่า SSH เข้า laptop** — ทำไม่ได้ตาม DCL policy
5. **Deploy ทำที่ ThinkStation โดยตรง** — อย่าพึ่ง laptop เป็น proxy

### ถ้าต้องให้ laptop deploy ไป ThinkStation
- Laptop ใช้ `dga-workflow.sh deploy` (SSH เข้า ThinkStation ได้)
- แต่ ThinkStation deploy ตัวเองได้เลย เพราะ PM2 อยู่ที่ ThinkStation แล้ว

---

##  Deploy Procedure (ทำจาก ThinkStation)

```bash
# Frontend
cd ~/projects/calisto-transformer/dga-nextjs
npm run build && pm2 restart dga-app

# Backend (ถ้าแก้ API)
cd ~/projects/dga-anomaly-detection
pm2 restart dga-anomaly-api

# Verify
sleep 5
curl -k https://100.123.214.57/dga/   # ต้องได้ 200/302/308
```

---

## 📂 ไฟล์ที่ต้องอ่าน (ตามลำดับ)

1. **ไฟล์นี้** (`NOTES_FOR_HERMES.md`) — Architecture + กฎ
2. **`AGENTS.md`** — Rules และ conventions
3. **`docs/PROJECT_HANDOVER.md`** — Status + Next Steps

---

##  งานที่ควรทำต่อ (จาก Priority)

| # | งาน | ไฟล์ที่ต้องแก้ | ความสำคัญ |
|---|-----|---------------|-----------|
| 1 | **Fix Telegram Alert Auto-trigger** | `api/app/api/routes.py` | ⭐⭐⭐ |
| 2 | **Implement Real Retrain** | `api/app/models/hybrid_zscore.py` | ⭐⭐⭐ |
| 3 | **Connect Database** | `api/app/config.py`, `models/hybrid_zscore.py` | ⭐⭐ |
| 4 | **CI/CD Pipeline** | `.github/workflows/deploy.yml` | ⭐⭐ |
| 5 | **Multi-Gas Charts** | `components/ControlChartsTabs.tsx` | ⭐ |

### รายละเอียดงาน #1 (Telegram Auto-trigger)

ใน `api/app/api/routes.py` endpoint `get_control_charts`:
- เมื่อ `alert_24h or alert_7d or alert_30d` เป็น True → เรียก `TelegramAlert().send_alert(...)`
- Credentials พร้อมแล้ว (`telegram_alert.py`)
- Tดสอบโดย set ค่า z-score ให้สูงแล้วเรียก endpoint

### รายละเอียดงาน #2 (Real Retrain)

ใน `api/app/models/hybrid_zscore.py` เมธอด `retrain()`:
- ปัจจุบันเป็น placeholder (return success แต่ไม่ train จริง)
- ต้อง query database → คำนวณ mean/std ใหม่ → save baseline
- ต้อง backup baseline เก่าก่อน (ใช้ `shutil.copy2`)

---

##  การทดสอบ

### Backend (pytest)
```bash
cd ~/projects/dga-anomaly-detection
python3 -m pytest tests/ -v
```

### Frontend (Playwright) — ต้องรันเมื่อ laptop ส่งมา
```bash
# ถ้า laptop SSH เข้ามา test:
cd ~/projects/calisto-transformer/dga-nextjs
npx playwright test tests/anomaly-components.spec.ts
```

### Manual Verify
```bash
curl http://localhost:8000/health
curl http://localhost:8000/anomaly/control-charts?device=DA115
curl -k https://100.123.214.57/dga/
```

---

## 🐛 Common Pitfalls ที่ต้องระวัง

1. **Duplicate routers** — routes.py ต้องมี `router = APIRouter()` แค่ครั้งที่ 1
2. **HTTPException ถูก generic Exception catch** — ต้อง `except HTTPException: raise` ก่อน
3. **Pydantic model access** — ใช้ `getattr()` ไม่ใช่ `.get()`
4. **TypeScript formatter** — ใช้ `Number(value).toFixed()` ไม่ใช่ `(value: number)`
5. **CUSUM เป็น one-sided** — มีแต่ UCL (5σ·h) ไม่มี LCL

---

## 📞 ถ้ามีปัญหา

### Logs
```bash
# Frontend
tail -f ~/.pm2/logs/dga-app-error.log

# Backend
tail -f ~/.pm2/logs/dga-anomaly-api-error.log

# Cron
tail -f ~/logs/dga_weekly.log
```

### PM2
```bash
pm2 list
pm2 logs dga-app --lines 50
pm2 restart dga-app
pm2 restart dga-anomaly-api
```

### Git (ถ้าติด conflict)
```bash
# ดูว่าอะไรขัดกัน
git status
git diff

# ถ้าอยากเริ่มใหม่หมด (⚠️ ลบการแก้ไขทั้งหมด)
./scripts/dga-workflow.sh sync
```

---

## ✅ Checklist ก่อนเริ่มทำงาน

- [ ] อ่านไฟล์นี้จบ
- [ ] อ่าน `AGENTS.md` จบ
- [ ] รัน `./scripts/dga-workflow.sh start` — pull code ใหม่
- [ ] เช็คว่า `git status` clean
- [ ] ดู `docs/PROJECT_HANDOVER.md` ว่าต้องทำอะไรต่อ
- [ ] เลือกงาน 1 งานจาก Priority list
- [ ] เริ่มทำงาน

## ✅ Checklist ก่อนเลิกทำงาน

- [ ] Push ทั้ง 2 repos กลับ GitHub
- [ ] Run `./scripts/dga-workflow.sh status` — ดูว่า clean
- [ ] ถ้า deploy แล้ว → verify production ด้วย `curl -k https://100.123.214.57/dga/`
- [ ] จดไว้ใน log ว่าทำอะไรไปบ้าง

---

## 📝 บันทึกการทำงานของคุณ

ใช้ไฟล์นี้เพิ่มบรรทัดทุกครั้งที่ทำงานเสร็จ:

```markdown
### 2025-07-27 (Session 1 — Hermes)
- งานที่ทำ: Priority #1 — Fix Telegram Alert Auto-trigger
- Commit: 9de3d59 (master → dga-anomaly-detection)
- ผลลัพธ์:
  - ✅ แก้ duplicate router bug (5 routers → 1) — /health, /devices, /anomaly กลับมาทำงาน
  - ✅ สร้าง telegram_alert.py (TelegramAlert class)
  - ✅ เพิ่ม auto-trigger ใน /anomaly/control-charts
  - ✅ เพิ่ม /test-telegram endpoint
  - ✅ แก้ test_control_charts.py port 9000→8000 — 23/23 tests pass
  - ✅ Production verified: /health, /devices, /control-charts, frontend 308
  - ⚠️ Telegram chat not found — bot ยังไม่มีใคร /start (chat_id=-4736485987)
```

---

**พร้อมแล้ว — เริ่มทำงานได้เลย!**
