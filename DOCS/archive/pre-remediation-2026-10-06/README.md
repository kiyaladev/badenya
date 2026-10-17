# Badenya

**Application Mobile de Gestion Financière Collaborative**

"Le Ciment Numérique de la Solidarité Africaine"

---

## 🎯 Project Status

**Status:** 🟢 **PRODUCTION READY**  
**Completion:** 97.5% (309/317 tasks)  
**Last Updated:** 2025-10-12

### Quick Links
- 📊 [Current Status](DOCS/STATUS_2025-10-12.md) - Quick status overview
- 🚀 [Next Steps for Developer](DOCS/NEXT_STEPS_FOR_DEVELOPER.md) - **START HERE** for deployment
- 📖 [Quick Start Guide](DOCS/QUICKSTART_DEVELOPER_GUIDE.md) - Development setup
- 🚢 [Deployment Guide](DOCS/DEPLOYMENT_GUIDE.md) - Production deployment
- 📋 [Task Tracker](DOCS/AGENT_TASKS.md) - Development progress

### What's Ready
✅ All source code complete (0 errors)  
✅ All features implemented  
✅ All builds successful  
✅ Comprehensive documentation  

### What's Needed
⏸️ Payment provider accounts (CinetPay, Wave)  
⏸️ Apple Developer account ($99/year)  
⏸️ Domain and hosting setup  

**→ See [NEXT_STEPS_FOR_DEVELOPER.md](DOCS/NEXT_STEPS_FOR_DEVELOPER.md) to deploy to production!**

---

## Description

Badenya est une application mobile qui digitalise les pratiques traditionnelles de tontines et d'épargne collective en Afrique, en y ajoutant transparence, sécurité et intelligence artificielle.

## Structure du Projet

Ce monorepo contient 4 applications principales:

```
badenya/
├── mobile/          # Application mobile React Native (iOS & Android)
├── backend/         # API REST Node.js + Express + MongoDB
├── admin/           # Panel d'administration React
├── landing-page/    # Site web vitrine
├── DOCS/            # Documentation et suivi du projet
└── README.md        # Ce fichier
```

## Stack Technique

### Mobile App
- **Framework**: React Native avec Expo
- **Router**: Expo Router (file-based routing)
- **Language**: TypeScript
- **UI**: NativeWind (Tailwind CSS pour React Native)
- **State Management**: Zustand
- **Storage**: Expo Secure Store & AsyncStorage
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (local pour développement, serveur personnel pour production)
- **ORM**: Mongoose
- **Auth**: JWT + bcrypt
- **API Documentation**: Swagger (à venir)

### Admin Panel
- **Framework**: React + Vite
- **Language**: TypeScript
- **UI**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6

### Landing Page
- **Framework**: React + Vite
- **UI**: Tailwind CSS
- **Animations**: Framer Motion

## Services Externes

- **Database**: MongoDB Local (développement) / MongoDB (production sur serveur personnel)
- **Notifications**: Firebase Cloud Messaging
- **Storage**: Filesystem (stockage local)
- **AI**: Google Gemini 2.5 Flash
- **Payments**: CinetPay, Wave API
- **Hosting Backend**: Serveur personnel
- **Hosting Frontend**: Vercel / Netlify

## Prérequis

### Outils de Développement
- Node.js v20 ou supérieur
- npm ou yarn
- Git
- MongoDB Community Edition (installé localement)
- MongoDB Compass (optionnel, pour visualiser la base de données)

### Pour le Mobile
- Expo CLI (sera installé automatiquement)
- Xcode (pour iOS, macOS uniquement, optionnel pour développement avec Expo Go)
- Android Studio (pour Android, optionnel pour développement avec Expo Go)
- Expo Go app sur votre téléphone (pour tester rapidement)

### Éditeur Recommandé
- Visual Studio Code avec extensions:
  - ESLint
  - Prettier
  - React Native Tools
  - TypeScript

## Installation

### 1. Installer MongoDB (si pas déjà installé)

