Badenya - Spécifications Techniques Complètes
Application Mobile de Gestion Financière Collaborative

1. VISION & POSITIONNEMENT
Proposition de Valeur
"Le Ciment Numérique de la Solidarité Africaine"
Une application mobile native qui digitalise les pratiques traditionnelles de tontines et d'épargne collective en Afrique, en y ajoutant transparence, sécurité et intelligence artificielle.
Objectifs Stratégiques

Inclusion Financière: Démocratiser l'accès aux outils de gestion financière collaborative
Transparence Totale: Chaque franc est tracé, chaque décision est documentée
Autonomisation: Donner aux communautés les outils pour s'auto-gérer
Intelligence: Utiliser l'IA pour des insights financiers accessibles à tous


2. ARCHITECTURE TECHNIQUE MOBILE
Stack Technologique
Frontend Mobile

Framework: React Native (dernière version stable)

Support iOS et Android depuis une seule codebase
Performance native avec React Native New Architecture (Fabric + TurboModules)
Hot reload pour un développement rapide


UI Framework: NativeWind (Tailwind CSS pour React Native)

Utilisation de classes Tailwind adaptées au mobile
Design system cohérent et maintenable
Support des thèmes sombre/clair


State Management: Zustand (v4+)

Simple, performant et sans boilerplate
Parfait pour React Native
Middleware pour la persistance (zustand/persist avec AsyncStorage)


Navigation: React Navigation v6

Navigation native fluide
Support des deep links
Transitions animées personnalisables



Backend

Runtime: Node.js v20+ avec TypeScript 5+
Framework: Express.js avec architecture modulaire
Base de données: MongoDB sur serveur personnel

Schémas flexibles avec Mongoose
Backup automatiques sur serveur personnel
Configuration pour développement local et production



APIs & Services

Authentification:

JWT (access + refresh tokens)
Bcrypt pour le hashing des mots de passe
Support OAuth2 (Google, Apple Sign-In)


Paiements:

