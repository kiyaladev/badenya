# Site public Badenya

Installation, vérification et exploitation : [guide de démarrage](../DOCS/QUICKSTART_DEVELOPER_GUIDE.md) et [guide de déploiement](../DOCS/DEPLOYMENT_GUIDE.md). Le build `npm run build --workspace=landing-page` produit `landing-page/dist`. La configuration `VITE_API_URL` doit inclure `/api/v1`. Les pages `/privacy`, `/terms` et `/reset-password` nécessitent la réécriture SPA dans le virtual host du site public.
