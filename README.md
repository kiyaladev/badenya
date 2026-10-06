# Badenya

Gestion collaborative de cotisations, propositions, votes et dépenses de groupes.

Le dépôt comprend une API Express/MongoDB (`backend`), une administration React (`admin`), un site public React (`landing-page`) et une application Expo (`mobile`). Le backend, l’administration et le site public utilisent les workspaces npm et le verrou racine. Le mobile possède son propre verrou.

## État actuel

L’[audit du 6 octobre 2026](DOCS/AUDIT_APPLICATION_2026-10-06.md) décrit les problèmes reproduits avant correction. Les corrections et leur vérification sont suivies dans le [rapport de remédiation](DOCS/REMEDIATION_2026-10-06.md). Les anciens pourcentages de complétion et déclarations « prêt à déployer » ne constituent pas une validation des parcours métier ; ils sont conservés dans `DOCS/archive/pre-remediation-2026-10-06`.

Les modifications du dépôt ne sont pas automatiquement publiées. La configuration email, push et IA ainsi que les essais sur appareils doivent être vérifiés dans l’environnement cible. Les opérations financières atomiques nécessitent un replica set MongoDB ; le MongoDB standalone actuellement observé doit être migré vers une instance dédiée avant activation de ces opérations.

## Documentation de référence

- [Démarrage et vérification](DOCS/QUICKSTART_DEVELOPER_GUIDE.md)
- [Contrats API](DOCS/API_CONTRACTS.md)
- [Déploiement, artefacts et retour arrière](DOCS/DEPLOYMENT_GUIDE.md)
- [Migration MongoDB dédiée](DOCS/MONGODB_REPLICA_SET_RUNBOOK.md)
- [Audit initial](DOCS/AUDIT_APPLICATION_2026-10-06.md)

Les guides datés et suivis de tâches historiques décrivent une ancienne version. Les contrats sont définis par les routes, validations et modèles TypeScript du backend ; la documentation interactive est exposée par `/api-docs` quand elle est activée.
