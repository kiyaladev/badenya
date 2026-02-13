#!/bin/bash

# Badenya Backend Deployment Script
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting Badenya Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/bade"
BACKEND_DIR="$PROJECT_DIR/backend"
BACKUP_DIR="/backups/badenya"
LOG_FILE="/var/log/badenya-deploy.log"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if script is run as correct user
if [ "$EUID" -eq 0 ]; then 
    error "Do not run this script as root. Run as deployment user."
fi

# Step 1: Create backup
log "Creating backup..."
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Backup current deployment
if [ -d "$BACKEND_DIR/dist" ]; then
    tar -czf "$BACKUP_DIR/backend_$BACKUP_DATE.tar.gz" -C "$BACKEND_DIR" dist uploads .env || warning "Backup creation failed"
    log "✅ Backup created: backend_$BACKUP_DATE.tar.gz"
fi

# Step 2: Pull latest code
log "Pulling latest code from Git..."
cd "$PROJECT_DIR"
git fetch origin
git checkout main
git pull origin main || error "Git pull failed"
log "✅ Code updated"

# Step 3: Install dependencies
log "Installing dependencies..."
cd "$BACKEND_DIR"
npm ci --production || error "npm ci failed"
log "✅ Dependencies installed"

# Step 4: Run build
log "Building TypeScript..."
npm run build || error "Build failed"
log "✅ Build completed"

# Step 5: Database migration (if needed)
# Uncomment when you have migrations
# log "Running database migrations..."
# npm run migrate || error "Migration failed"
# log "✅ Migrations completed"

# Step 6: Restart application
log "Restarting application with PM2..."

# Check if PM2 is running the app
if pm2 list | grep -q "badenya-api"; then
    pm2 restart badenya-api || error "PM2 restart failed"
    log "✅ Application restarted"
else
    pm2 start ecosystem.config.js || error "PM2 start failed"
    log "✅ Application started"
fi

# Save PM2 configuration
pm2 save || warning "PM2 save failed"

# Step 7: Health check
log "Performing health check..."
sleep 5  # Wait for app to start

# Check if app is responding
HEALTH_URL="http://localhost:3000/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$RESPONSE" -eq 200 ]; then
    log "✅ Health check passed (HTTP $RESPONSE)"
else
    error "Health check failed (HTTP $RESPONSE). Rolling back..."
    # Rollback if health check fails
    pm2 restart badenya-api
fi

# Step 8: Clean old backups (keep last 7 days)
log "Cleaning old backups..."
find "$BACKUP_DIR" -name "backend_*.tar.gz" -mtime +7 -delete
log "✅ Old backups cleaned"

# Step 9: Display status
log "Deployment Status:"
pm2 status badenya-api

log "🎉 Deployment completed successfully!"
log "=========================================="

# Send notification (optional - requires configured notification service)
# curl -X POST "https://your-notification-service.com/notify" \
#   -H "Content-Type: application/json" \
#   -d '{"message": "Badenya backend deployed successfully"}'

exit 0
