# Contrats API — remédiation du 6 octobre 2026

Base : `/api/v1`. Les identifiants sont des chaînes MongoDB. Les routes de groupe nécessitent un compte actif et une appartenance active ; les rôles sont `admin`, `treasurer`, `member`. Les références peuplées exposent `_id` : `members[].userId` peut être un objet `{_id,fullName,...}` ou une chaîne ; il ne faut pas attendre un champ `member.user`.

Les réponses métier utilisent `{status:"success",data:...}` ; les erreurs utilisent `{status:"error",message,code?}`. L’administration conserve son enveloppe `{success:true,data:...}`. Le client doit vérifier le code HTTP avant de lire les données. Les opérations refusées ne doivent pas être affichées comme réalisées.

## Accès et capacités

| Route | Entrée | Résultat |
| --- | --- | --- |
| GET `/capabilities` | Publique | `data:{ai,push,email}` booléens de configuration ; cela ne prouve pas la délivrabilité ni l’état réseau du fournisseur |
| POST `/auth/forgot-password` | `{email}` | 200 générique indiquant la prise en compte de la demande si le transport est configuré, même si le fournisseur refuse l’envoi (le jeton concerné est alors invalidé) ; 503 si l’email n’est pas configuré, avant recherche du compte |
| POST `/auth/reset-password` | `{token,newPassword}` | 200 après changement ; 400 pour jeton expiré/utilisé/invalide. Mot de passe ≥8 caractères, majuscule, minuscule, chiffre ; jeton 32–256 caractères |

Le lien de réinitialisation ouvre `${APP_URL}/reset-password?token=...`. Le jeton brut est envoyé uniquement par email ; seul son SHA256 est enregistré. La consommation du jeton et le changement de mot de passe sont atomiques. Les anciens jetons de session et de renouvellement sont invalidés ; une nouvelle connexion peut être faite immédiatement. Les comptes suspendus ne peuvent pas se connecter, renouveler leur session ou appeler une route protégée.

Les sessions JWT portent une version de révocation ; les comptes historiques sans champ sont traités comme version0. POST `/auth/refresh-token` accepte le jeton JSON ou le cookie HTTP-only `admin_refresh_token`, et renvoie401 si absent. Un renouvellement consomme une seule session ; un changement de mot de passe invalide toutes les anciennes sessions. Pour les mutations avec cookies uniquement, envoyer un `Origin` autorisé ; les origines inconnues sont refusées403. La limite générale est600 requêtes/IP/15minutes (`API_RATE_LIMIT`, borné100–5000), avec des limites distinctes sur l’authentification et le contact.

DELETE `/auth/account` exige un stockage transactionnel : supprimer le dernier administrateur actif d’un groupe actif renvoie409 ; transférer le rôle auparavant. La suppression des appartenances, notifications et du compte est atomique ; l’historique financier reste conservé.

## Découverte et adhésion

| Route | Entrée | `data` |
| --- | --- | --- |
| GET `/groups/discover` | `?search=texte`, compte connecté | `{groups}` liste publique active limitée à100 ; DTO public sans identités de membres ni écritures |
| POST `/groups/join` | `{code}` code d’invitation | `{status:"pending" ou "active",groupId}` |
| POST `/groups/:id/join` | Groupe public | même résultat ; groupe privé inaccessible sans code |
| GET `/groups/:id/invitation-code` | Administrateur actif | `{code}` aléatoire et stable ; ne pas utiliser le suffixe de l’identifiant MongoDB |
| GET `/groups/:id/join-requests` | Administrateur actif | `{requests}` avec utilisateur et identifiant de demande |
| POST `/groups/:id/join-requests/:requestId/approve` | Administrateur actif | `{status:"active",groupId}` |
| POST `/groups/:id/join-requests/:requestId/reject` | Administrateur actif | `{status:"rejected",groupId}` |

Une demande en attente n’accorde aucun accès de membre. Une suspension de groupe ne peut pas être contournée par une nouvelle demande. Un groupe archivé ne peut pas être rejoint. Les types serveur sont `tontine`, `association`, `family`, `friends`, `project`. Les devises acceptées à la création sont `XOF`, `XAF`, `EUR`, `USD`, `GNF`, `CDF`, `MAD` ; les totaux de devises distinctes ne doivent pas être additionnés sans conversion.

## Calendrier partagé des tontines

GET `/groups/:id/tontine` renvoie `data:{schedule}`. Une fréquence personnalisée non encore définie peut retourner `schedule:null`. Le calendrier contient `groupId`, `revision`, `cycleNumber`, `totalRounds`, `currentRoundNumber`, `contributionAmount`, `potAmount`, `frequency` (`daily|weekly|monthly|custom`), `customIntervalDays?` et `rounds`.

Chaque tour contient `roundId`, `roundNumber`, `beneficiaryId`, `beneficiaryName`, `payoutDate` ISO, `potAmount`, `status` (`upcoming|current|completed`), puis `paidAt` et `payoutTransactionId` après versement.

PUT `/groups/:id/tontine` nécessite un administrateur ou trésorier actif et le calendrier complet avec sa `revision`. Les bénéficiaires doivent être actifs et uniques. `customIntervalDays` est un entier positif pour une fréquence personnalisée. Un conflit de révision renvoie409 : recharger avant de recommencer. Les tours déjà versés doivent être conservés et ne peuvent pas être déplacés ni changer de bénéficiaire. Le premier tour restant devient le tour courant.

