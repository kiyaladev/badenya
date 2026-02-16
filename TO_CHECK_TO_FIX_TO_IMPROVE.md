# Badenya — Audit & Suivi des corrections

---

## 📋 RÉSUMÉ

| Module | Corrigé | Reste à faire |
|--------|---------|---------------|
| **Backend** | 37 corrections · 0 erreur TS · 80/80 tests | ~8 items |
| **Admin** | 33 corrections | ~4 items |
| **Landing Page** | 22 corrections | ~6 items |
| **Mobile** | 38+ corrections | ~7 items |
| **Projet** | DOCS/, README, LICENSE, SECURITY.md | ~2 items |

---

## 🔴 BACKEND

> ✅ **37 corrections** (passes 1-3) — 0 erreur TS, 80/80 tests
> - Bugs critiques, sécurité, types Express 5, fullName, vote admin, transaction validation
> - Passe 3 : `try-catch` isAdmin, JWT secret validation (fail-fast au démarrage + throw dans jwt.ts), `crypto.timingSafeEqual()` pour refresh tokens, rate limiting PUT /profile et /change-password, middleware `compression`

### Reste à faire

- [ ] `services/ai.service.ts` — Double cast `as unknown as Array<...>` (nécessaire avec Mongoose populate)
- [ ] `auth.controller.ts:298` — TODO: envoi d'email pour reset password
- [ ] `notification.controller.ts/service.ts` — TODO: intégration Firebase Cloud Messaging
- [ ] Tests intégration — 4 suites échouent (nécessitent MongoDB réel)
- [ ] 60+ `console.*` → remplacer par Winston ou Pino
- [ ] `index.ts` — `xss-clean` dans `package.json` mais non importé (package deprecated)
- [ ] `index.ts` — Pas de middleware corrélation ID (`express-request-id`)
- [ ] `api.ts` — Token admin dans localStorage (vulnérable XSS → migrer vers `httpOnly` cookies)

---

## 🟠 ADMIN

> ✅ **33 corrections** (passes 1-3)
> - fullName, clés stables, debounce, modales custom, layout, error boundary, ARIA, token refresh
> - Passe 3 : toast auto-dismiss 5s (3 pages), debounce 300ms TransactionsPage, `aria-label` recherche (3 pages), `aria-live` toasts (3 pages), try-catch logout, état de chargement bouton « Signaler »

### Reste à faire

- [ ] Modales — pas de focus trap
- [ ] Formulaires — pas de `aria-describedby` pour messages d'erreur
- [ ] `services/api.ts` — Assertions `as any` (contournent le strict mode TS)
- [ ] `vite.config.ts` — Pas de headers CSP

---

## 🔵 LANDING PAGE

> ✅ **22 corrections** (passes 1-3)
> - SVG, accessibilité, formulaires, OG images, error boundary, reduced-motion, sitemap
> - Passe 3 : JSON-LD (Organisation + SoftwareApplication), page 404 dédiée, validation email regex newsletter, contraintes longueur formulaire contact

### Reste à faire

- [ ] Images OG : créer `og-image.png` (1200×630px)
- [ ] `favicon` = `vite.svg` → remplacer par favicon Badenya
- [ ] `HomePage.tsx/ContactPage.tsx` — TODO: connecter formulaires au backend
- [ ] 14+ liens `href="#"` morts (footer, réseaux sociaux, téléchargement)
- [ ] Valeurs hardcodées (statistiques, montants démo)
- [ ] `AboutPage.tsx:91` — Année de fondation hardcodée

---

## 🟢 MOBILE

> ✅ **38+ corrections** (passes 1-3)
> - fullName, mocks→API, bugs, design system, regex, validation, stores harmonisés
> - Passe 3 : `user?._id` corrigé (group-details.tsx), `Keyboard.dismiss()` (6 écrans), `React.memo()` (GroupCard, TransactionItem, VoteCard), `AppState` listener (vérification auth au retour foreground)

### Reste à faire

- [ ] `services/api.ts` — Pas de vérification d'expiration du token avant refresh
- [ ] `user.service.ts` — Endpoint `/users/search` non implémenté côté backend
- [ ] `profile.tsx` — `totalContributions`/`totalVotes` hardcodés à 0
- [ ] `settings.tsx` — Suppression de compte non implémentée
- [ ] 31 `console.error()` → logging structuré
- [ ] Gestion offline (NetInfo, cache local, file d'attente)
- [ ] `(tabs)/_layout.tsx` — Pas d'error boundary sur les écrans d'onglets

---

## 🏗️ PROJET

> ✅ Organisation DOCS/, README, LICENSE (MIT), SECURITY.md

### Reste à faire

- [ ] `package.json` racine pour gestion monorepo
- [ ] Docker pour admin et landing page (seul le backend a un Dockerfile)

---

## 🔮 AMÉLIORATIONS FUTURES

### Haute priorité
- [ ] Logging structuré backend (60+ console.*) → Winston ou Pino
- [ ] Tokens admin : localStorage → `httpOnly` cookies
- [ ] Gestion offline mobile (NetInfo + cache)
- [ ] Implémenter envoi d'email forgotPassword
- [ ] Firebase Cloud Messaging (backend + mobile)

### Moyenne priorité
- [ ] Connecter formulaires landing page au backend
- [ ] Tests d'intégration avec `mongodb-memory-server`
- [ ] Implémenter `GET /users/search` côté backend
- [ ] Focus trap dans les modales admin
- [ ] Headers CSP dans vite.config.ts
- [ ] `package.json` racine monorepo

### Basse priorité
- [ ] i18n multi-langue (fr/en/ar)
- [ ] Remplacer 14+ liens `href="#"` par de vrais URLs
- [ ] Fichier `og-image.png` et favicon Badenya
- [ ] Assertions `as any` dans admin api.ts
- [ ] Docker pour admin et landing page
- [ ] Suppression de compte mobile
