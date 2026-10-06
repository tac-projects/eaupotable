// Soumet des URLs à IndexNow (Bing, Yandex, Seznam, Naver, Copilot).
//
// Usage :
//   node scripts/indexnow-submit.js --url=https://www.eaupotable.net/ville/paris
//   node scripts/indexnow-submit.js --file=/tmp/urls.txt      (une URL par ligne)
//   node scripts/indexnow-submit.js --important                (statiques + métropoles)
//   node scripts/indexnow-submit.js --important --dry-run
//
// La clé est lue depuis public/<clé>.txt (nom du fichier = contenu = clé).
// Aucune authentification : IndexNow est ouvert. Ne jamais soumettre le sitemap
// entier (35 000 URLs) — uniquement les pages importantes ou modifiées.

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://www.eaupotable.net';
const HOST = 'www.eaupotable.net';
const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_BATCH = 10000;

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const getArg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};
const getAllArgs = (name) =>
  args.filter((a) => a.startsWith(`--${name}=`)).map((a) => a.split('=').slice(1).join('='));

function findKeyFile() {
  const pub = path.join(__dirname, '..', 'public');
  for (const file of fs.readdirSync(pub)) {
    if (!file.endsWith('.txt')) continue;
    const key = file.slice(0, -4);
    if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) continue;
    const content = fs.readFileSync(path.join(pub, file), 'utf8').trim();
    if (content === key) return { key, keyLocation: `${DOMAIN}/${file}` };
  }
  return null;
}

function collectImportant() {
  const urls = [];
  const mainSitemap = path.join(__dirname, '..', 'public', 'sitemaps', 'sitemap-main.xml');
  if (fs.existsSync(mainSitemap)) {
    const xml = fs.readFileSync(mainSitemap, 'utf8');
    for (const m of xml.matchAll(/<loc>(.*?)<\/loc>/g)) urls.push(m[1]);
  }
  const metropolis = path.join(__dirname, '..', 'public', 'data', 'metropolis.json');
  if (fs.existsSync(metropolis)) {
    const list = JSON.parse(fs.readFileSync(metropolis, 'utf8'));
    for (const city of list) if (city.slug) urls.push(`${DOMAIN}/ville/${city.slug}`);
  }
  return urls;
}

function collectUrls() {
  let urls = [...getAllArgs('url')];

  const file = getArg('file', null);
  if (file) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    for (const line of lines) {
      const url = line.trim();
      if (url && !url.startsWith('#')) urls.push(url);
    }
  }

  if (hasFlag('important')) urls = urls.concat(collectImportant());

  const seen = new Set();
  const clean = [];
  for (const raw of urls) {
    let url;
    try {
      url = new URL(raw);
    } catch {
      continue;
    }
    if (url.hostname !== HOST) continue;
    const normalized = url.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    clean.push(normalized);
  }
  return clean;
}

async function main() {
  const { key, keyLocation } = findKeyFile() || {};
  if (!key) {
    console.error('Clé IndexNow introuvable : attendu public/<clé>.txt (nom = contenu).');
    process.exit(1);
  }
  console.log(`Clé : ${key} (${keyLocation})`);

  const urls = collectUrls();
  if (!urls.length) {
    console.error('Aucune URL. Utilisez --url=, --file= ou --important.');
    process.exit(1);
  }
  console.log(`${urls.length} URL(s) à soumettre.`);

  if (hasFlag('dry-run')) {
    for (const u of urls) console.log(`  ${u}`);
    return;
  }

  const endpoint = getArg('endpoint', DEFAULT_ENDPOINT);
  const batches = [];
  for (let i = 0; i < urls.length; i += MAX_BATCH) batches.push(urls.slice(i, i + MAX_BATCH));

  let ok = 0;
  let ko = 0;
  for (let i = 0; i < batches.length; i++) {
    const urlList = batches[i];
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key, keyLocation, urlList }),
    });
    const label = `lot ${i + 1}/${batches.length} (${urlList.length} URLs)`;
    if (res.status === 200 || res.status === 202) {
      ok++;
      console.log(`  OK    ${label} — HTTP ${res.status}`);
    } else {
      ko++;
      const body = await res.text();
      console.log(`  ECHEC ${label} — HTTP ${res.status} ${body.slice(0, 200)}`);
    }
  }

  console.log(`\nTerminé : ${ok} lot(s) accepté(s), ${ko} en échec.`);
  if (ko) process.exit(1);
}

main().catch((e) => {
  console.error('Erreur :', e.message);
  process.exit(1);
});
