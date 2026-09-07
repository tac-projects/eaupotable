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
- **Snippets Google / listes de classement** : Google extrait souvent le passage « Benchmark »/« Top 10 » des pages ville/département comme meta description (ces pages rankent pour les villes classées). Ne jamais juxtaposer des `<span>` de rang/score sans séparateur texte (flex `gap` seul → snippet `#1Adamswiller. 10.0#2Albe…`). Format en vigueur : rang `N°N`, score `10,0/10`, espaces textuels entre spans, et séparateur ` - ` en `<span class="sr-only">` (sr-only défini dans `styles/base.css`) entre items — lisible par Google, invisible à l'écran (listes verticales).

# Analytics (GA4)

- Tag : `G-L7BMHXS6DJ`, chargé en lazyOnload dans `app/layout.js`. Tous les events passent par `track()` de `lib/analytics.js` (push `window.dataLayer`), jamais d'appel gtag direct.
- **Piège SPA** : GA4 ne tracke pas les navigations client-side. Le composant `app/components/Analytics.js` (monté dans `layout.js`) envoie un `page_view` à chaque changement de route via `usePathname`, **sauf le premier rendu** (couvert par la config gtag → ne pas envoyer page_view au premier rendu sous peine de double comptage). Il gère aussi `outbound_click` (listener délégué, ne pas dupliquer dans les pages).
- Events en place : `share` (params method/context/city), `share_cancelled`, `pwa_installed`, `standalone_view`, `pwa_install_prompt` (outcome), `page_view` (SPA), `outbound_click`, `search_no_result` {q}, `contact_submit`, `vigilance_subscribe` {ville}. Les events customs ne sont visibles que dans « Événements récents » (24-48h) ; pour un compteur direct, les marquer comme conversion dans GA4.

# Rafraîchir les données ARS (SISE-Eaux)

Les Crystal Scores/pages ville dépendent des archives `source-data/archives/` (prélèvements ARS). **Aucune automatisation** : la mise à jour est manuelle et la source est publiée mensuellement avec ~1 mois de délai (ex. prélèvements de juin publiés début août).

1. **Tester la fraîcheur** : `node scripts/fetch-sise-eaux.js` — interroge data.gouv.fr, télécharge le dernier `eaurob-YYYYMM.zip`, compare le dernier `dateprel` avec les archives locales et affiche un verdict clair. Ne pas lancer la pipeline tant que le verdict n'est pas « NOUVELLE DONNÉE DISPONIBLE ».
2. **Remplacer les archives** (uniquement si nouvelle donnée) : mettre à jour `source-data/archives/<année>/` (format `DIS_PLV_*`, `DIS_RESULT_*`, `DIS_COM_UDI_*` par département ; la transformation depuis `eaurob-YYYYMM.zip` — colonnes décalées — est faite manuellement, non scriptée).
3. **Régénérer** : `npm run sitemap` (pipeline complète : build-dept-generic + fix-dept-attribution + pure-price-injector + sync-home-scores + build-pfas-nation + generate-sitemap — ces correctifs protègent la donnée, ne pas les retirer).
4. **Vérifier le diff** : seuls les scores/date liés à la nouvelle donnée doivent changer (un diff inattendu sur INSEE/prix = bug d'attribution à signaler).
5. **Déployer** : `git commit` + `git push` + `npm run build` + `sudo pm2 restart eaupotable` (accords explicites requis).

Source officielle : dataset data.gouv.fr « Résultats du contrôle sanitaire de l'eau du robinet » (Ministère des Solidarités et de la Santé), URL des ressources `static.data.gouv.fr/resources/.../eaurob-YYYYMM.zip`.

# Chantier « uniformisation des indicateurs » (en cours)

**Source de vérité des paramètres = `lib/params-registry.js`** (créé au Jalon A). Toute liste de paramètres affichée ou transmise doit être dérivée d'ici, jamais réécrite en dur. Exports : `PARAMS`, `ANALYSIS_CARDS` (9 cartes), `SEO_DOSSIERS` (14 en 3 dossiers), `CITY_STATS_KEYS` (payload ville, 14 clés), `SCORED_COUNT`.

- Branchés sur le registre : `CityAnalysisSection.js`, `WaterReport.js`, `SeoDataTable.js` (composant **orphelin**, jamais importé — ne pas le réutiliser sans vérif), payload de `app/ville/[slug]/page.js`.
- **Moteur de score** (`calculateCrystalScore` dans `lib/water-utils.js`) : ne pénalise que 6 paramètres (microbio, pesticides, PFAS, nitrates, chlore, dureté — + le bloc `conformity` jamais alimenté). Les 9 cartes affichées incluent pH/turbidité/conductivité qui sont **non notés** (choix assumé « afficher ≠ noter »).
- Restes à traiter (Jalons B/C, pas encore faits) : `build-dept-generic.js` explication codée « basé sur 12 paramètres sanitaires » ; page `/methodologie` « 6 piliers » ; table « Duel » dans `CitySEOContent.js` (liste labels/keys dupliquée, accès `metrics.*` + drapeaux) ; `CityJsonLd.js` libellés/unités en dur ; re-définition du périmètre score sur base normative (arrêté 2007, directive 2020/2184).

# Page PFAS (/pfas-eau-potable)

- Données : `scripts/build-pfas-nation.js` → `public/data/pfas-nation.json` (national + departments + top50 villes).
- Carte : `app/components/PfasMap.js` + contours `public/data/france-dept-paths.json` (générés par `scratch/build-france-dept-paths.js` depuis le GeoJSON `/tmp/fr-depts.geojson` — re-générer si source mise à jour ; métropole uniquement, DOM absents de la source).
- Og:image dynamique : `/api/og?pfas=1&tested=...&alerts=...&over=...`.
- Objectif SEO : capter « carte pfas france », « norme pfas », « filtre pfas », « pfas eau en bouteille » — sections long-tail sourcées (ANSES, CIRC, directive UE 2020/2184).
