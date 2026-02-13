# 🚀 Badenya Quick Deployment Reference

**Last Updated:** 2025-10-11  
**For detailed guides, see:** DEPLOYMENT_GUIDE.md, BUILD_RELEASE_GUIDE.md, DOCKER_DEPLOYMENT.md

## 📋 Prerequisites Checklist

### Required
- [ ] Node.js 20.x installed
- [ ] Git installed
- [ ] Repository cloned

### For Backend
- [ ] MongoDB (local or Atlas account)
- [ ] Server/VPS (or Docker installed)
- [ ] Domain name (optional)

### For Mobile
- [ ] Expo account (free)
- [ ] EAS CLI: `npm install -g eas-cli`
- [ ] Google Play account ($25) - for Android
- [ ] Apple Developer account ($99) - for iOS

### For Web
- [ ] Vercel or Netlify account (free)

## ⚡ Quick Start Commands

### Backend (Docker - Fastest)

```bash
# 1. Configure environment
cd backend
cp .env.docker .env
nano .env  # Edit secrets

# 2. Start services
docker-compose up -d

# 3. Check health
curl http://localhost:3000/api/health
```

### Backend (Traditional VPS)

```bash
# 1. Install dependencies
cd backend
npm ci --production

# 2. Build
npm run build

# 3. Configure environment
cp .env.example .env
nano .env  # Edit secrets

# 4. Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

### Admin Panel (Vercel)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
cd admin
vercel --prod

# Done! URL provided in output
```

### Landing Page (Vercel)

```bash
cd landing-page
vercel --prod
```

### Mobile App (Preview Build)

```bash
# 1. Login to Expo
eas login

# 2. Configure project
cd mobile
eas build:configure

# 3. Build APK for Android
eas build --platform android --profile preview

# 4. Build for iOS (TestFlight)
eas build --platform ios --profile preview
```

## 🔧 Essential Configuration

### Backend Environment (.env)

```bash
# Generate secrets
openssl rand -hex 64  # For JWT_SECRET
openssl rand -hex 64  # For JWT_REFRESH_SECRET

# Minimum required:
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/badenya
JWT_SECRET=your_64_char_secret
JWT_REFRESH_SECRET=your_64_char_refresh_secret
CORS_ORIGIN=https://yourdomain.com
```

### Mobile App (app.json)

```json
{
  "expo": {
    "name": "Badenya",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.badenya.app"
    },
    "android": {
      "package": "com.badenya.app"
    }
  }
}
```

## 📱 Mobile App Store Submission

### Android (Google Play)

```bash
# 1. Build production AAB
eas build --platform android --profile production

# 2. Download AAB
eas build:download --platform android

# 3. Go to play.google.com/console
# 4. Upload AAB
# 5. Fill store listing (use APP_STORE_DESCRIPTION.md)
# 6. Submit for review
```

### iOS (App Store)

```bash
# 1. Build for App Store
eas build --platform ios --profile production

# 2. Submit to TestFlight
eas submit --platform ios

# 3. Go to appstoreconnect.apple.com
# 4. Fill store listing (use APP_STORE_DESCRIPTION.md)
# 5. Submit for review
```

## 🔍 Health Checks

```bash
# Backend API
curl http://localhost:3000/api/health

# MongoDB
docker-compose exec mongodb mongosh --eval "db.serverStatus()"

# PM2 Status
pm2 status

# Docker Containers
docker-compose ps

# Check logs
pm2 logs badenya-api
# or
docker-compose logs -f backend
```

## 🆘 Common Issues

### Backend won't start
```bash
# Check MongoDB connection
# Verify .env file exists
# Check port 3000 is free
sudo lsof -i :3000
```

### Mobile build fails
```bash
# Clear cache
eas build:clear-cache --platform android

# Check eas.json configuration
# Verify Expo account is active
```

### Docker issues
```bash
# Stop all containers
docker-compose down

# Rebuild
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

## 📚 Documentation Map

- **DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **BUILD_RELEASE_GUIDE.md** - Mobile app build/release
- **APP_STORE_DESCRIPTION.md** - Store listings (FR/EN)
- **DOCKER_DEPLOYMENT.md** - Docker deployment guide
- **FIREBASE_SETUP.md** - Push notifications setup

## 🔐 Security Checklist

- [ ] Strong JWT secrets (64+ chars)
- [ ] Different secrets for each environment
- [ ] MongoDB authentication enabled
- [ ] CORS configured for production domains
- [ ] SSL/HTTPS enabled
- [ ] Environment variables secured
- [ ] Backups configured
- [ ] Firewall rules set

## 📊 Deployment Order

**Recommended sequence:**

1. **Backend** (Docker or VPS) - Core API
2. **Admin Panel** (Vercel) - Management
3. **Landing Page** (Vercel) - Public site
4. **Mobile Preview** (TestFlight/APK) - Test build
5. **Mobile Production** (Stores) - Public release

## 🎯 One-Command Deployments

### Full Stack (Docker)
```bash
cd backend && docker-compose up -d
```

### Web Apps (Vercel)
```bash
cd admin && vercel --prod &
cd ../landing-page && vercel --prod
```

### Mobile (Both Platforms)
```bash
cd mobile && eas build --platform all --profile production
```

## 📞 Support

- **Email:** support@badenya.com
- **GitHub Issues:** https://github.com/bleoue488-ship-it/bade/issues
- **Documentation:** See guides listed above

---

**Version:** 1.0.0  
**Quick Reference - For full details, see comprehensive guides**
