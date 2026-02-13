# 🚀 Badenya Deployment Guide

**Version:** 1.0.0  
**Last Updated:** 2025-10-11  
**Status:** Production Ready

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Backend Deployment](#backend-deployment)
- [Mobile App Release](#mobile-app-release)
- [Admin Panel Deployment](#admin-panel-deployment)
- [Landing Page Deployment](#landing-page-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Production Checklist](#production-checklist)

## 🎯 Overview

This guide covers the complete deployment process for all Badenya components:
- **Backend API** (Node.js + Express + MongoDB)
- **Mobile App** (React Native + Expo)
- **Admin Panel** (React + Vite)
- **Landing Page** (React + Vite)

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│   Backend API   │
│  (iOS/Android)  │     │   (Node.js)     │
└─────────────────┘     └─────────────────┘
                               │
┌─────────────────┐           │
│  Admin Panel    │───────────┤
│    (React)      │           │
└─────────────────┘           ▼
                        ┌─────────────────┐
┌─────────────────┐    │    MongoDB      │
│  Landing Page   │    │    Database     │
│    (React)      │    └─────────────────┘
└─────────────────┘
```

## ✅ Prerequisites

### Required Accounts
- [ ] GitHub account (for code repository and CI/CD)
- [ ] MongoDB Atlas account (or self-hosted MongoDB)
- [ ] Domain name (optional but recommended)
- [ ] SSL certificate (Let's Encrypt recommended)

### For Mobile App
- [ ] Apple Developer Account ($99/year - for iOS)
- [ ] Google Play Console Account ($25 one-time - for Android)
- [ ] Expo Account (free tier available)

### For Web Deployment
- [ ] Vercel/Netlify account (free tier available)
- [ ] Or VPS/Cloud server (DigitalOcean, AWS, etc.)

### Development Tools
- [ ] Node.js 20.x or higher
- [ ] npm or yarn
- [ ] Git
- [ ] Docker (optional, for containerized deployment)

## 🔧 Backend Deployment

### Option 1: Traditional VPS/Server Deployment

#### Step 1: Server Setup

**Requirements:**
- Ubuntu 20.04 LTS or higher
- 2GB RAM minimum (4GB recommended)
- 20GB storage minimum
- Node.js 20.x
- MongoDB (local or remote)
- Nginx (for reverse proxy)

**Install Dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB (if self-hosting)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Step 2: Clone and Build

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/bleoue488-ship-it/bade.git
cd bade/backend

# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Create ecosystem file for PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'badenya-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF
```

#### Step 3: Environment Configuration

```bash
# Create production .env file
cat > .env << 'EOF'
# Server
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/badenya
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/badenya

# JWT
JWT_SECRET=your_super_secure_random_secret_key_change_this
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_change_this
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/var/www/bade/backend/uploads

# Email (optional - for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# AI (optional)
GEMINI_API_KEY=your_gemini_api_key

# Firebase (optional - for push notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="your_private_key"
EOF

# Secure the .env file
chmod 600 .env
```

**Generate Secure Secrets:**
```bash
# Generate JWT secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

#### Step 4: MongoDB Setup

**Option A: Local MongoDB**
```bash
# Create database user
mongosh
use badenya
db.createUser({
  user: "badenyauser",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "badenya" }]
})
exit

# Update .env with authenticated URI
MONGODB_URI=mongodb://badenyauser:your_secure_password@localhost:27017/badenya
```

**Option B: MongoDB Atlas (Recommended)**
1. Create cluster at https://cloud.mongodb.com
2. Set up database user
3. Whitelist your server IP
4. Get connection string
5. Update MONGODB_URI in .env

#### Step 5: Nginx Configuration

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/badenya-api

# Add this configuration:
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File upload size limit
    client_max_body_size 10M;
}

# Enable site
sudo ln -s /etc/nginx/sites-available/badenya-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 6: SSL/HTTPS Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

#### Step 7: Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Monitor application
pm2 status
pm2 logs badenya-api
pm2 monit
```

#### Step 8: Backup Configuration

```bash
# Create backup script
sudo nano /usr/local/bin/backup-badenya.sh

# Add this script:
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/badenya"
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --uri="mongodb://localhost:27017/badenya" --out="$BACKUP_DIR/mongo_$DATE"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /var/www/bade/backend/uploads

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete

# Make executable
sudo chmod +x /usr/local/bin/backup-badenya.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-badenya.sh") | crontab -
```

### Option 2: Docker Deployment

#### Docker Setup

**Create Dockerfile:**
```bash
cd /home/runner/work/bade/bade/backend

cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "dist/index.js"]
EOF
```

**Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: badenya-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: badenya
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: .
    container_name: badenya-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/badenya?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - mongodb
    volumes:
      - ./uploads:/app/uploads

volumes:
  mongodb_data:
```

**Deploy with Docker:**
```bash
# Create .env file with secrets
echo "MONGO_PASSWORD=your_secure_password" > .env
echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 64)" >> .env

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

### Backend Health Checks

```bash
# Check API is running
curl http://localhost:3000/api/health

# Check MongoDB connection
pm2 logs badenya-api | grep -i "connected to mongodb"

# Monitor resources
htop
df -h
```

## 📱 Mobile App Release

### Prerequisites
- Expo account: https://expo.dev/signup
- EAS CLI: `npm install -g eas-cli`
- For iOS: Apple Developer account
- For Android: Google Play Console account

### Step 1: Configure App Metadata

Update `mobile/app.json`:
```json
{
  "expo": {
    "name": "Badenya",
    "slug": "badenya",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#10B981"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.badenya.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Badenya needs camera access to take photos of receipts",
        "NSPhotoLibraryUsageDescription": "Badenya needs photo library access to upload receipts"
      }
    },
    "android": {
      "package": "com.badenya.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#10B981"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### Step 2: Generate App Icons and Splash Screens

**Using a design tool or online service:**
1. Create a 1024x1024px app icon
2. Create a 2048x2048px splash screen
3. Use https://www.appicon.co/ or https://icon.kitchen/ to generate all sizes

**Or use Expo's asset generation:**
```bash
cd mobile

# This will generate all required icon sizes
npx expo-optimize

# For splash screen, use a service like:
# https://github.com/expo/expo/tree/main/packages/%40expo/configure-splash-screen
```

### Step 3: Configure EAS Build

```bash
cd mobile

# Login to Expo
eas login

# Configure project
eas build:configure

# This creates eas.json
```

**Customize `mobile/eas.json`:**
```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json"
      },
      "ios": {
        "appleId": "your.apple.id@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

### Step 4: Update Environment Variables

Update `mobile/.env`:
```bash
# Production API
API_URL=https://api.yourdomain.com/api

# Environment
NODE_ENV=production
```

### Step 5: Build Android App

```bash
cd mobile

# Build for Google Play Store (AAB)
eas build --platform android --profile production

# Or build APK for testing
eas build --platform android --profile preview

# Download build when complete
eas build:download --platform android --profile production
```

### Step 6: Build iOS App

**Prerequisites:**
- Apple Developer account
- iOS Distribution Certificate
- Provisioning Profile

```bash
cd mobile

# Build for App Store
eas build --platform ios --profile production

# Download build
eas build:download --platform ios --profile production
```

### Step 7: Create App Store Listings

#### Google Play Store

1. Go to https://play.google.com/console
2. Create new application
3. Fill in app details:
   - Title: Badenya
   - Short description: Épargne collaborative simplifiée
   - Full description: (See APP_STORE_DESCRIPTION.md)
   - App category: Finance
   - Content rating: Everyone
   
4. Upload screenshots (required sizes):
   - Phone: 1080x1920 or 1440x2560 (at least 2)
   - 7-inch tablet: 1200x1920 (at least 2)
   - 10-inch tablet: 1600x2560 (at least 2)

5. Upload app bundle (.aab file)

6. Complete privacy policy and content rating

7. Submit for review

#### Apple App Store

1. Go to https://appstoreconnect.apple.com
2. Create new app
3. Fill in app information:
   - Name: Badenya
   - Subtitle: Épargne Collaborative
   - Category: Finance
   - Description: (See APP_STORE_DESCRIPTION.md)

4. Upload screenshots (required sizes):
   - 6.7" Display: 1290x2796
   - 6.5" Display: 1284x2778
   - 5.5" Display: 1242x2208
   - iPad Pro (12.9"): 2048x2732

5. Upload build from TestFlight

6. Complete App Review Information

7. Submit for review

### Step 8: App Store Descriptions

Create `mobile/APP_STORE_DESCRIPTION.md` with translations and descriptions for both stores.

### Testing Before Release

```bash
# Test on Android
eas build --platform android --profile preview
# Install APK on test device

# Test on iOS  
eas build --platform ios --profile preview
# Install via TestFlight
```

## 🖥️ Admin Panel Deployment

### Option 1: Vercel (Recommended)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Configure Project**
```bash
cd admin

# Login to Vercel
vercel login

# Initialize project
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? badenya-admin
# - Directory? ./
# - Override settings? No
```

**Step 3: Configure Environment Variables**
```bash
# Set environment variables in Vercel dashboard
# Or use CLI:
vercel env add API_URL production
# Enter: https://api.yourdomain.com/api

vercel env add VITE_API_URL production
# Enter: https://api.yourdomain.com/api
```

**Step 4: Deploy**
```bash
# Deploy to production
vercel --prod

# Your admin panel will be available at:
# https://badenya-admin.vercel.app
```

**Step 5: Custom Domain (Optional)**
```bash
# Add custom domain
vercel domains add admin.yourdomain.com

# Follow DNS configuration instructions
```

### Option 2: Netlify

```bash
cd admin

# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

### Option 3: Self-Hosted (Nginx)

```bash
cd admin

# Build production bundle
npm run build

# Copy to web server
sudo cp -r dist/* /var/www/html/admin/

# Configure Nginx
sudo nano /etc/nginx/sites-available/badenya-admin

# Add configuration:
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /var/www/html/admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}

# Enable and reload
sudo ln -s /etc/nginx/sites-available/badenya-admin /etc/nginx/sites-enabled/
sudo systemctl reload nginx

# Add SSL
sudo certbot --nginx -d admin.yourdomain.com
```

## 🌐 Landing Page Deployment

Same process as Admin Panel - use Vercel, Netlify, or self-hosted Nginx.

**Vercel deployment:**
```bash
cd landing-page
vercel --prod

# Add custom domain
vercel domains add yourdomain.com
vercel domains add www.yourdomain.com
```

## 🔄 CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:
- Runs on push to `main` and `develop` branches
- Runs on pull requests
- Builds and tests all components

### Enhance CI/CD for Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy-backend:
    name: Deploy Backend
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Server via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /var/www/bade
            git pull origin main
            cd backend
            npm ci --production
            npm run build
            pm2 restart badenya-api

  deploy-admin:
    name: Deploy Admin Panel
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Vercel CLI
        run: npm install -g vercel
      
      - name: Deploy to Vercel
        working-directory: ./admin
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_ADMIN_PROJECT_ID }}

  deploy-landing:
    name: Deploy Landing Page
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Vercel CLI
        run: npm install -g vercel
      
      - name: Deploy to Vercel
        working-directory: ./landing-page
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_LANDING_PROJECT_ID }}
```

### Required GitHub Secrets

Add these in repository Settings → Secrets:
- `SERVER_HOST` - Your server IP/domain
- `SERVER_USER` - SSH username
- `SERVER_SSH_KEY` - Private SSH key
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_ADMIN_PROJECT_ID` - Admin project ID
- `VERCEL_LANDING_PROJECT_ID` - Landing project ID

## ✅ Production Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No ESLint errors
- [ ] Environment variables configured
- [ ] Database backups configured
- [ ] SSL certificates ready
- [ ] Domain DNS configured
- [ ] Monitoring tools set up

### Backend
- [ ] MongoDB connection tested
- [ ] JWT secrets generated (64+ chars)
- [ ] CORS origins configured
- [ ] File upload limits set
- [ ] PM2 process manager configured
- [ ] Nginx reverse proxy configured
- [ ] SSL/HTTPS enabled
- [ ] Automatic backups scheduled

### Mobile
- [ ] App icons generated (all sizes)
- [ ] Splash screens created
- [ ] Bundle identifiers configured
- [ ] API URL updated to production
- [ ] App store accounts ready
- [ ] Screenshots prepared
- [ ] Store descriptions written
- [ ] Privacy policy ready

### Web (Admin + Landing)
- [ ] Production builds tested
- [ ] API URLs configured
- [ ] Analytics added (Google Analytics)
- [ ] SEO meta tags set
- [ ] Custom domains configured
- [ ] SSL enabled

### Security
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured
- [ ] CORS properly configured

### Monitoring
- [ ] Application monitoring (PM2, New Relic, etc.)
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Log aggregation
- [ ] Performance monitoring
- [ ] Database monitoring

## 📊 Post-Deployment

### Monitor Application
```bash
# Backend logs
pm2 logs badenya-api

# System resources
htop
df -h

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

### Performance Testing
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://api.yourdomain.com/api/health

# Or use https://loader.io/ for more comprehensive testing
```

### Analytics Setup
1. Add Google Analytics to landing page
2. Set up Sentry for error tracking
3. Configure uptime monitoring
4. Set up performance monitoring

## 🆘 Troubleshooting

### Backend Issues
```bash
# Check if app is running
pm2 status

# Restart app
pm2 restart badenya-api

# View logs
pm2 logs badenya-api --lines 100

# Check MongoDB connection
mongosh --eval "db.serverStatus()"

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Mobile Build Issues
```bash
# Clear cache
cd mobile
rm -rf node_modules
npm install

# Clear Expo cache
npx expo start -c

# Check EAS build logs
eas build:list
```

### Web Deployment Issues
```bash
# Check build locally
cd admin  # or landing-page
npm run build
npm run preview

# Vercel logs
vercel logs
```

## 📚 Additional Resources

- [Expo Application Services Documentation](https://docs.expo.dev/eas/)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## 📞 Support

For deployment issues, contact:
- Email: support@badenya.com
- GitHub Issues: https://github.com/bleoue488-ship-it/bade/issues

---

**Last Updated:** 2025-10-11  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
