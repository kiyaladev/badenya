# Badenya Mobile App

Application mobile React Native avec Expo et Expo Router pour la gestion financière collaborative.

## 🚀 Stack Technique

- **Framework**: React Native avec Expo
- **Router**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Storage**: Async Storage & Expo Secure Store
- **HTTP Client**: Axios
- **Navigation**: Expo Router avec React Navigation

## 📦 Installation

```bash
npm install
```

## 🏃‍♂️ Démarrage

### Démarrer le serveur de développement
```bash
npm start
```

### Lancer sur Android
```bash
npm run android
```

### Lancer sur iOS
```bash
npm run ios
```

### Lancer sur le Web
```bash
npm run web
```

## 📱 Structure de l'Application

```
app/
├── (auth)/                 # Écrans d'authentification
│   ├── splash.tsx         # Écran de démarrage
│   ├── onboarding.tsx     # Introduction de l'app
│   ├── login.tsx          # Connexion
│   ├── register.tsx       # Inscription
│   └── forgot-password.tsx # Mot de passe oublié
├── (tabs)/                # Navigation principale (tabs)
│   ├── index.tsx          # Dashboard/Accueil
│   ├── groups.tsx         # Liste des groupes
│   ├── transactions.tsx   # Transactions
│   ├── notifications.tsx  # Notifications
│   └── profile.tsx        # Profil utilisateur
├── (screens)/             # Autres écrans
│   ├── group-details.tsx  # Détails d'un groupe
│   ├── create-group.tsx   # Créer un groupe
│   ├── group-members.tsx  # Membres du groupe
│   ├── proposals.tsx      # Liste des propositions
│   ├── proposal-details.tsx # Détails proposition
│   ├── create-proposal.tsx # Créer proposition
│   ├── vote.tsx           # Voter
│   ├── transaction-details.tsx # Détails transaction
│   ├── add-contribution.tsx # Ajouter contribution
│   └── settings.tsx       # Paramètres
└── _layout.tsx            # Layout racine
```

## 🎨 Design System

### Couleurs Principales
- **Primary**: Bleu (#0ea5e9)
- **Secondary**: Purple (#d946ef)
- **Success**: Vert
- **Error**: Rouge
- **Gray**: Nuances de gris

### Utilisation de NativeWind

Utilisez les classes Tailwind CSS directement dans les composants:

```tsx
<View className="flex-1 bg-gray-50 p-6">
  <Text className="text-2xl font-bold text-gray-800">
    Titre
  </Text>
</View>
```

## 🔐 Authentification

L'app utilise Expo Secure Store pour stocker de manière sécurisée:
- Tokens JWT
- Informations d'authentification

## 📊 State Management

Zustand est utilisé pour gérer l'état global de l'application:
- État d'authentification
- Données utilisateur
- Groupes
- Transactions

## 🌐 API Integration

Configuration de l'API dans les variables d'environnement:
- Créez un fichier `.env` à la racine
- Ajoutez `API_URL=http://localhost:5000/api/v1`

## 📋 Fonctionnalités Principales

### ✅ Implémentées
- [x] Structure de navigation avec Expo Router
- [x] Écrans d'authentification (Login, Register, Forgot Password)
- [x] Dashboard avec résumé financier
- [x] Liste des groupes
- [x] Transactions
- [x] Notifications
- [x] Profil utilisateur
- [x] Design system avec NativeWind
- [x] Navigation par tabs

### 🚧 À Implémenter
- [ ] Intégration API backend
- [ ] Gestion d'état avec Zustand
- [ ] Authentification JWT
- [ ] CRUD Groupes
- [ ] CRUD Propositions
- [ ] Système de vote
- [ ] Notifications push (Firebase)
- [ ] Upload d'images (stockage local)
- [ ] Paiements mobiles
- [ ] Rapports IA

## 🧪 Tests

```bash
npm test
```

## 📝 Notes de Développement

### Expo Router
- File-based routing (comme Next.js)
- Les dossiers entre parenthèses `(auth)` créent des groupes de routes
- `_layout.tsx` définit le layout pour chaque groupe
- Navigation automatique basée sur la structure des fichiers

### NativeWind
- Utilise Tailwind CSS syntax
- Configuration dans `tailwind.config.js`
- Import global de `global.css` dans le layout racine

### TypeScript
- Configuration dans `tsconfig.json`
- Types stricts activés
- Support complet d'Expo Router avec typed routes

## 🔄 Workflow de Développement

1. Créer/modifier les écrans dans `app/`
2. Utiliser NativeWind pour le styling
3. Tester avec `npm start`
4. Vérifier sur iOS, Android et Web

## 📱 Build Production

### Android (APK)
```bash
eas build --platform android
```

### iOS (IPA)
```bash
eas build --platform ios
```

## 🐛 Débogage

- Shake le device/emulator pour ouvrir le menu Dev
- Appuyer sur `j` dans le terminal pour ouvrir Chrome DevTools
- Utiliser React Native Debugger pour un débogage avancé

## 📄 License

ISC

## 👥 Support

Pour toute question ou problème:
1. Vérifier la documentation Expo
2. Consulter la documentation Expo Router
3. Vérifier les issues GitHub du projet

---

**Bon développement! 🎉**
