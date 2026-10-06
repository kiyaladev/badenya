# 🚀 Quick Start Guide - Badenya Project

**For Developers Taking Over This Project**

## 📌 Project Overview

Badenya is a complete tontine management system with:
- Backend API (Node.js + MongoDB)
- Mobile App (React Native + Expo)
- Admin Panel (React + Vite)
- Landing Page (React + Vite)

**Current Status:** 97.5% complete, production-ready

## ⚡ Quick Setup (Development)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/kiyaladev/badenya.git
cd badenya

# Install all dependencies
npm install --prefix backend
npm install --prefix mobile
npm install --prefix admin
npm install --prefix landing-page
```

### 2. Environment Setup

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

**Mobile (.env):**
```bash
cd mobile
cp .env.example .env
# Edit with your API URL
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Mobile:**
```bash
cd mobile
npm start
# Choose platform: 'a' for Android, 'i' for iOS, 'w' for web
```

**Terminal 3 - Admin:**
```bash
cd admin
npm run dev
# Runs on http://localhost:5173
```

**Terminal 4 - Landing:**
```bash
cd landing-page
npm run dev
# Runs on http://localhost:5174
```

### 4. Access Points

- 🔧 **Backend API:** http://localhost:5000
- 📱 **Mobile App:** Expo Go app
- 👨‍💼 **Admin Panel:** http://localhost:5173
- 🌐 **Landing Page:** http://localhost:5174
- 📚 **API Docs:** http://localhost:5000/api/docs

## 📁 Project Structure

```
badenya/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, validation, etc.
│   │   └── utils/        # Helper functions
│   ├── __tests__/        # Test files
│   └── package.json
│
├── mobile/               # React Native + Expo
│   ├── app/              # Screens (file-based routing)
│   ├── components/       # Reusable components
│   ├── services/         # API services
│   ├── store/            # Zustand stores
│   └── __tests__/        # Test files
│
├── admin/                # React + Vite admin panel
│   ├── src/
│   │   ├── pages/        # Admin pages
│   │   ├── components/   # UI components
│   │   ├── services/     # API services
│   │   └── store/        # State management
│   └── package.json
│
└── landing-page/         # React + Vite landing
    ├── src/
    │   ├── components/   # Page components
    │   └── pages/        # Landing pages
    └── package.json
```

## 🧪 Running Tests

```bash
# Backend tests
cd backend
npm test                 # Run all tests
npm run test:coverage    # With coverage

# Mobile tests
cd mobile
npm test                 # Run all tests
npm run test:coverage    # With coverage

# Admin tests
cd admin
npm test

# Landing tests
cd landing-page
npm test
```

## 🔑 Key Features Implemented

### ✅ Backend (52 endpoints)
- User authentication & authorization
- Group management (CRUD)
- Transaction processing
- Voting system
- Notifications (email + push)
- AI insights (Gemini integration)
- PDF reports & Excel exports
- Role-based access control

### ✅ Mobile App (76 screens)
- Onboarding & authentication
- Dashboard with stats
- Group creation & management
- Add/verify transactions
- Create & vote on proposals
- Real-time notifications
- Profile & settings
- Image upload (receipts, avatars)

### ✅ Admin Panel (27 features)
- User management
- Group oversight
- Transaction monitoring
- Analytics & reports
- System settings
- Audit logs

### ✅ Landing Page (17 sections)
- Hero with CTA
- Features showcase
- Pricing plans
- Testimonials
- FAQ
- Contact form

## 🛠️ Common Tasks

### Add a New API Endpoint

1. **Create route:**
```typescript
// backend/src/routes/example.routes.ts
import { Router } from 'express';
import { exampleController } from '../controllers/example.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, exampleController.list);
export default router;
```

2. **Create controller:**
```typescript
// backend/src/controllers/example.controller.ts
import { Request, Response } from 'express';

export const exampleController = {
  async list(req: Request, res: Response) {
    // Your logic here
    res.json({ data: [] });
  }
};
```

3. **Register route:**
```typescript
// backend/src/routes/index.ts
import exampleRoutes from './example.routes';
router.use('/examples', exampleRoutes);
```

### Add a New Mobile Screen

1. **Create screen file:**
```typescript
// mobile/app/(screens)/example.tsx
import { View, Text } from 'react-native';

export default function ExampleScreen() {
  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold">Example Screen</Text>
    </View>
  );
}
```

