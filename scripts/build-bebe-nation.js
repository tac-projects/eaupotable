const fs = require('fs');
const path = require('path');
const { parseValue } = require('../lib/crystal-engine');

/**
 * BEBE NATIONAL AGGREGATOR
 * Parcourt les données communales générées (public/data/departments/*.json)
 * et produit public/data/bebe-nation.json, agrégat national utilisé par la
 * page /eau-bebe (bandeau hero) et son og:image.
 *
 * Lecture seule des JSON existants : ne recalcule aucun score (le
 * crystal.final stocké fait foi) et ne réimplémente aucune norme.
 */

const DEPTS_DIR = path.join(__dirname, '..', 'public', 'data', 'departments');
const OUT_PATH = path.join(__dirname, '..', 'public', 'data', 'bebe-nation.json');

// Seuil « vigilance biberon » aligné sur le palier 1 du moteur Crystal
// (crystal-engine : pénalité nitrates au-delà de 15 mg/L) et sur la
// recommandation maison déjà affichée en FAQ.
const BABY_VIGILANCE = 15;
const REG_LIMIT = 50;

function toNumber(v) {
  const n = parseValue(v);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const files = fs.readdirSync(DEPTS_DIR).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.error('Aucun fichier département trouvé. Lancez d\'abord la pipeline de données.');
    return;
  }

  let citiesTotal = 0;
  let testedNitrates = 0;
  let biberonOk = 0;
  let vigilance = 0;
  let over50 = 0;
  let noData = 0;
  let conformCount = 0;
  let conformTotal = 0;

  for (const file of files) {
    const filePath = path.join(DEPTS_DIR, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.warn(`Lecture impossible de ${file} : ${e.message}`);
      continue;
    }
    const cities = data.cities || {};
    citiesTotal += Object.keys(cities).length;

    for (const city of Object.values(cities)) {
      if (typeof city.isConform === 'boolean') {
        conformTotal += 1;
        if (city.isConform) conformCount += 1;
      }

      const nitVal = city.stats && city.stats.nitrates ? city.stats.nitrates.val : null;
      const nit = toNumber(nitVal);
      if (nit === null) {
        noData += 1;
        continue;
      }
      testedNitrates += 1;
      if (nit < BABY_VIGILANCE) biberonOk += 1;
      else if (nit < REG_LIMIT) vigilance += 1;
      else over50 += 1;
    }
  }

  const national = {
    citiesTotal,
    conformCount,
    conformTotal,
    testedNitrates,
    biberonOk,
    vigilance,
    over50,
    noData,
    generatedAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify({ national }, null, 2));
  console.log(`bebe-nation.json généré : ${citiesTotal} communes, ${testedNitrates} avec nitrates mesurés, ${biberonOk} sous ${BABY_VIGILANCE} mg/L, ${vigilance} en vigilance, ${over50} au-dessus de ${REG_LIMIT} mg/L.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
