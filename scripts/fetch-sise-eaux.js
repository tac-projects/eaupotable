const fs = require('fs');
const path = require('path');
const { getJson, download, listZip, zipExtract } = require('../lib/zip-reader');

// Source officielle des archives : dataset data.gouv.fr
// « Résultats du contrôle sanitaire de l'eau distribuée commune par commune »
// (id 5cf8d9ed8b4c4110294c841d). Les ressources `dis-YYYY-dept.zip` contiennent
// DIRECTEMENT les fichiers DIS_PLV_*, DIS_RESULT_*, DIS_COM_UDI_* par département,
// au format attendu par scripts/build-dept-generic.js. Aucune transformation.
const DATASET_ID = '5cf8d9ed8b4c4110294c841d';
const DATASET_API = `https://www.data.gouv.fr/api/1/datasets/${DATASET_ID}/`;
const ARCHIVE_DIR = path.join(__dirname, '..', 'source-data', 'archives');
const SYNC_FILE = path.join(__dirname, '..', 'source-data', '.sise-sync.json');
const TMP_DIR = '/tmp/eaupotable-sise';
const DEFAULT_YEARS = ['2022', '2023', '2024', '2025', '2026'];

function parseArgs(argv) {
  const args = { apply: false, force: false, years: DEFAULT_YEARS.slice() };
  for (const a of argv) {
    if (a === '--apply') args.apply = true;
    else if (a === '--force') args.force = true;
    else if (a.startsWith('--years=')) {
      args.years = a.slice('--years='.length).split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return args;
}

// --- CSV ---
function splitCsv(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += char;
  }
  result.push(current.trim());
  return result;
}

function headerIndex(header, name) {
  const idx = splitCsv(header).indexOf(name);
  if (idx < 0) throw new Error(`Colonne "${name}" absente`);
  return idx;
}

// --- Fichiers locaux ---
function localSync() {
  if (!fs.existsSync(SYNC_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(SYNC_FILE, 'utf8')); } catch { return {}; }
}

function localMaxDate(year) {
  const dir = path.join(ARCHIVE_DIR, year);
  if (!fs.existsSync(dir)) return null;
  let maxDate = null;
  for (const f of fs.readdirSync(dir)) {
    if (!/^DIS_PLV_/.test(f) || !f.endsWith('.txt')) continue;
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
    if (!lines[0]) continue;
    const idx = headerIndex(lines[0], 'dateprel');
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsv(lines[i]);
      const d = (cols[idx] || '').match(/(20\d{2}-\d{2}-\d{2})/);
      if (d && (!maxDate || d[1] > maxDate)) maxDate = d[1];
    }
  }
  return maxDate;
}

// --- Ressources distantes ---
function resourcesByYear(dataset) {
  const map = {};
  for (const r of dataset.resources || []) {
    const m = (r.title || '').match(/^dis-(\d{4})-dept\.zip$/);
    if (!m) continue;
    const year = m[1];
    const stamp = (r.last_modified || r.created_at || '').slice(0, 10);
    if (!map[year] || stamp > map[year].stamp) {
      map[year] = { year, url: r.url, stamp, title: r.title };
    }
  }
  return map;
}

function maxDateInZip(buf, entries) {
  let maxDate = null;
  const plv = entries.filter((e) => /^DIS_PLV_/.test(e.name) && e.name.endsWith('.txt'));
  for (const e of plv) {
    const lines = zipExtract(buf, e).toString('utf8').split('\n');
    if (!lines[0]) continue;
    const idx = headerIndex(lines[0], 'dateprel');
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsv(lines[i]);
      const d = (cols[idx] || '').match(/(20\d{2}-\d{2}-\d{2})/);
      if (d && (!maxDate || d[1] > maxDate)) maxDate = d[1];
    }
  }
  return maxDate;
}

