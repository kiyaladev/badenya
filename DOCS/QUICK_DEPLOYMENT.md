# 🚀 Quick Deployment Guide - Badenya Project

**Status:** Production Ready ✅  
**Updated:** October 11, 2025

---

## 🎯 One-Command Deployments

### Admin Panel

**Vercel (Recommended):**
```bash
cd admin
npm install -g vercel  # If not installed
vercel login
vercel --prod
```

**Netlify:**
```bash
cd admin
npm install -g netlify-cli  # If not installed
netlify login
netlify init
netlify deploy --prod
```

**Environment Variables to Set:**
- `VITE_API_URL` - Backend API URL (e.g., `https://api.badenya.com/api`)
- `VITE_APP_NAME` - "Badenya Admin"

---

### Landing Page

**Vercel (Recommended):**
```bash
cd landing-page
vercel login
vercel --prod
```

**Netlify:**
```bash
cd landing-page
netlify login
netlify init
netlify deploy --prod
```

**Environment Variables to Set:**
- `VITE_APP_NAME` - "Badenya"
- `VITE_API_URL` - (Optional) Backend API URL

---

### Mobile App

**Build for Testing (Preview):**
```bash
cd mobile
npm install -g eas-cli  # If not installed
eas login
eas build --platform all --profile preview
```

**Build for Production:**
```bash
cd mobile
eas build --platform android --profile production  # Android
eas build --platform ios --profile production      # iOS
```

**Submit to Stores:**
```bash
eas submit --platform android  # Google Play
eas submit --platform ios      # App Store
```

---

## 📋 Pre-Deployment Checklist

### Before Deploying Admin/Landing

- [ ] Verify builds locally: `npm run build`
- [ ] Test locally: `npm run preview`
- [ ] Set environment variables in platform dashboard
- [ ] Review security headers in vercel.json/netlify.toml
- [ ] Prepare custom domain (if using)

### Before Releasing Mobile App

- [ ] Complete testing checklist: `mobile/RELEASE_TESTING.md`
- [ ] Verify all features work
- [ ] Check app icons and splash screens
- [ ] Update version in app.json
- [ ] Set production API URL in eas.json
- [ ] Test on real devices (Android & iOS)

---

## 🔧 Post-Deployment Tasks

### Immediate (First Hour)

1. **Verify deployments:**
   - [ ] Admin panel loads correctly
   - [ ] Landing page loads correctly
   - [ ] API connection works
   - [ ] No console errors

2. **Configure domains:**
   - [ ] Point DNS to deployment
   - [ ] Verify SSL certificate
   - [ ] Test www and non-www

3. **Setup monitoring:**
   - [ ] Enable Vercel/Netlify analytics
   - [ ] Add Google Analytics
   - [ ] Configure error tracking

### First Day

1. **Test all features:**
   - [ ] User registration/login
   - [ ] All navigation links
   - [ ] Forms submission
   - [ ] Responsive design

2. **Performance check:**
   - [ ] Run Lighthouse audit (target: 90+)
   - [ ] Check load times
   - [ ] Verify image loading

3. **Security check:**
   - [ ] Verify HTTPS
   - [ ] Check security headers
   - [ ] Test CSP if configured

### First Week

1. **Monitor:**
   - [ ] Check error logs daily
   - [ ] Review analytics
   - [ ] Monitor API performance
   - [ ] Check database usage

2. **User feedback:**
   - [ ] Set up support email
   - [ ] Monitor app reviews
   - [ ] Collect early feedback

---

## 📞 Support Resources

### Documentation
- Admin deployment: `admin/DEPLOYMENT.md`
- Landing deployment: `landing-page/DEPLOYMENT.md`
- Mobile release testing: `mobile/RELEASE_TESTING.md`
- Post-launch ops: `POST_LAUNCH_OPERATIONS.md`

### Deployment Platforms
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Netlify Dashboard:** https://app.netlify.com/
- **Expo Dashboard:** https://expo.dev/accounts/[your-account]/projects

### Help & Troubleshooting
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com/
- EAS Build Docs: https://docs.expo.dev/build/introduction/

---

## 🎯 Expected Results

### Admin Panel
- **URL:** https://admin.badenya.com (or Vercel/Netlify subdomain)
- **Build size:** ~315 kB (95 kB gzipped)
- **Load time:** < 2 seconds

### Landing Page  
- **URL:** https://badenya.com (or Vercel/Netlify subdomain)
- **Build size:** ~374 kB (118 kB gzipped)
- **Load time:** < 1.5 seconds
- **Lighthouse score:** 90+

### Mobile App
- **Google Play:** Review in 1-7 days
- **App Store:** Review in 1-3 days
- **Build size:** ~30-50 MB (varies by platform)

---

## 🚨 Common Issues & Solutions

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working
- Vercel: Must start with `VITE_` for client-side
- Netlify: Check build environment settings
- Restart build after setting variables

### Domain Not Working
- Check DNS propagation (can take 24-48 hours)
- Verify DNS records are correct
- Check SSL certificate status

### Mobile Build Fails
```bash
# Check EAS credentials
eas credentials

# View build logs
eas build:list
eas build:view [BUILD_ID]
```

---

## 💡 Pro Tips

1. **Use staging first:** Deploy to staging environment before production
2. **Test mobile previews:** Use preview builds before production
3. **Monitor immediately:** Set up monitoring before deploying
4. **Have rollback plan:** Know how to revert if needed
5. **Gradual rollout:** Consider releasing to subset of users first

---

## ✅ Success Criteria

You'll know deployment was successful when:

- ✅ All URLs load without errors
- ✅ SSL certificates valid (green padlock)
- ✅ No console errors in browser
- ✅ All features work as expected
- ✅ Analytics tracking events
- ✅ Mobile apps accepted by stores
- ✅ Performance meets targets
- ✅ Users can sign up and use the app

---

**Ready to deploy?** Start with the admin panel or landing page, then move to mobile app. Good luck! 🚀

For detailed instructions, refer to the specific deployment guides in each directory.
