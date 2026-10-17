# Déploiement Badenya — configuration observée

Le serveur actuel utilise `/opt/apps/badenya`, Nginx et PM2. L’API écoute sur `127.0.0.1:5054` derrière `https://badenya-api.naimba.com`. `https://badenya.naimba.com` sert l’export Expo `mobile/dist`. L’administration et le site public sont des builds distincts ; leurs virtual hosts doivent être configurés et vérifiés avant publication. Les cookies admin utilisent `SameSite=Strict` : héberger l’administration sur un domaine du même site que l’API (par exemple un sous-domaine de `naimba.com`). Pour un domaine externe, `AUTH_COOKIE_SAME_SITE=none` est supporté uniquement en production HTTPS avec des cookies `Secure` et un contrôle strict des en-têtes `Origin` pour les mutations authentifiées par cookie ; inscrire uniquement les origines retenues dans `CORS_ORIGIN`. Certains navigateurs bloquent néanmoins les cookies tiers, donc privilégier un domaine du même site. Vérifier le parcours navigateur et les cookies sur les noms d’hôtes réellement retenus. La présence d’un APK de debug ne valide pas une distribution Android.

Aucun redémarrage PM2, changement Nginx ou migration de données n’est effectué par les vérifications du dépôt. La préparation construit directement dans le dossier de livraison ; elle ne remplace pas les fichiers servis. Attention : un `npm run build` local ordinaire peut écrire dans `backend/dist`, chemin actuellement utilisé par PM2 avec un redémarrage quotidien à03h. Examiner ce chemin avant toute activation automatique ; privilégier la configuration PM2 pointant vers une version validée.

## Préparer une version

1. Exécuter les vérifications du guide de démarrage et les parcours navigateur.
2. Fournir les URL publiques de build : `VITE_API_URL=https://badenya-api.naimba.com/api/v1` et `EXPO_PUBLIC_API_URL=https://badenya-api.naimba.com/api/v1`.
3. Exécuter `bash scripts/prepare-release.sh identifiant-version`. Le résultat est créé dans `/tmp/badenya-releases/identifiant-version` par défaut ; `BADENYA_ARTIFACT_DIR` peut changer ce dossier.
4. L’export Expo vide le cache Metro et vérifie l’URL dans le module API compilé, pour éviter de réutiliser une transformation issue des essais locaux. Le dossier contient les quatre builds, les manifestes npm, `SHA256SUMS`, le commit source et l’état du worktree. Vérifier `sha256sum -c SHA256SUMS` depuis ce dossier. Les fichiers `.env`, données et dépendances installées sont exclus.
5. Les workflows manuels de production et staging préparent et conservent ces artefacts. Ils ne publient pas les fichiers et n’envoient pas de messages à des tiers. Le staging reçoit explicitement son URL API ; aucune instance staging n’est présumée existante.

## Publication contrôlée