#### Sur macOS (avec Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Sur Ubuntu/Debian
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### Sur Windows
Télécharger et installer depuis [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

Vérifier l'installation:
```bash
mongosh --version
```

### 2. Cloner le Repository
```bash
git clone https://github.com/kiyaladev/badenya.git
cd badenya
```

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env  # Configurer les variables d'environnement
npm run dev
```

**Note**: Assurez-vous que MongoDB est démarré avant de lancer le backend. Le serveur se connectera à `mongodb://localhost:27017/badenya` par défaut.

### 4. Mobile
```bash
cd mobile
npm install
npm start        # Démarrer Expo
# Puis:
# - Scanner le QR code avec Expo Go (iOS/Android)
# - Ou appuyer sur 'i' pour iOS simulator
# - Ou appuyer sur 'a' pour Android emulator
# - Ou appuyer sur 'w' pour web
```

### 5. Admin Panel
```bash
cd admin
npm install
npm run dev
```

### 6. Landing Page
```bash
cd landing-page
npm install
npm run dev
```

## Configuration

### Variables d'Environnement

Chaque application nécessite un fichier `.env`:

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/badenya
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FIREBASE_SERVER_KEY=your-firebase-key
GEMINI_API_KEY=your-gemini-api-key
```

#### Mobile (.env)
```env
API_URL=http://localhost:5000/api/v1
ENVIRONMENT=development
```

#### Admin (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
```

#### Landing Page (.env)
```env
VITE_API_URL=https://api.badenya.app/v1
```

## Scripts de Développement

### Depuis la racine du monorepo
```bash
npm run seed:backend
npm run build:backend
npm run build:mobile:web
npm run test:backend
npm run test:backend:integration
npm run test:mobile
npm run typecheck:mobile
npm run lint:mobile
```

### Backend
```bash
npm run dev      # Démarrer en mode développement
npm run build    # Compiler TypeScript
npm run seed     # Charger les données de démonstration
npm run start    # Démarrer en production
npm run test     # Lancer les tests
npm run lint     # Vérifier le code
```

### Mobile
```bash
npm start        # Démarrer Metro bundler
npm run ios      # Lancer sur iOS
npm run android  # Lancer sur Android
npm run test     # Lancer les tests
npm run lint     # Vérifier le code
```

### Admin & Landing
```bash
npm run dev      # Démarrer serveur de développement
npm run build    # Build pour production
npm run preview  # Preview du build
npm run lint     # Vérifier le code
```

## Documentation

- [Spécifications Techniques Complètes](./DOCS/README-SPECS.md)
- [Liste des Tâches](./DOCS/TASKS.md) - Planning et suivi du développement
- [Guide de démarrage](./DOCS/QUICKSTART_DEVELOPER_GUIDE.md)
- [Guide de déploiement](./DOCS/DEPLOYMENT_GUIDE.md)
- [Documentation API](./backend/API.md)

## Roadmap

### Phase 1 - MVP (3 mois) ✅ En cours
- Authentification complète
- CRUD Groupes
- Gestion financière basique
- Système de vote
- Notifications push
- Rapports IA simples

### Phase 2 - Consolidation (2 mois)
- Intégrations paiement réelles
- Chatbot IA dans l'app
- Multi-devises
- Améliorations UX

### Phase 3 - Croissance (3 mois)
- Programme de parrainage
- Prêts entre membres
- Calendrier de paiements
- Investissements groupés

### Phase 4 - Écosystème (6 mois)
- Marketplace de services
- Partenariats bancaires
- API publique pour tiers
- Version Web (PWA)

## Métriques de Succès

- **MAU** (Monthly Active Users): Objectif 10,000 à 6 mois
- **Retention D7**: > 40%
- **Retention D30**: > 25%
- **Uptime**: > 99.9%

## Licence

[À définir - Propriétaire ou Open Source]

## Contact & Support

- **Email**: support@badenya.app
- **WhatsApp**: [À définir]
- **Documentation**: https://docs.badenya.app (à venir)

## Contributeurs

- [Votre Nom] - Fondateur & Lead Developer

---

**Version**: 1.0.0  
**Dernière mise à jour**: 12 octobre 2025

## État du Projet

🟢 **Prêt pour le déploiement** (97,5 % des tâches terminées)

Voir [AGENT_TASKS.md](./DOCS/AGENT_TASKS.md) pour le suivi détaillé des tâches.
