const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const getArg = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : null;
};

const auditDir = path.join(__dirname, '..', 'audit');
if (!fs.existsSync(auditDir)) {
  console.error("Aucun dossier audit/. Lancez npm run audit d'abord.");
  process.exit(1);
}

const findSnapshots = (dir) => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findSnapshots(p));
    else if (e.name === 'snapshot.json') out.push(p);
  }
  return out;
};

const snapshots = findSnapshots(auditDir).sort();
const cadence = getArg('period') || 'month';
const cadenceDir = cadence === 'week' ? '/weekly/' : '/monthly/';
const pool = snapshots.filter((s) => s.includes(cadenceDir));

const pick = (needle) => {
  if (!needle) return null;
  const hit = snapshots.find((s) => s.includes(needle));
  if (!hit) {
    console.error(`Snapshot introuvable pour "${needle}". Disponibles :\n${snapshots.map((s) => '  ' + path.relative(auditDir, s)).join('\n')}`);
    process.exit(1);
  }
  return hit;
};

if (pool.length < 2 && !getArg('from')) {
  console.error(`Il faut au moins 2 snapshots "${cadence}" (trouvés : ${pool.length}). Utilisez --from= ou --period=week|month.`);
  process.exit(1);
}

const toPath = pick(getArg('to')) || pool[pool.length - 1];
const fromPath = pick(getArg('from')) || pool[pool.length - 2];
const from = JSON.parse(fs.readFileSync(fromPath, 'utf8'));
const to = JSON.parse(fs.readFileSync(toPath, 'utf8'));

const rel = (p) => path.relative(auditDir, path.dirname(p));
const fmt = (n) => Number(n).toLocaleString('fr-FR');
const pct = (x) => `${(Number(x) * 100).toFixed(2)} %`;
const delta = (a, b) => (b ? ((a - b) / b) * 100 : a > 0 ? Infinity : 0);
const dstr = (a, b) => (b ? `${delta(a, b).toFixed(1)} %` : '—');
const strip = (u) => String(u).replace('https://www.eaupotable.net', '');

console.log(`Diff audit : ${rel(fromPath)} (${from.meta.windowA.start}→${from.meta.windowA.end})`);
console.log(`         →  ${rel(toPath)} (${to.meta.windowA.start}→${to.meta.windowA.end})\n`);

console.log('## GSC — Totaux');
console.log(`Clics       : ${fmt(from.gsc.totalsA.clicks)} → ${fmt(to.gsc.totalsA.clicks)} (${dstr(to.gsc.totalsA.clicks, from.gsc.totalsA.clicks)})`);
console.log(`Impressions : ${fmt(from.gsc.totalsA.impressions)} → ${fmt(to.gsc.totalsA.impressions)} (${dstr(to.gsc.totalsA.impressions, from.gsc.totalsA.impressions)})`);
console.log(`CTR         : ${pct(from.gsc.totalsA.ctr)} → ${pct(to.gsc.totalsA.ctr)}`);
console.log(`Position    : ${from.gsc.totalsA.position.toFixed(1)} → ${to.gsc.totalsA.position.toFixed(1)}`);

console.log('\n## GSC — Segments');
const segKeys = new Set([...Object.keys(from.gsc.segments || {}), ...Object.keys(to.gsc.segments || {})]);
for (const k of segKeys) {
  const f = (from.gsc.segments || {})[k] || { clicksA: 0 };
  const t = (to.gsc.segments || {})[k] || { clicksA: 0 };
  console.log(`${k.padEnd(16)}: ${fmt(f.clicksA)} → ${fmt(t.clicksA)} (${dstr(t.clicksA, f.clicksA)})`);
}

if (from.gsc.byTypeA && to.gsc.byTypeA) {
  console.log('\n## GSC — Par type');
  const ft = new Map(from.gsc.byTypeA.map((r) => [r.type, r]));
  const tt = new Map(to.gsc.byTypeA.map((r) => [r.type, r]));
  for (const k of new Set([...ft.keys(), ...tt.keys()])) {
    const f = ft.get(k) || { clicks: 0, impressions: 0 };
    const t = tt.get(k) || { clicks: 0, impressions: 0 };
    console.log(`${k.padEnd(16)}: clics ${fmt(f.clicks)} → ${fmt(t.clicks)} | imp ${fmt(f.impressions)} → ${fmt(t.impressions)}`);
  }
}

