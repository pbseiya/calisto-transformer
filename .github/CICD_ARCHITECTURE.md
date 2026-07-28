# CI/CD Pipeline Architecture

## 🌿 Branching Strategy

```
main (production) ← develop (staging) ← feature/*
   ↑                    ↑
   │                    │
   Manual approve       Auto-deploy
   + Health check       + Smoke test
```

## 🔄 Pipeline Flow

### 1. Feature Development
```
feature/* → PR to develop
   ↓
CI: lint + typecheck + unit tests + build
   ↓
✅ Pass → Merge to develop
```

### 2. Staging Deployment (Auto)
```
develop branch
   ↓
CI: Full test suite
   ↓
CD: Deploy to staging (port 3002)
   ↓
Smoke test: Health check + Basic functionality
   ↓
✅ Pass → Ready for production
```

### 3. Production Deployment (Manual)
```
develop → PR to main
   ↓
CI: Full test suite + E2E tests
   ↓
⏸️ Manual approval required
   ↓
CD: Deploy to production (port 3001)
   ↓
Health check (30s timeout)
   ↓
✅ Pass → Deploy success
❌ Fail → Auto-rollback to previous version
```

## 🛡️ Safety Mechanisms

### Pre-deploy
- ✅ Branch protection: main requires PR + approval
- ✅ Status checks: CI must pass before merge
- ✅ Build verification: Must build successfully
- ✅ Type safety: No TypeScript errors

### During deploy
- ✅ Atomic deployment: Build complete before swap
- ✅ Health check: Automated after deploy
- ✅ Rollback trigger: On health check failure

### Post-deploy
- ✅ Smoke tests: Basic functionality check
- ✅ Monitoring: PM2 logs + error tracking
- ✅ Rollback plan: `git revert` + redeploy

## 📊 Environments

| Environment | Branch | Port | Deploy | URL |
|-------------|--------|------|--------|-----|
| **Development** | feature/* | 3000 | Local | http://localhost:3000 |
| **Staging** | develop | 3002 | Auto | https://100.123.214.57/dga-staging |
| **Production** | main | 3001 | Manual | https://100.123.214.57/dga |

## 🔧 GitHub Configuration Required

### 1. Branch Protection Rules

**main branch:**
- Require pull requests before merging ✅
- Require approvals: 1 ✅
- Require status checks to pass ✅
- Require branches to be up to date ✅
- Include administrators ✅

**develop branch:**
- Require pull requests before merging ✅
- Require status checks to pass ✅

### 2. Environments

**staging:**
- No protection (auto-deploy)

**production:**
- Required reviewers: @pbseiya
- Wait timer: 0 (manual approve)

### 3. Secrets

- `THINKSTATION_HOST`: 100.123.214.57
- (No SSH needed - self-hosted runner)

## 🚀 Deployment Scripts

### Staging
```bash
cd ~/projects/calisto-transformer
git checkout develop
git pull origin develop

cd dga-nextjs
npm ci
npm run build

# Start staging on port 3002
pm2 delete dga-staging || true
PORT=3002 pm2 start npm --name "dga-staging" -- start

# Verify
curl http://localhost:3002/dga/login
```

### Production
```bash
cd ~/projects/calisto-transformer
git checkout main
git pull origin main

cd dga-nextjs
npm ci
npm run build

# Backup current build
cp -r .next .next.backup

# Deploy
pm2 restart dga-app

# Health check
sleep 10
curl -k https://100.123.214.57/dga/

# Rollback if failed
if [ $? -ne 0 ]; then
  echo "❌ Health check failed, rolling back..."
  rm -rf .next
  mv .next.backup .next
  pm2 restart dga-app
  exit 1
fi

echo "✅ Deploy success"
```

## 📝 Workflow Files

1. **ci.yml** - Test on every PR
2. **deploy-staging.yml** - Auto-deploy develop
3. **deploy-production.yml** - Manual deploy main
4. **rollback.yml** - Emergency rollback

## 🎯 Benefits

✅ **Zero downtime**: Staging validates before production  
✅ **Safety net**: Auto-rollback on failure  
✅ **Fast feedback**: CI catches issues early  
✅ **Control**: Manual approval for production  
✅ **Traceability**: Every deploy logged in GitHub  
