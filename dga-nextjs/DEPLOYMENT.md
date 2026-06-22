# DGA Dashboard Deployment Guide

## Prerequisites
- SSH access to Thinkstation (seiya@100.123.214.57)
- Docker and Docker Compose installed on Thinkstation
- Nginx installed on Thinkstation
- PostgreSQL database running on Thinkstation

## Step 1: Clone and Setup Repository

On Thinkstation:
```bash
cd /home/seiya/projects/calisto-transformer
git clone -b feature/bubble-ui git@github.com:pbseiya/calisto-transformer.git
cd dga-nextjs
```

## Step 2: Generate Self-Signed SSL Certificate

```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/server.key \
  -out /etc/nginx/ssl/server.crt \
  -subj "/C=TH/ST=Bangkok/L=Bangkok/O=IRPC/CN=10.28.15.77"
sudo chmod 600 /etc/nginx/ssl/server.key
sudo chmod 644 /etc/nginx/ssl/server.crt
```

## Step 3: Configure Nginx

```bash
sudo tee /etc/nginx/sites-available/dga-dashboard << 'NGINX'
server {
    listen 443 ssl http2;
    server_name 10.28.15.77;

    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

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
```

## Step 4: Test IRPC AD API Reachability

```bash
curl -X POST http://devmscenter-api.irpc.in.th/Auth \
  -H 'Content-Type: application/json' \
  -d '{"username":"test","password":"test"}'
```

If the API is not reachable, the fallback credentials (admin/dga2024) will work.

## Step 5: Deploy Docker Container

```bash
cd /home/seiya/projects/calisto-transformer/dga-nextjs
docker compose build
docker compose up -d
```

## Step 6: Verify Deployment

```bash
# Wait for health check
sleep 15

# Test locally
curl -fk https://localhost/dga

# Test from external IP
curl -fk https://10.28.15.77/dga
```

## Step 7: Setup Git Hook for Auto-Deploy (Optional)

On Thinkstation:
```bash
mkdir -p ~/repos/dga-nextjs.git
cd ~/repos/dga-nextjs.git
git init --bare

cat > hooks/post-receive << 'HOOK'
#!/bin/bash
while read oldrev newrev refname; do
    if [ "$refname" = "refs/heads/feature/bubble-ui" ]; then
        echo "🚀 Auto-deploying DGA Dashboard..."
        cd /home/seiya/projects/calisto-transformer/dga-nextjs
        git pull origin feature/bubble-ui
        /home/seiya/projects/calisto-transformer/dga-nextjs/deploy.sh
    fi
done
HOOK
chmod +x hooks/post-receive
```

On local machine, add remote:
```bash
cd /home/pongsak/projects/calisto-transformer/dga-nextjs
git remote add deploy ssh://seiya@100.123.214.57/home/seiya/repos/dga-nextjs.git
```

Now you can deploy with:
```bash
git push deploy feature/bubble-ui
```

## Manual Deployment

After making changes:
```bash
cd /home/seiya/projects/calisto-transformer/dga-nextjs
./deploy.sh
```

## Access

- URL: https://10.28.15.77/dga
- Login: Use your IRPC Active Directory credentials
- Fallback: admin / dga2024 (for testing)

## Troubleshooting

### Check container logs:
```bash
docker compose logs -f
```

### Check container status:
```bash
docker compose ps
```

### Restart container:
```bash
docker compose restart
```

### Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Test IRPC AD API:
```bash
curl -X POST http://devmscenter-api.irpc.in.th/Auth \
  -H 'Content-Type: application/json' \
  -d '{"username":"your_username","password":"your_password"}'
```

## Important Notes

- Port 3001 is used for the Next.js application (NOT port 3000)
- The application runs under basePath `/dga`
- SSL is required for secure communication
- Access is restricted to the 10.28.0.0/16 subnet
- Database connection uses `host.docker.internal` for Docker networking
- Session cookies are HTTP-only, secure, and have a max age of 8 hours