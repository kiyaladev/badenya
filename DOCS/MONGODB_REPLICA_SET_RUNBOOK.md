# MongoDB : instance Badenya dédiée avec replica set

Le MongoDB observé lors de l’audit est standalone. Les nouvelles opérations financières multi-documents exigent des transactions et refusent de modifier les écritures lorsque cette capacité est indisponible. Ne pas convertir ni redémarrer une instance MongoDB partagée avec d’autres applications.

## Préparation

- Identifier la base Badenya et son utilisateur depuis la configuration, sans afficher les secrets dans les logs.
- Choisir un port local disponible, par exemple 27019 après vérification, un utilisateur système dédié, un dossier de données et un service `mongod` indépendant.
- Vérifier l’espace disque, la version MongoDB compatible et les autorisations. Sauvegarder la base Badenya avec `mongodump` et ses fichiers téléversés. Vérifier qu’une restauration de cette sauvegarde fonctionne sur une base temporaire.
- Pour une disponibilité réelle, préparer trois membres sur des hôtes distincts. Un replica set à un membre permet les transactions mais ne fournit aucune tolérance à la panne du serveur.

## Mise en place isolée

Les modèles prêts à examiner sont [mongod.yml](../ops/mongodb/mongod.yml) et [badenya-mongodb.service](../ops/mongodb/badenya-mongodb.service). Ils utilisent le port 27019, les interfaces de boucle locale IPv4/IPv6, `badenya-rs`, un utilisateur système indépendant et un cache WiredTiger de 256 Mio. Le port était libre au précontrôle du 6 octobre ; le revérifier avant installation. `mongod --config ops/mongodb/mongod.yml --outputConfig` et `systemd-analyze verify ops/mongodb/badenya-mongodb.service` vérifient les modèles sans démarrer de service.

Après accord pour l’installation : créer l’utilisateur système `badenya-mongodb`, installer la configuration dans `/etc/badenya-mongodb/mongod.yml`, puis générer une clé aléatoire dans `/etc/badenya-mongodb/keyfile`, propriétaire `badenya-mongodb:badenya-mongodb`, mode 0400. Installer l’unité dans `/etc/systemd/system/badenya-mongodb.service`, puis charger et démarrer uniquement cette nouvelle unité. Ses répertoires d’état et de journaux sont créés par systemd avec le mode 0700. Ne jamais recopier la clé dans le dépôt ou la livraison.

Sur cette instance vide, utiliser l’exception localhost pour initialiser `rs.initiate({_id: 'badenya-rs', members: [{_id: 0, host: 'localhost:27019'}]})`, attendre le primaire, puis créer un administrateur permettant de gérer les utilisateurs. S’authentifier avec cet administrateur avant de créer l’utilisateur applicatif `readWrite` limité à la seule base Badenya. Les mots de passe passent par `passwordPrompt()`, pas par une ligne de commande ou un fichier commité. L’exception localhost se ferme à la création du premier utilisateur. Cette séquence suit la [documentation MongoDB sur le bootstrap authentifié](https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set-with-keyfile-access-control/). Pour une installation multi-hôtes en production, prévoir aussi les certificats X.509 recommandés par cette documentation ; le modèle local à un membre ne fournit pas de haute disponibilité.

## Vérification de sauvegarde avant bascule

Le script [verify-migration-backup.cjs](../scripts/verify-migration-backup.cjs) lit la base configurée sans y écrire, dépose un dump compressé dans un nouveau dossier privé sous `/var/backups/badenya`, puis restaure exclusivement dans son propre replica set temporaire authentifié. Il compare les documents BSON triés avec la lecture préliminaire de la source. Les URI passent dans des fichiers de configuration 0600 supprimés à la fin, et ne figurent pas dans les arguments des outils. La sauvegarde et ses diagnostics restent hors du dépôt et de la livraison.

Ce contrôle préliminaire vérifie la restauration ; une source standalone peut changer entre les lectures de ses collections. Il ne prouve donc pas une sauvegarde cohérente au même instant. La bascule exige toujours le dernier dump pendant l’arrêt des écritures, conformément à la [documentation mongodump](https://www.mongodb.com/docs/database-tools/mongodump/).

Le 6 octobre, la restauration préliminaire a réussi : les 12 collections et 41 documents BSON restaurés correspondent à la lecture de la source. Le dump privé est conservé sous `/var/backups/badenya/preflight-2026-10-06T15-03-43-254Z`, avec son empreinte et sa vérification. Le dossier de téléversement configuré n’existait pas au contrôle ; revérifier et sauvegarder les fichiers présents au moment de la bascule. Les instances temporaires ont été arrêtées. La [preuve sans données personnelles](remediation-2026-10-06/migration-preflight.json) est incluse dans la livraison.

Restaurer une copie de la base Badenya dans la nouvelle instance. Vérifier les volumes de collections, les identifiants, les soldes et les liens groupe/transaction/proposition. Exécuter les tests de concurrence et une transaction de test sur une base distincte de cette même instance. `hello` doit annoncer `setName: badenya-rs` et un primaire accessible.

## Bascule

1. Arrêter les écritures Badenya pendant une fenêtre planifiée, sans arrêter les autres applications.
2. Réaliser un dernier dump cohérent de Badenya et le restaurer dans l’instance dédiée. Vérifier les comptes, membres, opérations et fichiers.
3. Modifier uniquement `MONGODB_URI` du service Badenya pour inclure l’utilisateur dédié, la base, `replicaSet=badenya-rs` et le bon `authSource`. Conserver l’ancienne URI dans une sauvegarde sécurisée.
4. Redémarrer uniquement `badenya-api`, vérifier la santé et la capacité transactionnelle, puis ouvrir les parcours de validation/exécution. Réouvrir les écritures après validation.
5. Conserver la base initiale en lecture pendant la période de retour arrière ; ne pas écrire simultanément dans deux bases.

## Retour arrière

Si la validation échoue avant réouverture des écritures, rétablir l’ancienne URI et la version précédente. Si des écritures ont déjà été acceptées dans la nouvelle base, arrêter les écritures et réconcilier ces événements avant de revenir : un simple changement d’URI perdrait les événements récents. Conserver les sauvegardes et journaux jusqu’à clôture de la migration.

La sauvegarde préliminaire et sa restauration isolée ont été vérifiées. Aucun service MongoDB de production, utilisateur système ou URI applicative n’a été modifié ; l’installation et la bascule restent à autoriser.
