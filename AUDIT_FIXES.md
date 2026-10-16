# Rapport des correctifs d'audit — Badenya

Ce document récapitule la vérification et le traitement des constats d'audit identifiés dans `/root/hermes-workspace/audit-2026-10-14/codex/badenya.md` pour le dépôt `/root/hermes-workspace/fix-2026-10-15/wt/badenya`.

---

## 1. Synthèse des constats

| Réf | Priorité | Titre | Statut | Fichiers modifiés |
|---|---|---|---|---|
| 1 | **[P1]** | Excluez les opérations non comptabilisées des résumés financiers | **Corrigé** | `backend/src/services/report.service.ts`, `backend/src/__tests__/services/report.service.test.ts` |
| 2 | **[P1]** | Soustrayez les remboursements du solde des rapports | **Corrigé** | `backend/src/services/report.service.ts`, `backend/src/__tests__/services/report.service.test.ts` |
| 3 | **[P1]** | Remplacez les actions de publication d’artefacts retirées | **Corrigé** | `.github/workflows/mobile-build.yml` |
| 4 | **[P2]** | Gérez les contributeurs dont le compte a été supprimé | **Corrigé** | `backend/src/services/report.service.ts`, `backend/src/__tests__/services/report.service.test.ts` |
| 5 | **[P2]** | Convertissez les tours Mongoose avant de les copier | **Corrigé** | `backend/src/controllers/tontine.controller.ts`, `backend/src/__tests__/integration/audit-regressions.test.ts` |
| 6 | **[P2]** | Mutualisez aussi le renouvellement déclenché par les réponses 401 | **Corrigé** | `mobile/services/api.ts` |
| 7 | **[P2]** | Échappez les expressions régulières de recherche utilisateur | **Corrigé** | `backend/src/controllers/user.controller.ts`, `backend/src/routes/user.routes.ts`, `backend/src/__tests__/integration/audit-regressions.test.ts` |
| 8 | **[P2]** | Retirez les jetons Expo définitivement invalides | **Corrigé** | `backend/src/services/notification.service.ts`, `backend/src/__tests__/integration/notification-outbox.test.ts` |

---

## 2. Détail par constat

### [P1] Excluez les opérations non comptabilisées des résumés financiers
- **Emplacement d'origine :** `backend/src/services/report.service.ts:57`
- **Statut :** **Corrigé**
- **Vérification :** La requête MongoDB dans `getGroupSummary` ne filtrait pas le statut des transactions (`const query: Record<string, unknown> = { groupId };`), ce qui incluait les transactions `pending`, `cancelled` ou `failed` dans les totaux financiers et les classements de membres/catégories.
- **Correctif apporté :**
  - Ajout du filtre `status: "completed"` dans le filtre de requête de `getGroupSummary`.
  - Ajout du filtre `status: "completed"` dans la liste de transactions générée pour les rapports PDF (`generatePdfReport`).
  - Ajout de tests unitaires dans `backend/src/__tests__/services/report.service.test.ts`.
- **Fichiers modifiés :**
  - `backend/src/services/report.service.ts`
  - `backend/src/__tests__/services/report.service.test.ts`

---

### [P1] Soustrayez les remboursements du solde des rapports
- **Emplacement d'origine :** `backend/src/services/report.service.ts:159-160`
- **Statut :** **Corrigé**
- **Vérification :** La formule de calcul du solde net (`summary.netBalance`) additionnait les remboursements au lieu de les déduire (`summary.totalContributions - summary.totalExpenses + summary.totalRefunds`), en contradiction avec la convention comptable de `financial.service.ts` où les remboursements (`refund`) sont des sorties de trésorerie.
- **Correctif apporté :**
  - Correction de la formule : `summary.netBalance = summary.totalContributions - summary.totalExpenses - summary.totalRefunds;`.
  - Ajout d'un test unitaire validant le calcul avec contributions, dépenses et remboursements.
