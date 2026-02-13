# CI/CD Pipeline Guide

**Project:** Badenya  
**Last Updated:** 2025-10-11  
**Status:** ✅ Active

## Overview

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Badenya project.

## Table of Contents

- [Pipeline Architecture](#pipeline-architecture)
- [CI Workflow (Pull Requests)](#ci-workflow-pull-requests)
- [CD Workflow (Production Deployment)](#cd-workflow-production-deployment)
- [Required Secrets](#required-secrets)
- [Manual Deployment](#manual-deployment)
- [Troubleshooting](#troubleshooting)

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           │
        ┌──────────────────┴───────────────────┐
        │                                      │
        │ Pull Request                         │ Push to main
        ▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐
│  CI Pipeline     │                  │  CD Pipeline     │
│  (ci.yml)        │                  │  (deploy.yml)    │
└──────────────────┘                  └──────────────────┘
        │                                      │
        ├─ Backend Tests                       ├─ Test All
        ├─ Mobile Tests                        ├─ Deploy Backend (VPS/SSH)
        ├─ Admin Tests                         ├─ Deploy Admin (Vercel)
        └─ Landing Tests                       ├─ Deploy Landing (Vercel)
                                              └─ Health Checks
```

## CI Workflow (Pull Requests)

**File:** `.github/workflows/ci.yml`

### Triggers
- Pull requests to `main` or `develop` branches
- Pushes to `main` or `develop` branches

### Jobs

#### 1. Backend - Build & Test
**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run ESLint linter
5. Build TypeScript (`npm run build`)
6. Run tests with coverage (`npm test -- --coverage`)
7. Upload coverage to Codecov

**Environment Variables:**
- `CI=true`

**Coverage:**
- Target: >70% overall coverage
- Reports uploaded to Codecov with flag `backend`

#### 2. Mobile - Build Check
**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. TypeScript type check (`npx tsc --noEmit`)
5. Run ESLint linter
6. Run tests with coverage (`npm test -- --ci --coverage --maxWorkers=2`)
7. Upload coverage to Codecov

**Coverage:**
- Reports uploaded to Codecov with flag `mobile`

#### 3. Admin Panel - Build
**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run ESLint linter
5. Build for production (`npm run build`)
6. Run tests with coverage
7. Upload coverage to Codecov

**Coverage:**
- Reports uploaded to Codecov with flag `admin`

#### 4. Landing Page - Build
**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run ESLint linter
5. Build for production (`npm run build`)
6. Run tests with coverage
7. Upload coverage to Codecov

**Coverage:**
- Reports uploaded to Codecov with flag `landing`

### Status Checks

All jobs must pass before a PR can be merged to `main` or `develop`.

## CD Workflow (Production Deployment)

**File:** `.github/workflows/deploy.yml`

### Triggers
- Push to `main` branch (auto-deploy all)
- Manual workflow dispatch with component selection

### Manual Deployment Options
When manually triggered, you can choose to deploy:
- `all` - All components (default)
- `backend` - Backend API only
- `admin` - Admin panel only
- `landing` - Landing page only

### Jobs

#### 1. Test Backend
Runs comprehensive backend tests before deployment.

#### 2. Deploy Backend
**Requirements:**
- SSH access to production server
- PM2 installed on server
- MongoDB configured

**Deployment Steps:**
1. SSH into production server
2. Navigate to `/var/www/bade`
3. Pull latest code from `main` branch
4. Install production dependencies
5. Build TypeScript
6. Restart API with PM2
7. Save PM2 configuration

**Health Check:**
- Wait 10 seconds for app to start
- Verify API health endpoint responds with 200

**Notifications:**
- Slack notification on success ✅
- Slack notification on failure ❌

#### 3. Test Admin Panel
Runs admin panel tests and builds before deployment.

#### 4. Deploy Admin Panel
**Platform:** Vercel

**Deployment Steps:**
1. Install Vercel CLI
2. Pull Vercel environment configuration
3. Build project with production settings
4. Deploy to Vercel production

**Environment Variables:**
- `VITE_API_URL`: Production API URL

**Notifications:**
- Slack notification on success ✅

#### 5. Test Landing Page
Runs landing page tests and builds before deployment.

#### 6. Deploy Landing Page
**Platform:** Vercel

**Deployment Steps:**
1. Install Vercel CLI
2. Pull Vercel environment configuration
3. Build project with production settings
4. Deploy to Vercel production

**Environment Variables:**
- `VITE_API_URL`: Production API URL

**Notifications:**
- Slack notification on success ✅

#### 7. Health Check
**Runs After:** All deployments complete

**Checks:**
1. Backend API health endpoint (`/health`)
2. Admin panel accessibility
3. Landing page accessibility

**Final Notification:**
- Comprehensive Slack notification with deployment summary 🎉

## Required Secrets

Configure these secrets in GitHub repository settings:

### Backend Deployment
```
SERVER_HOST         - Production server hostname or IP
SERVER_USER         - SSH username
SERVER_SSH_KEY      - Private SSH key for authentication
SERVER_PORT         - SSH port (default: 22)
API_URL             - Production API URL (for health checks)
```

### Vercel Deployment
```
VERCEL_TOKEN                - Vercel authentication token
VERCEL_ORG_ID              - Vercel organization ID
VERCEL_ADMIN_PROJECT_ID    - Vercel project ID for admin panel
VERCEL_LANDING_PROJECT_ID  - Vercel project ID for landing page
```

### URLs
```
PRODUCTION_API_URL  - API URL for frontend builds
ADMIN_URL          - Admin panel URL (for health checks)
LANDING_URL        - Landing page URL (for health checks)
```

### Notifications
```
SLACK_WEBHOOK_URL  - Slack webhook for deployment notifications
```

### Optional (Codecov)
```
CODECOV_TOKEN      - Token for uploading coverage reports
```

## Manual Deployment

### Deploy All Components
```bash
# Via GitHub Actions UI
1. Go to "Actions" tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Select branch: main
5. Component: all
6. Click "Run workflow"
```

### Deploy Specific Component
```bash
# Backend only
1. Run workflow
2. Component: backend

# Admin only
1. Run workflow
2. Component: admin

# Landing only
1. Run workflow
2. Component: landing
```

### Manual Backend Deployment (SSH)
```bash
ssh user@server
cd /var/www/bade
git pull origin main
cd backend
npm ci --production
npm run build
pm2 restart badenya-api
pm2 save
```

### Manual Vercel Deployment
```bash
# Admin panel
cd admin
vercel --prod

# Landing page
cd landing-page
vercel --prod
```

## Staging Environment

### Setup Staging Branch
```bash
git checkout -b staging
git push origin staging
```

### Modify Workflows for Staging
1. Update `.github/workflows/deploy.yml`
2. Add staging branch to triggers:
```yaml
on:
  push:
    branches: [ main, staging ]
```

3. Add conditional deployment:
```yaml
- name: Deploy to Staging
  if: github.ref == 'refs/heads/staging'
  # Use staging secrets
```

### Required Staging Secrets
```
STAGING_SERVER_HOST
STAGING_API_URL
VERCEL_STAGING_ADMIN_PROJECT_ID
VERCEL_STAGING_LANDING_PROJECT_ID
```

## Troubleshooting

### CI Tests Failing

**Backend Tests**
```bash
# Run locally
cd backend
npm test -- --coverage

# Check MongoDB connection
# Integration tests need MongoDB Memory Server
# which downloads MongoDB binaries
```

**Mobile Tests**
```bash
# Run locally
cd mobile
npm test -- --ci

# Check for native module mocking issues
# Review jest.setup.ts for mocks
```

**Admin/Landing Tests**
```bash
# Run locally
cd admin  # or landing-page
npm test -- --ci

# Check import.meta.env mocking
# Ensure proper test environment setup
```

### Deployment Failures

**Backend Deployment Failed**
1. Check SSH connectivity: `ssh user@server`
2. Verify PM2 is installed: `pm2 --version`
3. Check server logs: `pm2 logs badenya-api`
4. Verify environment variables on server
5. Check database connectivity

**Vercel Deployment Failed**
1. Verify Vercel token is valid
2. Check organization and project IDs
3. Review build logs in GitHub Actions
4. Verify environment variables in Vercel dashboard
5. Check build command in `package.json`

**Health Check Failed**
1. Wait longer (services may need time to start)
2. Check actual service status manually
3. Verify health check URLs are correct
4. Check firewall/security group settings

### Coverage Upload Failed
1. Verify `CODECOV_TOKEN` is set (if using private repo)
2. Check coverage files are generated
3. Review Codecov GitHub Action logs
4. Ensure coverage reports are in correct format (lcov.info)

## Best Practices

### Code Quality
- ✅ All tests must pass before merging
- ✅ Maintain >70% code coverage
- ✅ Fix linter warnings
- ✅ Review build warnings

### Deployment Safety
- ✅ Test thoroughly in staging first
- ✅ Deploy during low-traffic hours
- ✅ Monitor logs after deployment
- ✅ Keep rollback plan ready
- ✅ Verify health checks pass

### Notifications
- ✅ Monitor Slack for deployment status
- ✅ Investigate failures immediately
- ✅ Document common issues

## Monitoring

### Post-Deployment Checks
After each deployment, verify:

1. **Backend API**
   - Health endpoint: `GET /health`
   - Auth endpoints working
   - Database connectivity
   - No error logs

2. **Admin Panel**
   - Login working
   - Dashboard loading
   - API calls successful
   - No console errors

3. **Landing Page**
   - All pages loading
   - Forms submitting
   - Links working
   - SEO tags present

### Rollback Procedure

**Backend Rollback**
```bash
ssh user@server
cd /var/www/bade
git reset --hard HEAD~1
cd backend
npm ci --production
npm run build
pm2 restart badenya-api
```

**Vercel Rollback**
1. Go to Vercel dashboard
2. Select deployment
3. Click "..." menu
4. Select "Promote to Production"

## Future Enhancements

### Planned Features
- [ ] Automated staging deployments
- [ ] Manual approval gates for production
- [ ] Blue-green deployment for backend
- [ ] Automated database migrations
- [ ] Performance testing in CI
- [ ] Security scanning (Snyk, Dependabot)
- [ ] Mobile app builds (EAS)
- [ ] E2E tests (Playwright/Detox)

### Phase 8.4 Tasks (CI/CD)
- [x] ✅ Create GitHub Actions workflows
- [x] ✅ Enable auto-tests on PR (ci.yml with tests)
- [ ] ⬜ Auto-deploy to staging
- [ ] ⬜ Manual approval for production
- [x] ✅ Deployment notifications (Slack configured)

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review this documentation
3. Check deployment guides: `DEPLOYMENT_GUIDE.md`
4. Contact DevOps team

---

**Last Updated:** 2025-10-11  
**Maintained By:** Badenya Development Team
