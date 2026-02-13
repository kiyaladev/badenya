# Guide de Démarrage Rapide - Badenya

## 🚀 Installation Complète du Projet

### 1. Cloner le Repository

```bash
git clone https://github.com/bleoue488-ship-it/bade.git
cd bade
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos configurations
npm run dev
```

Le backend démarre sur http://localhost:5000

### 3. Mobile App Setup

```bash
cd mobile
npm install

# Pour iOS (macOS uniquement)
npx pod-install
npm run ios

# Pour Android
npm run android
```

### 4. Admin Panel Setup

```bash
cd admin
npm install
npm run dev
```

L'admin démarre sur http://localhost:5173

### 5. Landing Page Setup

```bash
cd landing-page
npm install
npm run dev
```

La landing page démarre sur http://localhost:5174 (ou le port suivant disponible)

## 📋 Prochaines Étapes

Voir [TASKS.md](./TASKS.md) pour la liste complète des tâches.

### Phase 1 - Configuration Initiale (En cours)

- [x] Créer structure du monorepo
- [x] Initialiser Backend (Node.js + Express + TypeScript)
- [x] Initialiser Mobile (React Native)
- [x] Initialiser Admin (React + Vite)
- [x] Initialiser Landing Page (React + Vite)
- [ ] Installer dépendances additionnelles
- [ ] Configurer base de données MongoDB
- [ ] Créer premiers modèles
- [ ] Créer premières routes API

### Backend - Tâches Immédiates

1. Installer Tailwind CSS pour admin et landing
2. Créer modèles MongoDB (User, Group, Transaction)
3. Implémenter authentification JWT
4. Créer routes API de base

### Mobile - Tâches Immédiates

1. Installer NativeWind
2. Installer React Navigation
3. Installer Zustand
4. Créer structure de dossiers
5. Créer design system de base

### Admin & Landing - Tâches Immédiates

1. Installer Tailwind CSS
2. Installer React Router
3. Créer layout de base
4. Créer composants de base

## 🛠️ Outils Recommandés

- **IDE**: Visual Studio Code
- **Extensions VSCode**:
  - ESLint
  - Prettier
  - React Native Tools
  - TypeScript
- **Database**: MongoDB Compass
- **API Testing**: Postman ou Insomnia
- **Git Client**: GitKraken ou SourceTree (optionnel)

## 📚 Documentation

- [Spécifications Techniques](./README-SPECS.md)
- [Liste des Tâches](./TASKS.md)
- [Backend README](./backend/README.md)
- [Mobile README](./mobile/README-BADENYA.md)
- [Admin README](./admin/README.md)
- [Landing Page README](./landing-page/README.md)

## 🆘 Support

En cas de problème:
1. Vérifier que Node.js v20+ est installé
2. Vérifier que toutes les dépendances sont installées
3. Vérifier les variables d'environnement
4. Consulter la documentation des outils utilisés

## 📝 Notes

- Le backend nécessite MongoDB (local ou Atlas)
- Le mobile nécessite Xcode (iOS) ou Android Studio (Android)
- Admin et Landing nécessitent seulement Node.js

---

**Bon développement! 🎉**
