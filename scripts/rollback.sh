#!/bin/bash
# Emergency rollback script for production
# Usage: ./rollback.sh [commit_sha]

set -e

TARGET_COMMIT=${1:-HEAD~1}

echo "🔄 Rolling back production to: ${TARGET_COMMIT}"

cd ~/projects/calisto-transformer

# Backup current state
echo "Backing up current state..."
cp -r dga-nextjs/.next dga-nextjs/.next.rollback 2>/dev/null || true

# Checkout target commit
git checkout ${TARGET_COMMIT}
echo "✅ Code rolled back to $(git rev-parse --short HEAD)"

# Rebuild
cd dga-nextjs
npm ci
npm run build 2>&1 | tee /tmp/rollback-build.log

if grep -q "Type error" /tmp/rollback-build.log; then
    echo "❌ Rollback build failed"
    # Restore backup
    rm -rf .next
    mv .next.rollback .next 2>/dev/null || true
    exit 1
fi

# Restart
pm2 restart dga-app
sleep 10

# Health check
HTTP_CODE=$(curl -k -s -o /dev/null -w '%{http_code}' https://100.123.214.57/dga/login)
echo "HTTP Status: ${HTTP_CODE}"

if [ "${HTTP_CODE}" != "200" ] && [ "${HTTP_CODE}" != "302" ] && [ "${HTTP_CODE}" != "308" ]; then
    echo "❌ Rollback verification failed"
    exit 1
fi

# Cleanup
rm -rf .next.rollback

echo "✅ Rollback successful"
echo "⚠️ Remember to fix the issue and create a new PR"
