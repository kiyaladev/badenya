# Variables d'Environnement - Badenya

Ce document décrit toutes les variables d'environnement nécessaires pour chaque composant du projet.

## Backend (.env)

Créer un fichier `.env` dans le dossier `backend/` basé sur `.env.example`:

```env
# Environment
NODE_ENV=development

# Server
PORT=5000

# Database - MongoDB Local
MONGODB_URI=mongodb://localhost:27017/badenya

# JWT Tokens
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:19006

# File Upload Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,application/pdf

# Firebase (Notifications Push)
FIREBASE_SERVER_KEY=your-firebase-server-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# CinetPay (Paiements Mobile)
CINETPAY_API_KEY=your-cinetpay-api-key
CINETPAY_SITE_ID=your-cinetpay-site-id

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Variables Critiques

- **MONGODB_URI**: Connexion à MongoDB local. Par défaut: `mongodb://localhost:27017/badenya`
  - **Important**: Nous utilisons MongoDB en local, PAS MongoDB Atlas
  - En production: Utiliser une instance MongoDB sur le serveur personnel

- **JWT_SECRET & JWT_REFRESH_SECRET**: Clés secrètes pour signer les tokens JWT
  - Générer avec: `openssl rand -base64 64`
  - **Critique**: Changer les valeurs par défaut en production

- **FIREBASE_SERVER_KEY**: Clé serveur Firebase pour les notifications push
  - Obtenir depuis: Console Firebase > Paramètres projet > Cloud Messaging

- **GEMINI_API_KEY**: Clé API Google Gemini pour l'IA
  - Obtenir depuis: [Google AI Studio](https://makersuite.google.com/app/apikey)

## Mobile (.env)

Créer un fichier `.env` dans le dossier `mobile/`:

```env
API_URL=http://localhost:5000/api/v1
ENVIRONMENT=development
```

### Pour les Tests sur Appareil Physique

Remplacer `localhost` par l'adresse IP locale de votre machine:

```env
API_URL=http://192.168.1.XXX:5000/api/v1
```

## Admin Panel (.env)

Créer un fichier `.env` dans le dossier `admin/`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Landing Page (.env)

Créer un fichier `.env` dans le dossier `landing-page/`:

```env
# Développement
VITE_API_URL=http://localhost:5000/api/v1

# Production
# VITE_API_URL=https://api.badenya.app/v1
```

## Production

### Backend Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/badenya_prod
JWT_SECRET=[généré avec openssl]
JWT_REFRESH_SECRET=[généré avec openssl]
CORS_ORIGIN=https://admin.badenya.app,https://badenya.app
FRONTEND_URL=https://admin.badenya.app
```

### Admin & Landing Production

```env
VITE_API_URL=https://api.badenya.app/v1
```

## Services à Configurer (Phase 4)

### Firebase Cloud Messaging

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activer Cloud Messaging
3. Télécharger `google-services.json` (Android) et `GoogleService-Info.plist` (iOS)
4. Récupérer la clé serveur pour `FIREBASE_SERVER_KEY`

### Google Gemini AI

1. Aller sur [Google AI Studio](https://makersuite.google.com/)
2. Créer une clé API
3. Copier la clé dans `GEMINI_API_KEY`

### CinetPay (Phase 4)

1. Créer un compte sur [CinetPay](https://www.cinetpay.com/)
2. Obtenir les clés API de test/production
3. Configurer `CINETPAY_API_KEY` et `CINETPAY_SITE_ID`

## Sécurité

⚠️ **IMPORTANT**:

- Ne jamais commiter les fichiers `.env` dans Git
- Les fichiers `.env` sont dans `.gitignore`
- Utiliser des secrets forts en production
- Changer toutes les clés par défaut avant le déploiement
- Utiliser des variables d'environnement système en production

## Génération de Secrets

```bash
# JWT Secret
openssl rand -base64 64

# JWT Refresh Secret
openssl rand -base64 64
```

## Base de Données

### Développement Local

```bash
# Démarrer MongoDB
mongod

# Vérifier la connexion
mongosh
> use badenya
> show collections
```

### Production

MongoDB sera installé et configuré sur le serveur personnel (pas de MongoDB Atlas).

Configuration recommandée:
- Backup automatique quotidien
- Authentification activée
- Bind IP restreint
- Réplication (si possible)

## Troubleshooting

### Backend ne démarre pas

1. Vérifier que MongoDB est démarré: `mongosh --version`
2. Vérifier les variables d'environnement dans `.env`
3. Vérifier les logs: `npm run dev`

### Erreur de connexion MongoDB

```bash
# Démarrer MongoDB sur macOS
brew services start mongodb-community

# Démarrer MongoDB sur Linux
sudo systemctl start mongodb

# Vérifier le statut
mongosh --eval "db.version()"
```

### Mobile ne se connecte pas au backend

1. Si sur appareil physique: utiliser l'IP locale au lieu de localhost
2. Vérifier que le backend est accessible: `curl http://localhost:5000/api/v1`
3. Vérifier CORS dans backend `.env`
