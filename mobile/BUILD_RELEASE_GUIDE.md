# Builds et essais natifs Badenya

Ce guide décrit le dépôt actuel (Expo 54). Les artefacts ne sont pas publiés automatiquement. Les contrats et migrations backend sont dans [le guide de déploiement](../DOCS/DEPLOYMENT_GUIDE.md).

## Préparer une version

Depuis `mobile` avec Node 24 :

```sh
npm ci
npm run security:audit
npm run typecheck
npm run lint
npm run test:ci
```

`postinstall` applique les correctifs transitoires documentés dans [patches/README.md](patches/README.md). Après une installation avec `--ignore-scripts`, lancer `npm run security:apply`. `security:audit` conserve les avertissements npm bruts, vérifie les empreintes et les régressions des correctifs et refuse tout nouvel avis non couvert. Un avis enregistré n’est pas masqué par son seul nom de paquet.

L’API de production est `https://badenya-api.naimba.com/api/v1`. Le client lit `EXPO_PUBLIC_API_URL` au build. Les profils EAS `preview` et `production` utilisent cette URL ; un changement nécessite un nouveau bundle. Ne pas utiliser d’ancienne variable `API_URL` ni recopier un ancien `app.config.js` depuis les documents archivés.

## Android

Configurer Java 21 et le SDK Android. Pour reconstruire les fichiers natifs générés : `npx expo prebuild --platform android`. Pour un essai de développement sur un appareil ou un émulateur :

```sh
EXPO_PUBLIC_API_URL=https://badenya-api.naimba.com/api/v1 npx expo run:android
```

Les scénarios qui créent des comptes, cotisations et versements doivent utiliser une API et une base isolées. Sur l’émulateur Android, `10.0.2.2` désigne la machine hôte. L’HTTP de développement est autorisé par le manifest debug ; cette exception ne doit pas être ajoutée au manifest de production. Un APK de test compilé avec une URL locale n’est pas un artefact à publier.

Les répertoires `android` et `ios` sont générés et ne constituent pas la source de configuration versionnée. Les options partagées restent dans `app.json`, `eas.json` et les plugins Expo.

Pour les builds EAS, utiliser un compte autorisé et son projet Expo réel :

```sh
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production
```

Le profil preview produit un APK interne ; production produit un AAB. La signature et les identifiants Play Console doivent appartenir au projet cible. La commande de soumission constitue une opération distincte.

## iOS

Les essais iOS demandent un Mac avec Xcode et un simulateur, ou un iPhone autorisé. Linux peut vérifier les types, les tests JavaScript et les contrats, mais ne peut pas valider le comportement iOS natif.

Sur le Mac de test : installer le même verrou, exécuter les contrôles ci-dessus, puis lancer `npx expo run:ios` (simulateur) ou `npx expo run:ios --device` (appareil). Tester ensuite le build de distribution avec les véritables identifiants Apple. Les valeurs d’exemple dans `submit.production.ios` et le fichier de compte de service Android sont à configurer avant toute soumission ; elles ne sont pas des identifiants opérationnels.

## Scénarios de validation

Sur une base isolée : connexion, déconnexion et reconnexion ; création/modification d’un groupe et de ses échéances ; ajout d’une cotisation avec photo de justificatif ; lecture et ouverture de ce justificatif par un autre membre actif ; refus après départ/suspension ; validation avec identité du responsable ; passage au cycle suivant et consultation de l’archive. Vérifier aussi le retour après une interruption réseau et l’absence de rejeu d’un lien de fichier expiré depuis le cache.

La biométrie, l’appareil photo, les notifications et l’ouverture de documents doivent être essayés sur l’appareil cible. Une compilation ou un export web réussi ne prouve pas ces capacités. Noter la version d’OS, le type d’appareil, l’API cible, l’empreinte de l’artefact et le résultat de chaque scénario.
