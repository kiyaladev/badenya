# Corrections mobile — 6 octobre 2026

Le rapport d’audit initial reste la référence des défauts. Ces modifications concernent le code local et un artefact web de livraison vérifié, sans publication ni activation en production.

| Parcours | Correction |
| --- | --- |
| Export web | Résolution CommonJS Metro pour Zustand ; navigation et connexion vérifiées dans Chromium, sans erreur JavaScript |
| Authentification | Jetons dans SecureStore natif / sessionStorage du navigateur ; écrans privés protégés pendant la restauration ; échec réseau du renouvellement conserve les jetons |
| Confidentialité hors ligne | Cache et file liés au compte ; paramètres inclus dans les clés ; réponse d’une ancienne session rejetée ; déconnexion remet les stores à zéro |
| Écritures hors ligne | Les écritures exigent une connexion et un réessai explicite. Aucune cotisation, dépense ou requête de mot de passe n’est mise automatiquement en file après un délai réseau ambigu |
| Invitations | Découverte, demande réelle, code serveur et approbation/refus via API ; données publiques fictives retirées |
| Tontine | Calendrier partagé par API, révision de réorganisation, identité stable du versement et intervalle personnalisé explicite ; cycle suivant après confirmation ; aucune confirmation financière locale |
| Propositions | Clôture après échéance ; exécution réservée au rôle responsable ; division par zéro évitée |
| Transactions | Pagination serveur ; fiche du groupe filtrée par identifiant et totaux serveur ; devises séparées |
| Notifications | Proposition ou transaction ouverte avant le groupe ; capacités serveur et préférences contrôlent les services facultatifs |
| Analyse | Synthèse, Recommandations et Anomalies regroupées dans une page ; disponibilité réelle contrôlée ; anciens liens conservés |
| Apparence | Préférence effective partagée ; variantes NativeWind et palette sur composants/cartes/formulaires/navigation |
| Récupération et droits | Formulaire /reset-password, /privacy, /terms et /newsletter/unsubscribe accessibles sans session |
| Biométrie | Déverrouillage de restauration/retour au premier plan ; permission Face ID déclarée |

Vérifications finales : **209 tests passent dans 25 suites** ; TypeScript et lint passent. Les résultats bruts sont conservés dans [tests.json](audit-evidence-2026-10-06/tests.json). Le test de demande d’adhésion impose un corps JSON explicite et conserve le statut serveur « pending ». Les tests ajoutés couvrent séparation compte A/B, clés par page, renouvellement réseau, réponse/échec de renouvellement du compte A après connexion B, lecture différée du cache, reprise de mutation d’une ancienne session, sérialisation SecureStore, conservation de la navigation sous un écran de verrouillage opaque, annulation du bootstrap splash masqué après perte du focus, confidentialité des requêtes publiques, versement tontine réessayé et destination des notifications.

Les confirmations natives Android/iOS, réception push, biométrie matérielle et délivrabilité email restent à réaliser avec appareils et configuration réels. Le client a été vérifié avec l’API locale réelle et une base temporaire en replica set, séparées de la production. Les textes légaux décrivent le fonctionnement et doivent être complétés avec l’identité de l’opérateur avant une diffusion publique.

## Vérification navigateur finale

L’export canonique `entry-7e5e6ebc9a89f95e770621a8d4192fe0.js` a passé **13 contrôles** dans Chromium contre l’API locale réelle. Les **57 requêtes** visant l’API canonique ont toutes été redirigées exclusivement vers la fixture locale : **zéro requête externe**, zéro erreur de page ou de console. Résultats et captures : [evidence.json](audit-evidence-2026-10-06/evidence.json).

Les parcours vérifiés couvrent connexion, confirmation et vérification de cotisation, devise EUR, pagination serveur page 2, deux votes réels, clôture puis exécution de proposition, deux versements de tontine et démarrage du cycle suivant, découverte « Famille », demande d’adhésion puis approbation administrateur, préférence sombre persistée et accès public aux pages de réinitialisation/confidentialité. L’échéance de la seule proposition fictive a été avancée dans la fixture locale pour exercer la clôture.

La destination privée reste stable après le délai de bootstrap ; les deux versements et le nouveau cycle conservent la route sans rechargement ni contournement de navigation. Six contrôles d’absence de débordement horizontal couvrent les largeurs **375, 768 et 1440 px**, en clair et sombre. Sept captures sont conservées ; la carte de groupe sombre utilise la palette effective (`rgb(31, 41, 55)`). Les contrôles d’accessibilité concernent les commandes par rôle et les titres publics ; aucun audit complet lecteur d’écran/axe n’est revendiqué. Les mesures locales (connexion 1 341 ms ; fiche de groupe 3 621 ms, délai de stabilité inclus) ne constituent pas une mesure de performance de production.

## Dépendances

Mise à jour compatible, sans changement majeur du SDK Expo 54. Les overrides imposent uuid 11.1.1 (CommonJS), PostCSS 8.5.29, source-map-js 1.2.2, postcss-selector-parser 7.1.6 et js-yaml 4 dans load-nyc-config.

L’audit npm final reste en échec : **55 avis (52 élevés, 3 modérés)**, provenant de quatre dépendances et de leurs consommateurs transitifs. Rapport brut : [dependencies.json](audit-evidence-2026-10-06/dependencies.json). Aucun avis n’est masqué et aucune bibliothèque de sécurité n’est remplacée par un fork local.

| Dépendance | Chemins et exposition | Limite de correction |
| --- | --- | --- |
| braces 3.0.3 | micromatch → Metro/Jest/fast-glob ; chokidar → Tailwind. Motifs imbriqués malveillants peuvent épuiser la pile des outils de développement/build. Les formulaires métier ne transmettent pas leurs valeurs à ce parseur. | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) : aucune version corrigée publiée au contrôle. |
| node-forge 1.4.0 | @expo/code-signing-certificates → CLI Expo. Vérification RSA de signatures de développement et certificats ; pas de traitement financier dans l’API métier. | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) : aucune version corrigée publiée au contrôle. |
| decode-uri-component 0.2.2 | query-string 7 → Expo Router 6. Décodage de liens avec séquences URI malformées peut consommer les ressources du client. | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) : 0.5.0 corrigée mais ESM ; query-string 7 exige une fonction CommonJS, un override direct casse ce contrat. Migration des consommateurs nécessaire. |
| image-size 1.2.1 | Metro lit les dimensions des assets pendant le build ; des images malveillantes peuvent provoquer un déni de service. | [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) : 2.0.4 corrigée, mais Metro transmet aussi un nom de fichier ; le changement de contrat a fait échouer un export réel et a été annulé. |
