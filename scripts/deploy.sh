#!/bin/bash
# Deploy script for staging environment
# Used by GitHub Actions self-hosted runner

set -e

ENVIRONMENT=${1:-staging}
PORT=${2:-3002}
APP_NAME="dga-${ENVIRONMENT}"

echo "🚀 Deploying to ${ENVIRONMENT} on port ${PORT}..."

cd ~/projects/calisto-transformer

# Pull latest code
git fetch origin
git checkout ${ENVIRONMENT}
git reset --hard origin/${ENVIRONMENT}
echo "✅ Code updated to $(git rev-parse --short HEAD)"

# Install dependencies
cd dga-nextjs
npm ci
echo "✅ Dependencies installed"

# Build
npm run build 2>&1 | tee /tmp/${ENVIRONMENT}-build.log

if grep -q "Type error" /tmp/${ENVIRONMENT}-build.log; then
    echo "❌ Build failed: TypeScript errors"
    exit 1
fi
echo "✅ Build successful"

# Stop existing app
pm2 delete ${APP_NAME} 2>/dev/null || true

# Start new app
PORT=${PORT} pm2 start npm --name "${APP_NAME}" -- start
sleep 8

# Verify
if ! pm2 describe ${APP_NAME} | grep -q "online"; then
    echo "❌ ${APP_NAME} failed to start"
    pm2 logs ${APP_NAME} --lines 20 --nostream
    exit 1
fi

# Health check
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:${PORT}/dga/login)
echo "HTTP Status: ${HTTP_CODE}"

if [ "${HTTP_CODE}" != "200" ] && [ "${HTTP_CODE}" != "302" ] && [ "${HTTP_CODE}" != "308" ]; then
    echo "❌ Health check failed"
    exit 1
fi

echo "✅ ${ENVIRONMENT} deployed successfully on port ${PORT}"
