const fs = require('fs');
const path = require('path');

// Génère les redirections 301 pour les pages ville dont le slug a changé
// (renommage de commune nouvelle) ou dont la commune a disparu de la source ARS.
//
// Les slugs d'URL sont GLOBAUX : les homonymes portent un suffixe `-<dept>`
// dans public/city-index.json (ex. `sainte-croix` en 01, `sainte-croix-02` en 02).
// Ce script reconstitue le slug global à partir des clés locales des fichiers
// départementaux et du city-index.
//
// Compare la génération courante avec l'historique de la précédente
// (source-data/city-slugs.json, gitignoré, persistant sur le serveur).
// Le fichier `lib/city-redirects.json` est ACCUMULATIF : les redirections
// passées ne sont jamais perdues (même si l'historique manque).
//
// Intégré à `npm run sitemap` (après generate-sitemap). Idempotent.

const ROOT = path.join(__dirname, '..');
const DEPTS_DIR = path.join(ROOT, 'public', 'data', 'departments');
const INDEX_FILE = path.join(ROOT, 'public', 'city-index.json');
const HIST_FILE = path.join(ROOT, 'source-data', 'city-slugs.json');
const OUT_FILE = path.join(ROOT, 'lib', 'city-redirects.json');

function buildIndex() {
  const cityIndex = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const bySlug = {};
  const byInsee = {};
  for (const f of fs.readdirSync(DEPTS_DIR)) {
    if (!f.endsWith('.json')) continue;
    const dept = f.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(DEPTS_DIR, f), 'utf8'));
    for (const [local, city] of Object.entries(data.cities || {})) {
      const insee = (city.meta || {}).insee || null;
      let global = null;
      if (cityIndex[local] === dept) global = local;
      else if (cityIndex[`${local}-${dept}`] === dept) global = `${local}-${dept}`;
      if (!global) continue;
      bySlug[global] = { insee, dept };
      if (insee) byInsee[insee] = global;
    }
  }
  return { bySlug, byInsee };
}

function main() {
  const { bySlug: current, byInsee: currentByInsee } = buildIndex();
  const prev = fs.existsSync(HIST_FILE) ? JSON.parse(fs.readFileSync(HIST_FILE, 'utf8')) : {};
  const redirects = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : {};

  let renamed = 0;
  let removed = 0;
  let purged = 0;

  // Purge : un ancien slug redevenu une vraie page ville ne doit plus rediriger.
  for (const src of Object.keys(redirects)) {
    const slug = src.replace(/^\/ville\//, '');
    if (current[slug]) {
      delete redirects[src];
      purged++;
    }
  }

  for (const [slug, p] of Object.entries(prev)) {
    if (current[slug]) continue; // slug toujours valide
    const oldUrl = `/ville/${slug}`;
    const newSlug = p.insee ? currentByInsee[p.insee] : null;
    if (newSlug && newSlug !== slug) {
      if (!redirects[oldUrl]) { redirects[oldUrl] = `/ville/${newSlug}`; renamed++; }
    } else {
      if (!redirects[oldUrl]) { redirects[oldUrl] = `/departement/${p.dept}`; removed++; }
    }
  }

  const sorted = {};
  for (const k of Object.keys(redirects).sort()) sorted[k] = redirects[k];

  fs.writeFileSync(OUT_FILE, JSON.stringify(sorted, null, 2) + '\n');
  fs.writeFileSync(HIST_FILE, JSON.stringify(current, null, 2) + '\n');

  console.log(
    `↪️  Redirections villes : +${renamed} renommage(s), +${removed} → département, ${purged} purgée(s) — total actif : ${Object.keys(sorted).length}.`
  );
}

main();