if (from.indexation && to.indexation) {
  console.log('\n## Indexation');
  console.log(`Taux PASS : ${pct(from.indexation.indexationRate)} → ${pct(to.indexation.indexationRate)}`);
}

if (from.sitemapsApi && to.sitemapsApi) {
  const sub = (arr) => arr.reduce((a, s) => a + (s.contents[0]?.submitted || 0), 0);
  const idx = (arr) => arr.reduce((a, s) => a + (s.contents[0]?.indexed || 0), 0);
  const err = (arr) => arr.reduce((a, s) => a + s.errors, 0);
  console.log('\n## GSC Sitemaps API');
  console.log(`Soumis : ${fmt(sub(from.sitemapsApi))} → ${fmt(sub(to.sitemapsApi))} | Indexés : ${fmt(idx(from.sitemapsApi))} → ${fmt(idx(to.sitemapsApi))} | Erreurs : ${err(from.sitemapsApi)} → ${err(to.sitemapsApi)}`);
}

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

const fromPages = unionPages(from);
const toPages = unionPages(to);
const pageKeys = new Set([...fromPages.keys(), ...toPages.keys()]);
const rows = [];
for (const k of pageKeys) {
  const fc = fromPages.get(k)?.a?.clicks || 0;
  const tc = toPages.get(k)?.a?.clicks || 0;
  const fi = fromPages.get(k)?.a?.impressions || 0;
  const ti = toPages.get(k)?.a?.impressions || 0;
  if (fc + tc < 3) continue;
  rows.push({ page: strip(k), fc, tc, fi, ti, d: delta(tc, fc) });
}
const up = [...rows].sort((a, b) => (b.tc - b.fc) - (a.tc - a.fc)).slice(0, 15);
const down = [...rows].sort((a, b) => (a.tc - a.fc) - (b.tc - b.fc)).slice(0, 15);

console.log('\n## GSC — Pages : plus fortes hausses (clics)');
for (const r of up) console.log(`${r.page} | ${r.fc} → ${r.tc} (${r.d === Infinity ? 'NEW' : `${r.d.toFixed(0)} %`}) | imp ${fmt(r.fi)} → ${fmt(r.ti)}`);
console.log('\n## GSC — Pages : plus fortes baisses (clics)');
for (const r of down) console.log(`${r.page} | ${r.fc} → ${r.tc} (${r.d.toFixed(0)} %) | imp ${fmt(r.fi)} → ${fmt(r.ti)}`);

if (from.ga4 && to.ga4) {
  const keyed = (list, key, val) => new Map(list.map((x) => [x[key], x]));
  const diffSimple = (label, fa, ta, key, val) => {
    const fm = keyed(fa, key);
    const tm = keyed(ta, key);
    const keys = new Set([...fm.keys(), ...tm.keys()]);
    console.log(`\n## GA4 — ${label}`);
    for (const k of [...keys].sort((a, b) => (tm.get(b)?.[val] || 0) - (tm.get(a)?.[val] || 0)).slice(0, 15)) {
      const f = fm.get(k)?.[val] || 0;
      const t = tm.get(k)?.[val] || 0;
      console.log(`${String(k).padEnd(24)}: ${fmt(f)} → ${fmt(t)} (${dstr(t, f)})`);
    }
  };
  diffSimple('Canaux (sessions)', from.ga4.channels, to.ga4.channels, 'channel', 'sessions');
  diffSimple('Appareils (sessions)', from.ga4.devices, to.ga4.devices, 'device', 'sessions');
  diffSimple('Events (occurrences)', from.ga4.events, to.ga4.events, 'event', 'count');
  diffSimple('Landing organiques (sessions)', from.ga4.landingA, to.ga4.landingA, 'page', 'sessions');
  if (from.ga4.keyEvents && to.ga4.keyEvents) {
    diffSimple('Événements clés (keyEvents)', from.ga4.keyEvents, to.ga4.keyEvents, 'event', 'keyEvents');
  }
} else {
  console.log('\n(GA4 absent d\'un des snapshots — diff GA4 ignoré.)');
}
