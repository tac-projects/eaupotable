// Récupère les données communales (population, superficie, codes postaux) depuis
// geo.api.gouv.fr et les fige dans public/data/communes-geo.json (clé = code INSEE).
//
// Données annuelles stables : le fichier est commité et n'est PAS régénéré par la
// pipeline `npm run sitemap`. Relancer manuellement avec `npm run geo` pour rafraîchir.
//
// Usage : node scripts/fetch-commune-geo.js

const fs = require('fs');
const path = require('path');

const API = 'https://geo.api.gouv.fr/communes';
const FIELDS = 'nom,code,population,surface,codesPostaux';
const OUT = path.join(__dirname, '..', 'public', 'data', 'communes-geo.json');
const DEPT_DIR = path.join(__dirname, '..', 'public', 'data', 'departments');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchDept(deptCode) {
  const url = `${API}?codeDepartement=${encodeURIComponent(deptCode)}&fields=${FIELDS}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('réponse inattendue');
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

  const out = {};
  let ok = 0;
  const failed = [];

  for (const deptCode of deptCodes) {
    try {
      const communes = await fetchDept(deptCode);
      for (const c of communes) {
        if (!c.code) continue;
        out[c.code] = {
          population: typeof c.population === 'number' ? c.population : null,
          surface: typeof c.surface === 'number' ? c.surface : null,
          codesPostaux: Array.isArray(c.codesPostaux) ? c.codesPostaux : [],
        };
      }
      ok++;
      process.stdout.write('.');
    } catch (e) {
      failed.push(`${deptCode} (${e.message})`);
      process.stdout.write('x');
    }
    await sleep(120);
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
