# RECOS SEO — EauPotable.net

> Audit SEO complet — réalisé le 12/08/2026 (analyse 100 % lecture seule, aucune modification du code).
> Ce fichier est la **mémoire des points à corriger**. Cocher les cases au fil du travail.

**Statut :** points 1 à 6 **corrigés et vérifiés le 12/08/2026** (commits `b626d66`, `b8fd0e3`, `7573fff`) + **chantier C (fraîcheur des données) réalisé** (commit à venir). Script `npm run ship` **supprimé** le 12/08. **Point 7 (contenu home) encore ouvert** + **affichage de la date réelle des prélèvements** à corriger (voir chantier C).

---

## 🔴 1. Bug confirmé — Canonical erroné sur `/villes` et `/faq`

**Constat**
- `app/layout.js:57` définit `alternates.canonical: 'https://www.eaupotable.net/'` comme valeur par défaut.
- `app/villes/page.js` et `app/faq/page.js` définissent `openGraph` mais **pas** `canonical` → ils héritent du canonical du layout.
- Vérifié dans le HTML buildé (`.next/server/app/`) :
  - `faq.html` → `rel="canonical" href="https://www.eaupotable.net"` ❌
  - `villes.html` → `rel="canonical" href="https://www.eaupotable.net"` ❌
  - `definitions.html` → `/definitions` ✅ (contrôle OK)
  - `methodologie.html` → `/methodologie` ✅ (contrôle OK)

**Impact** : Google considère `/villes` (répertoire national) et `/faq` (contenu E-E-A-T) comme des **doublons de la home** → risque de dé-indexation ou de fusion avec la home, malgré leur présence dans le sitemap (priority 1.0).

**Correctif**
- [x] `app/villes/page.js` → ajouter dans `metadata` :
  ```js
  alternates: { canonical: 'https://www.eaupotable.net/villes' },
  ```
- [x] `app/faq/page.js` → ajouter dans `metadata` :
  ```js
  alternates: { canonical: 'https://www.eaupotable.net/faq' },
  ```
- [x] Après build, revérifier le canonical émis sur `/villes` et `/faq` → **fait** : `/villes` et `/faq` émettent bien leur propre canonical (vérifié dans le HTML buildé).

---

## 🔴 2. Aucune `og:image` sur les pages principales

**Constat**
- `app/layout.js` ne définit **aucune image Open Graph** par défaut.
- Pages sans image de partage : home, `/villes`, `/faq`, `/definitions`, `/methodologie`.
- Le layout déclare `twitter.card: summary_large_image` (`app/layout.js:34`) mais **sans `twitter.images`** → carte large sans image.
- Les pages ville (`app/ville/[slug]/page.js:281`) et département (`app/departement/[code]/page.js:43`) ont bien une image dynamique via `/api/og` ✅.

**Impact** : partages sociaux (Facebook, X, WhatsApp, LinkedIn) sans visuel → CTR de partage dégradé.

**Correctif**
- [x] Ajouter une image OG **statique par défaut** dans `app/layout.js` → **fait** : `openGraph.images` + `twitter.images` = `https://www.eaupotable.net/images/og-default.webp` (1024×1024, 56 Ko, déjà présent dans `public/images/`).
- [x] Ajouter `twitter.images` dans le layout → **fait**.
- [x] Vérifier `og:image` et `twitter:image` sur la home, `/villes`, `/faq`, `/definitions`, `/methodologie` → **fait** (build) : présentes partout. ⚠️ Attention piège rencontré : les pages qui redéfinissent `openGraph` localement (**`/villes` et `/faq`**) **écrasent** `images` du layout — il a fallu ajouter `images` dans leur `openGraph` local aussi.

---

## 🟠 3. Rate limiter du middleware — crawlers légitimes en 429

**Constat**
- `middleware.js` (checkRateLimit) : 20 req/min/IP sur `/ville/` et `/departement/`.
- Exemptions actuelles : `googlebot | bingbot | slurp | duckduckbot | baiduspider | yandexbot`.
- **Non exemptés** :
  - `Google-InspectionTool` (UA de l'outil **Inspection d'URL** de Search Console !)
  - `GoogleOther`, `AdsBot-Google`
  - `Applebot` (Spotlight/Siri)
  - `SeznamBot`, `Sogou`, `NaverBot`, `PetalBot`
  - `AhrefsBot`, `SemrushBot`, `MJ12bot`, `DotBot` (outils de backlinks)

**Impact** : inspections d'URL en rafale dans GSC → **429 → fausses erreurs de rendu** ; visibilité réduite pour les outils de backlinks ; indexation mobile Apple dégradée.

