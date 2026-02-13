# Badenya Backend API

Backend REST API pour l'application Badenya - Gestion financière collaborative.

## Stack Technique

- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB avec Mongoose
- **Auth**: JWT + bcrypt
- **Validation**: express-validator

## Installation

```bash
npm install
```

## Configuration

Copier le fichier `.env.example` vers `.env` et configurer les variables:

```bash
cp .env.example .env
```

Variables requises:
- `MONGODB_URI` - URL de connexion MongoDB locale (par défaut: `mongodb://localhost:27017/badenya`)
- `JWT_SECRET` - Secret pour les access tokens
- `JWT_REFRESH_SECRET` - Secret pour les refresh tokens
- `PORT` - Port du serveur (défaut: 5000)

**Important**: Ce projet utilise MongoDB en local pour le développement. Assurez-vous que MongoDB est installé et démarré sur votre machine avant de lancer le serveur.

### Vérifier MongoDB

```bash
# Vérifier que MongoDB est en cours d'exécution
mongosh --eval "db.version()"
```

## Développement

```bash
npm run dev
```

Le serveur démarre sur http://localhost:5000 et se connecte automatiquement à MongoDB local.

## Production

```bash
npm run build
npm start
```

## Structure

```
src/
├── config/          # Configuration (database, etc.)
├── controllers/     # Contrôleurs de routes
│   ├── auth.controller.ts
│   ├── group.controller.ts
│   ├── transaction.controller.ts
│   └── proposal.controller.ts
├── middleware/      # Middleware Express
│   ├── auth.ts
│   └── validation.ts
├── models/          # Modèles Mongoose
│   ├── User.ts
│   ├── Group.ts
│   ├── Transaction.ts
│   ├── Proposal.ts
│   ├── Notification.ts
│   ├── Invitation.ts
│   └── AIReport.ts
├── routes/          # Définitions de routes
│   ├── auth.routes.ts
│   ├── group.routes.ts
│   ├── transaction.routes.ts
│   ├── proposal.routes.ts
│   └── index.ts
├── utils/           # Utilitaires
│   ├── jwt.ts
│   ├── password.ts
│   └── crypto.ts
└── index.ts         # Point d'entrée
```

## Endpoints API

### Health Check
- `GET /health` - Vérifier l'état de l'API

### API v1
- `GET /api/v1` - Information de version

### Authentification
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/refresh-token` - Rafraîchir le token
- `POST /api/v1/auth/logout` - Déconnexion
- `GET /api/v1/auth/me` - Obtenir l'utilisateur actuel
- `PUT /api/v1/auth/profile` - Modifier le profil
- `PUT /api/v1/auth/change-password` - Changer le mot de passe
- `POST /api/v1/auth/forgot-password` - Mot de passe oublié
- `POST /api/v1/auth/reset-password` - Réinitialiser le mot de passe

### Groupes
- `POST /api/v1/groups` - Créer un groupe
- `GET /api/v1/groups` - Liste des groupes
- `GET /api/v1/groups/:id` - Détails d'un groupe
- `PUT /api/v1/groups/:id` - Modifier un groupe
- `DELETE /api/v1/groups/:id` - Archiver un groupe
- `POST /api/v1/groups/:id/members` - Ajouter un membre
- `DELETE /api/v1/groups/:id/members/:userId` - Retirer un membre
- `PUT /api/v1/groups/:id/members/:userId/role` - Modifier le rôle

### Transactions
- `POST /api/v1/groups/:groupId/transactions` - Créer une transaction
- `GET /api/v1/groups/:groupId/transactions` - Liste des transactions
- `GET /api/v1/transactions/:id` - Détails d'une transaction
- `PUT /api/v1/transactions/:id/verify` - Vérifier une transaction
- `DELETE /api/v1/transactions/:id` - Annuler une transaction

### Propositions
- `POST /api/v1/groups/:groupId/proposals` - Créer une proposition
- `GET /api/v1/groups/:groupId/proposals` - Liste des propositions
- `GET /api/v1/proposals/:id` - Détails d'une proposition
- `POST /api/v1/proposals/:id/vote` - Voter sur une proposition
- `PUT /api/v1/proposals/:id/close` - Clôturer une proposition
- `POST /api/v1/proposals/:id/execute` - Exécuter une proposition

Pour plus de détails, consultez [API.md](./API.md).

## Scripts

- `npm run dev` - Démarrer en mode développement
- `npm run build` - Compiler TypeScript
- `npm start` - Démarrer en production
- `npm run lint` - Vérifier le code
- `npm run format` - Formater le code

## Prochaines Étapes

- [ ] Endpoints notifications
- [ ] Endpoints invitations
- [ ] Intégration paiements mobiles
- [ ] Upload de fichiers (stockage local)
- [ ] Service email
- [ ] Notifications push
- [ ] Tests unitaires et d'intégration

## License

ISC