POST `/groups/:id/tontine/payout` reçoit `{roundId}`. Le versement du tour courant crée une dépense, actualise le solde et avance le calendrier dans la même transaction MongoDB. Un réessai d’un tour déjà versé renvoie le calendrier sans nouveau débit. Un solde insuffisant renvoie409 ; un stockage sans transactions renvoie503. Aucun transfert bancaire externe n’est exécuté par ce bouton.

POST `/groups/:id/tontine/next-cycle` est réservé aux responsables actifs. Il exige que tous les tours soient versés, archive intégralement le cycle précédent et crée le suivant avec de nouveaux identifiants et une révision incrémentée, dans une transaction MongoDB. Un réessai pendant le nouveau cycle renvoie409 sans nouvelle création.

## Transactions et propositions

GET `/transactions` retourne les opérations des groupes actifs de l’utilisateur. `groupId`, `type`, `status`, `page` (défaut1), `limit` (défaut50, maximum100), `skip` optionnel filtrent/paginent côté serveur. GET `/groups/:groupId/transactions` applique le même contrat avec le groupe imposé par le chemin.

`data:{transactions,total,count,page,pages,limit}` distingue le total serveur du nombre chargé. L’ordre est `createdAt` puis `_id`, décroissant. Les interfaces doivent charger les pages suivantes au lieu de découper uniquement la première page.

POST `/groups/:groupId/transactions` crée une opération en attente. L’en-tête `Idempotency-Key` conserve la même opération pour un même corps ; un corps différent avec la même clé renvoie409. Les montants validés sont positifs, avec une précision entière pour XOF/XAF/GNF ou deux décimales pour les autres devises ; les montants et sommes doivent rester dans les limites des entiers sûrs JavaScript. Une annulation ne peut gagner après une validation concurrente. La devise doit correspondre à celle du groupe. PUT `/transactions/:id/verify` est réservé aux responsables actifs : une opération terminée ne débite/crédite pas une seconde fois. Un signalement admin ajoute une métadonnée de signalement et ne remet pas le statut comptable en attente.

Un traitement serveur clôture automatiquement les propositions arrivées à échéance avec quorum et seuil d’approbation ; les abstentions participent au quorum sans entrer dans le dénominateur pour/contre. Les propositions d’un groupe indisponible expirent. Les notifications métier ont un événement durable et des tentatives par canal ; un fournisseur externe peut produire des doublons après un incident de livraison (pas de garantie de réception exactement une fois).

Les routes PUT `/proposals/:id/close` et POST `/proposals/:id/execute` complètent le vote des propositions. L’exécution d’une proposition approuvée crée une dépense liée par `transactionId`, copie son bénéficiaire, actualise le solde et fixe `status:"executed"`. Le réessai conserve la même opération. Les réponses409 représentent un conflit métier, dont un solde insuffisant ; `code:"FINANCIAL_STORAGE_UNAVAILABLE"` et HTTP503 indiquent qu’un replica set MongoDB est requis. Ne pas contourner ce refus en modifiant le solde côté client.

## Contact et newsletter

POST `/contact`, public : `{name,email,subject,message}` ; limites100 caractères pour le nom,200 pour le sujet,10–2000 pour le message. La réponse200 signifie que le contenu a été enregistré. Un email de confirmation dépend du transport ; il n’est pas nécessaire à la conservation du message. Les messages expirent après un an.

POST `/contact/newsletter`, public : `{email}` ; inscription persistante et idempotente par adresse, avec date de consentement. Les deux routes sont limitées à5 requêtes par15minutes. Les contenus ne doivent pas être écrits dans les logs ni rendus comme du HTML.

POST `/contact/newsletter/unsubscribe` reçoit `{token}` (64 caractères hexadécimaux) depuis le lien de confirmation. Il désactive l’inscription sans exposer l’adresse. Le jeton est aléatoire et seul son SHA256 est enregistré ; aucune adresse email seule ne permet de désinscrire un tiers. Les réessais et jetons inconnus reçoivent la même réponse200. Une réinscription volontaire crée un nouveau jeton et rend l’ancien lien inopérant. Le lien ouvre `/newsletter/unsubscribe?token=...` sur `PUBLIC_SITE_URL` ou `APP_URL` ; sans transport, l’inscription reste enregistrée et une demande de désinscription peut être faite au contact.

GET `/admin/contact-submissions` nécessite le rôle administrateur global actif et accepte `page`, `limit` (défaut20, maximum100) et `status=new|handled`. `data` contient `submissions,page,limit,total,pages`. PUT `/admin/contact-submissions/:id/handled` marque un message traité avec `handledAt` et renvoie `data.submission`. L’interface `/inbox` affiche le contenu comme texte, jamais comme HTML.

GET `/admin/newsletter-subscriptions` accepte `page`, `limit` et `active=false` pour les désinscrits (actifs par défaut). `data` contient `subscriptions,page,limit,total,pages`. Les jetons de désinscription et leurs empreintes ne sont jamais renvoyés dans cette liste.

## Exploitation

`/health` est hors de `/api/v1`. Vérifier la connexion à la base et la capacité transactionnelle avant d’annoncer que les écritures financières sont disponibles. Un simple200 statique ou une compilation ne valide pas un parcours utilisateur. Voir le guide de déploiement et le runbook MongoDB pour les prérequis et la bascule contrôlée.
