# 🐳 Docker Deployment Guide

This guide covers deploying Badenya backend using Docker and Docker Compose.

## Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- Git

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/bleoue488-ship-it/bade.git
cd bade/backend
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.docker .env

# Edit environment variables
nano .env

# Generate secure secrets:
openssl rand -hex 64  # Copy output for JWT_SECRET
openssl rand -hex 64  # Copy output for JWT_REFRESH_SECRET
openssl rand -base64 32  # Copy output for MONGO_ROOT_PASSWORD
openssl rand -base64 32  # Copy output for MONGO_APP_PASSWORD
```

**Required Variables:**
- `MONGO_ROOT_PASSWORD` - MongoDB root password
- `MONGO_APP_PASSWORD` - App database user password
- `JWT_SECRET` - JWT signing secret (64+ chars)
- `JWT_REFRESH_SECRET` - Refresh token secret (64+ chars)
- `CORS_ORIGIN` - Allowed frontend origins

### 3. Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Check status
docker-compose ps
```

### 4. Verify Deployment

```bash
# Check API health
curl http://localhost:3000/api/health

# Expected response: {"status":"ok","timestamp":"2025-10-11T..."}
```

## Service Architecture

```
┌─────────────────┐
│  Nginx (80/443) │  (optional)
└────────┬────────┘
         │
┌────────▼────────┐
│  Backend (3000) │
└────────┬────────┘
         │
┌────────▼────────┐
│ MongoDB (27017) │
└─────────────────┘
```

## Docker Compose Services

### MongoDB
- **Image:** mongo:7.0
- **Port:** 27017
- **Volumes:** 
  - `mongodb_data` - Database files
  - `mongodb_config` - Configuration
- **Init Script:** `mongo-init.js` - Creates app user and indexes

### Backend
- **Build:** Local Dockerfile
- **Port:** 3000
- **Volumes:**
  - `uploads_data` - User uploaded files
  - `./logs` - Application logs
- **Health Check:** HTTP GET /api/health every 30s

### Nginx (Optional)
- **Image:** nginx:alpine
- **Ports:** 80, 443
- **Profile:** `with-nginx`
- **Purpose:** Reverse proxy with SSL

## Management Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Restart backend only
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend
```

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# MongoDB only
docker-compose logs -f mongodb

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Database Operations

```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p <MONGO_ROOT_PASSWORD>

# Backup database
docker-compose exec mongodb mongodump -u admin -p <MONGO_ROOT_PASSWORD> --out /data/backup

# Restore database
docker-compose exec mongodb mongorestore -u admin -p <MONGO_ROOT_PASSWORD> /data/backup

# Export database to host
docker cp badenya-mongodb:/data/backup ./backup_$(date +%Y%m%d)
```

### Application Shell

```bash
# Access backend container
docker-compose exec backend sh

# View PM2 status
docker-compose exec backend pm2 status

# View PM2 logs
docker-compose exec backend pm2 logs
```

## Production Deployment

### 1. Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone and Configure

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/bleoue488-ship-it/bade.git
cd bade/backend

# Set up environment
sudo cp .env.docker .env
sudo nano .env  # Configure production values

# Set proper permissions
sudo chown -R $USER:$USER .
```

### 3. Deploy with Nginx

```bash
# Start with Nginx reverse proxy
docker-compose --profile with-nginx up -d

# Configure SSL (Let's Encrypt)
# See nginx.conf for SSL configuration
```

### 4. Set Up Auto-Start

```bash
# Create systemd service
sudo nano /etc/systemd/system/badenya.service

# Add this content:
[Unit]
Description=Badenya Backend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/bade/backend
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target

# Enable service
sudo systemctl enable badenya
sudo systemctl start badenya
```

## Monitoring

### Health Checks

```bash
# Check all services
docker-compose ps

# Check backend health
curl http://localhost:3000/api/health

# Check MongoDB health
docker-compose exec mongodb mongosh --eval "db.serverStatus()"
```

### Resource Usage

