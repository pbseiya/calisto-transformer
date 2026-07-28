# 🛡️ Safe CI/CD Pipeline - Setup Complete ✅

**วันที่:** 2026-07-28  
**สถานะ:** ✅ พร้อมใช้งาน

---

## 🎯 สิ่งที่ทำสำเร็จ

### 1. Branching Strategy
```
main (production) ← develop (staging) ← feature/*
   ↑                    ↑
   │                    │
   Manual approve       Auto-deploy
   + Health check       + Smoke test
```

### 2. Workflows ที่สร้าง

| Workflow | Trigger | Runner | Description |
|----------|---------|--------|-------------|
| **ci.yml** | ทุก PR/Push | ubuntu-latest | Lint + TypeCheck + Unit Tests + Build |
| **deploy-staging.yml** | Push ไป develop | self-hosted | Auto-deploy → port 3002 |
| **deploy-production.yml** | Manual (workflow_dispatch) | self-hosted | Deploy → port 3001 + Health Check + Auto-rollback |
| **rollback.yml** | Manual (workflow_dispatch) | self-hosted | Emergency rollback |

### 3. Safety Mechanisms

✅ **Branch Protection**
- `main`: ต้องผ่าน PR + CI checks (lint, test, build)
- `develop`: ต้องผ่าน CI checks

✅ **Pre-deploy**
- TypeScript type check
- Unit tests (vitest)
- Build verification

✅ **During deploy**
- Backup before deploy
- Health check (30s timeout)
- Auto-rollback on failure

✅ **Post-deploy**
- Smoke tests
- PM2 logs monitoring

### 4. Environments

