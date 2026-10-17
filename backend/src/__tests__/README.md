# Tests du backend

Les suites unitaires couvrent les utilitaires, permissions et services. Les suites d’intégration exécutent Express via Supertest avec des bases MongoDB éphémères. Les parcours financiers utilisent un replica set pour vérifier les commits atomiques.

Depuis la racine :

```sh
npm run test:backend
npm run test:backend:integration
npm test --workspace=backend -- --runInBand --detectOpenHandles
npm run build:backend
```

`helpers/financial-fixture.ts` crée une base isolée, un compte authentifié et un groupe. Chaque suite ferme sa connexion et arrête son serveur MongoDB. Aucun test ne doit effacer une base de développement ou de production.

Pour une règle métier, envoyer une session valide, vérifier un statut précis et inspecter les données persistées. Un `401` ne prouve pas la validation d’un montant ou d’un identifiant. Les tests d’authentification restent distincts. Les tests de concurrence vérifient les invariants financiers et la déduplication.

Pour rechercher les ressources non libérées : exécuter Jest avec `--runInBand --detectOpenHandles`, corriger la ressource concernée et vérifier la sortie naturelle du processus ; ne pas masquer le problème avec `--forceExit`.

Les tests de fichiers utilisent un répertoire temporaire nettoyé en fin de suite. Les comptes, pièces jointes et secrets de test sont fictifs. La couverture doit être mesurée avec `npm run test:coverage --workspace=backend` ; aucun pourcentage historique n’est une preuve de couverture de la version courante.
