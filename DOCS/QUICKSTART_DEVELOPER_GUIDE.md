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