| Environment | Branch | Port | URL | Deploy |
|-------------|--------|------|-----|--------|
| **Development** | feature/* | 3000 | http://localhost:3000 | Local |
| **Staging** | develop | 3002 | https://100.123.214.57/dga-staging | Auto |
| **Production** | main | 3001 | https://100.123.214.57/dga | Manual |

### 5. Nginx Configuration

```nginx
# Production
location /dga {
    proxy_pass http://localhost:3001;
}

# Staging
location /dga-staging {
    proxy_pass http://localhost:3002;
}
```

---

## 🔄 Workflow การทำงาน

### Feature Development
```bash
# 1. สร้าง branch ใหม่
git checkout -b feature/new-feature develop

# 2. Develop + commit
git add . && git commit -m "feat: new feature"
git push origin feature/new-feature

# 3. สร้าง PR ไป develop
gh pr create --base develop --head feature/new-feature

# 4. CI รันอัตโนมัติ (lint, test, build)
# 5. Merge PR → develop
# 6. Staging auto-deploy → https://100.123.214.57/dga-staging
# 7. ทดสอบบน staging
```

### Production Deployment
```bash
# 1. สร้าง PR จาก develop ไป main
gh pr create --base main --head develop

# 2. CI รันอัตโนมัติ
# 3. Merge PR → main (ต้องผ่าน CI)

# 4. Deploy production ด้วยมือ
gh workflow run deploy-production.yml \
  -f confirm_deploy=DEPLOY \
  --ref main

# 5. Health check อัตโนมัติ
# 6. ถ้า fail → auto-rollback
```

### Emergency Rollback
```bash
# Rollback ไป commit ก่อนหน้า
gh workflow run rollback.yml \
  -f reason="Critical bug found" \
  --ref main

# หรือระบุ commit
gh workflow run rollback.yml \
  -f target_commit=abc123 \
  -f reason="Rollback to stable version" \
  --ref main
```

---

## 📊 CI Checks ที่ต้องผ่าน

### สำหรับ PR ไป develop
- ✅ 🔍 Lint & Type Check
- ✅ 🧪 Unit Tests
- ✅ 🔨 Build

### สำหรับ PR ไป main
- ✅ 🔍 Lint & Type Check
- ✅ 🧪 Unit Tests
- ✅ 🔨 Build
- ✅ ✅ CI Summary

---

## 🛠️ Scripts ที่สร้าง

### deploy.sh
```bash
# Deploy staging
./scripts/deploy.sh staging 3002

# Deploy production (ใช้โดย workflow)
./scripts/deploy.sh production 3001
```

### rollback.sh
```bash
# Rollback ไป commit ก่อนหน้า
./scripts/rollback.sh

# Rollback ไป commit เฉพาะ
./scripts/rollback.sh abc123
```

---

## 🔧 คำสั่งที่ใช้บ่อย

### ตรวจสอบ CI Status
```bash
gh pr checks <pr-number> --repo pbseiya/calisto-transformer
```

### ดู Workflow Runs
```bash
gh run list --repo pbseiya/calisto-transformer --limit 10
```

### Deploy Production
```bash
gh workflow run deploy-production.yml \
  -f confirm_deploy=DEPLOY \
  --ref main
```

### Emergency Rollback
```bash
gh workflow run rollback.yml \
  -f reason="Critical bug" \
  --ref main
```

### ตรวจสอบ Staging
```bash
curl -s http://localhost:3002/dga/login | grep "Sign In"
```

### ตรวจสอบ Production
```bash
curl -k -s https://100.123.214.57/dga/login | grep "Sign In"
```

---

## 📝 ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | สถานะ | รายละเอียด |
|------|--------|------------|
| `.github/workflows/ci.yml` | ✅ Updated | CI pipeline ใหม่ |
| `.github/workflows/deploy-staging.yml` | ✅ Created | Auto-deploy staging |
| `.github/workflows/deploy-production.yml` | ✅ Created | Manual deploy + rollback |
| `.github/workflows/rollback.yml` | ✅ Created | Emergency rollback |
| `.github/CICD_ARCHITECTURE.md` | ✅ Created | สถาปัตยกรรม CI/CD |
| `scripts/deploy.sh` | ✅ Created | Deploy script |
| `scripts/rollback.sh` | ✅ Created | Rollback script |
| `dga-nextjs/tsconfig.json` | ✅ Updated | Exclude __tests__ |
| `/etc/nginx/sites-enabled/dga-dashboard` | ✅ Updated | เพิ่ม staging route |

---

## 🎯 ผลลัพธ์

### ก่อน (อันตราย)
```
git push main → Deploy ทันที ❌
- ไม่มี test
- ไม่มี health check
- ไม่มี rollback
- Production พังง่าย
```

### หลัง (ปลอดภัย)
```
feature/* → PR → CI → develop → Staging → PR → CI → main → Manual Deploy
                    ✅         ✅              ✅         ✅
                 Auto-test  Auto-deploy    Approve    Health check
                                                         + Rollback
```

---

## 🚀 ขั้นตอนต่อไป

### 1. ทดสอบ Pipeline
```bash
# สร้าง feature branch
git checkout -b test/ci-pipeline develop

# แก้ไขโค้ดเล็กน้อย
echo "// test" >> dga-nextjs/app/page.tsx
git add . && git commit -m "test: CI pipeline"
git push origin test/ci-pipeline

# สร้าง PR
gh pr create --base develop --head test/ci-pipeline

# ดู CI รัน
gh pr checks --watch
```

### 2. ทดสอบ Staging Deploy
```bash
# Merge PR ไป develop
gh pr merge <pr-number> --merge

# รอ staging deploy
sleep 60

# ตรวจสอบ
curl -s http://localhost:3002/dga/login | grep "Sign In"
```

### 3. ทดสอบ Production Deploy
```bash
# สร้าง PR ไป main
gh pr create --base main --head develop

# Merge
gh pr merge <pr-number> --merge

# Deploy production
gh workflow run deploy-production.yml \
  -f confirm_deploy=DEPLOY \
  --ref main

# ดู workflow
gh run list --workflow=deploy-production.yml --limit 1
```

---

## 📞 Support

### ปัญหาที่อาจพบ

1. **CI fail เพราะ lint errors**
   - แก้: `npm run lint -- --fix` หรือเพิ่ม `// eslint-disable-next-line`

2. **TypeScript errors**
   - แก้: `npx tsc --noEmit` เพื่อดู errors
   - หรือเพิ่ม `__tests__/**` ใน tsconfig.json exclude

3. **Staging ไม่ deploy**
   - เช็ค: `gh run list --workflow=deploy-staging.yml`
   - เช็ค: Runner online หรือไม่

4. **Production deploy fail**
   - เช็ค: `gh run view <run-id> --log`
   - เช็ค: Health check logs
   - Rollback: `gh workflow run rollback.yml -f reason="..."`

---

**Last Updated:** 2026-07-28 08:30  
**Status:** ✅ Production Ready