Configurer SMTP ou SendGrid avec des valeurs réelles : les chaînes d’exemple (`your_…`, `YOUR_…`, `smtp.example.com`) ne rendent pas le service disponible. Pour Gemini, renseigner **GEMINI_API_KEY et GEMINI_MODEL** ; le modèle n’est plus fixé à `gemini-pro`. Choisir un identifiant accessible au projet dans le [catalogue officiel](https://ai.google.dev/gemini-api/docs/models), puis vérifier un appel réel avant activation. Les indicateurs `/capabilities` reprennent l’état du service IA et la configuration email ; ils ne certifient ni les quotas, ni la délivrabilité, ni la validité des accès auprès du fournisseur. Aucun exemple de clé ou de modèle n’active ces fonctions.

Sauvegarder la base, les fichiers téléversés, les virtual hosts Nginx et `pm2 save`. Conserver la version actuellement servie et sa configuration. Copier l’artefact validé dans `/opt/apps/badenya/releases/<version>` et y exécuter `npm ci --omit=dev --workspace=backend` à partir du verrou racine ; les trois manifestes de workspaces sont présents.

Conserver les secrets et fichiers téléversés dans un dossier partagé hors des artefacts, avec les permissions nécessaires au seul utilisateur du service. Le backend doit charger la configuration du dossier de travail de sa version ; ne pas inclure ces secrets dans les artefacts CI. La configuration PM2 doit pointer explicitement vers `releases/<version>/backend/dist/index.js`, avec `cwd` sur le backend de la même version et `PORT=5054`. Les fichiers téléversés doivent rester raccordés au dossier partagé. Ne pas réinitialiser ou écraser le dépôt de travail pour publier.

Tester d’abord la version sur un port temporaire et une base staging dédiée. Après autorisation de publication, basculer les chemins Nginx vers les builds de cette version et recharger la configuration après `nginx -t`. Pour Expo, conserver `try_files $uri $uri.html $uri/ /index.html` afin que les routes exportées ouvrent leur propre page. Mettre à jour PM2 avec la configuration de version, puis contrôler `/health`, les origines CORS, la connexion sans cookie et les routes publiques/protégées. Les opérations financières doivent être vérifiées sur un replica set avant publication ; voir le runbook dédié.

## Retour arrière

Conserver au minimum la version précédente, son environnement et les chemins Nginx/PM2. Si la nouvelle version échoue : remettre les chemins statiques de la version précédente, valider/recharger Nginx et redémarrer PM2 avec sa configuration précédente. Vérifier la santé, la connexion et un parcours en lecture. Ne pas restaurer automatiquement une ancienne sauvegarde MongoDB : cela supprimerait les écritures récentes. Toute restauration de données exige une interruption contrôlée des écritures et une décision explicite.

Les compatibilités de schéma et de données doivent être examinées avant tout retour arrière. Les événements financiers existants doivent conserver leurs identifiants et leurs liens. Les anciennes dépendances et les builds exacts sont conservés avec leur version pour éviter de reconstruire une version historique avec des dépendances différentes.

## Mise à niveau du 17 octobre 2026 : fichiers privés

Préparer backend et export mobile ensemble : les uploads de reçus exigent maintenant `groupId` et les avatars doivent déclarer `purpose:"avatar"`. Vérifier `PUBLIC_API_URL` (URL absolue de l’API, avec ou sans `/api/v1`), `UPLOAD_DIR`, `JWT_SECRET` et les droits disque du compte applicatif. Le module natif `sharp` doit être installé depuis le verrou sur la plateforme cible ; ne pas copier un `node_modules` d’une autre architecture.

Avant activation, arrêter les écritures d’uploads, sauvegarder MongoDB et le dossier des fichiers, et réserver un dossier privé hors de `UPLOAD_DIR` pour les originaux. Avec la configuration de la base cible chargée, depuis `backend` :

```sh
npm run uploads:migrate
UPLOAD_MIGRATION_BACKUP=/chemin/prive/badenya-originaux npm run uploads:migrate -- --apply
```

Le script compilé `dist/scripts/migrate-uploads.js` fait partie du build backend ; dans un checkout source, lancer d’abord `npm run build` depuis `backend`. La première commande simule. La seconde classe les références existantes : avatars publics, reçus privés associés à leur groupe. Elle sauvegarde les originaux, réencode les fichiers sans métadonnées, crée les métadonnées d’accès et recalcule les quotas. Les originaux doivent rester inaccessibles au serveur HTTP. La migration est réexécutable. Les fichiers manquants sont signalés ; les références partagées entre plusieurs groupes doivent être copiées et réattribuées avant migration. Les fichiers inconnus restent inaccessibles et ne sont pas supprimés par la migration.

Supprimer toute directive Nginx/CDN servant directement `UPLOAD_DIR` : `/uploads/` doit passer par Express. Purger les caches publics des anciens reçus ; une copie déjà téléchargée ne peut pas être révoquée. Vérifier qu’un reçu refuse l’accès anonyme, qu’un membre reçoit un lien temporaire, qu’un départ révoque ce lien, et qu’un avatar public reste visible. Tester un upload et une consultation sur navigateur et appareil natif avant ouverture aux utilisateurs.

Les nouveaux cycles de tontine s’archivent automatiquement lors du passage au suivant. Les anciens cycles déjà écrasés et les acteurs des anciennes validations ne sont pas récupérables par cette mise à niveau sans sauvegarde ou journal externe. Les nouvelles métadonnées sont additives, mais revenir à l’ancien serveur réexposerait les reçus : un retour arrière doit maintenir le blocage HTTP de `/uploads/` jusqu’au rétablissement du contrôle d’accès.

Pour les groupes existants de fréquence `custom`, renseigner `customIntervalDays` avant d’activer leurs rappels. Les rappels non configurables sont journalisés sans bloquer ceux des autres groupes.
