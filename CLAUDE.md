# Concurrents

- https://infoeau.fr/
- https://moneau.app/
- https://www.cieau.com/eauchezmoi-une-etiquette-pour-mon-eau-du-robinet/
- https://leaupotable.fr/
- https://qualite-eau-france.fr/

# Déploiement

- Serveur : ce dossier EST la prod (`/var/www/eaupotable`), servi par `next start` sous **PM2 root** (app `eaupotable`, `npm start` = `next start -H 127.0.0.1`).
- Cycle : `git commit` + `git push` (accords explicites requis) → `npm run build` → `sudo pm2 restart eaupotable`.
- **Jamais** de commit/push/restart PM2 sans l'accord explicite de Thomas à chaque fois.
- `npm run sitemap` régénère toutes les données (`build-dept-generic`, `sync-home-scores`, `build-pfas-nation`, `generate-sitemap`) — le commit des sitemaps régénérés est normal.
- `npm run build:full` = sitemap + build.

# Pièges connus

- Le middleware redirige tout host non-localhost vers `https://www.eaupotable.net` et bloque l'accès IP direct en prod (cf-ray requis). Pour tester un build local : `next start -p <port>` + header `Host: localhost:<port>` sur `http://127.0.0.1`.
- Chiffres formatés avec `toLocaleString('fr-FR')` → espace fine U+202F dans le HTML (grep avec espace normale ne matche pas).
- Page PFAS : les stats de la FAQ sont générées dynamiquement depuis `pfas-nation.json` (ne jamais les coder en dur).
- Playwright dispo via `/home/admin/.npm/_npx/9833c18b2d85bc59/node_modules/playwright` avec `executablePath: '/usr/bin/google-chrome'` + `--no-sandbox` (pas de chromium téléchargé).

# Page PFAS (/pfas-eau-potable)

- Données : `scripts/build-pfas-nation.js` → `public/data/pfas-nation.json` (national + departments + top50 villes).
- Carte : `app/components/PfasMap.js` + contours `public/data/france-dept-paths.json` (générés par `scratch/build-france-dept-paths.js` depuis le GeoJSON `/tmp/fr-depts.geojson` — re-générer si source mise à jour ; métropole uniquement, DOM absents de la source).
- Og:image dynamique : `/api/og?pfas=1&tested=...&alerts=...&over=...`.
- Objectif SEO : capter « carte pfas france », « norme pfas », « filtre pfas », « pfas eau en bouteille » — sections long-tail sourcées (ANSES, CIRC, directive UE 2020/2184).
