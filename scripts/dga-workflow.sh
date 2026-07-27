#!/bin/bash
# DGA Development Workflow Script
# ใช้งานได้ที่ทั้ง Laptop (Latitude) และ ThinkStation

set -euo pipefail

# Detect current machine
CURRENT_HOST=$(hostname)
if [[ "$CURRENT_HOST" == *"Latitude"* ]]; then
    MACHINE="laptop"
    THINKSTATION_USER="seiya@100.123.214.57"
else
    MACHINE="thinkstation"
    THINKSTATION_USER="seiya@localhost"
fi

CALISTO_DIR="$HOME/projects/calisto-transformer"
DGA_API_DIR="$HOME/projects/dga-anomaly-detection"

log() { echo "=== [$(date +%H:%M:%S)] $1"; }

# ===== COMMANDS =====

cmd_start() {
    log "Starting work on $MACHINE"
    log "Pulling latest from GitHub..."
    
    cd "$CALISTO_DIR"
    git pull origin main || {
        echo "❌ Pull failed! อาจมี conflict หรือยังไม่ได้ push จากเครื่องอื่น"
        echo "แนะนำให้: git status เพื่อดูปัญหา"
        exit 1
    }
    
    cd "$DGA_API_DIR"
    git pull origin master || {
        echo "❌ Pull failed for dga-anomaly-detection!"
        exit 1
    }
    
    log "✅ Both repos up-to-date"
    
    if command -v pm2 &> /dev/null; then
        log "PM2 services:"
        pm2 list | grep "dga"
    fi
}

cmd_deploy() {
    log "Deploying to ThinkStation..."
    
    if [[ "$MACHINE" == "laptop" ]]; then
        # Deploy from laptop → ThinkStation via SSH
        log "Syncing frontend to ThinkStation..."
        ssh $THINKSTATION_USER "cd ~/projects/calisto-transformer && git pull origin main"
        ssh $THINKSTATION_USER "cd ~/projects/calisto-transformer/dga-nextjs && npm run build && pm2 restart dga-app"
        
        log "Syncing backend to ThinkStation..."
        ssh $THINKSTATION_USER "cd ~/projects/dga-anomaly-detection && git pull origin master && pm2 restart dga-anomaly-api"
    else
        # Deploy from ThinkStation directly
        cd "$CALISTO_DIR/dga-nextjs" && npm run build && pm2 restart dga-app
        cd "$DGA_API_DIR" && pm2 restart dga-anomaly-api
    fi
    
    log "✅ Deployment complete"
    sleep 5
    
    # Quick health check
    if curl -sk -o /dev/null -w "%{http_code}" https://100.123.214.57/dga/ | grep -q "30[0-9]\|200"; then
        log "✅ DGA Dashboard is UP"
    else
        log "❌ DGA Dashboard may be down - check manually"
    fi
}

cmd_finish() {
    log "Finishing work - pushing to GitHub..."
    
    cd "$CALISTO_DIR"
    if [[ $(git status --porcelain | wc -l) -gt 0 ]]; then
        read -p "มีไฟล์ที่ยังไม่ได้ commit ต้องการ commit+pusth ไหม? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add -A
            git commit -m "work: $(date +%Y-%m-%d) update on $MACHINE"
            git push origin main
            log "✅ calisto-transformer pushed"
        else
            log "️ ยังไม่ได้ push calisto-transformer - ระวัง conflict!"
        fi
    else
        log "️  calisto-transformer clean - ไม่ต้อง push"
    fi
    
    cd "$DGA_API_DIR"
    if [[ $(git status --porcelain | wc -l) -gt 0 ]]; then
        read -p "มีไฟล์ใน dga-anomaly-detection ที่ยังไม่ commit - ต้องการ commit+push ไหม? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add -A
            git commit -m "work: $(date +%Y-%m-%d) update on $MACHINE"
            git push origin master
            log "✅ dga-anomaly-detection pushed"
        else
            log "️ ยังไม่ได้ push dga-anomaly-detection - ระวัง conflict!"
        fi
    else
        log "️  dga-anomaly-detection clean - ไม่ต้อง push"
    fi
}

