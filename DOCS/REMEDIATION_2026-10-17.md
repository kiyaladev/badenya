# Corrections de l’audit du 17 octobre 2026

## État actuel

Les correctifs sont présents dans le dépôt et une version isolée a été construite et vérifiée. La publication API/web attend l’autorisation demandée. Les essais complets sur appareils Android et iOS restent à terminer ; compiler une application ne valide pas son fonctionnement natif.

## Corrections réalisées

- Reçus privés par défaut, accès contrôlé par groupe et session, liens de lecture de deux minutes, révocation après départ du groupe. Les avatars sont publics seulement sur demande explicite. Le cache mobile exclut les liens temporaires.
- Images décodées réellement par Sharp : JPEG/PNG/WEBP, 5 Mo, 16 mégapixels et côté maximal de 8192 pixels à l’entrée ; réencodage WEBP sans métadonnées et redimensionnement à 2400 pixels. Quota de 100 Mo par compte, 30 uploads par heure, nettoyage des fichiers abandonnés après 24 heures.
- Migration des anciens fichiers avec simulation par défaut, sauvegarde privée des originaux, détection des conflits et réexécution possible. Les fichiers inconnus ne sont pas servis.
- Archives des cycles de tontine et passage au cycle suivant dans la même transaction MongoDB. Historique paginé consultable dans le mobile.
- Identité et date de validation, journal des validations et annulations financières sensibles.
- Échéances persistantes : quotidien, hebdomadaire, mensuel et intervalle personnalisé ; fin de mois sans dérive, rappel consolidé et dédoublonnage après interruption.
- Tests métier authentifiés avec statuts précis et assertions en base ; fixtures MongoDB éphémères, retrait d’un helper inutilisé capable d’effacer une base externe.
- Extraction des contrôleurs de compte et de mots de passe, modules dédiés aux fichiers et échéances, messages utilisateur en français et correction des avertissements de style.
- Profils EAS preview/production corrigés vers `https://badenya-api.naimba.com/api/v1`, guides de publication actualisés et artefacts de release isolés du dossier servi.

## Vérifications réussies

| Périmètre | Résultat |
| --- | --- |
| Backend | 204 tests, 25 suites |
| Mobile | 189 tests, 24 suites |
| Administration | 46 tests |
| Site public | 12 tests |
| Sécurité des dépendances mobiles | 9 contrôles supplémentaires |
| Types et lint | Contrôles du projet réussis, sans avertissement |
| Builds | Backend, administration, site public et export Expo web de 56 routes |
| Android | Builds Gradle debug et release x86_64 réussis pour l’API de test isolée |

Les 451 tests applicatifs et les neuf contrôles de sécurité ont réussi. Les vérifications de ressources de tests n’ont pas révélé de handle ouvert. Les parcours navigateur ont couvert la connexion, les échéances, l’upload et la lecture privée d’un reçu, l’identité de validation et l’archive d’un cycle. Ils utilisent une base dédiée, sans écriture en production.

### Dépendances mobiles

La mise à jour compatible de `shell-quote` supprime l’alerte critique initiale. Les cinq avis restants à la date de contrôle sont traités par onze backports exacts sur `braces`, `node-forge`, `image-size` et `decode-uri-component`, sans changement de leurs API attendues par Expo/Metro. Le contrôle RSA couvre le module Node et les deux bundles UMD.

Les empreintes SHA-256 avant/après, les versions et la provenance sont dans `mobile/patches/security-backports.json`, avec les licences d’origine. L’installation applique les correctifs ; Metro et `security:verify` refusent les fichiers inconnus ou altérés. Les régressions couvrent les entrées malformées, les cas valides, l’application sur des sources propres, l’idempotence et le refus d’un nouvel avis.

`npm run security:audit` réussit avec zéro avis non traité. **L’audit npm brut reste en alerte**, car les numéros de version restent ceux des paquets d’origine : selon la réponse du registre, 53 à 55 dépendances signalées par propagation des cinq avis connus, aucune critique. Les réponses brutes sont conservées en CI. Un nouvel avis ou une copie non corrigée fait échouer la porte de sécurité. L’audit du workspace backend/admin/site public ne signale pas de vulnérabilité lors du contrôle. Voir `mobile/patches/README.md` pour les sources et limites de chaque backport.

## Version de revue et sauvegarde

Version figée : `/tmp/badenya-releases/audit-20261017-reviewed`.

