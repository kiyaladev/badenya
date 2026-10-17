# Démarrage développeur

Depuis la racine du dépôt, avec Node.js 24 (version observée sur le serveur : 24.14.0) et npm :

```sh
npm ci
npm --prefix mobile ci
cp backend/.env.example backend/.env
```

Compléter les valeurs de développement de `backend/.env` sans copier de secrets de production. Utiliser une base MongoDB dédiée au développement et un replica set pour les opérations financières ; voir le runbook MongoDB. Ne pas utiliser la base de production pour les tests ou le seed.

```sh
npm run dev:backend
npm run dev:admin
npm run dev:landing
npm --prefix mobile start
```

Définir `VITE_API_URL` dans les environnements admin/site public et `EXPO_PUBLIC_API_URL` pour Expo, avec le suffixe `/api/v1`. Les variables publiques de build ne doivent pas contenir de secrets. Le serveur lit `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `APP_URL` et `CORS_ORIGIN` dans son environnement. `CORS_ORIGIN` est une liste d’origines exactes séparées par des virgules. `APP_URL` doit ouvrir le formulaire `/reset-password`. `PUBLIC_SITE_URL` peut définir un autre site public pour les liens de désinscription ; il doit servir `/newsletter/unsubscribe`. Configurer `EMAIL_FROM` avec une adresse autorisée par le fournisseur SMTP/SendGrid avant de tester la délivrabilité.

## Vérifications

```sh
npm run lint:backend
npm run lint:admin
npm run lint:landing
npm run lint:mobile
npm run build:backend
npm run build:admin
npm run build:landing
npm run typecheck:mobile
npm run test:unit --workspace=backend -- --runInBand
npm run test:integration --workspace=backend -- --runInBand
npm test --workspace=admin -- --runInBand
npm test --workspace=landing-page -- --runInBand
npm run test:mobile
```

Les tests d’intégration utilisent des instances MongoDB temporaires. Un export web doit aussi être ouvert dans un navigateur pour vérifier la connexion, la navigation et les erreurs JavaScript. La compilation seule ne valide pas ces parcours. Les essais email, push, IA et biométrie nécessitent leurs services et appareils configurés.

## Variables d’environnement

Partir des fichiers `.env.example` (`backend/`, `mobile/`) ; ne jamais commiter de `.env`.

- Backend : `MONGODB_URI` (base de développement dédiée), `JWT_SECRET` et `JWT_REFRESH_SECRET` (générer avec `openssl rand -base64 64`), `CORS_ORIGIN`, `APP_URL`, `PUBLIC_API_URL`, `AUTH_COOKIE_SAME_SITE`, SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`), IA (`GEMINI_API_KEY`, `GEMINI_MODEL`), envois (`UPLOAD_DIR`, `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES`).
- Mobile : `EXPO_PUBLIC_API_URL` ; sur un appareil physique, remplacer `localhost` par l’IP LAN de la machine.
- Admin et site public : `VITE_API_URL`.

## Notifications push (Firebase)

Le backend envoie les push via Firebase Admin si `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` et `FIREBASE_PRIVATE_KEY` sont définis (console Firebase > Paramètres du projet > Comptes de service > Générer une clé privée ; conserver les `\n` dans la clé). Sans ces variables, les notifications restent consultables dans l’application mais aucun push n’est envoyé. Côté mobile, placer `google-services.json` / `GoogleService-Info.plist` hors du dépôt et les référencer dans `app.json` pour un build natif. Tester sur un appareil réel : l’émulateur ne valide pas la réception.

## Tests ciblés

```sh
npm test --workspace=backend -- path/to/file.test.ts   # un fichier
npm test --workspace=backend -- -t "nom du test"        # un test
npm run test:coverage --workspace=backend               # couverture
npm --prefix mobile test -- --watch                     # mobile en continu
```