CinetPay (Côte d'Ivoire, Sénégal, etc.)
Orange Money / MTN Mobile Money APIs
Wave API (en expansion)


Intelligence Artificielle:

Google Gemini 2.5 Flash pour analyses
Gemini Pro pour insights complexes (option premium)


Notifications Push:

Firebase Cloud Messaging (FCM)
APNs pour iOS
Notifications locales et à distance


Stockage Fichiers:

Filesystem (stockage local) pour avatars et documents
Compression automatique des images



DevOps & Infrastructure

Hosting Backend: Serveur personnel
Database: MongoDB sur serveur personnel
CI/CD: GitHub Actions
Versioning: Semantic versioning avec CodePush pour updates OTA


3. MODÈLES DE DONNÉES OPTIMISÉS
3.1 User (Utilisateur)
typescript{
  _id: ObjectId,
  fullName: String (required, trim, index),
  email: String (required, unique, lowercase, index),
  phone: String (unique, validation E.164),
  password: String (hashed, bcrypt rounds: 12),
  avatar: {
    url: String (chemin local ou URL),
    filename: String
  },
  
  // Sécurité
  isEmailVerified: Boolean (default: false),
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Sessions
  refreshTokens: [{
    token: String,
    deviceId: String,
    deviceName: String,
    createdAt: Date,
    expiresAt: Date
  }],
  
  // Préférences
  preferences: {
    language: String (default: 'fr', enum: ['fr', 'en', 'ar']),
    currency: String (default: 'XOF'),
    notifications: {
      push: Boolean (default: true),
      email: Boolean (default: true),
      proposalCreated: Boolean (default: true),
      proposalVoted: Boolean (default: true),
      contributionReceived: Boolean (default: true)
    },
    theme: String (enum: ['light', 'dark', 'auto'], default: 'auto')
  },
  
  // Méta
  lastLoginAt: Date,
  lastActiveAt: Date,
  deviceTokens: [String], // FCM tokens
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- email (unique)
- phone (unique, sparse)
- fullName (text search)
3.2 Group (Groupe/Tontine)
typescript{
  _id: ObjectId,
  name: String (required, trim, max: 100),
  description: String (max: 500),
  type: String (enum: ['tontine', 'association', 'family', 'friends', 'project'], required),
  
  // Configuration financière
  currency: String (default: 'XOF'),
  balance: Number (default: 0, min: 0),
  targetAmount: Number (optional),
  
  // Configuration des cotisations
  contributionSettings: {
    frequency: String (enum: ['daily', 'weekly', 'monthly', 'custom'], default: 'monthly'),
    amount: Number (montant recommandé),
    dueDay: Number (1-31 pour mensuel, 1-7 pour hebdomadaire),
    autoReminder: Boolean (default: true)
  },
  
  // Membres
  members: [{
    userId: ObjectId (ref: 'User'),
    role: String (enum: ['admin', 'treasurer', 'member'], required),
    joinedAt: Date,
    totalContributed: Number (default: 0),
    lastContributionAt: Date,
    status: String (enum: ['active', 'suspended', 'left'], default: 'active')
  }],
  
  // Gouvernance
  votingRules: {
    quorum: Number (default: 50, pourcentage minimum),
    approvalThreshold: Number (default: 50, pourcentage pour approbation),
    votingDuration: Number (default: 72, heures),
    allowAbstention: Boolean (default: true)
  },
  
  // Statistiques
  stats: {
    totalContributions: Number (default: 0),
    totalExpenses: Number (default: 0),
    totalProposals: Number (default: 0),
    activeProposals: Number (default: 0)
  },
  
  // Paramètres
  settings: {
    isPrivate: Boolean (default: false),
    requireApprovalToJoin: Boolean (default: true),
    allowMemberProposals: Boolean (default: true),
    maxProposalsPerMonth: Number (default: 10)
  },
  
  // Image
  avatar: {
    url: String,
    publicId: String
  },
  
  // Méta
  isActive: Boolean (default: true),
  archivedAt: Date,
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- members.userId (compound)
- type
- isActive
- createdAt (descending)
3.3 Transaction
typescript{
  _id: ObjectId,
  groupId: ObjectId (ref: 'Group', required, index),
  type: String (enum: ['contribution', 'expense', 'refund', 'adjustment'], required),
  
  // Montant
  amount: Number (required, min: 1),
  currency: String (required),
  
  // Acteurs
  initiatedBy: ObjectId (ref: 'User', required),
  beneficiary: {
    type: String (enum: ['member', 'external', 'group']),
    userId: ObjectId (ref: 'User', for member),
    name: String (for external),
    details: String
  },
  
  // Détails
  description: String (required, max: 500),
  category: String (enum: ['membership', 'loan', 'investment', 'charity', 'event', 'emergency', 'other']),
  
  // Paiement
  paymentMethod: String (enum: ['cash', 'mobile_money', 'bank_transfer', 'cinetpay', 'wave', 'orange_money']),
  paymentReference: String,
  paymentProof: {
    url: String,
    publicId: String
  },
  
  // Lié à une proposition
  proposalId: ObjectId (ref: 'Proposal', optional),
  
  // Validation
  status: String (enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'completed'),
  verifiedBy: ObjectId (ref: 'User'),
  verifiedAt: Date,
  
  // Balance snapshot
  balanceBefore: Number,
  balanceAfter: Number,
  
  // Méta
  metadata: Map,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- groupId + createdAt (compound, descending)
- type
- initiatedBy
- status
- proposalId
3.4 Proposal (Proposition de Dépense)
typescript{
  _id: ObjectId,
  groupId: ObjectId (ref: 'Group', required, index),
  
  // Contenu
  title: String (required, max: 200),
  description: String (required, max: 2000),
  amount: Number (required, min: 1),
  currency: String (required),
  
  // Bénéficiaire
  beneficiary: {
    type: String (enum: ['member', 'external', 'group']),
    userId: ObjectId (ref: 'User'),
    name: String,
    details: String
  },
  
  // Créateur
  proposedBy: ObjectId (ref: 'User', required),
  
  // Justification
  attachments: [{
    type: String (enum: ['image', 'document', 'link']),
    url: String,
    publicId: String,
    name: String
  }],
  
  category: String (enum: ['loan', 'investment', 'charity', 'event', 'emergency', 'other']),
  priority: String (enum: ['low', 'medium', 'high', 'urgent'], default: 'medium'),
  
  // Vote
  votes: [{
    userId: ObjectId (ref: 'User'),
    decision: String (enum: ['for', 'against', 'abstain'], required),
    comment: String (max: 500),
    votedAt: Date
  }],
  
  votingDeadline: Date,
  
  // Résultat
  status: String (enum: ['pending', 'approved', 'rejected', 'expired', 'executed'], default: 'pending'),
  
  result: {
    totalVotes: Number,
    votesFor: Number,
    votesAgainst: Number,
    votesAbstain: Number,
    participationRate: Number,
    decidedAt: Date
  },
  
  // Exécution
  executedAt: Date,
  transactionId: ObjectId (ref: 'Transaction'),
  
  // Méta
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- groupId + status (compound)
- proposedBy
- votingDeadline
- status
3.5 Notification
typescript{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required, index),
  
  // Type
  type: String (enum: [
    'group_invitation',
    'member_joined',
    'proposal_created',
    'proposal_approved',
    'proposal_rejected',
    'contribution_received',
    'vote_reminder',
    'payment_reminder',
    'expense_executed',
    'role_changed',
    'group_archived'
  ], required),
  
  // Contenu
  title: String (required, max: 100),
  message: String (required, max: 500),
  
  // Données contextuelles
  data: {
    groupId: ObjectId,
    proposalId: ObjectId,
    transactionId: ObjectId,
    amount: Number,
    actionUrl: String
  },
  
  // État
  isRead: Boolean (default: false),
  readAt: Date,
  
  // Priorité
  priority: String (enum: ['low', 'normal', 'high'], default: 'normal'),
  
  // Méta
  createdAt: Date,
  expiresAt: Date (TTL index)
}

// Indexes
- userId + isRead + createdAt (compound)
- type
- expiresAt (TTL)
3.6 Invitation
typescript{
  _id: ObjectId,
  groupId: ObjectId (ref: 'Group', required),
  invitedBy: ObjectId (ref: 'User', required),
  
  // Destinataire
  email: String (required, lowercase),
  phone: String,
  
  // Token
  token: String (unique, index),
  
  // Status
  status: String (enum: ['pending', 'accepted', 'declined', 'expired'], default: 'pending'),
  
  // Méta
  expiresAt: Date,
  acceptedAt: Date,
  createdAt: Date
}

// Indexes
- token (unique)
- email + groupId (compound)
- status + expiresAt
3.7 AIReport (Rapport IA)
typescript{
  _id: ObjectId,
  groupId: ObjectId (ref: 'Group', required, index),
  generatedBy: ObjectId (ref: 'User', required),
  
  // Période analysée
  periodStart: Date,
  periodEnd: Date,
  
  // Données analysées
  transactionsAnalyzed: Number,
  
  // Résultat
  report: {
    summary: String,
    totalContributions: Number,
    totalExpenses: Number,
    netBalance: Number,
    
    insights: [{
      category: String,
      observation: String,
      recommendation: String
    }],
    
    trends: [{
      metric: String,
      direction: String (enum: ['up', 'down', 'stable']),
      percentage: Number,
      description: String
    }],
    
    topContributors: [{
      userId: ObjectId,
      amount: Number
    }],
    
    expenseBreakdown: [{
      category: String,
      amount: Number,
      percentage: Number
    }]
  },
  
  // Méta
  model: String (ex: 'gemini-2.5-flash'),
  tokensUsed: Number,
  generationTime: Number (ms),
  createdAt: Date
}

// Indexes
- groupId + createdAt (compound, descending)

4. ARCHITECTURE API REST
Base URL
Production: https://api.badenya.app/v1
Staging: https://api-staging.badenya.app/v1
Authentification
POST /auth/register
json{
  "fullName": "Kouadio Jean",
  "email": "jean@example.com",
  "phone": "+2250748123456",
  "password": "SecurePass123!"
}
POST /auth/login
json{
  "email": "jean@example.com",
  "password": "SecurePass123!",
  "deviceId": "uuid-device",
  "deviceName": "iPhone 14 Pro"
}
Response: { accessToken, refreshToken, user }
POST /auth/refresh
json{
  "refreshToken": "eyJhbGc..."
}
POST /auth/logout
Headers: Authorization: Bearer {accessToken}
POST /auth/forgot-password
json{
  "email": "jean@example.com"
}
POST /auth/reset-password
json{
  "token": "reset-token",
  "newPassword": "NewPass123!"
}
Utilisateurs
GET /users/me
Récupère le profil de l'utilisateur connecté
PATCH /users/me
json{
  "fullName": "Nouveau Nom",
  "phone": "+2250748123456",
  "preferences": {
    "language": "fr",
    "notifications": {
      "push": true
    }
  }
}
POST /users/me/avatar
FormData: avatar (file)
DELETE /users/me/avatar
Groupes
GET /groups
Query params: ?type=tontine&status=active&page=1&limit=20
POST /groups
json{
  "name": "Tontine Familiale",
  "description": "Notre tontine mensuelle",
  "type": "tontine",
  "currency": "XOF",
  "contributionSettings": {
    "frequency": "monthly",
    "amount": 10000,
    "dueDay": 1
  }
}
GET /groups/:groupId
PATCH /groups/:groupId
(Admin uniquement)
DELETE /groups/:groupId
(Admin uniquement, soft delete)
GET /groups/:groupId/members
POST /groups/:groupId/members/invite
json{
  "email": "nouveau@example.com",
  "role": "member"
}
PATCH /groups/:groupId/members/:userId
json{
  "role": "treasurer"
}
DELETE /groups/:groupId/members/:userId
(Retirer un membre)
Transactions
GET /groups/:groupId/transactions
Query: ?type=contribution&page=1&limit=20&startDate=2025-01-01
POST /groups/:groupId/transactions
json{
  "type": "contribution",
  "amount": 10000,
  "description": "Cotisation janvier 2025",
  "paymentMethod": "mobile_money",
  "paymentReference": "TXN123456"
}
GET /transactions/:transactionId
PATCH /transactions/:transactionId/verify
(Pour trésorier/admin)
Propositions
GET /groups/:groupId/proposals
Query: ?status=pending&page=1&limit=20
POST /groups/:groupId/proposals
json{
  "title": "Achat de matériel",
  "description": "Nous avons besoin de...",
  "amount": 50000,
  "category": "investment",
  "priority": "medium",
  "beneficiary": {
    "type": "external",
    "name": "Fournisseur ABC"
  }
}
GET /proposals/:proposalId
POST /proposals/:proposalId/vote
json{
  "decision": "for",
  "comment": "Je suis d'accord avec cette dépense"
}
DELETE /proposals/:proposalId
(Créateur uniquement, si pas encore de votes)
Notifications
GET /notifications
Query: ?isRead=false&page=1&limit=50
PATCH /notifications/:notificationId/read
POST /notifications/read-all
DELETE /notifications/:notificationId
Intelligence Artificielle
POST /groups/:groupId/reports/generate
json{
  "periodStart": "2025-01-01",
  "periodEnd": "2025-10-09"
}
Response: Rapport AI complet
GET /groups/:groupId/reports
Liste des rapports précédents
GET /reports/:reportId

5. FEATURES MOBILES AVANCÉES
5.1 Notifications Push Intelligentes

Géolocalisation: Rappels contextuels selon la localisation
Timing intelligent: Envoi aux heures optimales selon les habitudes
Groupage: Regroupement des notifications similaires
Actions rapides: Vote, confirmation directement depuis la notification

5.2 Mode Hors-ligne

Consultation: Lecture des données en cache (Zustand persist)
Queue d'actions: File d'attente des actions à synchroniser
Indicateur de sync: Status de synchronisation visible
Conflict resolution: Gestion des conflits de données

5.3 Biométrie

Face ID / Touch ID: Authentification rapide
Verrouillage automatique: Après inactivité
Transactions sensibles: Confirmation biométrique pour votes et paiements

5.4 Partage et Collaboration

Deep Links: badenya://group/{groupId}
QR Code: Génération pour invitations rapides
Partage de rapports: Export PDF/Image via système de partage natif

5.5 Accessibilité

Support VoiceOver/TalkBack: Narration complète
Tailles de texte dynamiques: Respect des préférences système
Contraste élevé: Mode pour malvoyants
Haptic feedback: Retours tactiles pour actions importantes

5.6 Performance

Lazy loading: Chargement progressif des listes
Image optimization: Compression et mise en cache
Pagination: 20 items par page par défaut
Prefetching: Anticipation des données suivantes


6. SÉCURITÉ & CONFORMITÉ
6.1 Authentification & Autorisation

JWT avec rotation: Access token (15min) + Refresh token (30 jours)
Rate limiting: 5 tentatives de connexion / 15 minutes
2FA optionnel: Via SMS ou app d'authentification
Gestion des sessions: Liste des devices connectés avec révocation

6.2 Protection des Données

Chiffrement:

En transit: TLS 1.3
Au repos: Chiffrement MongoDB
Mots de passe: Bcrypt avec 12 rounds


PII: Données personnelles anonymisées dans les logs
RGPD Compliance: Export et suppression des données

6.3 Transactions

Idempotence: Tokens uniques pour éviter doublons
Audit trail: Logs immuables de toutes les actions financières
Validation stricte: Contrôles multi-niveaux (frontend, backend, DB)

6.4 Monitoring

Alertes: Notifications aux admins pour actions suspectes
Logs structurés: Winston avec rotation quotidienne
Error tracking: Logs personnalisés avec monitoring serveur


7. EXPÉRIENCE UTILISATEUR MOBILE
7.1 Design System
Palette de Couleurs
Primary (Vert Confiance):
- 50:  #f0fdf4
- 500: #22c55e (Principal)
- 600: #16a34a (Hover)
- 700: #15803d (Active)

Secondary (Bleu Actions):
- 500: #3b82f6
- 600: #2563eb

Danger (Rouge Attention):
- 500: #ef4444
- 600: #dc2626

Neutral (Gris Interface):
- 50:  #fafafa (Background)
- 100: #f5f5f5
- 700: #404040 (Text primary)
- 900: #171717 (Text strong)
Typographie

Headlines: Inter Bold, 20-32px
Body: Inter Regular, 14-16px
Captions: Inter Medium, 12-14px
Line height: 1.5 pour lisibilité

Espacements (Tailwind)

Padding cards: p-4 (16px)
Gaps listes: gap-3 (12px)
Marges sections: my-6 (24px)

7.2 Composants Clés
GroupCard
┌─────────────────────────────┐
│ 👥 Avatar   Tontine Famille │
│             10 membres       │
│                              │
│ 💰 450,000 XOF              │
│ 📊 +15% ce mois             │
│                              │
│ [Voir détails →]            │
└─────────────────────────────┘
ProposalCard
┌─────────────────────────────┐
│ 🎯 Achat de matériel        │
│ Par: Jean K. - Il y a 2h    │
│                              │
│ 💰 50,000 XOF               │
│ ⏱️ Fin dans 48h             │
│                              │
│ ████████░░ 8/10 votes       │
│ ✅ 6 Pour  ❌ 2 Contre      │
│                              │
│ [👍 Pour] [👎 Contre]       │
└─────────────────────────────┘
TransactionItem
┌─────────────────────────────┐
│ 📥 Cotisation               │
│ Jean Kouadio                │
│                              │
│ + 10,000 XOF   14:30        │
│ Mobile Money • Vérifié ✓    │
└─────────────────────────────┘
7.3 Écrans Principaux
1. Splash Screen

Logo animé Badenya
Tagline
Chargement initial

2. Onboarding (première utilisation)

3 slides: Concept, Sécurité, Collaboration
Skip possible

3. Auth

Login/Register toggle
Authentification sociale
"Mot de passe oublié"

4. Dashboard (Home)

Header avec avatar et notifications badge
Résumé financier global
Liste des groupes (cards scrollables)
FAB "+" pour créer groupe

5. Group Details

Tabs: Vue d'ensemble, Transactions, Propositions, Membres
Actions rapides: Cotiser, Proposer, Inviter
Graphique d'évolution du solde

6. Create Proposal

Formulaire multi-étapes
Upload de justificatifs
Prévisualisation

7. Vote Screen

Détails de la proposition
Commentaires existants
Boutons de vote prominent
Timer visuel

8. Profile

Informations personnelles
Préférences
Statistiques personnelles
Historique global
Déconnexion

9. Notifications Center

Liste filtrée par type
Actions inline
Mark all as read

10. AI Reports

Sélection de période
Génération avec loading
Affichage interactif (graphiques)
Partage/Export

7.4 Animations & Feedback

Skeleton loaders: Pendant chargements
Pull to refresh: Sur listes
Swipe actions: Sur transactions/notifications
Success animations: Lottie pour confirmations
Haptic feedback: Sur actions importantes


8. STRATÉGIE DE DÉPLOIEMENT
8.1 Environnements

Dev: Développement local
Staging: Tests pré-production
Production: Application live

8.2 CI/CD Pipeline
GitHub Push
    ↓
GitHub Actions
    ↓
[Tests Unitaires + E2E]
    ↓
Build APK/IPA
    ↓
Deploy Backend (Serveur personnel)
    ↓
Upload to App Stores
8.3 Stratégie de Release

Versioning: Semantic (1.0.0)
Beta Testing: TestFlight (iOS) + Firebase App Distribution (Android)
Rollout progressif: 10% → 50% → 100%
Hotfix: Pipeline accéléré pour bugs critiques

8.4 Monitoring Production

Uptime: UptimeRobot (99.9% SLA)
Performance: Firebase Performance Monitoring
Logs: Système de logs personnalisé avec monitoring serveur


9. ROADMAP & ÉVOLUTIONS
Phase 1 - MVP (3 mois)
✅ Authentification complète
✅ CRUD Groupes
✅ Gestion financière basique
✅ Système de vote
✅ Notifications push
✅ Rapports IA simples
Phase 2 - Consolidation (2 mois)

Mode hors-ligne complet
Intégrations paiement réelles
Chatbot IA dans l'app
Multi-devises

Phase 3 - Croissance (3 mois)

Programme de parrainage
Prêts entre membres
Calendrier de paiements
Investissements groupés

Phase 4 - Écosystème (6 mois)

Marketplace de services
Partenariats bancaires
API publique pour tiers
Version Web (PWA)


10. CONTRAINTES & CONSIDÉRATIONS
Techniques

Offline-first: Résilience réseau faible (Afrique)
Low data: Optimisation pour connexions lentes
Battery: Économie d'énergie (background sync limité)
Storage: Gestion cache intelligent (max 100MB)

Réglementaires

KYC: Vérification d'identité pour montants élevés
AML: Détection de transactions suspectes
Licences: Conformité aux régulateurs financiers locaux

Business

Monétisation:

Gratuit jusqu'à 5 groupes
Premium: 2,000 XOF/mois (groupes illimités + IA avancée)
Commission: 1% sur transactions > 100,000 XOF


Support:

FAQ intégrée
Chat support (heures ouvrables)
WhatsApp Business




11. MÉTRIQUES DE SUCCÈS
Adoption

MAU (Monthly Active Users): Objectif 10,000 à 6 mois
Retention D7: > 40%
Retention D30: > 25%
