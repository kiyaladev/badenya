# 🚀 Admin Panel Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Prerequisites
- Vercel account (free tier available)
- GitHub repository connected

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bleoue488-ship-it/bade&project-name=badenya-admin&root-directory=admin)

### Manual Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Admin Directory**
   ```bash
   cd admin
   vercel
   ```

4. **Configure Environment Variables** (in Vercel Dashboard)
   - `VITE_API_URL` - Your backend API URL (e.g., `https://api.badenya.com/api`)
   - `VITE_APP_NAME` - Admin Panel (default)

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Deploy to Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Site**
   ```bash
   cd admin
   netlify init
   ```

4. **Configure Environment Variables**
   ```bash
   netlify env:set VITE_API_URL "https://api.badenya.com/api"
   netlify env:set VITE_APP_NAME "Badenya Admin"
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Configuration

### Environment Variables

Create `.env.production` file:
```env
VITE_API_URL=https://api.badenya.com/api
VITE_APP_NAME=Badenya Admin
```

### Build Locally

```bash
npm install
npm run build
```

The production build will be in the `dist/` directory.

### Test Production Build Locally

```bash
npm run preview
```

## Custom Domain Setup

### Vercel
1. Go to your project settings
2. Navigate to "Domains"
3. Add your custom domain (e.g., `admin.badenya.com`)
4. Update your DNS records as instructed

### Netlify
1. Go to "Domain settings"
2. Click "Add custom domain"
3. Follow DNS configuration instructions

## Security Headers

Both `vercel.json` and `netlify.toml` include security headers:
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

## Post-Deployment Checklist

- [ ] Verify API connection
- [ ] Test login functionality
- [ ] Check all dashboard features
- [ ] Verify analytics display
- [ ] Test user management
- [ ] Test group management
- [ ] Check responsive design
- [ ] Verify all routes work
- [ ] Test on different browsers
- [ ] Monitor console for errors

## Troubleshooting

### Build Fails
- Check Node version (should be 20.x)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check for TypeScript errors: `npm run type-check`

### API Connection Issues
- Verify `VITE_API_URL` is set correctly
- Check CORS settings on backend
- Ensure backend is accessible

### Routing Issues
- Verify rewrites in `vercel.json`/`netlify.toml`
- Check that all routes use React Router properly

## Monitoring

After deployment:
- Setup monitoring (Vercel Analytics, Google Analytics)
- Configure error tracking (Sentry recommended)
- Monitor performance metrics

## CI/CD

GitHub Actions workflow automatically:
- Builds on every push to main
- Deploys to production on version tags
- See `.github/workflows/deploy.yml`

## Support

For issues, check:
1. Build logs in Vercel/Netlify dashboard
2. Browser console errors
3. Network tab for failed API calls
