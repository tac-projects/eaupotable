const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const https = require('https');

const DATASET_API = 'https://www.data.gouv.fr/api/1/datasets/resultats-du-controle-sanitaire-de-leau-du-robinet/';
const ARCHIVE_DIR = path.join(__dirname, '..', 'source-data', 'archives');
const TMP_DIR = '/tmp/eaupotable-sise';

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'EauPotable.net-data-refresh' } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode} pour ${url}`));
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function download(url, filePath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'EauPotable.net-data-refresh' } }, (res) => {
      if (res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode} pour ${url}`)); res.resume(); return; }
      const out = fs.createWriteStream(filePath);
      res.pipe(out);
      out.on('finish', () => out.close(() => resolve(filePath)));
      out.on('error', reject);
    }).on('error', reject);
  });
}

function listZip(buf) {
  const eocd = buf.lastIndexOf(Buffer.from('PK\x05\x06'));
  if (eocd < 0) throw new Error('Archive ZIP invalide');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const nameLen = buf.readUInt16LE(off + 28);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString();
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const localOff = buf.readUInt32LE(off + 42);
    entries.push({ name, method, csize, localOff });
    off += 46 + nameLen + buf.readUInt16LE(off + 30) + buf.readUInt16LE(off + 32);
  }
  return entries;
}

function zipExtract(buf, entry) {
  const nameLen = buf.readUInt16LE(entry.localOff + 26);
  const extraLen = buf.readUInt16LE(entry.localOff + 28);
  const start = entry.localOff + 30 + nameLen + extraLen;
  const data = buf.slice(start, start + entry.csize);
  return entry.method === 0 ? data : zlib.inflateRawSync(data);
}

function csvHeaderIndex(header, name) {
  const idx = header.split(',').map((h) => h.replace(/"/g, '').trim()).indexOf(name);
  if (idx < 0) throw new Error(`Colonne "${name}" absente du fichier`);
  return idx;
}

function csvDate(line, idx) {
  const cols = line.split(',');
  const m = (cols[idx] || '').replace(/"/g, '').match(/(20\d{2}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function scanRepo() {
  if (!fs.existsSync(ARCHIVE_DIR)) return { maxDate: null, files: 0 };
  const years = fs.readdirSync(ARCHIVE_DIR)
    .filter((d) => /^\d{4}$/.test(d))
    .sort();
  let maxDate = null;
  let files = 0;
  for (const year of years) {
    const dir = path.join(ARCHIVE_DIR, year);
    for (const f of fs.readdirSync(dir)) {
      if (!/^DIS_PLV_/.test(f) || !f.endsWith('.txt')) continue;
      files++;
      const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
      const dateIdx = csvHeaderIndex(lines[0], 'dateprel');
      for (let i = 1; i < lines.length; i++) {
        const d = csvDate(lines[i], dateIdx);
        if (d && (!maxDate || d > maxDate)) maxDate = d;
      }
    }
  }
  return { maxDate, files };
}

async function main() {
  console.log('🔎 Contrôle de la fraîcheur des données SISE-Eaux…');
  const repo = scanRepo();
  console.log(`   Repo (archives locales)  : ${repo.files} fichiers DIS_PLV, dernier prélèvement : ${repo.maxDate || 'N/A'}`);

  let dataset;
  try {
    dataset = await getJson(DATASET_API);
  } catch (e) {
    console.error(`❌ Impossible d'interroger data.gouv.fr : ${e.message}`);
    process.exit(1);
  }

  const eaurob = dataset.resources
    .map((r) => {
      const m = (r.title || '').match(/^eaurob-(\d{6})\.zip$/);
      return m ? { month: m[1], url: r.url, created: r.created_at } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.month.localeCompare(a.month));

  if (eaurob.length === 0) {
    console.error('❌ Aucune ressource eaurob-YYYYMM.zip trouvée sur data.gouv.fr.');
    process.exit(1);
  }

  const latest = eaurob[0];
  const year = latest.month.slice(0, 4);
  const month = latest.month.slice(4, 6);
  console.log(`   Dernier fichier publié    : eaurob-${latest.month}.zip (prélèvements ${month}/${year}, publication ${latest.created.slice(0, 10)})`);

  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  const zipPath = path.join(TMP_DIR, `eaurob-${latest.month}.zip`);

  console.log('   Téléchargement…');
  try {
    await download(latest.url, zipPath);
  } catch (e) {
    console.error(`❌ Échec du téléchargement : ${e.message}`);
    process.exit(1);
  }
  const zipSize = fs.statSync(zipPath).size;
  console.log(`   → ${zipPath} (${(zipSize / 1048576).toFixed(1)} Mo)`);

  const buf = fs.readFileSync(zipPath);
  const entries = listZip(buf);
  const plv = entries.find((e) => e.name === `UDI_PLV_${latest.month}.txt`);
  if (!plv) {
    console.error(`❌ UDI_PLV_${latest.month}.txt introuvable dans le zip.`);
    process.exit(1);
  }

  const plvTxt = zipExtract(buf, plv).toString('utf8');
  const lines = plvTxt.split('\n').filter((l) => l.trim());
  const dateIdx = csvHeaderIndex(lines[0], 'dateprel');
  let maxDate = null;
  for (let i = 1; i < lines.length; i++) {
    const d = csvDate(lines[i], dateIdx);
    if (d && (!maxDate || d > maxDate)) maxDate = d;
  }

  console.log(`   Nouveau fichier (UDI_PLV)  : ${lines.length - 1} lignes, dernier prélèvement : ${maxDate}`);
  console.log('');

  if (!repo.maxDate) {
    console.log('⚠️  Aucune donnée locale détectée. Une régénération complète est à prévoir.');
  } else if (maxDate > repo.maxDate) {
    console.log(`✅ NOUVELLE DONNÉE DISPONIBLE : prélèvements jusqu'au ${maxDate} (repo : ${repo.maxDate}).`);
    console.log('   Procédure : voir AGENTS.md → « Rafraîchir les données ARS (SISE-Eaux) ».');
    console.log('   Résumé : remplacer source-data/archives puis lancer npm run sitemap → build → deploy.');
  } else {
    console.log(`ℹ️  Aucune donnée plus récente : le dernier prélèvement publié (${maxDate}) ne dépasse pas les archives locales (${repo.maxDate}).`);
    console.log('   La publication est mensuelle avec ~1 mois de délai : re-tester début du mois suivant.');
  }
}

main().catch((e) => {
  console.error('❌ Erreur :', e.message);
  process.exit(1);
});
