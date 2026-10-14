# Remédiation de Badenya — 6 octobre 2026

Le périmètre reprend toutes les tâches et recommandations de [l’audit initial](AUDIT_APPLICATION_2026-10-06.md). Les corrections ci-dessous sont dans le worktree ; cela ne signifie pas qu’elles sont publiées. L’audit initial est conservé comme référence historique.

| Recommandations de l’audit | Réalisation | Vérification |
| --- | --- | --- |
| Web interactif, stockage web, CORS | Résolution Metro compatible CommonJS, stockage de session web, liste CORS avec une seule origine autorisée renvoyée | Export Expo puis connexion/navigation Chromium ; test CORS sur l’application serveur réelle |
| Première connexion et rechargement admin | Bootstrap de session, absence de session normale, renouvellement sans boucle ; destination préservée | Application réelle dans les tests admin et parcours navigateur |
| Suspension et sessions | Contrôle du compte sur login/refresh/requête ; version JWT révocable, rotation CAS, compatibilité comptes historiques | Régressions sur anciens jetons, suspension et changement de mot de passe |
| Écritures financières | Transaction MongoDB unique pour solde/statistiques/opération/proposition/tour ; précision et sommes bornées, insuffisance refusée sans modification | Replica set temporaire, concurrence, annulation contre validation, dépassement et réessais |
| Signalement et doubles écritures | Signalement séparé du statut ; validation/exécution idempotentes ; clé de création et empreinte du corps | Plusieurs validations/exécutions simultanées ; corps changé refusé 409 |
| Appartenances et gouvernance | Identifiant normalisé, membre actif commun, groupes archivés exclus, capacité/permissions, dernier admin protégé | Tests réels de références peuplées, suspension, admissions et concurrence ; suppression de compte atomique |
| Découverte, codes, adhésions | DTO public serveur, code aléatoire, demandes persistantes, acceptation/refus admin | API réelle avec POST sans corps et parcours mobile ; aucune adhésion fictive locale |
| Tontines collaboratives | Calendrier serveur révisionné, tours stables, versement comptabilisé, archive et démarrage du cycle suivant | Deux lecteurs du même serveur, révision obsolète 409, paiement unique, archivage du cycle |
| Propositions et sondages | Clôture manuelle/automatique, quorum, abstentions, dépense liée ; sondages : recomptage et DTO confidentiels | Tests de décision automatique, événement durable, changement et concurrence des bulletins |
| Rôle des deux votes | Le mobile utilise les propositions de dépenses ; le backend garde les sondages distincts ; services historiques conservés pour compatibilité | Contrats documentés, navigation visible raccordée aux propositions |
| Offline et changements de compte | Cache/file par compte et paramètres ; nettoyage à la déconnexion ; erreur réseau de refresh conserve la session ; réessai explicite des mutations | Régressions A→B, refresh tardif, ancien401, cache tardif, démarrage différé sans redirection, écritures natives sérialisées et clés de requête ; téléphone hors ligne encore à valider |
| Mot de passe oublié | Routes/formulaires accessibles, lien canonique, empreinte du jeton, consommation unique, sessions invalidées, transport absent explicite | SMTP simulé et réinitialisation concurrente sur MongoDB ; délivrabilité réelle à valider |
| Contact et newsletter | Texte conservé, boîte admin paginée, traitement, consentement, désinscription sécurisée, rétention365jours | Tests de cycle de vie et contrôles navigateur de la boîte admin |
| Notifications, IA et biométrie | Capacités réelles affichées ; événements métier durables et reprises par canal ; préférence biométrique appliquée sur appareil compatible | Tests des préférences/erreurs/leases et navigation précise ; fournisseurs/appareils réels requis |
| Navigation mobile et rapports | Actions cohérentes, groupe explicite pour contribuer, IA regroupée avec anciennes routes redirigées, rapports conservés | Parcours mobile ; aucun paiement bancaire externe annoncé |
| Statistiques, devises et pagination | Totaux par groupe, page suivante serveur, devise conservée, agrégations séparées par devise, recherche admin effective | API EUR/pagination, contrôles mobile et admin |
| Responsive et accessibilité | Layout admin unique, panneau mobile, navbar site compacte, libellés/contrastes, identité française ; thème mobile effectif partagé | Admin15 vues et site18 vues aux largeurs375/768/1440 : aucun débordement ni violation axe A/AA ; contrôles mobile complémentaires |
| Promesses fictives et fichiers inutiles | Faux groupes/succès/statistiques/liens retirés, stores sans URL masqués, pages légales accessibles ; templates nettoyés après vérification des imports | Liens et pages contrôlés ; identité juridique formelle encore à fournir |
| Documentation et exploitation | README/quickstart/contrats/guide serveur actuel, anciens états archivés, santé DB et capacités, workflow avec audits bloquants, build versionné et rollback | Builds/lint/tests, checksums de livraison ; aucune migration ni publication automatique |
| Dépendances | Verrou racine pour backend/admin/site ; verrou séparé Expo ; mises à jour compatibles et overrides ciblés | Audit racine : 0 vulnérabilité ; détail mobile et risques résiduels dans les preuves mobiles |