2. **Add navigation:**
```typescript
// Navigate from another screen
router.push('/(screens)/example');
```

### Add a New Zustand Store

```typescript
// mobile/store/exampleStore.ts
import { create } from 'zustand';

interface ExampleState {
  items: any[];
  fetchItems: () => Promise<void>;
}

export const useExampleStore = create<ExampleState>((set) => ({
  items: [],
  fetchItems: async () => {
    // Fetch logic
    set({ items: [] });
  }
}));
```

## 📦 Build for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Mobile
```bash
cd mobile
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Admin & Landing
```bash
cd admin
npm run build
# Deploy dist/ folder

cd landing-page
npm run build
# Deploy dist/ folder
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check MongoDB is running
mongod --version

# Check port 5000 is free
lsof -i :5000

# Clear node_modules
rm -rf node_modules package-lock.json
npm install
```

### Mobile app won't start
```bash
# Clear Expo cache
npx expo start -c

# Reset Metro bundler
rm -rf node_modules
npm install
npx expo start
```

### Tests failing
```bash
# Update snapshots
npm test -- -u

# Run specific test
npm test -- <test-file-name>

# Clear Jest cache
npx jest --clearCache
```

## 📖 Important Documents to Read

1. **README.md** - Project overview
2. **AGENT_TASKS.md** - Task completion status (97.5%)
3. **DEPLOYMENT_GUIDE.md** - How to deploy
4. **PAYMENT_INTEGRATION_GUIDE.md** - Payment setup
5. **CI_CD_GUIDE.md** - CI/CD setup
6. **POST_LAUNCH_OPERATIONS.md** - After launch
7. **../SECURITY.md** - Security policy
8. **../backend/API.md** - API reference

## ⏭️ Next Steps (What Remains)

### 1. Payment Integration (2 tasks)
**Action Required:**
- Create CinetPay developer account
- Create Wave business account
- Get API credentials

**Code Status:** ✅ Complete (see PAYMENT_INTEGRATION_GUIDE.md)

### 2. Mobile Builds (2 tasks)
**Action Required:**
- Create Expo EAS account
- Create Apple Developer account ($99/year)
- Get signing credentials

**Config Status:** ✅ Ready (eas.json configured)

### 3. Deployment (4 tasks)
**Action Required:**
- Set up VPS or cloud hosting
- Register domain name
- Configure DNS
- Deploy and test

**Scripts Status:** ✅ Ready (all scripts provided)

## 💡 Pro Tips

1. **Use Swagger Docs:** http://localhost:5000/api/docs for API testing
2. **Check Logs:** All services log to console in development
3. **Hot Reload:** All apps have hot reload enabled
4. **TypeScript:** Run `tsc --noEmit` to check for type errors
5. **ESLint:** Run `npm run lint` to check code style
6. **Git Hooks:** Pre-commit hooks run linting automatically

## 🆘 Getting Help

- **Code Comments:** Most complex functions have JSDoc comments
- **Type Definitions:** Check `*.d.ts` files for type information
- **Test Files:** Check `__tests__/` for usage examples
- **Session Summaries:** 20+ summaries document development decisions

## 🎯 Quick Commands Cheat Sheet

```bash
# Development
npm run dev              # Start dev server
npm test                 # Run tests
npm run lint             # Check code style
npm run build            # Build for production

# Backend specific
npm run test:coverage    # Test coverage
npm run format           # Format code

# Mobile specific
npx expo start           # Start Expo
npx expo start -c        # Clear cache
eas build                # Build with EAS

# Docker (backend)
docker-compose up -d     # Start services
docker-compose logs -f   # View logs
docker-compose down      # Stop services
```

## ✅ Checklist Before First Commit

- [ ] Read this guide
- [ ] Review AGENT_TASKS.md for context
- [ ] Set up all .env files
- [ ] Run all dev servers successfully
- [ ] Run all tests
- [ ] Check API docs (Swagger)
- [ ] Understand project structure
- [ ] Read deployment guides

---

**Welcome to the Badenya project!** 🎉

The codebase is production-ready and well-documented. Most of the heavy lifting is done. Your job is to get the external accounts set up and deploy.

**Estimated time to deployment:** 3-5 days with proper credentials.

Good luck! 🚀