cmd_sync() {
    log "Force sync from GitHub ( discard local changes )"
    
    read -p "⚠️  การ sync จะลบการแก้ไขที่ยังไม่ได้ commit! ยืนยัน? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "ยกเลิก"
        exit 0
    fi
    
    cd "$CALISTO_DIR"
    git reset --hard origin/main
    git clean -fd
    log "✅ calisto-transformer synced"
    
    cd "$DGA_API_DIR"
    git reset --hard origin/master
    git clean -fd
    log "✅ dga-anomaly-detection synced"
}

cmd_status() {
    log "Status of both repos"
    
    echo ""
    echo "=== calisto-transformer ==="
    cd "$CALISTO_DIR"
    git log --oneline -3
    echo ""
    git status --short | head -10
    [[ $(git status --porcelain | wc -l) -gt 0 ]] && echo "⚠️  มีไฟล์ที่ยังไม่ได้ commit" || echo "✅ Clean"
    
    echo ""
    echo "=== dga-anomaly-detection ==="
    cd "$DGA_API_DIR"
    git log --oneline -3
    echo ""
    git status --short | head -10
    [[ $(git status --porcelain | wc -l) -gt 0 ]] && echo "⚠️  มีไฟล์ที่ยังไม่ได้ commit" || echo "✅ Clean"
    
    echo ""
    log "GitHub remotes:"
    cd "$CALISTO_DIR" && git remote -v | head -2
    cd "$DGA_API_DIR" && git remote -v | head -2
}

cmd_test() {
    log "Running tests..."
    
    cd "$CALISTO_DIR/dga-nextjs"
    if [[ -f "tests/anomaly-components.spec.ts" ]]; then
        log "▶ Playwright frontend tests..."
        npx playwright test tests/anomaly-components.spec.ts 2>&1 | tail -20
    fi
    
    cd "$DGA_API_DIR"
    if command -v python3 &> /dev/null; then
        log "▶ Pytest backend tests..."
        python3 -m pytest tests/ -v 2>&1 | tail -30
    fi
    
    log "✅ Tests complete"
}

# ===== MAIN =====

case "${1:-help}" in
    start|x)    cmd_start ;;
    deploy|push-live)  cmd_deploy ;;
    finish|save)  cmd_finish ;;
    sync|reset)  cmd_sync ;;
    status|st)   cmd_status ;;
    test|t)     cmd_test ;;
    help|-h|--help)
        echo "DGA Workflow - ทำงานสลับ 2 เครื่องได้ง่าย"
        echo ""
        echo "Usage: ./scripts/dga-workflow.sh <command>"
        echo ""
        echo "Commands:"
        echo "  start (x)      - ดึง code ใหม่จาก GitHub ก่อนเริ่มทำงาน"
        echo "  finish (save)  - Commit + push ก่อนเลิกทำงาน"
        echo "  deploy         - Deploy ไป ThinkStation (build + restart PM2)"
        echo "  sync (reset)   - Force sync กับ GitHub (ทำลาย local changes)"
        echo "  status (st)    - ดูสถานะของทั้ง 2 repos"
        echo "  test (t)       - รัน tests ทั้ง frontend และ backend"
        echo ""
        echo "💡 Workflow แนะนำ:"
        echo "  1. dga-workflow.sh start   (เมื่อจะเริ่มทำงาน)"
        echo "  2. แก้ code ทดสอบ"
        echo "  3. dga-workflow.sh deploy   (ถ้าอยาก deploy)"
        echo "  4. dga-workflow.sh finish   (ก่อนปิดเครื่อง)"
        ;;
    *)
        echo "Unknown command: $1"
        cmd_help
        exit 1
        ;;
esac