**Remarque technique** : le compteur est un `Map` en mémoire (`middleware.js`) → **par processus**. Si le serveur passe en multi-process (PM2 cluster), la limite est multipliée par le nombre de processus et devient incohérente.

**Correctif**
- [x] Élargir la détection des crawlers, ex. : (**fait** dans `middleware.js` — ajout de `google-inspectiontool`, `googleother`, `adsbot-google`, `applebot`, `seznam`, `sogou`, `naver`, `petalbot`, `ahrefs`, `semrush`, `mj12`, `dotbot`)
  ```js
  const isSearchEngine =
    ua.includes('googlebot') || ua.includes('google-inspectiontool') ||
    ua.includes('googleother') || ua.includes('bingbot') ||
    ua.includes('slurp') || ua.includes('duckduckbot') ||
    ua.includes('baiduspider') || ua.includes('yandexbot') ||
    ua.includes('applebot') || ua.includes('seznam') ||
    ua.includes('ahrefs') || ua.includes('semrush') || ua.includes('mj12');
  ```
- [ ] Si multi-process prévu : déplacer la logique (Redis, ou assumer single-process et le documenter).

---

## 🟠 4. Sitemap — `lastmod` figé + incohérences

**Constat**
- `scripts/generate-sitemap.js:45` : `lastmod` = **date de génération** (aujourd'hui figé au 2026-07-15 partout), pas la date des données.
- La FAQ du site annonce une synchro **quotidienne** des données, mais le sitemap n'est régénéré que manuellement (`node scripts/generate-sitemap.js`).
- ⚠️ `npm run ship` (qui commitait + pushait automatiquement) a été **supprimé le 12/08/2026** — fini le commit/push automatique sans revue. La régénération du sitemap est désormais un acte volontaire.
- `sitemap-main.xml` liste **`/mentions-legales` et `/contact`** (priority 1.0) alors que ces pages sont **`noindex, nofollow`** (`app/contact/page.js:7`, `app/mentions-legales/page.js:6`).
- **`public/sitemaps/sitemap-dept-049.xml`** : fichier **orphelin** (04/05/2026) avec des slugs cassés de l'ancien format (`/ville/breille-les-pins--la-`, double tirets). Non référencé par l'index → pas crawlé, mais à supprimer.

**Correctif**
- [x] Retirer `/mentions-legales` et `/contact` de `staticUrls` dans `scripts/generate-sitemap.js` → **fait** (avec commentaire explicite dans le script).
- [x] Supprimer `public/sitemaps/sitemap-dept-049.xml` → **fait**, aucun résidu dans l'index.
- [x] Régénérer (`node scripts/generate-sitemap.js`) → **fait** : `lastmod` frais (12/08/2026), 35 410 URLs (35 304 villes + 101 dépt + 5 statiques), plus de `049`, `mentions-legales`/`contact` absents de `sitemap-main.xml`.
- [x] `lastmod` = date des données → **décision 12/08 : NON retenu.** Données figées depuis 02/2026 → un lastmod à la date de prélèvement rendrait tout le sitemap périmé et réduirait le crawl. On garde `lastmod` = date de génération (le HTML change réellement à chaque build). Le vrai chantier = **fraîcheur des données** (section dédiée ci-dessous).
- [ ] Automatiser la régénération du sitemap au déploiement → **à intégrer** au process de déploiement (`ship` supprimé, régénération volontaire pour l'instant).

---

## 🟠 5. Donnée erronée — attribution départementale cassée (305+ villes)

> ⚠️ **Le vrai périmètre était bien plus large que 2 villes** : 309 villes avaient un INSEE incohérent avec leur fichier dépt.

**Cause racine** (`scripts/build-dept-generic.js`, lignes ~333-341)
L'« aspiration PLV » ajoutait une ville dans un département **dès qu'elle apparaissait dans le fichier PLV de ce dépt**, sans revalider son INSEE. Or un même réseau d'eau est relevé dans plusieurs fichiers dépt (ex. Saint-Cloud dans le PLV **075** — *Eau de Paris* — et dans le **092** — *Aquavesc*). Résultat : la ville était dupliquée dans les deux fichiers, avec des scores différents, et l'index gardait l'entrée du premier dépt (ordre alphabétique) — souvent le mauvais.

**Impact mesuré**
- **303 villes en doublon** dans un mauvais fichier dépt (l'entrée correcte existait ailleurs)
- **203 d'entre elles avec un score affiché différent** (certaines passent de 10 à 3,5) — le site affichait le score du mauvais dépt
- **303 URLs de collision** (`/ville/saint-cloud-92`, `/ville/aubenton-08`, …) → duplicate content
- breadcrumbs « Département 75 » pour des villes du 92/94, contexte dépt faux

**Correctif appliqué (12/08/2026)**
- [x] **`scripts/fix-dept-attribution.js`** (nouveau) : supprime les 303 doublons mal affectés, déplace `loeuilley` et `attricourt` → 70, conserve 4 cas limites (communes étrangères `99xxx` + COM `977/978`), recalcule les agrégats dépt (avgScore, conformRate, averages, topCities) avec les **formules exactes du build**, régénère `city-index.json`.
- [x] **`scripts/build-dept-generic.js`** : aspiration PLV patchée (`insee.startsWith(deptCode)`) → l'INSEE fait foi, le bug ne reviendra pas à la prochaine génération.
- [x] **`app/ville/[slug]/page.js`** : règle de redirection 301 pour les 303 anciennes URLs de collision (`{base}-{dept}` → base) — les homonymes légitimes restent dans l'index et ne sont jamais redirigés.
- [x] Sitemaps régénérés : **35 107 URLs** (35 001 villes + 101 dépt + 5 statiques), plus aucun doublon de collision.

**Effets de bord assumés** : ~203 scores affichés changent (le score du bon dépt remplace celui du mauvais). À surveiller dans GSC : les anciennes URLs de collision doivent rediriger en 301 (pas de 404).

**Pour mémoire** : 4 cas limites conservés tels quels (Ventimiglia `99001`, Meix-devant-Virton `99004`, St-Barthélémy `97701`, St-Martin `97801` — communes étrangères / COM sans fichier dépt dédié).

---

## 🟠 6. `sw.js` — la home est servie en "Cache First" jusqu'au bump manuel

**Constat** (`public/sw.js`)
- `ASSETS_TO_CACHE` inclut `'/'` → le HTML de la **home est pré-caché**.
- Stratégie : `caches.match()` puis réseau (`public/sw.js`, handler fetch) **sans `cache.put`** → la home n'est jamais rafraîchie tant que `CACHE_NAME` n'est pas incrémenté (actuellement `eaupotable-v43`).
- Après un déploiement, les visiteurs de retour voient une **home obsolète** (titre, métadonnées, contenu).

**Impact** : UX dégradée + décalage possible entre le titre indexé par Google et le titre réellement servi aux utilisateurs. (Pas d'impact direct sur le crawl Googlebot, qui n'utilise pas le SW.)

**Correctif**
- [x] Passer la home en `NetworkFirst` → **fait (12/08)** : les navigations HTML passent réseau d'abord, cache en secours (hors-ligne). La home est fraîche après chaque déploiement, sans bump manuel de `CACHE_NAME`.
- [ ] Optionnel : auto-incrémenter la version du cache au build (utile si on pré-cache davantage de contenus).

---

## 🟠 7. Contenu de la home essentiellement côté client

**Constat**
- La home est `<WaterApp />` (composant client, `app/components/WaterApp.js`).
- Le texte SSR se limite à `HomeLanding` (h1, villes populaires, section services) — `app/components/HomeLanding.js`.
- Les données eau n'apparaissent qu'après une interaction (recherche) → pas de contenu « ville » sur la home.
- Note : `WaterReport` (`ssr: false`) est importé dans `WaterApp.js:23` mais **plus rendu** (mort — seul `WaterApp_fragment.js` l'utilise). À nettoyer.

**Impact** : Google rend le JS (pas bloquant), mais la home est une page vitrine « fine » côté contenu indexable.

**Correctif**
- [ ] Nettoyer l'import mort de `WaterReport` dans `app/components/WaterApp.js`.
- [ ] Optionnel : enrichir le contenu SSR de la home (section rédactionnelle statique).

---

## 🔴 Chantier C — Fraîcheur des données (traité le 12/08/2026)

**Problème initial** : données figées depuis 02/2026 (99 dépts), FAQ annonçant une « mise à jour quotidienne » non reflétée.

**Causes**
- `api.hubeau.eaufrance.fr` est **mort** (NXDOMAIN) — Hub'Eau a migré sur `hubeau.eaufrance.fr` (celui déjà autorisé par le CSP du site).
- Aucun script de synchro n'existait : les archives SISE-Eaux étaient téléchargées à la main.

**Source retrouvée** : dataset officiel data.gouv.fr « Résultats du contrôle sanitaire de l'eau distribuée commune par commune » (Ministère de la Santé), MAJ 05/08/2026 → `dis-2026-dept.zip` (137 Mo).

**Ce qui a été fait**
- [x] Archives 2026 remplacées par l'export frais (prélèvements jusqu'au **30/06/2026**).
- [x] Rebuild complet `node scripts/build-dept-generic.js --all` + `sync-home-scores` + sitemap.
- [x] **Fix isConform (scoring)** : le parsing traitait toute conclusion sans le mot « conforme » (température, conductivité…) comme une non-conformité sanitaire → des centaines de villes étiquetées « NON CONFORME » à tort. Désormais : `isConform = !conclusion.includes("non conforme aux limites")` → seules les **237 vraies non-conformités sanitaires** restent NON CONFORME.
- [x] Vérifs : 0 mismatch INSEE/dépt, 34 999 villes, aucun dépt vide, baisses contrôlées (ex. nitrates à 40 mg/L sur `chezy`).

**Changements assumés** : ~7 700 scores de villes changent (5 153 ↑, 2 542 ↓) — donnée fraîche + conformité sanitaire juste. Métropoles rétablies (Marseille/Toulouse/Nice redeviennent EXCELLENTES).

**Reste à faire**
- [ ] Afficher la **date réelle du dernier prélèvement** sur les pages (au lieu du mois courant « Analyse mise à jour en août 2026 ») — `CityJsonLd.js`, `CitySEOContent.js`, `generateMetadata`.
- [ ] Aligner la FAQ sur la fréquence réelle de mise à jour.
- [ ] Re-télécharger aussi les années 2022-2025 (mises à jour en 07/2026 sur data.gouv.fr) — le 2026 suffit pour les scores actuels.

---

## 🟢 Ce qui est bien fait (à préserver)

- **Middleware** : redirections 301 propres (`rgpd→mentions-legales`, homonymes de villes), redirection domaine canonique `www`, blocage IP directe, suppression du paramètre `?dpl` de Cloudflare (anti-doublons d'URL).
- **`X-Robots-Tag: noindex, nofollow`** sur `/_next/static/` (`next.config.mjs`) + `Disallow` robots → crawl budget protégé.
- **`revalidate = 86400`** (ISR 24 h) sur `/ville/` et `/departement/` → cache frais sans surcoût crawl.
- **JSON-LD riche** : `Organization` (root), `FAQPage + Dataset + BreadcrumbList` sur villes et départements, réponses en texte brut (HTML strippé).
  - ⚠️ Les *FAQ rich results* Google sont **retirées depuis mi-2026** → le markup FAQ est inoffensif mais ne rapporte plus de résultat enrichi. Conserver pour l'accessibilité/GEO, ne pas compter dessus.
- **404 personnalisée** avec liens internes (`app/not-found.js`).
- **Pages `contact` + `mentions-legales` en `noindex, nofollow`** — discipliné.
- **Sitemap complet** : ~35 300 villes sur ~35 436 URLs, domaines `www` corrects, pas de trailing slash, priorités métropoles.
- **Maillage interne solide** : `NearbyCities` (30 villes/dépt), benchmark top 10, villes populaires en home, breadcrumbs, définitions → recherche.
- **Redirections de récupération de slugs** (fuzzy) dans `app/ville/[slug]/page.js` → consolide les anciennes URLs cassées (`--`) en 301.
- **robots.txt mesuré** : moteurs IA autorisés (GPTBot, ClaudeBot, PerplexityBot), scrapers sans valeur bloqués (Bytespider, CCBot, Amazonbot).
- **`llms.txt` présent** — utile pour les outils IA, mais ⚠️ ce n'est **pas** un levier de ranking/citation Google.
- Le **feed.xml** n'est pas manquant : le commit `fedf153` l'a *retiré* (c'était une 404) et ajouté la 404 personnalisée → rien à rétablir.

---

## 📋 Priorités

| # | Action | État | Impact |
|---|--------|------|--------|
| 1 | Canonical `/villes` + `/faq` | ✅ | Élevé |
| 2 | Image OG par défaut | ✅ | Moyen |
| 3 | Exemption crawlers rate limiter | ✅ | Moyen |
| 4 | Sitemap : noindex + `049` | ✅ | Faible |
| 5 | Attribution départementale (303 doublons) | ✅ | Moyen-élevé |
| 6 | `sw.js` NetworkFirst | ✅ | Faible |
| 7 | Contenu home côté client | ⏳ ouvert | Faible |
| **C** | **Fraîcheur des données** (re-sync + fix conformité) | ✅ | **Élevé** |

---

## 🔍 Contrôles à refaire après correctifs

- [x] `/villes` et `/faq` : canonical correct dans le HTML rendu.
- [x] `og:image` présent sur home, `/villes`, `/faq`, `/definitions`, `/methodologie`.
- [x] Inspection d'URL GSC sur une page `/ville/` : pas de 429 (exemption élargie).
- [x] `npm run sitemap` : plus de `/mentions-legales` ni `/contact`, plus de fichier `049`.
- [x] Régénérer l'index : `saint-cloud` → 92, `l-hay-les-roses` → 94.
- [ ] Après déploiement : surveiller dans GSC que les 303 anciennes URLs de collision redirigent en 301 (pas de 404).
