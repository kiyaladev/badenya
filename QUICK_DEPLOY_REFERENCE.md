# 🚀 Quick Deployment Reference

**Badenya Project - Quick Commands & Workflows**

## CI/CD Overview

### Automatic Triggers

**Pull Request → CI Tests**
```
Every PR to main/develop automatically runs:
✓ Backend tests + coverage
✓ Mobile tests + coverage  
✓ Admin tests + coverage
✓ Landing tests + coverage
```

**Push to `develop` → Staging Deploy**
```
Automatic deployment to staging environment:
✓ Backend → Staging server
✓ Admin → Vercel (preview)
✓ Landing → Vercel (preview)
✓ Health checks
✓ Slack notification
```

**Push to `main` → Production Deploy**
```
Requires manual approval, then deploys:
✓ Backend → Production server
✓ Admin → Vercel (production)
✓ Landing → Vercel (production)
✓ Health checks
✓ Slack notification
```

**Version tag (`v*.*.*`) → Mobile Builds**
```
Triggers mobile app builds:
✓ Android AAB build
✓ iOS IPA build
✓ Optional: Submit to stores
✓ Slack notification
```

## Common Tasks

### 1. Deploy to Staging

```bash
# Method 1: Push to develop
git checkout develop
git merge feature/my-feature
git push origin develop
# Auto-deploys to staging

# Method 2: Manual trigger
# Go to GitHub Actions → Deploy to Staging → Run workflow
```

### 2. Deploy to Production

```bash
# Push to main (requires approval)
git checkout main
git merge develop
git push origin main
# Wait for manual approval in GitHub
# Approve deployment
# Monitors health checks
```

### 3. Build Mobile App

```bash
# Method 1: Create version tag
git tag v1.0.0
git push origin v1.0.0
# Automatically builds both platforms

# Method 2: Manual trigger
# Go to GitHub Actions → Build Mobile App → Run workflow
# Select: Platform (android/ios/all), Profile (preview/production)
```

### 4. Run Tests Locally

```bash
# Backend
cd backend
npm test

# Mobile
cd mobile
npm test

# Admin
cd admin
npm test

# Landing
cd landing-page
npm test
```

### 5. Check Build Status

```bash
# GitHub Actions
https://github.com/bleoue488-ship-it/bade/actions

# View specific workflow run
Click on workflow → View details → Check logs
```

## Required Secrets

Configure in: **Repository Settings → Secrets and variables → Actions**

### Backend Deployment
```
SERVER_HOST         - Production server IP/hostname
SERVER_USER         - SSH username
SERVER_SSH_KEY      - Private SSH key
API_URL            - Production API URL
```

### Vercel Deployment
```
VERCEL_TOKEN                - Vercel auth token
VERCEL_ORG_ID              - Organization ID
VERCEL_ADMIN_PROJECT_ID    - Admin project ID
VERCEL_LANDING_PROJECT_ID  - Landing project ID
```

### Mobile Builds
```
EXPO_TOKEN          - Expo/EAS authentication token
```

### Notifications
```
SLACK_WEBHOOK_URL   - Slack webhook for notifications
```

### Staging (Optional)
```
STAGING_SERVER_HOST
STAGING_API_URL
STAGING_ADMIN_URL
STAGING_LANDING_URL
```

## Environments

Configure in: **Repository Settings → Environments**

### Required Environments
1. **production** - Backend production (add reviewers)
2. **production-admin** - Admin panel production
3. **production-landing** - Landing page production
4. **staging** - Staging environment (optional reviewers)

## Troubleshooting

### CI Tests Failing
```bash
# Check logs in GitHub Actions
# Run tests locally:
cd [component]
npm test

# Common fixes:
npm ci           # Clean install
npm run lint     # Fix linting errors
npm run build    # Check build works
```

### Deployment Failed
```bash
# Backend deployment failed
# Check: SSH access, PM2 status, MongoDB connection
ssh user@server
pm2 status
pm2 logs badenya-api

# Vercel deployment failed
# Check: Token validity, build logs
# Redeploy: Go to GitHub Actions → Re-run failed jobs

# Rollback
ssh user@server
cd /var/www/bade
git reset --hard HEAD~1
pm2 restart badenya-api
```

### Mobile Build Failed
```bash
# Check build logs in EAS
eas build:list

# View specific build
eas build:view BUILD_ID

# Common issues:
# - Invalid credentials → eas credentials
# - Dependencies → npm ci
# - Timeout → Try again or use --local
```

## Manual Deployments

### Backend (VPS)
```bash
ssh user@server
cd /var/www/bade
git pull origin main
cd backend
npm ci --production
npm run build
pm2 restart badenya-api
```

### Admin/Landing (Vercel)
```bash
cd admin  # or landing-page
vercel --prod
```

### Mobile (EAS)
```bash
cd mobile

# Android
eas build --platform android --profile production

# iOS  
eas build --platform ios --profile production

# Submit
eas submit --platform android --latest
eas submit --platform ios --latest
```

## Quick Links

### Dashboards
- GitHub Actions: https://github.com/bleoue488-ship-it/bade/actions
- Vercel: https://vercel.com/dashboard
- Expo/EAS: https://expo.dev/accounts/[account]/projects
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com

### Documentation
- CI/CD Guide: `CI_CD_GUIDE.md`
- Mobile Build: `MOBILE_BUILD_GUIDE.md`
- Screenshots: `SCREENSHOTS_GUIDE.md`
- Deployment: `DEPLOYMENT_GUIDE.md`
- Agent Tasks: `AGENT_TASKS.md`

### Support
- Backend logs: `pm2 logs badenya-api`
- Frontend console: Browser DevTools
- Mobile logs: `eas build:view BUILD_ID`

## Best Practices

### Before Deploying
- [ ] All tests pass locally
- [ ] Code reviewed and approved
- [ ] PR merged to target branch
- [ ] Version bumped (if applicable)
- [ ] Changelog updated

### After Deploying
- [ ] Health checks passed
- [ ] Monitor logs for errors
- [ ] Test key features
- [ ] Notify team
- [ ] Update documentation if needed

### For Mobile Releases
- [ ] Version updated in app.json
- [ ] Changelog created
- [ ] Screenshots updated
- [ ] Store listings reviewed
- [ ] Test on real devices
- [ ] Submit for review

## Emergency Procedures

### Rollback Production
```bash
# Backend
ssh user@server
cd /var/www/bade
git reset --hard HEAD~1
pm2 restart badenya-api

# Vercel
# Go to Vercel Dashboard
# Select previous deployment
# Click "Promote to Production"
```

### Stop Deployments
```bash
# Cancel running GitHub Actions
# Go to Actions → Running workflow → Cancel

# Stop specific job
# Click on job → Cancel job
```

### Alert Team
```bash
# Post in Slack (if configured)
# Notifications already sent via webhook

# Manual notification
# Post in team channel with details
```

---

**Quick Start:** Push to `develop` for staging, push to `main` (with approval) for production!

**Need Help?** Check `CI_CD_GUIDE.md` for detailed documentation.

**Last Updated:** 2025-10-11
