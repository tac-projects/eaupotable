// Mesure la similarité entre communes d'un même réseau avec une méthode plus
// sévère que le découpage en phrases : shingles de 4 mots + indice de Jaccard.
// Se rapproche davantage d'une similarité de documents (ce que voit un moteur).
//
// Usage : node scratch/measure-similarity-shingles.js [--base=http://localhost:3000] [--n=12]

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

const shingles = (t, k = 4) => {
  const w = t.split(' ');
  const s = new Set();
  for (let i = 0; i + k <= w.length; i++) s.add(w.slice(i, i + k).join(' '));
  return s;
};

async function getSet(slug) {
  try {
    const res = await fetch(`${BASE}/ville/${slug}`, {
      headers: {
        'cf-ray': 'measure',
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
    });
    if (!res.ok) return null;
    return shingles(toText(await res.text()));
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

  console.log(`Similarité shingles (4-grammes, Jaccard) — ${BASE}, ${sample.length} réseaux`);
  console.log('-'.repeat(64));

  const results = [];
  for (const r of sample) {
    const sets = [];
    for (const c of r.communes) sets.push(await getSet(c.slug));
    const valid = sets.filter(Boolean);
    if (valid.length < 2) continue;
    let sum = 0;
    let n = 0;
    for (let i = 1; i < valid.length; i++) {
      const A = valid[0];
      const B = valid[i];
      let inter = 0;
      for (const x of B) if (A.has(x)) inter++;
      sum += (100 * inter) / (A.size + B.size - inter);
      n++;
    }
    const pct = n ? sum / n : 0;
    results.push(pct);
    console.log(`${r.udi}  ${String(r.departements.join('/')).padEnd(6)}  ${r.communes.length} communes  ->  ${pct.toFixed(1)} %`);
  }

  console.log('-'.repeat(64));
  if (!results.length) process.exit(1);
  console.log(`Similarité moyenne (shingles) : ${(results.reduce((a, b) => a + b, 0) / results.length).toFixed(1)} %`);
}

main().catch((e) => { console.error(e); process.exit(1); });
