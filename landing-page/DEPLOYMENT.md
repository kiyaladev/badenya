# 🚀 Landing Page Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Prerequisites
- Vercel account (free tier available)
- GitHub repository connected

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bleoue488-ship-it/bade&project-name=badenya-landing&root-directory=landing-page)

### Manual Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Landing Page Directory**
   ```bash
   cd landing-page
   vercel
   ```

4. **Configure Environment Variables** (in Vercel Dashboard)
   - `VITE_APP_NAME` - Badenya (default)
   - `VITE_API_URL` - Your backend API URL (optional)

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
   cd landing-page
   netlify init
   ```

4. **Configure Environment Variables** (optional)
   ```bash
   netlify env:set VITE_APP_NAME "Badenya"
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Configuration

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

## SEO Optimization

The landing page includes:
- ✅ Meta tags for SEO
- ✅ Open Graph tags for social sharing
- ✅ Responsive images
- ✅ Fast loading times
- ✅ Mobile-first design
- ✅ Structured data (Schema.org)

## Custom Domain Setup

### Vercel
1. Go to your project settings
2. Navigate to "Domains"
3. Add your custom domain (e.g., `badenya.com` or `www.badenya.com`)
4. Update your DNS records as instructed

### Netlify
1. Go to "Domain settings"
2. Click "Add custom domain"
3. Follow DNS configuration instructions

### DNS Configuration Example

For a domain like `badenya.com`:

**Vercel:**
```
A     @       76.76.21.21
CNAME www     cname.vercel-dns.com
```

**Netlify:**
```
A     @       75.2.60.5
CNAME www     <your-site-name>.netlify.app
```

## Security Headers

Both `vercel.json` and `netlify.toml` include:
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy (Netlify)

## Performance Optimization

The landing page is optimized for:
- **Fast Loading**: Bundle size ~374 KB (gzipped: 118 KB)
- **Caching**: Static assets cached for 1 year
- **Images**: Lazy loading enabled
- **Code Splitting**: Automatic via Vite

### Performance Targets
- Lighthouse Score: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s

## Analytics Setup

### Google Analytics (Recommended)

1. Create GA4 property
2. Add tracking code to `index.html`:
   ```html
   <!-- Google tag (gtag.js) -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

### Vercel Analytics

Enable in project settings - no code changes needed.

## Post-Deployment Checklist

### Functionality
- [ ] All sections visible
- [ ] Navigation works
- [ ] Forms submit correctly
- [ ] Contact form sends emails
- [ ] Newsletter signup works
- [ ] Links to app stores work
- [ ] Mobile menu works

### Performance
- [ ] Run Lighthouse audit (target: 90+)
- [ ] Test on slow 3G connection
- [ ] Verify image lazy loading
- [ ] Check bundle size

### SEO
- [ ] Verify meta tags
- [ ] Test Open Graph preview
- [ ] Submit sitemap to Google
- [ ] Check structured data
- [ ] Verify mobile-friendliness

### Cross-Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (desktop & mobile)
- [ ] Mobile browsers (iOS/Android)

### Accessibility
- [ ] Run aXe DevTools scan
- [ ] Test keyboard navigation
- [ ] Check color contrast
- [ ] Verify alt text on images

## Troubleshooting

### Build Fails
- Check Node version (should be 20.x)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check for TypeScript errors: `npm run type-check`

### Slow Loading
- Verify assets are being cached
- Check image sizes and formats
- Use Chrome DevTools Performance tab

### Contact Form Not Working
- Verify email service configuration
- Check environment variables
- Review browser console for errors

## CI/CD

GitHub Actions workflow automatically:
- Builds on every push to main
- Runs tests and linting
- Deploys to production on version tags
- See `.github/workflows/deploy.yml`

## Monitoring & Maintenance

### Regular Tasks
- Monitor analytics weekly
- Update content as needed
- Check for broken links monthly
- Update dependencies quarterly
- Review and respond to contact form submissions

### Tools
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, LogRocket
- **Analytics**: Google Analytics, Vercel Analytics
- **Performance**: Lighthouse CI

## Support

For issues, check:
1. Build logs in Vercel/Netlify dashboard
2. Browser console errors
3. Network tab for failed requests
4. Lighthouse report for performance issues
