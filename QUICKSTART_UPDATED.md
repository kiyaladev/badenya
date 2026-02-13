# 🚀 Badenya Quick Start Guide

**Last Updated:** October 10, 2025  
**Project Progress:** 11.8% (Phase 1: 79.2% Complete)

## 📋 Prerequisites

- Node.js v20+
- npm or yarn
- Git
- For mobile: iOS Simulator (macOS) or Android Studio

## 🏗️ Project Structure

```
bade/
├── backend/          # Node.js + Express API (✅ 100%)
├── mobile/           # React Native + Expo (⏳ 90%)
├── admin/            # React Admin Panel (✅ 100%)
├── landing-page/     # React Landing Page (⏳ 85.7%)
├── TASKS.md          # Main task list
└── AGENT_TASKS.md    # Auto-generated progress tracker
```

## 🔧 Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB URI and secrets
nano .env

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

**Backend runs on:** http://localhost:5000  
**Health check:** http://localhost:5000/health

**Environment Variables Required:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `CORS_ORIGIN` - Allowed CORS origins

### 2. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start Expo dev server
npm start

# Run on iOS simulator (macOS only)
npm run ios

# Run on Android emulator
npm run android
```

**Configured Features:**
- ✅ TypeScript
- ✅ NativeWind (Tailwind CSS)
- ✅ React Navigation v7
- ✅ Zustand state management
- ✅ AsyncStorage
- ✅ ESLint + Prettier
- ✅ Environment configurations

### 3. Admin Panel Setup

```bash
cd admin

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.development

# Run development server
npm run dev

# Build for production
npm run build
npm run preview
```

**Admin runs on:** http://localhost:5173

**Installed Tools:**
- ✅ Tailwind CSS v4
- ✅ React Router v6
- ✅ Zustand
- ✅ Axios

### 4. Landing Page Setup

```bash
cd landing-page

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.development

# Run development server
npm run dev

# Build for production
npm run build
npm run preview
```

**Landing runs on:** http://localhost:5173

**Installed Tools:**
- ✅ Tailwind CSS v4
- ✅ Framer Motion
- ✅ React Router

## 🧪 Testing Builds

```bash
# Test all builds
cd backend && npm run build && cd ..
cd admin && npm run build && cd ..
cd landing-page && npm run build && cd ..
```

## 📝 Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier

### Mobile
- `npm start` - Start Expo dev server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier

### Admin & Landing
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Environment Files

Each project has environment files for different stages:

```
.env.example      # Template (commit to git)
.env.development  # Development config (git ignored)
.env.production   # Production config (git ignored)
```

## 🎯 Current Status

### ✅ Completed (38/323 tasks)
- Project structure
- All project initializations
- TypeScript configurations
- Backend security middleware
- Mobile ESLint + Prettier
- Admin Tailwind + React Router + Zustand + Axios
- Landing Tailwind + Framer Motion + React Router

### ⏳ In Progress
- Phase 1 final tasks (Metro config, SEO optimization)
- DevOps infrastructure setup

### 🔜 Next Up (Phase 2)
- MongoDB models (User, Group, Transaction, Vote)
- Authentication API endpoints
- Mobile design system
- JWT implementation

## 📚 Documentation

- `README.md` - Project overview
- `TASKS.md` - Detailed task list
- `AGENT_TASKS.md` - Progress tracker (auto-generated)
- `CONFIGURATION_SUMMARY.md` - Configuration details
- `BACKEND_SUMMARY.md` - Backend documentation
- `PROJECT_STATUS.md` - Overall project status

## 🆘 Troubleshooting

### Backend won't start
- Check MongoDB connection in `.env`
- Ensure port 5000 is available
- Run `npm install` to ensure all dependencies

### Mobile build errors
- Clear cache: `expo start --clear`
- Delete `node_modules` and reinstall
- Check React Native compatibility

### Admin/Landing build fails
- Ensure Tailwind PostCSS plugin is installed: `@tailwindcss/postcss`
- Clear Vite cache: `rm -rf .vite`
- Check `postcss.config.js` configuration

## 🚀 Development Workflow

1. **Start Backend:** `cd backend && npm run dev`
2. **Start Mobile:** `cd mobile && npm start`
3. **Start Admin:** `cd admin && npm run dev`
4. **Start Landing:** `cd landing-page && npm run dev`

All services can run simultaneously on different ports.

## 🔗 Useful Links

- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [Express.js Docs](https://expressjs.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Framer Motion Docs](https://www.framer.com/motion)

---

**Ready to build!** 🎉