- **Fichiers modifiés :**
  - `backend/src/services/report.service.ts`
  - `backend/src/__tests__/services/report.service.test.ts`

---

### [P1] Remplacez les actions de publication d’artefacts retirées
- **Emplacement d'origine :** `.github/workflows/mobile-build.yml:126, 269`
- **Statut :** **Corrigé**
- **Vérification :** Les étapes d'upload d'artefacts pour Android (ligne 126) et iOS (ligne 269) utilisaient l'action dépréciée et retirée `actions/upload-artifact@v3`, alors que le workflow `deploy.yml` utilisait déjà `actions/upload-artifact@v4`.
- **Correctif apporté :**
  - Mise à jour de `actions/upload-artifact@v3` vers `actions/upload-artifact@v4` pour les jobs Android et iOS.
- **Fichiers modifiés :**
  - `.github/workflows/mobile-build.yml`

---

### [P2] Gérez les contributeurs dont le compte a été supprimé
- **Emplacement d'origine :** `backend/src/services/report.service.ts:96-99`
- **Statut :** **Corrigé**
- **Vérification :** Lorsqu'un compte utilisateur est supprimé (`User.deleteOne`), les transactions historiques sont conservées en base avec leur `initiatedBy`. Lors du `.populate("initiatedBy")`, le champ devient `null`. L'accès direct à `tx.initiatedBy._id` déclenchait une exception `TypeError: Cannot read properties of null (reading '_id')`.
- **Correctif apporté :**
  - Typage de `initiatedBy?: PopulatedUser | null;` dans `PopulatedTransaction`.
  - Gestion sécurisée de `initiatedBy` nul avec identité de remplacement (`userId: "deleted"`, `userName: "Utilisateur supprimé"`) préservant l'historique comptable et l'agrégation des cotisations.
  - Sécurisation similaire dans les rapports PDF et exports Excel.
  - Ajout d'un test unitaire couvrant les transactions orphelines.
- **Fichiers modifiés :**
  - `backend/src/services/report.service.ts`
  - `backend/src/__tests__/services/report.service.test.ts`

---

### [P2] Convertissez les tours Mongoose avant de les copier
- **Emplacement d'origine :** `backend/src/controllers/tontine.controller.ts:136-136`
- **Statut :** **Corrigé**
- **Vérification :** L'élément `old` issu de `existing.rounds` est un sous-document Mongoose. La décomposition par déstructuration `{ ...old, roundNumber: index + 1 }` ne copiait pas les accesseurs de schéma (`roundId`, `status`, etc.) mais les champs internes Mongoose (`_doc`, `$__`). La vérification ultérieure `!rounds.some((n) => n.roundId === r.roundId)` échouait systématiquement avec une erreur 409 (« Tour versé conservé obligatoire ») dès qu'un tour était complété.
- **Correctif apporté :**
  - Copie explicite et typée de toutes les propriétés du tour (`roundId`, `roundNumber`, `beneficiaryId`, `beneficiaryName`, `payoutDate`, `potAmount`, `status`, `paidAt`, `payoutTransactionId`) avec conversion `.toObject()` si présent.
  - Ajout d'un test d'intégration vérifiant la mise à jour sans erreur d'un calendrier de tontine comportant un tour déjà complété.
- **Fichiers modifiés :**
  - `backend/src/controllers/tontine.controller.ts`
  - `backend/src/__tests__/integration/audit-regressions.test.ts`

---

