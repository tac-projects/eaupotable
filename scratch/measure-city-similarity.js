// Mesure la similarité de contenu entre communes d'un même réseau (UDI).
// Baseline 09/2026 : ~46 % de phrases identiques entre communes sœurs.
// Objectif (Thomas) : < 20 %.
//
// Usage : node scratch/measure-city-similarity.js [--base=http://127.0.0.1:3000] [--host=localhost] [--n=12]
// Lecture seule (aucune écriture de données).

const fs = require('fs');
const path = require('path');

function opt(key, def) {
  const arg = process.argv.slice(2).find((a) => a.startsWith(`--${key}=`));
  return arg ? arg.split('=').slice(1).join('=') : def;
}

const BASE = opt('base', 'http://localhost:3000');
const N = parseInt(opt('n', '12'), 10);

const toText = (h) => h
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#?[a-z0-9]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const sentences = (t) => t
  .split(/(?<=[.!?])\s+/)
  .map((s) => s.trim())
  .filter((s) => s.split(' ').length >= 5);

async function fetchSentences(slug) {
  try {
    const res = await fetch(`${BASE}/ville/${slug}`, {
      headers: {
        'cf-ray': 'measure',
        // UA bot exempté du rate-limit du middleware (20 req/min par IP).
        // NB : passer par le hostname "localhost" (pas 127.0.0.1 + header Host,
        // que Node n'envoie pas → le middleware redirigerait vers la prod).
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
    });
    if (!res.ok) return null;
    return new Set(sentences(toText(await res.text())));
  } catch {
    return null;
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'data', 'reseaux-index.json'), 'utf8'));
  const pool = Object.values(data.reseaux)
    .filter((r) => r.communes.length >= 3 && r.communes.length <= 6)
    .sort((a, b) => a.udi.localeCompare(b.udi));

  const step = Math.max(1, Math.floor(pool.length / N));
  const sample = pool.filter((_, i) => i % step === 0).slice(0, N);

  console.log(`Mesure de similarité — base ${BASE}, ${sample.length} réseaux`);
  console.log('-'.repeat(64));

  const results = [];
  for (const r of sample) {
    const pages = {};
    for (const c of r.communes) pages[c.slug] = await fetchSentences(c.slug);
    const keys = Object.keys(pages).filter((k) => pages[k] && pages[k].size);
    if (keys.length < 2) continue;

    const base = pages[keys[0]];
    let sum = 0;
    let n = 0;
    for (const k of keys.slice(1)) {
      const p = [...pages[k]];
      const common = p.filter((x) => base.has(x));
      sum += (100 * common.length) / p.length;
      n++;
    }
    const pct = n ? sum / n : 0;
    results.push(pct);
    console.log(`${r.udi}  ${String(r.departements.join('/')).padEnd(6)}  ${r.communes.length} communes  ->  ${pct.toFixed(1)} %`);
  }

  console.log('-'.repeat(64));
  if (!results.length) {
    console.log('Aucune mesure exploitable (serveur injoignable ?).');
    process.exit(1);
  }
  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  console.log(`Similarité moyenne : ${avg.toFixed(1)} %  (cible < 20 %)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
