# Projet

Site Next.js de qualité de l'eau potable par commune : scores, analyses, carte PFAS nationale. Servi sur https://www.eaupotable.net.

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

# Rafraîchir les données ARS (SISE-Eaux)

Les Crystal Scores/pages ville dépendent des archives `source-data/archives/` (prélèvements ARS). **Aucune automatisation** : la mise à jour est manuelle et la source est publiée mensuellement avec ~1 mois de délai (ex. prélèvements de juin publiés début août).

1. **Tester la fraîcheur** : `node scripts/fetch-sise-eaux.js` — interroge data.gouv.fr, télécharge le dernier `eaurob-YYYYMM.zip`, compare le dernier `dateprel` avec les archives locales et affiche un verdict clair. Ne pas lancer la pipeline tant que le verdict n'est pas « NOUVELLE DONNÉE DISPONIBLE ».
2. **Remplacer les archives** (uniquement si nouvelle donnée) : mettre à jour `source-data/archives/<année>/` (format `DIS_PLV_*`, `DIS_RESULT_*`, `DIS_COM_UDI_*` par département ; la transformation depuis `eaurob-YYYYMM.zip` — colonnes décalées — est faite manuellement, non scriptée).
3. **Régénérer** : `npm run sitemap` (pipeline complète : build-dept-generic + fix-dept-attribution + pure-price-injector + sync-home-scores + build-pfas-nation + generate-sitemap — ces correctifs protègent la donnée, ne pas les retirer).
4. **Vérifier le diff** : seuls les scores/date liés à la nouvelle donnée doivent changer (un diff inattendu sur INSEE/prix = bug d'attribution à signaler).
5. **Déployer** : `git commit` + `git push` + `npm run build` + `sudo pm2 restart eaupotable` (accords explicites requis).

Source officielle : dataset data.gouv.fr « Résultats du contrôle sanitaire de l'eau du robinet » (Ministère des Solidarités et de la Santé), URL des ressources `static.data.gouv.fr/resources/.../eaurob-YYYYMM.zip`.

# Page PFAS (/pfas-eau-potable)

- Données : `scripts/build-pfas-nation.js` → `public/data/pfas-nation.json` (national + departments + top50 villes).
- Carte : `app/components/PfasMap.js` + contours `public/data/france-dept-paths.json` (générés par `scratch/build-france-dept-paths.js` depuis le GeoJSON `/tmp/fr-depts.geojson` — re-générer si source mise à jour ; métropole uniquement, DOM absents de la source).
- Og:image dynamique : `/api/og?pfas=1&tested=...&alerts=...&over=...`.
- Objectif SEO : capter « carte pfas france », « norme pfas », « filtre pfas », « pfas eau en bouteille » — sections long-tail sourcées (ANSES, CIRC, directive UE 2020/2184).
