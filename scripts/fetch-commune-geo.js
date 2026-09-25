// Récupère les données communales depuis geo.api.gouv.fr et les fige dans
// public/data/communes-geo.json (clé = code INSEE).
//
// Champs : population, surface, codesPostaux, intercommunalité (EPCI), région,
// coordonnées du centre et proximité (distance à la commune la plus peuplée du
// département). Ces données servent au contenu factuel unique des pages ville.
//
// Données annuelles stables : le fichier est commité et n'est PAS régénéré par la
// pipeline `npm run sitemap`. Relancer manuellement avec `npm run geo` pour rafraîchir.
//
// Usage : node scripts/fetch-commune-geo.js

const fs = require('fs');
const path = require('path');

const BASE = 'https://geo.api.gouv.fr';
const FIELDS = 'nom,code,population,surface,codesPostaux,codeEpci,codeRegion,centre';
const OUT = path.join(__dirname, '..', 'public', 'data', 'communes-geo.json');
const DEPT_DIR = path.join(__dirname, '..', 'public', 'data', 'departments');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function haversine([lon1, lat1], [lon2, lat2]) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) && typeof data !== 'object') throw new Error('réponse inattendue');
  return data;
}

async function main() {
  if (!fs.existsSync(DEPT_DIR)) {
    console.error('Dossier departments introuvable.');
    process.exit(1);
  }

  const deptCodes = fs.readdirSync(DEPT_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''))
    .sort();

  console.log(`Récupération des données communales pour ${deptCodes.length} départements...`);

  // Référentiels (1 appel chacun)
  console.log('→ Référentiel EPCI...');
  const epcis = await getJson(`${BASE}/epcis?fields=nom,code,population,surface&limit=20000`);
  const epciByCode = {};
  for (const e of epcis) {
    epciByCode[e.code] = {
      nom: e.nom || null,
      population: typeof e.population === 'number' ? e.population : null,
      surface: typeof e.surface === 'number' ? e.surface : null,
    };
  }

  console.log('→ Référentiel régions...');
  const regions = await getJson(`${BASE}/regions?fields=nom,code`);
  const regionByCode = {};
  for (const r of regions) regionByCode[r.code] = r.nom || null;

  const out = {};
  const deptCities = {}; // codeDepartement -> [{insee, population, centre}]
  let ok = 0;
  const failed = [];

  for (const deptCode of deptCodes) {
    try {
      const communes = await getJson(`${BASE}/communes?codeDepartement=${encodeURIComponent(deptCode)}&fields=${FIELDS}&format=json`);
      for (const c of communes) {
        if (!c.code) continue;
        const centre = c.centre?.coordinates?.length === 2 ? c.centre.coordinates : null;
        out[c.code] = {
          nom: c.nom || null,
          population: typeof c.population === 'number' ? c.population : null,
          surface: typeof c.surface === 'number' ? c.surface : null,
          codesPostaux: Array.isArray(c.codesPostaux) ? c.codesPostaux : [],
          codeEpci: c.codeEpci || null,
          epciNom: epciByCode[c.codeEpci]?.nom || null,
          epciPopulation: epciByCode[c.codeEpci]?.population ?? null,
          epciSurface: epciByCode[c.codeEpci]?.surface ?? null,
          codeRegion: c.codeRegion || null,
          regionNom: regionByCode[c.codeRegion] || null,
          centre,
          distGrandeVille: null,
          grandeVilleNom: null,
        };
        deptCities[deptCode] = deptCities[deptCode] || [];
        deptCities[deptCode].push({ insee: c.code, population: out[c.code].population || 0, centre });
      }
      ok++;
      process.stdout.write('.');
    } catch (e) {
      failed.push(`${deptCode} (${e.message})`);
      process.stdout.write('x');
    }
    await sleep(120);
  }

  // Proximité : distance à la commune la plus peuplée du département.
  for (const cities of Object.values(deptCities)) {
    const biggest = cities.reduce((a, b) => (b.population > a.population ? b : a), cities[0]);
    if (!biggest || !biggest.centre) continue;
    const bigName = out[biggest.insee]?.nom || null;
    for (const c of cities) {
      if (!out[c.insee].centre) continue;
      out[c.insee].distGrandeVille = haversine(c.centre, biggest.centre);
      out[c.insee].grandeVilleNom = bigName;
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(out));

  console.log(`\n${Object.keys(out).length} communes écrites dans ${path.relative(process.cwd(), OUT)}`);
  console.log(`Départements OK : ${ok}/${deptCodes.length}`);
  if (failed.length) console.warn(`Échecs : ${failed.join(', ')}`);
}

main().catch((e) => {
  console.error('Erreur fatale :', e);
  process.exit(1);
});
