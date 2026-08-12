# RECOS SEO — EauPotable.net

> Audit SEO complet — réalisé le 12/08/2026 (analyse 100 % lecture seule, aucune modification du code).
> Ce fichier est la **mémoire des points à corriger**. Cocher les cases au fil du travail.

**Statut :** points 1, 2 et 3 **corrigés et vérifiés par build le 12/08/2026** (commit à venir). Points 4 à 7 toujours ouverts.

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
- La FAQ du site annonce une synchro **quotidienne** des données, mais le sitemap n'est régénéré que lors de `npm run ship` (manuel + commit).
- `sitemap-main.xml` liste **`/mentions-legales` et `/contact`** (priority 1.0) alors que ces pages sont **`noindex, nofollow`** (`app/contact/page.js:7`, `app/mentions-legales/page.js:6`).
- **`public/sitemaps/sitemap-dept-049.xml`** : fichier **orphelin** (04/05/2026) avec des slugs cassés de l'ancien format (`/ville/breille-les-pins--la-`, double tirets). Non référencé par l'index → pas crawlé, mais à supprimer.

**Correctif**
- [ ] Retirer `/mentions-legales` et `/contact` de `staticUrls` dans `scripts/generate-sitemap.js:48`.
- [ ] Supprimer `public/sitemaps/sitemap-dept-049.xml`.
- [ ] Optionnel : `lastmod` = date de dernière MAJ des données (issue de la synchro Hub'Eau), pas la date de génération.
- [ ] S'assurer que le sitemap est régénéré **à chaque déploiement** (pas seulement à la main).

---

## 🟠 5. Donnée erronée — 2 villes mal rattachées au département

**Constat** (`public/city-index.json`)
- `saint-cloud` → `75` (en réalité **92**, Hauts-de-Seine)
- `l-hay-les-roses` → `75` (en réalité **94**, Val-de-Marne)
- Contrôles OK par ailleurs : `lyon→69`, `marseille→13`, `nantes→44`, `strasbourg→67`, `metz→57`, `paris→75`.

**Impact** : breadcrumb « Département 75 » erroné, contexte départemental faux (moyennes ARS, villes voisines), groupement sitemap incorrect → pertinence SEO local affaiblie.

**Correctif**
- [ ] Corriger le mappage dans la source de données / le script de build (`saint-cloud → 92`, `l-hay-les-roses → 94`).
- [ ] Régénérer `city-index.json` et les sitemaps.
- [ ] Vérifier qu'aucune autre ville n'est mal affectée (script de contrôle à prévoir).

---

## 🟠 6. `sw.js` — la home est servie en "Cache First" jusqu'au bump manuel

**Constat** (`public/sw.js`)
- `ASSETS_TO_CACHE` inclut `'/'` → le HTML de la **home est pré-caché**.
- Stratégie : `caches.match()` puis réseau (`public/sw.js`, handler fetch) **sans `cache.put`** → la home n'est jamais rafraîchie tant que `CACHE_NAME` n'est pas incrémenté (actuellement `eaupotable-v43`).
- Après un déploiement, les visiteurs de retour voient une **home obsolète** (titre, métadonnées, contenu).

**Impact** : UX dégradée + décalage possible entre le titre indexé par Google et le titre réellement servi aux utilisateurs. (Pas d'impact direct sur le crawl Googlebot, qui n'utilise pas le SW.)

**Correctif**
- [ ] Passer la home en `NetworkFirst` dans le handler fetch, ou
- [ ] Auto-incrémenter la version du cache à chaque build (variable injectée au build).

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

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Canonical sur `/villes` + `/faq` | ~5 min | Élevé (dé-indexation évitée) |
| 2 | Image OG par défaut dans le layout | ~10 min | Moyen (partage social) |
| 3 | Élargir l'exemption crawlers du rate limiter | ~5 min | Moyen (faux 429 GSC) |
| 4 | Nettoyer sitemap (contact/mentions, `049`) | ~10 min | Faible |
| 5 | Corriger le mappage 75 des 2 villes | ~15 min | Faible (pertinence locale) |
| 6 | `lastmod` sitemap = date des données | ~15 min | Faible (fréquence recrawl) |
| 7 | `NetworkFirst` sur `/` dans `sw.js` | ~10 min | Faible (fraîcheur visiteur) |

---

## 🔍 Contrôles à refaire après correctifs

- [ ] `/villes` et `/faq` : canonical correct dans le HTML rendu.
- [ ] `og:image` présent sur home, `/villes`, `/faq`, `/definitions`, `/methodologie`.
- [ ] Inspection d'URL GSC sur une page `/ville/` : pas de 429.
- [ ] `npm run sitemap` : plus de `/mentions-legales` ni `/contact`, plus de fichier `049`.
- [ ] Régénérer l'index : `saint-cloud` → 92, `l-hay-les-roses` → 94.
