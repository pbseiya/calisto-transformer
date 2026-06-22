#!/bin/bash
# ============================================================
# DGA Dashboard - Deploy Script for Thinkstation
# Run this on seiya-thinkstation (100.123.214.57)
# ============================================================

set -e

echo "=============================================="
echo " DGA Dashboard - Thinkstation Deploy Script"
echo "=============================================="

# Step 1: Generate SSL certificate
echo ""
echo "🔐 Step 1/4: Generating SSL certificate..."
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/server.key \
  -out /etc/nginx/ssl/server.crt \
  -subj "/C=TH/ST=Bangkok/L=Bangkok/O=IRPC/CN=10.28.15.77"
sudo chmod 600 /etc/nginx/ssl/server.key
sudo chmod 644 /etc/nginx/ssl/server.crt
echo " SSL certificate generated"

# Step 2: Setup Nginx config
echo ""
echo "🌐 Step 2/4: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/dga-dashboard > /dev/null << 'NGINX'
server {
    listen 443 ssl http2;
    server_name 10.28.15.77;

    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    allow 10.28.0.0/16;
    deny all;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Strict-Transport-Security "max-age=31536000" always;

    location /dga {
        proxy_pass http://localhost:3001/dga;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /dga;
        proxy_cache_bypass $http_upgrade;
    }

    location = / {
        return 302 /dga;
    }
}

server {
    listen 80;
    server_name 10.28.15.77;
    return 301 https://$host$request_uri;
}
NGINX

sudo ln -sf /etc/nginx/sites-available/dga-dashboard /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
echo " Nginx configured"

# Step 3: Build and run Docker container
echo ""
echo " Step 3/4: Building and running Docker container..."
cd ~/projects/calisto-transformer/dga-nextjs
chmod +x deploy.sh

# Pull latest code
git pull origin feature/bubble-ui

# Build image
docker compose build --no-cache

# Stop old container if running
docker compose down 2>/dev/null || true

# Start new container
docker compose up -d

echo " Waiting for container health check..."
sleep 20

# Step 4: Verify deployment
echo ""
echo "✅ Step 4/4: Verifying deployment..."
if curl -fk http://localhost:3001/dga > /dev/null 2>&1; then
    echo " ✅ DGA Dashboard is running!"
    echo ""
    echo " Access URL: https://10.28.15.77/dga"
    echo " Login: admin / dga2024 (or IRPC AD credentials)"
else
    echo " ⚠️  Container might still be starting..."
    echo " Check with: docker compose logs -f"
fi

echo ""
echo " Container status:"
docker compose ps
echo ""
echo "Done!"
