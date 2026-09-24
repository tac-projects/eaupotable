const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const getArg = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : null;
};

const auditDir = path.join(__dirname, '..', 'audit');
if (!fs.existsSync(auditDir)) {
  console.error('Aucun dossier audit/. Lancez npm run audit d\'abord.');
  process.exit(1);
}

const dates = fs.readdirSync(auditDir)
  .filter((d) => fs.existsSync(path.join(auditDir, d, 'snapshot.json')))
  .sort();

if (dates.length < 2 && !getArg('from')) {
  console.error(`Il faut au moins 2 snapshots pour comparer (trouvés : ${dates.length}).`);
  process.exit(1);
}

const toDate = getArg('to') || dates[dates.length - 1];
const fromDate = getArg('from') || dates[dates.length - 2];
const from = JSON.parse(fs.readFileSync(path.join(auditDir, fromDate, 'snapshot.json'), 'utf8'));
const to = JSON.parse(fs.readFileSync(path.join(auditDir, toDate, 'snapshot.json'), 'utf8'));

const fmt = (n) => Number(n).toLocaleString('fr-FR');
const pct = (x) => `${(Number(x) * 100).toFixed(2)} %`;
const delta = (a, b) => (b ? ((a - b) / b) * 100 : a > 0 ? Infinity : 0);
const dstr = (a, b) => (b ? `${delta(a, b).toFixed(1)} %` : '—');

const strip = (u) => String(u).replace('https://www.eaupotable.net', '');

const unionPages = (snap) => {
  const map = new Map();
  for (const r of snap.gsc.pagesA) map.set(r.keys[0], { a: r, b: null });
  for (const r of snap.gsc.pagesB) {
    const k = r.keys[0];
    if (map.has(k)) map.get(k).b = r;
    else map.set(k, { a: null, b: r });
  }
  return map;
};

console.log(`Diff audit : ${fromDate} → ${toDate}`);
console.log(`Fenêtre from : ${from.meta.windowA.start} → ${from.meta.windowA.end}`);
console.log(`Fenêtre to   : ${to.meta.windowA.start} → ${to.meta.windowA.end}\n`);

console.log('## Totaux GSC');
console.log(`Clics       : ${fmt(from.gsc.totalsA.clicks)} → ${fmt(to.gsc.totalsA.clicks)} (${dstr(to.gsc.totalsA.clicks, from.gsc.totalsA.clicks)})`);
console.log(`Impressions : ${fmt(from.gsc.totalsA.impressions)} → ${fmt(to.gsc.totalsA.impressions)} (${dstr(to.gsc.totalsA.impressions, from.gsc.totalsA.impressions)})`);
console.log(`CTR         : ${pct(from.gsc.totalsA.ctr)} → ${pct(to.gsc.totalsA.ctr)}`);
console.log(`Position    : ${from.gsc.totalsA.position.toFixed(1)} → ${to.gsc.totalsA.position.toFixed(1)}`);

console.log('\n## Segments');
const segKeys = new Set([...Object.keys(from.gsc.segments), ...Object.keys(to.gsc.segments)]);
for (const k of segKeys) {
  const f = from.gsc.segments[k] || { clicksA: 0 };
  const t = to.gsc.segments[k] || { clicksA: 0 };
  console.log(`${k.padEnd(16)}: ${fmt(f.clicksA)} → ${fmt(t.clicksA)} (${dstr(t.clicksA, f.clicksA)})`);
}

const fromPages = unionPages(from);
const toPages = unionPages(to);
const keys = new Set([...fromPages.keys(), ...toPages.keys()]);
const rows = [];
for (const k of keys) {
  const fc = fromPages.get(k)?.a?.clicks || 0;
  const tc = toPages.get(k)?.a?.clicks || 0;
  const fi = fromPages.get(k)?.a?.impressions || 0;
  const ti = toPages.get(k)?.a?.impressions || 0;
  if (fc + tc < 3) continue;
  rows.push({ page: strip(k), fc, tc, fi, ti, d: delta(tc, fc) });
}
const up = [...rows].sort((a, b) => b.tc - b.fc).slice(0, 15);
const down = [...rows].sort((a, b) => (a.tc - a.fc) - (b.tc - b.fc)).slice(0, 15);

console.log('\n## Pages — plus fortes hausses (clics)');
for (const r of up) console.log(`${r.page} | ${r.fc} → ${r.tc} (${r.d === Infinity ? 'NEW' : `${r.d.toFixed(0)} %`}) | imp ${fmt(r.fi)} → ${fmt(r.ti)}`);
console.log('\n## Pages — plus fortes baisses (clics)');
for (const r of down) console.log(`${r.page} | ${r.fc} → ${r.tc} (${r.d.toFixed(0)} %) | imp ${fmt(r.fi)} → ${fmt(r.ti)}`);
