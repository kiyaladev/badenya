# Badenya — Analyse, Vérification, Corrections & Améliorations

> Plan et suivi page par page — Analyse complète du projet

---

## 📂 ORGANISATION

- [x] **DOCS/** : 81 fichiers de documentation déplacés dans `DOCS/` pour nettoyer la racine
- [x] **README.md** et **TO_CHECK_TO_FIX_TO_IMPROVE.md** restent à la racine

---

## 📋 RÉSUMÉ GLOBAL

| Module | Pages/Fichiers | Bugs critiques | Sécurité | UI/UX | Statut |
|--------|---------------|----------------|----------|-------|--------|
| **Backend** | 25+ fichiers | ✅ 3/3 corrigés | 5/5 corrigés | N/A | ✅ Tests OK (80/80) — reste 4 TODOs, logging |
| **Admin** | 7 pages | ✅ 2/2 corrigés | ✅ 3/3 corrigés (token refresh) | ✅ 6/6 alert/confirm → modales custom | ⚠️ Passe 2 en cours |
| **Landing Page** | 3 pages + composants | ✅ 1/1 corrigé | 0/1 | ✅ Error boundary, reduced-motion, aria-live, label newsletter | ⚠️ Passe 2 en cours |
| **Mobile** | 20+ écrans | ✅ Bug runtime corrigé | ✅ Validation renforcée | ✅ fullName fixé, stores harmonisés | ⚠️ Passe 2 en cours |
| **API Mobile** | 19 fichiers vérifiés | ✅ 3 mocks → API réelle | ✅ Types corrigés | N/A | ✅ Corrigé |

---

## 🔴 BACKEND — Analyse par fichier

> ✅ **30 corrections appliquées** — 0 erreur TS, 80/80 tests OK
> - Bugs critiques : boucle infinie, div/0, rôle admin
> - Sécurité : resetToken exposé, CORS wildcard, Math.random OTP, validation input
> - Types Express 5, doublons requireAuth, fullName cohérent
> - `deviceId`/`deviceName` extraits du request body, populate helper, production DB guard, ai.service fullName + calcul mois réel
> - Vote controller : vérification admin du groupe pour closeVote/deleteVote, validation quorumPercentage côté contrôleur
> - Transaction routes : validation `isMongoId()` sur `groupId` et `id`

### Reste à faire

- [x] `auth.controller.ts` — `deviceId`/`deviceName` extraits du `req.body` avec fallback par défaut
- [x] `group.controller.ts` — `MEMBER_POPULATE_FIELDS` constant extrait pour réduire la répétition
- [x] `config/database.ts` — Échec explicite en production sans `MONGODB_URI`, avertissement en dev
- [x] `services/ai.service.ts` — `firstName`/`lastName` → `fullName`, commentaire sur le double cast Mongoose, calcul réel des mois (30.44 jours/mois)
- [ ] `services/ai.service.ts` — Double cast `as unknown as Array<...>` — nécessaire avec Mongoose populate
- [ ] **Tests intégration** : 4 suites échouent (nécessitent MongoDB)

---

## 🟠 ADMIN — Analyse par page

> ✅ **23 corrections appliquées**
> - `firstName`/`lastName` → `fullName` (7 fichiers)
> - `key={index}` → IDs stables, sanitisation `prompt()`, validation email login
> - Types `AdminUser` corrigés
> - Debounce 300ms sur recherches/filtres (UsersPage, GroupsPage)
> - `confirm()` natif → modales React custom (UsersPage, GroupsPage)
> - `<AdminLayout>` composant extrait (header + navigation dédupliqués, 5 pages)
> - `<ErrorBoundary>` ajouté dans `main.tsx`
> - Accessibilité ARIA ajoutée à toutes les modales (`role="dialog"`, `aria-labelledby`, `aria-modal`)
> - Token refresh automatique sur 401 dans `api.ts`

### Reste à faire

- [x] `UsersPage.tsx` — `confirm()` natif → modale React custom
- [x] `UsersPage.tsx` — Debounce 300ms sur la recherche
- [x] `GroupsPage.tsx` — Debounce 300ms sur filtres/recherche + modale custom
- [ ] `api.ts` — Token dans localStorage (vulnérable XSS)
- [x] `api.ts` — ~~Pas de token refresh → 401 = déconnexion directe~~ — **corrigé : intercepteur de réponse avec refresh token automatique sur 401**

---

## 🔵 LANDING PAGE — Analyse par page

> ✅ **17 corrections appliquées**
> - SVG professionnels, clés stables (`key={feature.id}`)
> - Accessibilité : aria-label, aria-expanded, noscript, aria-live compteurs, label newsletter
> - Icônes sociales, menu mobile amélioré
> - Formulaires newsletter et contact avec état de succès inline (remplace `alert()`)
> - Images OG standardisées (og-image.png unique pour OG + Twitter)
> - Error boundary ajouté, `prefers-reduced-motion` via MotionConfig

### Reste à faire

- [x] `HomePage.tsx` — Formulaire newsletter avec état de succès inline (remplace `alert()`)
- [x] `ContactPage.tsx` — Formulaire contact avec état de succès inline (remplace `alert()`)
- [x] `index.html` — Images OG standardisées (og-image.png partagé)
- [ ] Images OG : créer le fichier `og-image.png` réel (1200×630px recommandé)

---

## 🟢 MOBILE — Analyse par écran

> ✅ **30+ corrections appliquées**
> - `firstName`/`lastName` → `fullName` (7 services, 5 écrans, 2 stores)
> - 3 mocks → API réelle (change-password, updateProfile, register)
> - Bugs : balance undefined, user?.id null, Zustand getState
> - Design system créé (Theme.ts + skeleton components)
> - Regex email renforcée, error handling sécurisé, validation montant

### Reste à faire

- [x] `login.tsx` — Regex email renforcée (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- [x] `login.tsx` — Error handling sécurisé avec type guards (`instanceof Error` + `'response' in err`)
- [x] `register.tsx` — Regex email renforcée + error handling sécurisé
- [x] `create-proposal.tsx` — Validation de montant max (100M XOF)
- [ ] `services/api.ts` — Pas de vérification d'expiration du token avant refresh
- [ ] `user.service.ts` — Endpoint `/users/search` non implémenté côté backend (dégradation gracieuse)

---

## 🎨 UI/UX — Améliorations appliquées

- ✅ **Landing Page** : Hero dynamique, SVG features, compteurs animés, testimonials, FAQ accordéon, footer grid, navbar transitions, formulaires redesignés
- ✅ **Admin** : Login animations, dashboard sidebar moderne, cartes stats, typographie
- ✅ **Mobile** : Design system `Theme.ts` (Colors light/dark, Typography, Spacing, BorderRadius, Shadows) + skeleton components (`SkeletonItem`, `SkeletonCard`, `SkeletonList`) — non encore appliqués à tous les écrans

---

## 🔍 VÉRIFICATION API — Aucun mock restant

| Module | Statut | Notes |
|--------|--------|-------|
| **Admin** (7 pages) | ✅ Toutes via `adminService` | Sections placeholder dans GroupDetails/UserDetails |
| **Mobile** (20+ écrans) | ✅ Via stores Zustand, 3 mocks → API réelle | change-password, updateProfile, register corrigés |
| **Landing Page** (3 pages) | ✅ Formulaires avec état succès inline | Newsletter + contact = prêts pour connexion backend |

---

## 📊 PROGRESSION — Résumé

| Module | Corrigé | Reste à faire |
|--------|---------|---------------|
| **Backend** | 30 corrections (bugs, sécurité, types, qualité, deviceId, populate, DB guard, ai.service, vote admin, transaction validation, quorum validation) · 0 erreur TS · 80/80 tests | 2 items (double cast Mongoose + tests intégration) |
| **Admin** | 27 corrections (fullName, clés, sanitisation, validation, debounce, modales, layout, error boundary, ARIA, token refresh) | 1 item (sécurité token localStorage) |
| **Landing Page** | 17 corrections (SVG, accessibilité, clés stables, formulaires, OG images, error boundary, prefers-reduced-motion, aria-live, newsletter label) | 1 item (créer fichier og-image.png) |
| **Mobile** | 30+ corrections (fullName, mocks→API, bugs, types, design system, regex, error handling, validation montant) | 2 items (token expiration + search endpoint) |
| **Vérification API** | Audit complet · 3 mocks éliminés · 7 interfaces corrigées | Landing formulaires = état succès inline |

---

## 📝 PASSE 2 — Analyse approfondie (février 2026)

> Deuxième audit systématique du projet. Focus sur : TODOs oubliés, logging, `alert()`/`confirm()` restants, bugs runtime, cohérence des stores, accessibilité, liens morts, gestion offline.

---

### 🔴 BACKEND — Passe 2

> 4 TODOs identifiés dans le code source, 60+ `console.*` en production, ~~validations complémentaires à renforcer~~ ✅ Transaction routes + vote admin check + quorumPercentage corrigés.

#### TODOs dans le code

- [ ] `auth.controller.ts:298` — TODO: envoi d'email pour reset password non implémenté (mot de passe oublié ne fonctionne pas)
- [x] `vote.controller.ts:346,393` — ~~TODO: vérifier si l'utilisateur est admin du groupe avant fermeture/suppression de vote~~ — **corrigé : vérification du rôle admin du groupe ajoutée**
- [ ] `notification.controller.ts:190` — TODO: envoi push via Firebase Cloud Messaging (placeholder)
- [ ] `notification.service.ts:104,132` — TODO: intégration Firebase Cloud Messaging (`console.warn` en remplacement)

#### Logging

- [ ] 60+ instances de `console.error/warn/log` à travers contrôleurs, services et config — remplacer par un framework de logging structuré (Winston ou Pino)
  - `auth.controller.ts` — 9 instances
  - `notification.controller.ts` — 7 instances
  - `vote.controller.ts` — 6 instances
  - `group.controller.ts` — 6 instances
  - `transaction.controller.ts` — 5 instances
  - `proposal.controller.ts` — 6 instances
  - `ai.controller.ts` — 6 instances
  - `report.controller.ts` — 4 instances
  - `notification.service.ts` — 7 instances
  - `ai.service.ts` — 3 instances
  - `database.ts` — 6 instances
  - `index.ts` — 4 instances

#### Validation

- [x] `vote.controller.ts` — `endDate` validé ISO 8601 côté route mais pas vérifié `> Date.now()` côté contrôleur (date dans le passé acceptée) — **corrigé : validation ajoutée**
- [x] `vote.controller.ts` — ~~`quorumPercentage` validé `0-100` côté route mais pas re-vérifié côté contrôleur~~ — **corrigé : validation 0-100 ajoutée dans le contrôleur**
- [x] Routes de transactions — ~~pas de validation `isMongoId()` sur `param('groupId')` (contrairement aux votes)~~ — **corrigé : `groupIdValidation` et `transactionIdValidation` ajoutés**

#### Fonctionnalités incomplètes

- [ ] Reset password — endpoint existe mais n'envoie aucun email (TODO ligne 298)
- [ ] Firebase push — toutes les notifications push sont des `console.warn` placeholders
- [ ] Tests intégration — 4 suites échouent (nécessitent MongoDB réel)

---

### 🟠 ADMIN — Passe 2

> ~~3 pages utilisent encore `alert()`/`confirm()`/`prompt()` natifs~~ ✅ Corrigé — modales React custom + notifications toast ajoutées. 9 `console.error()`, ~~composants dupliqués~~ ✅ Extrait via `<AdminLayout>`, ~~accessibilité incomplète~~ ✅ ARIA ajouté, ~~pas d'error boundary~~ ✅ Ajouté.

#### `alert()`/`confirm()`/`prompt()` restants

- [x] `UserDetailsPage.tsx:41` — `confirm()` natif pour suspension utilisateur → modale React custom
- [x] `UserDetailsPage.tsx:48,58` — `alert()` natif pour erreurs/succès → notification toast
- [x] `GroupDetailsPage.tsx:41` — `confirm()` natif pour archivage groupe → modale React custom
- [x] `GroupDetailsPage.tsx:48` — `alert()` natif pour erreur → notification toast
- [x] `TransactionsPage.tsx:50` — `prompt()` natif pour raison de signalement → modale avec input
- [x] `TransactionsPage.tsx:56,58` — `alert()` natif pour succès/erreur → notification toast

#### Logging

- [ ] 9 instances de `console.error()` dans les pages admin et `authService.ts` — remplacer par gestion d'erreur silencieuse ou logging structuré
  - `UsersPage.tsx:34`, `LoginPage.tsx:34`, `GroupsPage.tsx:36`, `DashboardPage.tsx:31,42`
  - `GroupDetailsPage.tsx:24`, `UserDetailsPage.tsx:24`, `TransactionsPage.tsx:35`, `authService.ts:44`

#### Duplication de code

- [x] Navigation sidebar dupliquée dans chaque page (~40 lignes identiques) → ~~extraire en composant `<Sidebar>`~~ — **corrigé : `<AdminLayout>` composant extrait**
- [x] En-tête avec bouton déconnexion dupliqué → ~~extraire en composant `<Header>`~~ — **corrigé : intégré dans `<AdminLayout>`**
- [x] Layout commun (sidebar + header + content) dupliqué → ~~extraire en composant `<Layout>`~~ — **corrigé : `<AdminLayout>` utilisé par 5 pages**

#### Accessibilité

- [x] Modales (UsersPage, GroupsPage, UserDetailsPage, GroupDetailsPage, TransactionsPage) — ~~manquent `role="dialog"`, `aria-labelledby`, `aria-modal="true"`~~ — **corrigé : attributs ARIA ajoutés à toutes les modales**
- [ ] Modales — pas de focus trap (focus s'échappe vers les éléments en arrière-plan)
- [ ] Formulaires — pas de `aria-describedby` pour les messages d'erreur
- [ ] Tables — manquent `role` et labels ARIA appropriés

#### Robustesse

- [x] Pas d'error boundary React — ~~si un composant crash, l'app entière tombe~~ — **corrigé : `<ErrorBoundary>` ajouté dans `main.tsx`**
- [x] `api.ts` — ~~pas de tentative de refresh token, déconnexion directe sur 401~~ — **corrigé : intercepteur avec refresh token automatique**

---

### 🔵 LANDING PAGE — Passe 2

> 2 TODOs backend, 14+ liens `href="#"` morts, valeurs hardcodées, ~~animations sans `prefers-reduced-motion`~~ ✅, favicon Vite, ~~pas d'error boundary~~ ✅.

#### TODOs dans le code

- [ ] `HomePage.tsx:127` — TODO: connecter le formulaire newsletter au backend API
- [ ] `ContactPage.tsx:17` — TODO: connecter le formulaire contact au backend API

#### Liens morts (`href="#"`)

- [ ] `HomePage.tsx:554,566` — Boutons de téléchargement App Store / Google Play → liens placeholder
- [ ] `ContactPage.tsx:254,262,270` — Liens réseaux sociaux (Facebook, Twitter, LinkedIn) → placeholder
- [ ] `Footer.tsx:22,27,32,37` — Icônes réseaux sociaux (Facebook, Twitter, Instagram, LinkedIn) → placeholder
- [ ] `Footer.tsx:87,92` — Liens « Carrières » et « Blog » → placeholder
- [ ] `Footer.tsx:104,109,114` — Liens « CGU », « Politique de confidentialité », « Mentions légales » → placeholder

#### Valeurs hardcodées

- [ ] `HomePage.tsx:187-193` — Montants financiers dans la démo hero (2 450 000 XOF, 850 000 XOF, etc.)
- [ ] `HomePage.tsx:326-329` — Statistiques fictives (10 000 utilisateurs, 500M+ XOF, 50+ communautés, 98% satisfaction)
- [ ] `AboutPage.tsx:91` — Année de fondation `2024` hardcodée

#### Performance & Accessibilité

- [x] Animations framer-motion — ~~sans `prefers-reduced-motion` media query~~ — **corrigé : `MotionConfig reducedMotion="user"` ajouté dans App.tsx**
- [x] Compteurs statistiques animés — ~~pas de `aria-live` pour les lecteurs d'écran~~ — **corrigé : `aria-live="polite"` ajouté**
- [x] Formulaire newsletter — ~~`placeholder` utilisé au lieu d'un `<label>` visible~~ — **corrigé : `<label>` visible ajouté avec `htmlFor`**

#### Divers

- [ ] `favicon` = `vite.svg` par défaut — remplacer par un favicon Badenya dédié
- [x] ~~Pas d'error boundary React~~ — **corrigé : `<ErrorBoundary>` ajouté dans `main.tsx`**
- [x] `sitemap.xml` — ~~`lastmod` dates (2025-10-10) périmées, inclut `/features` et `/pricing` qui n'existent pas~~ — **corrigé : routes inexistantes supprimées, dates mises à jour (2026-02-16)**

---

### 🟢 MOBILE — Passe 2

> ~~1 bug runtime (variable `error` non destructurée)~~ ✅ Corrigé. 3 TODOs, ~~incohérence `loading`/`isLoading`~~ ✅ Harmonisé, 31 `console.error()`, pas de gestion offline.

#### Bugs

- [x] `group-insights.tsx:12,26` — `error` non destructuré du `useAIStore()` mais utilisé dans le `useEffect` → **corrigé : `error` ajouté à la destructuration**

#### TODOs dans le code

- [ ] `profile.tsx:111-112` — `totalContributions` et `totalVotes` hardcodés à `0` — TODO: calculer depuis les transactions/votes
- [ ] `settings.tsx:85` — Suppression de compte non implémentée — TODO: implémenter

#### Cohérence des stores

- [x] `transactionStore.ts` utilise `loading` (6 stores utilisent `isLoading`, 1 utilise `loading`) — **harmonisé vers `isLoading`**
  - `authStore.ts` → `isLoading` ✅
  - `groupStore.ts` → `isLoading` ✅
  - `proposalStore.ts` → `isLoading` ✅
  - `voteStore.ts` → `isLoading` ✅
  - `aiStore.ts` → `isLoading` ✅
  - `notificationStore.ts` → `isLoading` ✅
  - `transactionStore.ts` → `isLoading` ✅

#### Logging

- [ ] 31 instances de `console.error()` dans les services et écrans — pas de logging structuré
  - `push-notification.service.ts` — 13 instances
  - `upload.service.ts` — 7 instances
  - `group-reports.tsx` — 3 instances
  - `notificationStore.ts` — 2 instances
  - `auth.service.ts`, `splash.tsx`, `add-contribution.tsx`, `settings.tsx`, `edit-profile.tsx`, `_layout.tsx` — 1 chacun

#### Gestion offline

- [ ] Aucune détection de connexion réseau (pas de `NetInfo`)
- [ ] Pas de file d'attente hors-ligne pour les requêtes en échec
- [ ] Pas de cache local pour les données chargées (perte de données à chaque redémarrage)

#### Endpoint manquant

- [ ] `user.service.ts:16-18` — Appelle `GET /users/search?q=...` qui n'existe pas côté backend (aucune route `/users/search`)

---

## 📊 PROGRESSION — Résumé (mise à jour passe 2)

| Module | Corrigé (passe 1 + 2) | Identifié (passe 2) | Total reste à faire |
|--------|-------------------|---------------------|---------------------|
| **Backend** | 31 corrections · 0 erreur TS · 80/80 tests | 6 TODOs, 60+ console.*, ~~validations~~ ✅, fonctionnalités incomplètes | ~6 items |
| **Admin** | 27 corrections (fullName, clés, debounce, modales, toasts, layout, error boundary, ARIA, token refresh) | ~~6 alert/confirm/prompt~~ ✅, 9 console.error, ~~duplication code~~ ✅, ~~accessibilité ARIA modales~~ ✅, ~~token refresh~~ ✅ | ~3 items |
| **Landing Page** | 18 corrections (SVG, accessibilité, formulaires, OG, sitemap, error boundary, reduced-motion, aria-live, newsletter label) | 2 TODOs backend, 14+ liens morts, hardcoded values, ~~animations~~ ✅, favicon | ~8 items |
| **Mobile** | 32+ corrections (fullName, mocks→API, bugs, regex, validation, stores harmonisés) | ~~1 bug runtime~~ ✅, 3 TODOs, ~~incohérence stores~~ ✅, 31 console.error, pas d'offline | ~7 items |

---

## 🔮 AMÉLIORATIONS FUTURES RECOMMANDÉES (mise à jour)

### Critique (bugs / crashes)
- [x] **Mobile** : `group-insights.tsx` — ajouter `error` dans la destructuration de `useAIStore()` — **corrigé**
- [ ] **Backend** : implémenter l'envoi d'email pour `forgotPassword` (actuellement TODO)

### Haute priorité
- [ ] Remplacer 60+ `console.*` backend par Winston ou Pino (logging structuré)
- [x] Migrer les `alert()`/`confirm()`/`prompt()` restants vers des modales React (admin: 5 pages) — **corrigé**
- [x] Ajouter un token refresh automatique dans `admin/src/services/api.ts` au lieu de déconnexion sur 401 — **corrigé**
- [ ] Migrer le stockage des tokens admin de `localStorage` vers `httpOnly` cookies
- [x] Ajouter des error boundaries React dans admin ~~, landing page et mobile~~ — **corrigé pour admin**
- [x] Ajouter des error boundaries React dans landing page ~~et mobile~~ — **corrigé pour landing page**
- [ ] Implémenter la gestion offline dans l'app mobile (NetInfo + cache)
- [x] Remplacer `confirm()` et `prompt()` natifs par des modales React custom (UsersPage, GroupsPage — fait)
- [x] Ajouter un debounce sur les recherches/filtres (UsersPage, GroupsPage — fait)

### Moyenne priorité
- [x] **Admin** : Extraire les composants dupliqués admin : `<Layout>`, `<Sidebar>`, `<Header>` → **corrigé via `<AdminLayout>`**
- [x] Harmoniser `loading` → `isLoading` dans `transactionStore.ts` (mobile) — **corrigé**
- [ ] Ajouter un `package.json` racine pour la gestion monorepo
- [ ] Connecter les formulaires de la landing page (newsletter, contact) au backend
- [ ] Ajouter des tests d'intégration avec `mongodb-memory-server` configuré
- [ ] Implémenter le endpoint `GET /users/search` côté backend (utilisé par mobile)
- [ ] Compléter l'intégration Firebase Cloud Messaging (backend + mobile)
- [x] Ajouter `prefers-reduced-motion` pour les animations framer-motion — **corrigé**
- [ ] Implémenter les fonctions TODO du profil mobile (`totalContributions`, `totalVotes`)
- [x] Ajouter accessibilité ARIA complète dans les modales admin — **corrigé : `role="dialog"`, `aria-labelledby`, `aria-modal` ajoutés**

### Basse priorité
- [ ] Ajouter un framework i18n pour supporter la multi-langue (fr/en/ar)
- [ ] Remplacer les 14+ liens `href="#"` du footer/pages par de vrais URLs
- [ ] Ajouter le fichier `og-image.png` (1200×630px) pour le SEO de la landing page
- [ ] Remplacer le favicon `vite.svg` par un favicon Badenya
- [x] Mettre à jour `sitemap.xml` (dates `lastmod` périmées, routes inexistantes) — **corrigé**
- [ ] Implémenter la suppression de compte mobile (`settings.tsx`)
- [x] Ajouter la validation `endDate > now` côté contrôleur de votes — **corrigé**
