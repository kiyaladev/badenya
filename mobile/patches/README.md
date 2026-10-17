# Correctifs de sécurité transitoires

Ces backports corrigent des défauts reproduits dans la chaîne Expo 54 sans changer les API CommonJS attendues par Metro. Les versions des paquets restent identiques : **npm audit continue à signaler les avis**, il ne faut pas annoncer un audit npm vierge.

`security-backports.json` conserve les remplacements exacts et les empreintes SHA-256 avant/après. L’installation applique les correctifs ; `npm run security:verify` refuse toute copie manquante, non corrigée, modifiée ou de version différente. Une montée de version exige une nouvelle revue ; aucun remplacement approximatif n’est effectué. Les régressions utilisent des entrées malformées réelles dans des sous-processus bornés en temps.

| Paquet | Origine et adaptation |
| --- | --- |
| braces 3.0.3 | [Avis et recommandation de limite de profondeur](https://github.com/micromatch/braces/issues/70). Limite locale de 100 niveaux dans le parseur et les parcours d’AST, y compris les AST fournis directement. Elle ne rend pas sûres des expressions régulières arbitraires fournies par un utilisateur. |
| node-forge 1.4.0 | [Correctif proposé en amont, commit ceba34402e329f0365134f23fe19898756527d65](https://github.com/digitalbazaar/forge/pull/1152). Contrôle du nombre d’éléments de DigestAlgorithm ; pas de modification de la primitive RSA. |
| image-size 1.2.1 | Backport des contrôles de progression et de taille des blocs ICNS/JXL/HEIF de [image-size 2.0.4](https://www.npmjs.com/package/image-size/v/2.0.4), en conservant les exports et les réponses 1.x utilisés par Metro. |
| decode-uri-component 0.2.2 | Algorithme de décodage linéaire de [la version 0.5.0](https://github.com/SamVerschueren/decode-uri-component/releases/tag/v0.5.0), avec exports CommonJS et traitement historique du signe `+` conservés. |

Les licences des projets d’origine sont dans `licenses/`. Supprimer un backport uniquement après mise à niveau vers une version qui corrige l’avis et passage des régressions. Après `npm ci --ignore-scripts`, exécuter explicitement `npm run security:apply` avant tout build. Un build natif ou un export ne doit pas utiliser de dépendances non vérifiées.

## Porte CI et avis npm

`npm run security:audit` exécute les contrôles de source et les régressions, interroge le registre, puis suit chaque chaîne de vulnérabilités jusqu’à ses avis précis. Il ne couvre que les cinq identifiants enregistrés dans le manifeste et les copies installées présentes dans le verrou. Tout nouvel avis, paquet inattendu, fichier modifié, version différente ou réponse npm incomplète fait échouer le contrôle. Les avertissements npm bruts sont conservés comme artefact CI ; ils restent visibles car les paquets n’ont pas été renommés ni artificiellement déclarés corrigés dans leurs versions.