function extractYear(year, ressource, sync) {
  const zipPath = path.join(TMP_DIR, `dis-${year}-dept.zip`);
  console.log(`   ⬇️  ${ressource.title} (${ressource.stamp})…`);
  return download(ressource.url, zipPath).then(() => {
    const size = fs.statSync(zipPath).size;
    const buf = fs.readFileSync(zipPath);
    const entries = listZip(buf);
    const dir = path.join(ARCHIVE_DIR, year);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Purge des anciens fichiers DIS_* pour éviter tout résidu d'une version antérieure.
    let removed = 0;
    for (const f of fs.readdirSync(dir)) {
      if (/^DIS_(PLV|RESULT|COM_UDI)_/.test(f)) {
        fs.unlinkSync(path.join(dir, f));
        removed++;
      }
    }

    let written = 0;
    for (const e of entries) {
      if (!/^DIS_(PLV|RESULT|COM_UDI)_/.test(e.name)) continue;
      fs.writeFileSync(path.join(dir, e.name), zipExtract(buf, e));
      written++;
    }
    fs.unlinkSync(zipPath);
    const maxDate = maxDateInZip(buf, entries);
    console.log(`      → ${written} fichiers extraits (${removed} remplacés), ${(size / 1048576).toFixed(0)} Mo, dernier prélèvement : ${maxDate}`);
    sync[year] = { resource: ressource.title, stamp: ressource.stamp, maxDate, syncedAt: new Date().toISOString().slice(0, 10) };
    return { year, maxDate, written };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log('🔎 Données ARS SISE-Eaux — source : data.gouv.fr (commune par commune)');

  let dataset;
  try {
    dataset = await getJson(DATASET_API);
  } catch (e) {
    console.error(`❌ Impossible d'interroger data.gouv.fr : ${e.message}`);
    process.exit(1);
  }

  const remote = resourcesByYear(dataset);
  const sync = localSync();
  const years = args.years.filter((y) => remote[y]);
  if (years.length === 0) {
    console.error(`❌ Aucune ressource dis-YYYY-dept.zip pour les années demandées (${args.years.join(', ')}).`);
    process.exit(1);
  }

  if (!args.apply) {
    console.log('');
    let outdated = 0;
    for (const y of years) {
      const local = sync[y] ? `${sync[y].maxDate || '?'} (synchro ${sync[y].syncedAt})` : `${localMaxDate(y) || 'absente'} (non scriptée)`;
      const isNew = !sync[y] || sync[y].stamp !== remote[y].stamp;
      if (isNew) outdated++;
      console.log(`   ${y} : distance ${remote[y].stamp}  |  local ${local}  ${isNew ? '⚠️  à rafraîchir' : '✅ à jour'}`);
    }
    console.log('');
    if (outdated > 0) {
      console.log(`✅ NOUVELLE DONNÉE DISPONIBLE (${outdated} année(s) à rafraîchir sur ${years.length}).`);
      console.log('   Pour mettre à jour : npm run sise:apply  → puis npm run sitemap, npm run build.');
    } else {
      console.log('ℹ️  Archives locales à jour. La publication est mensuelle (~1 mois de délai) : re-tester le mois suivant.');
    }
    return;
  }

  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  console.log('');
  const results = [];
  for (const y of years) {
    const isNew = !sync[y] || sync[y].stamp !== remote[y].stamp;
    if (!isNew && !args.force) {
      console.log(`   ${y} : déjà à jour (${sync[y].stamp}) — ignorée (--force pour re-télécharger).`);
      continue;
    }
    results.push(await extractYear(y, remote[y], sync));
  }

  fs.writeFileSync(SYNC_FILE, JSON.stringify(sync, null, 2) + '\n');
  console.log('');
  if (results.length === 0) {
    console.log('ℹ️  Aucune année à télécharger. Utiliser --force pour tout refaire.');
  } else {
    console.log(`✅ ${results.length} année(s) mise(s) à jour : ${results.map((r) => `${r.year} → ${r.maxDate}`).join(', ')}.`);
    console.log('   Étape suivante : npm run sitemap  puis  npm run build  puis déploiement.');
  }
}

main().catch((e) => {
  console.error('❌ Erreur :', e.message);
  process.exit(1);
});