### [P2] Mutualisez aussi le renouvellement déclenché par les réponses 401
- **Emplacement d'origine :** `mobile/services/api.ts:237-238`
- **Statut :** **Corrigé**
- **Vérification :** Alors que l'intercepteur de requête préventif mutualisait le rafraîchissement via `refreshPromise`, l'intercepteur de réponse HTTP 401 appelait directement `await refreshAccessToken()`. Deux requêtes concurrentes recevant 401 déclenchaient ainsi deux rotations de jeton successives avec le même refresh token, invalidant la seconde et supprimant les jetons valides dans SecureStore.
- **Correctif apporté :**
  - Création de la fonction utilitaire partagée `getSharedRefreshToken()` réutilisant l'unique promesse en cours `refreshPromise`.
  - Utilisation de `getSharedRefreshToken()` dans les deux flux (proactif dans la requête et réactif en réponse 401).
  - Suppression de la variable inutilisée `isRefreshing` pour maintenir un linter sans avertissement.
- **Fichiers modifiés :**
  - `mobile/services/api.ts`

---

### [P2] Échappez les expressions régulières de recherche utilisateur
- **Emplacement d'origine :** `backend/src/controllers/user.controller.ts:20-22`
- **Statut :** **Corrigé**
- **Vérification :** La chaîne `req.query.q` était injectée sans échappement dans des requêtes `$regex`. Une recherche téléphonique avec `+` (ex. `+22370000000`) provoquait une exception de syntaxe RegExp et une erreur 500, tandis que des motifs comme `.*` altéraient la sémantique de filtrage.
- **Correctif apporté :**
  - Échappement des caractères spéciaux de regex (`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`) et limitation de la longueur à 100 caractères (`slice(0, 100)`), aligné sur le comportement de `community.controller.ts`.
  - Ajout d'une borne maximale (`max: 100`) dans la validation de route `searchValidation`.
  - Ajout d'un test d'intégration avec numéro de téléphone avec préfixe `+`.
- **Fichiers modifiés :**
  - `backend/src/controllers/user.controller.ts`
  - `backend/src/routes/user.routes.ts`
  - `backend/src/__tests__/integration/audit-regressions.test.ts`

---

### [P2] Retirez les jetons Expo définitivement invalides
- **Emplacement d'origine :** `backend/src/services/notification.service.ts:83-84`
- **Statut :** **Corrigé**
- **Vérification :** Les réponses d'erreur Expo (notamment `DeviceNotRegistered`) étaient traitées comme des erreurs globales sans suppression du jeton défaillant (`tickets.data.some(ticket => ticket.status !== 'ok')`). `deliverEvents()` replanifiait l'envoi indéfiniment toutes les 10 minutes, provoquant l'envoi répété de la notification aux terminaux valides du même utilisateur.
- **Correctif apporté :**
  - Détection des tickets en erreur avec `DeviceNotRegistered` et retrait automatique de la base (`User.findByIdAndUpdate` avec `$pull`).
  - Distinction entre erreurs temporaires et erreurs permanentes : si au moins un terminal a été servi ou que toutes les erreurs sont permanentes, la livraison est validée pour éviter la retransmission abusive aux terminaux déjà notifiés.
  - Ajout d'un test d'intégration vérifiant le retrait du jeton invalide et l'absence de retransmission vers le terminal valide.
- **Fichiers modifiés :**
  - `backend/src/services/notification.service.ts`
  - `backend/src/__tests__/integration/notification-outbox.test.ts`

---

## 3. Résultats des vérifications

| Composant | Commande | Résultat |
|---|---|---|
| **Backend Unit Tests** | `npm run test:backend` | **85 / 85 tests passés** (11 suites, 0 échec) |
| **Backend Integration Tests** | `npm run test:backend:integration` | **110 / 110 tests passés** (12 suites, 0 échec) |
| **Backend Lint** | `npm run lint:backend` | **0 erreur, 0 avertissement** |
| **Backend Build** | `npm run build:backend` | **Compilation TypeScript réussie** |
| **Mobile Typecheck** | `npm run typecheck:mobile` | **0 erreur TypeScript** (`tsc --noEmit`) |
| **Mobile Unit Tests** | `npm run test:mobile` | **184 / 184 tests passés** (24 suites, 0 échec) |
| **Mobile Lint** | `npm run lint:mobile` | **0 erreur** (aucun nouveau warning) |
