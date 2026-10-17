# Badenya

Gestion collaborative de cotisations, propositions, votes et dépenses de groupes.

Le dépôt comprend une API Express/MongoDB (`backend`), une administration React (`admin`), un site public React (`landing-page`) et une application Expo (`mobile`). Le backend, l’administration et le site public utilisent les workspaces npm et le verrou racine. Le mobile possède son propre verrou.

## État actuel

L’[audit du 6 octobre 2026](DOCS/AUDIT_APPLICATION_2026-10-06.md) décrit les problèmes reproduits avant correction. Les corrections et leur vérification sont suivies dans le [rapport de remédiation](DOCS/REMEDIATION_2026-10-06.md). Les anciens pourcentages de complétion et déclarations « prêt à déployer » ne constituent pas une validation des parcours métier ; ils sont conservés dans `DOCS/archive/pre-remediation-2026-10-06`.

Les modifications du dépôt ne sont pas automatiquement publiées. La configuration email, push et IA ainsi que les essais sur appareils doivent être vérifiés dans l’environnement cible. Les opérations financières atomiques nécessitent un replica set MongoDB. Le contrôle du 17 octobre 2026 confirme un replica set et un stockage financier disponible sur le serveur actuel ; le runbook de migration reste nécessaire pour les installations standalone.

Les corrections complémentaires sont décrites dans le [rapport du 17 octobre 2026](DOCS/REMEDIATION_2026-10-17.md), avec la procédure de migration des reçus privés dans le guide de déploiement.

## Domaines

| Domaine | Application |
| --- | --- |
| `https://badenya-api.naimba.com` | API Express (`backend`), PM2 sur `127.0.0.1:5054` derrière Nginx |
| `https://badenya.naimba.com` | Export web Expo (`mobile/dist`) |
| À configurer | Administration (`admin`) et site public (`landing-page`) : builds distincts, virtual hosts à définir ; l’administration doit rester sur le même site que l’API (cookies `SameSite=Strict`) |

Détails dans le [guide de déploiement](DOCS/DEPLOYMENT_GUIDE.md).

## Documentation de référence

- [Démarrage et vérification](DOCS/QUICKSTART_DEVELOPER_GUIDE.md)
- [Contrats API](DOCS/API_CONTRACTS.md)
- [Déploiement, artefacts et retour arrière](DOCS/DEPLOYMENT_GUIDE.md)
- [Migration MongoDB dédiée](DOCS/MONGODB_REPLICA_SET_RUNBOOK.md)
- [Audit initial](DOCS/AUDIT_APPLICATION_2026-10-06.md)

Les guides datés et suivis de tâches historiques décrivent une ancienne version. Les contrats sont définis par les routes, validations et modèles TypeScript du backend ; la documentation interactive est exposée par `/api-docs` quand elle est activée.