- 442 fichiers vérifiés par `SHA256SUMS` ; empreinte du manifeste : `d302be808df4f2900bc34a3aa50597d5e906723ec19de1eb8fbaa6c2eed85e25`.
- API et export web construits avec l’URL publique explicite et cache Metro vidé. Les builds avec des URL différentes doivent rester séquentiels ; le vérificateur contrôle l’endpoint réellement compilé.
- Dépendances de production propres installées dans l’artefact ; aucun secret ni donnée MongoDB dans les fichiers de livraison.
- Sauvegarde préliminaire privée : 15 collections et 46 documents, restauration dans un replica set temporaire authentifié et comparaison réussie. Aucun document source modifié. Empreinte de l’archive : `1add3630c6cf0f75c99c7f9fdfd56c4a62621fa17b185147843597fcf143d616`.
- Le serveur compilé de cet artefact a été testé avec ses propres dépendances sur la restauration isolée : connexion, reçu privé et refus anonyme, identité/date de validation, archive du cycle et conservation du solde réussis. Preuve : `STAGING_VERIFICATION.json` dans l’artefact.

La sauvegarde préliminaire ne remplace pas la sauvegarde finale avec écritures suspendues au moment de la bascule. Le rapport dans l’artefact figé décrit l’état lors de sa préparation ; le présent bilan du dépôt est actualisé séparément.

## Production observée et activation restante

MongoDB utilise déjà `rs0` ; `/health` confirme `database:true` et `financialStorage:true`. La simulation officielle de migration retourne `candidates:0, missing:0, applied:false`. Aucun ancien fichier référencé n’a besoin de conversion dans l’inventaire actuel. Le virtual host API transmet `/uploads` à Express et ne comporte pas d’alias statique de ce dossier.

L’API PM2 est restée en ligne avec zéro redémarrage pendant les vérifications. Aucun redémarrage, changement Nginx ni migration appliquée en production n’a été déclenché. PM2 pointe encore vers `/opt/apps/badenya/backend/dist/index.js` avec un redémarrage quotidien à 03h. Les builds locaux avaient réécrit ce dossier pendant les corrections. Pour éviter une activation involontaire, il a été remplacé atomiquement par une compilation du commit initial `97604f6125b7c02ad932e9c3fe9df62980f95037`, vérifiée sur une restauration isolée : santé, connexion et profil authentifié réussis. Les fichiers générés des correctifs sont conservés dans une sauvegarde privée et dans la version de revue. Le processus de production est resté identique (PID 2697, zéro redémarrage) et sa santé a été revérifiée après l’échange. Preuve : `/var/backups/badenya/generated-build-2026-10-17/RESTORATION.json`. La bascule contrôlée doit épingler PM2 sur un répertoire de version et conserver une version de retour arrière ; l’autorisation de publication demandée reste en attente.

Suivre `DOCS/DEPLOYMENT_GUIDE.md` : sauvegarde finale, conservation de la configuration précédente, fichiers privés hors artefact, contrôle de migration, bascule API/web coordonnée, validation Nginx et santé/connexion/droits après activation. Ne pas restaurer automatiquement MongoDB pour revenir en arrière.

## Validations natives et limites restantes

Les APK x86_64 produits ciblent une API locale de test ; ils ne sont pas des livraisons à publier. Le premier émulateur AOSP 29 a été arrêté par Watchdog durant son démarrage. Le second émulateur API 35, sans KVM, a rendu ses services package/activity visibles mais n’a pas terminé son démarrage. L’installation a échoué dans `StorageManagerService.allocateBytes` avec `PackageManagerInternal` nul. Les services de test dédiés ont été arrêtés ; preuve conservée dans `/tmp/badenya-native/VERIFICATION.json`. Aucun parcours natif n’est validé. L’hôte Linux ne dispose pas de Xcode. Les questions sur l’accès à un Android ou un Mac/iPhone sont en attente.

Les cycles déjà écrasés et l’identité des anciennes validations ne peuvent pas être reconstitués sans sauvegarde ou journal externe. Les services IA, email et push ne sont pas activés par de fausses clés ; leurs indicateurs de configuration ne prouvent ni les quotas ni le fonctionnement du fournisseur.

## Revue finale du périmètre

La revue reprend l’audit du 6 octobre, sa remédiation historique et les huit correctifs recensés dans `AUDIT_FIXES.md`, en plus des corrections du 17 octobre. Les résultats historiques ne remplacent pas une validation de la version actuelle. L’intégrité des 442 fichiers de la version de revue a été revérifiée ; son manifeste correspond toujours à l’empreinte annoncée. Le dossier figé n’a pas été modifié par cette mise à jour documentaire.

Les prérequis externes restent ouverts : accord de publication, appareils Android/iOS fonctionnels, configuration et essais réels email/push/IA, comptes de distribution et signature appartenant au projet pour une livraison native. Aucun succès n’est revendiqué pour ces parcours. L’état de l’hôte confirme l’absence de KVM et de Xcode ; les services de test dédiés sont arrêtés. La preuve de cette revue est dans `DOCS/archive/remediation-2026-10-17/verification-state.json`. L’objectif global reste inachevé tant que les validations requises ne sont pas obtenues.