```bash
# View resource usage
docker stats

# View specific container
docker stats badenya-backend

# Disk usage
docker system df
```

### Logs

```bash
# Backend application logs
docker-compose logs -f backend

# PM2 logs inside container
docker-compose exec backend pm2 logs

# MongoDB logs
docker-compose logs -f mongodb
```

## Backup & Restore

### Automated Backup Script

Create `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/badenya"
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose exec -T mongodb mongodump \
  -u admin -p $MONGO_ROOT_PASSWORD \
  --authenticationDatabase admin \
  --out /data/backup/$DATE

docker cp badenya-mongodb:/data/backup/$DATE $BACKUP_DIR/mongo_$DATE

# Backup uploads
docker cp badenya-backend:/app/uploads $BACKUP_DIR/uploads_$DATE

# Compress
tar -czf $BACKUP_DIR/complete_$DATE.tar.gz \
  $BACKUP_DIR/mongo_$DATE \
  $BACKUP_DIR/uploads_$DATE

# Cleanup
rm -rf $BACKUP_DIR/mongo_$DATE $BACKUP_DIR/uploads_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "complete_*.tar.gz" -mtime +7 -delete

echo "Backup completed: complete_$DATE.tar.gz"
```

```bash
# Make executable
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /var/www/bade/backend/backup.sh
```

### Restore from Backup

```bash
# Extract backup
tar -xzf /backups/badenya/complete_20251011.tar.gz

# Restore MongoDB
docker-compose exec -T mongodb mongorestore \
  -u admin -p $MONGO_ROOT_PASSWORD \
  --authenticationDatabase admin \
  --drop \
  /data/backup/20251011

# Restore uploads
docker cp ./uploads_20251011/. badenya-backend:/app/uploads/
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Environment variables missing
# - MongoDB not ready (wait 30s and retry)
# - Port already in use
```

### Database Connection Failed

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify credentials in .env
# Test connection
docker-compose exec backend node -e "console.log(process.env.MONGODB_URI)"
```

### High Memory Usage

```bash
# Check stats
docker stats

# Restart services
docker-compose restart

# Limit resources in docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Clear Everything

```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clean up Docker system
docker system prune -a --volumes
```

## Performance Tuning

### MongoDB Optimization

Add to `docker-compose.yml`:
```yaml
mongodb:
  command: mongod --wiredTigerCacheSizeGB 0.5
  deploy:
    resources:
      limits:
        memory: 1G
      reservations:
        memory: 512M
```

### Backend Scaling

```yaml
backend:
  deploy:
    replicas: 3
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
```

## Security Best Practices

1. **Use Strong Passwords**
   - Generate with `openssl rand -base64 32`
   - Different for each service

2. **Limit Network Exposure**
   - Don't expose MongoDB port (27017) publicly
   - Use internal Docker network

3. **Keep Updated**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

4. **Regular Backups**
   - Automated daily backups
   - Test restore process
   - Off-site backup storage

5. **Monitor Logs**
   - Check for suspicious activity
   - Set up log aggregation (ELK, Graylog)

## Advanced Configuration

### Custom Network

```yaml
networks:
  badenya-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
```

### Volume Backup Location

```yaml
volumes:
  mongodb_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/data/mongodb
```

### Environment-Specific Configs

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## Migration from Non-Docker

```bash
# 1. Export data from existing MongoDB
mongodump --uri="mongodb://user:pass@host:27017/badenya" --out ./migration

# 2. Start Docker containers
docker-compose up -d

# 3. Wait for MongoDB to be ready (30s)
sleep 30

# 4. Import data
docker cp ./migration badenya-mongodb:/data/
docker-compose exec mongodb mongorestore \
  -u admin -p $MONGO_ROOT_PASSWORD \
  --authenticationDatabase admin \
  /data/migration

# 5. Update app configs to point to Docker
```

## Support

For Docker-related issues:
- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- GitHub Issues: https://github.com/bleoue488-ship-it/bade/issues

---

**Last Updated:** 2025-10-11  
**Version:** 1.0.0