## Preuves et résultats

Les résultats machine sont conservés dans [remediation-2026-10-06](archive/remediation-2026-10-06/), les captures du site dans [remediation-landing-2026-10-06](archive/remediation-landing-2026-10-06/) et celles du mobile dans [mobile/audit-evidence-2026-10-06](archive/audit-evidence-2026-10-06/). Les tests automatisés et axe ne remplacent pas les essais sur téléphone ni une revue complète au lecteur d’écran.

Les tests finaux totalisent **484 tests distincts réussis** : backend216, administration47, site public12, mobile209. Les réexécutions ciblées ne sont pas comptées deux fois. Compilations, lint, preuves navigateur et livraison sont consignés dans [validation.json](archive/remediation-2026-10-06/validation.json). Les anciennes preuves d’audit décrivent la version avant correction ; elles ne constituent pas les résultats de la livraison.

Le bundle mobile final a passé 13 contrôles Chromium avec l’API réelle sur une base fictive : contribution, pagination, clôture/exécution, deux versements, nouveau cycle et admission approuvée. Les six vues de groupe en clair/sombre aux largeurs 375/768/1440 ne débordent pas ; aucune erreur JavaScript, et les 57 requêtes API ont été redirigées exclusivement vers le serveur de test. Aucun contrôle axe complet du mobile ni mesure de performance en production n’est revendiqué.

L’artefact versionné est préparé dans `/tmp/badenya-releases/remediation-2026-10-06-final`, avec les quatre builds, les deux verrous et les preuves conservées à leurs chemins documentaires. [SHA256SUMS](/tmp/badenya-releases/remediation-2026-10-06-final/SHA256SUMS) permet de vérifier l’intégrité de la livraison.

## Activation et validations restantes

- La préparation de migration est vérifiée : modèles MongoDB/systemd validés et sauvegarde préliminaire privée restaurée dans un replica set temporaire authentifié ; 12 collections et 41 documents BSON concordent. Voir [migration-preflight.json](archive/remediation-2026-10-06/migration-preflight.json). Aucun service de production n’a été installé ou modifié.
- La base de production observée est **standalone**. Les écritures transactionnelles refusent 503 sans modification partielle. Exécuter la migration dédiée suivant [le runbook MongoDB](MONGODB_REPLICA_SET_RUNBOOK.md) avant activation ; aucun service Mongo partagé n’a été modifié.
- Configurer et vérifier SMTP, Firebase/EAS et Gemini pour les services souhaités. Les valeurs d’exemple sont refusées comme configuration disponible ; Gemini nécessite aussi `GEMINI_MODEL`, et son indicateur suit l’état du service réellement utilisé. Aucun secret ni accès fournisseur n’a été fourni pendant ces vérifications. Contact et newsletter restent persistants même sans email ; une réinitialisation ne prétend pas envoyer un email absent.
- Vérifier réception email/push et biométrie sur Android/iOS physiques, puis préparer un build de distribution signé. L’APK debug existant n’est pas une livraison validée.
- Les alertes mobiles sans version amont corrigée ou sans remplacement compatible restent visibles dans l’audit/CI ; elles ne sont pas masquées par un changement de nom ni par `|| true`.
- Valider les URL publiques, cookies et origines sur les domaines réellement retenus, puis publier l’artefact selon [le guide de déploiement](DEPLOYMENT_GUIDE.md). Aucun redémarrage PM2, changement Nginx, publication statique ou écriture dans les données de production n’a été effectué. Les compilations locales ont actualisé `backend/dist` ; la configuration PM2 actuelle prévoit un redémarrage quotidien à 03h, ce qui doit être pris en compte avant de laisser ces builds dans son chemin actif. Les prochaines préparations construisent directement dans le dossier de livraison.

Les événements de notification sont durables ; une coupure après acceptation externe peut entraîner un doublon de réception. La page légale décrit le fonctionnement actuel sans inventer d’identité d’exploitant ni de conformité juridique validée.
