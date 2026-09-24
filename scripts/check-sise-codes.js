'use strict';

const fs = require('fs');
const path = require('path');
const { getJson, download, listZip, zipExtract } = require('../lib/zip-reader');
const { SISE_CODES, SISE_LABEL_HINTS } = require('../lib/sise-param-codes');

// Valide les codes SISE de lib/sise-param-codes.js contre le référentiel
// officiel `eaurob-ref-*.zip` (dataset data.gouv « eau du robinet » → PAR).
// Détecte toute dérive silencieuse (mauvais code paramètre → valeurs fausses).
// À lancer avec `npm run check:codes` (appelé par `npm run sise`).

const DATASET_API = 'https://www.data.gouv.fr/api/1/datasets/resultats-du-controle-sanitaire-de-leau-du-robinet/';
const TMP_DIR = '/tmp/eaupotable-sise';

function splitCsv(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const norm = (s) => (s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

async function main() {
  const dataset = await getJson(DATASET_API);
  const ref = (dataset.resources || [])
    .filter((r) => /^eaurob-ref-\d+\.zip$/.test(r.title || ''))
    .sort((a, b) => (b.last_modified || '').localeCompare(a.last_modified || ''))[0];
  if (!ref) {
    console.error('❌ Ressource eaurob-ref-*.zip introuvable sur data.gouv.fr.');
    process.exit(1);
  }

  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  const zipPath = path.join(TMP_DIR, ref.title);
  await download(ref.url, zipPath);
  const buf = fs.readFileSync(zipPath);
  const entry = listZip(buf).find((e) => /^PAR_\d+\.csv$/.test(e.name));
  if (!entry) {
    console.error('❌ Fichier PAR_*.csv introuvable dans eaurob-ref.');
    process.exit(1);
  }
  const rows = zipExtract(buf, entry).toString('utf8').split('\n').filter(Boolean);
  const header = splitCsv(rows[0]);
  const ci = header.indexOf('cdparametre');
  const li = header.indexOf('libmajparametre');
  if (ci < 0 || li < 0) {
    console.error('❌ Colonnes cdparametre/libmajparametre absentes de PAR.');
    process.exit(1);
  }
  const labels = new Map();
  for (let i = 1; i < rows.length; i++) {
    const p = splitCsv(rows[i]);
    if (p[ci] != null && !labels.has(p[ci])) labels.set(p[ci], p[li]);
  }

  const errors = [];
  let checked = 0;
  for (const [key, codes] of Object.entries(SISE_CODES)) {
    const hints = SISE_LABEL_HINTS[key] || [];
    for (const code of codes) {
      checked++;
      const label = labels.get(String(code));
      if (!label) {
        errors.push(`${key} → code ${code} ABSENT du référentiel PAR`);
        continue;
      }
      const ok = hints.some((h) => norm(label).includes(norm(h)));
      if (!ok) errors.push(`${key} → code ${code} = « ${label} » (attendu : ${hints.join(' / ')})`);
    }
  }

  if (errors.length) {
    console.error(`\n❌ Mapping SISE incohérent (${errors.length} code(s) sur ${checked}) :`);
    for (const e of errors) console.error(`   - ${e}`);
    console.error('\nCorriger lib/sise-param-codes.js puis régénérer (npm run sitemap).');
    process.exit(1);
  }
  console.log(`✅ Mapping SISE validé : ${Object.keys(SISE_CODES).length} paramètres, ${checked} codes conformes au référentiel PAR.`);
}

main().catch((e) => {
  console.error('❌ Erreur :', e.message);
  process.exit(1);
});
