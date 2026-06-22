#!/bin/bash
set -e
APP_DIR="/home/seiya/projects/calisto-transformer/dga-nextjs"
echo "🚀 Deploying DGA Dashboard..."
cd $APP_DIR
git pull origin feature/bubble-ui
docker compose build --no-cache
docker compose down
docker compose up -d
echo " Waiting for health check..."
sleep 15
if curl -fk http://localhost:3001/dga > /dev/null 2>&1; then
    echo "✅ Deployed! Access: https://10.28.15.77/dga"
else
    echo "❌ Failed!"
    docker compose logs --tail=50
    exit 1
fi
docker compose ps