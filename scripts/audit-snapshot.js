const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');
const { sampleUrls, inspectUrls, summarize } = require('./audit-indexation');

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};

const keyFile = process.env.GSC_KEY_FILE
  || process.env.GA4_KEY_FILE
  || path.join(__dirname, '..', '.secrets', 'ga4-service-account.json');
const site = process.env.GSC_SITE || 'sc-domain:eaupotable.net';
const propertyId = process.env.GA4_PROPERTY_ID;
const lagDays = parseInt(getArg('lag', '3'), 10);
const rowLimit = parseInt(getArg('rows', '25000'), 10);
const period = getArg('period', 'month');
const runDate = new Date().toISOString().slice(0, 10);

const addDays = (d, n) => new Date(d.getTime() + n * 864e5);
const fmtDate = (d) => d.toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, '0');

const isoWeekOf = (d) => {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dow + 3);
  const isoYear = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const f = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - f + 3);
  return { isoYear, week: 1 + Math.round((date - firstThursday) / (7 * 864e5)) };
};

const windowsFor = (p) => {
  if (p === 'week') {
    const cutoff = addDays(new Date(), -lagDays);
    const dow = (cutoff.getUTCDay() + 6) % 7;
    const lastSunday = addDays(cutoff, -(dow + 1));
    const prevSunday = addDays(lastSunday, -7);
    const { isoYear, week } = isoWeekOf(addDays(lastSunday, -3));
    return {
      a: { start: fmtDate(addDays(lastSunday, -6)), end: fmtDate(lastSunday) },
      b: { start: fmtDate(addDays(prevSunday, -6)), end: fmtDate(prevSunday) },
      label: `${isoYear}-W${pad(week)}`
    };
  }
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const aStart = new Date(Date.UTC(y, m - 1, 1));
  const aEnd = new Date(Date.UTC(y, m, 0));
  const bStart = new Date(Date.UTC(y, m - 2, 1));
  const bEnd = new Date(Date.UTC(y, m - 1, 0));
  return {
    a: { start: fmtDate(aStart), end: fmtDate(aEnd) },
    b: { start: fmtDate(bStart), end: fmtDate(bEnd) },
    label: `${aStart.getUTCFullYear()}-${pad(aStart.getUTCMonth() + 1)}`
  };
};

const win = windowsFor(period);
const startA = win.a.start;
const endA = win.a.end;
const startB = win.b.start;
const endB = win.b.end;

const BRAND = /eaupotable|eau[\s-]?potable\.?\s?net/i;
const strip = (u) => String(u).replace('https://www.eaupotable.net', '');

if (!fs.existsSync(keyFile)) {
  console.error(`Clé de service introuvable : ${keyFile}`);
  process.exit(1);
}

async function gscClient() {
  const auth = new GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  return auth.getClient();
}

async function gscQuery(http, startDate, endDate, body) {
  const { token } = await http.getAccessToken();
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, ...body })
    }
  );
  if (!res.ok) throw new Error(`GSC ${res.status} : ${await res.text()}`);
  return (await res.json()).rows || [];
}

async function gscSitemaps(http) {
  const { token } = await http.getAccessToken();
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`GSC sitemaps ${res.status} : ${await res.text()}`);
  const j = await res.json();
  return (j.sitemap || []).map((s) => ({
    path: strip(s.path),
    lastDownloaded: s.lastDownloaded || null,
    lastSubmitted: s.lastSubmitted || null,
    errors: Number(s.errors || 0),
    warnings: Number(s.warnings || 0),
    contents: (s.contents || []).map((c) => ({ type: c.type, submitted: Number(c.submitted || 0), indexed: Number(c.indexed || 0) }))
  }));
}

let ga4http;
async function ga4Query(body) {
  if (!ga4http) {
    const auth = new GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });
    ga4http = await auth.getClient();
  }
  const { token } = await ga4http.getAccessToken();
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );
  if (!res.ok) throw new Error(`GA4 ${res.status} : ${await res.text()}`);
  return (await res.json()).rows || [];
}

const gscRow = (r) => ({ keys: r.keys, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
const sumTotals = (rows) => {
  const t = rows.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 });
  const pos = rows.length ? rows.reduce((a, r) => a + r.position, 0) / rows.length : 0;
  return { clicks: t.clicks, impressions: t.impressions, ctr: t.impressions ? t.clicks / t.impressions : 0, position: pos };
};

const SEARCH_TYPES = ['web', 'image', 'video', 'news', 'discover', 'googleNews'];
async function searchTypeTotals(http, startDate, endDate) {
  const out = [];
  for (const t of SEARCH_TYPES) {
    try {
      const rows = await gscQuery(http, startDate, endDate, { type: t });
      const tot = sumTotals(rows);
      out.push({ type: t, clicks: tot.clicks, impressions: tot.impressions, ctr: tot.ctr, position: tot.position });
    } catch (e) { /* type non supporté pour la propriété */ }
  }
  return out;
}

const segmentPages = (rowsA, rowsB) => {
  const mb = new Map(rowsB.map((r) => [r.keys[0], r]));
  const seg = {};
  for (const r of rowsA) {
    const p = strip(r.keys[0]);
    const key = p === '/' ? 'home_brand_nav'
      : p.startsWith('/ville/') ? 'ville'
      : p.startsWith('/departement/') ? 'departement'
      : p.startsWith('/pfas') ? 'pfas'
      : 'autres';
    seg[key] = seg[key] || { clicksA: 0, impressionsA: 0, clicksB: 0, impressionsB: 0 };
    seg[key].clicksA += r.clicks;
    seg[key].impressionsA += r.impressions;
    const b = mb.get(r.keys[0]);
    if (b) { seg[key].clicksB += b.clicks; seg[key].impressionsB += b.impressions; }
  }
  return seg;
};

const sitemapHealth = () => {
  const root = path.join(__dirname, '..', 'public');
  const files = [path.join(root, 'sitemap.xml')];
  const dir = path.join(root, 'sitemaps');
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (f.endsWith('.xml')) files.push(path.join(dir, f));
  const urls = [];
  const lastmods = [];
  for (const f of files) {
    const x = fs.readFileSync(f, 'utf8');
    for (const m of x.matchAll(/<loc>(.*?)<\/loc>/g)) urls.push(m[1]);
    for (const m of x.matchAll(/<lastmod>(.*?)<\/lastmod>/g)) lastmods.push(m[1]);
  }
  const byMonth = {};
  for (const d of lastmods) {
    const k = d.slice(0, 7);
    byMonth[k] = (byMonth[k] || 0) + 1;
  }
  return { files: files.length, urls: urls.length, duplicates: urls.length - new Set(urls).size, lastmodByMonth: byMonth };
};

const expectedCtrByPos = (pagesA) => {
  const buckets = {};
  for (const r of pagesA) {
    const b = Math.min(20, Math.max(1, Math.round(r.position)));
    buckets[b] = buckets[b] || { imp: 0, clicks: 0 };
    buckets[b].imp += r.impressions;
    buckets[b].clicks += r.clicks;
  }
  const curve = {};
  for (const [b, v] of Object.entries(buckets)) curve[b] = v.imp ? v.clicks / v.imp : 0;
  return curve;
};

const opportunities = (pagesA, curve) => pagesA
  .filter((r) => r.position >= 5 && r.position <= 15 && r.impressions >= 200 && r.ctr < 0.02)
  .map((r) => {
    const expected = curve[Math.min(20, Math.max(1, Math.round(r.position)))] || 0;
    const gain = Math.max(0, (expected - r.ctr) * r.impressions);
    return { page: strip(r.keys[0]), impressions: r.impressions, clicks: r.clicks, ctr: r.ctr, expectedCtr: expected, position: r.position, estClicksGain: gain };
  })
  .sort((a, b) => b.estClicksGain - a.estClicksGain)
  .slice(0, 20);

const decliners = (pagesA, pagesB) => {
  const mb = new Map(pagesB.map((r) => [r.keys[0], r]));
  const out = [];
  for (const r of pagesA) {
    const b = mb.get(r.keys[0]);
    const prev = b ? b.clicks : 0;
    if (prev >= 5) {
      const d = (r.clicks - prev) / prev;
      if (d <= -0.15) out.push({ page: strip(r.keys[0]), clicksB: prev, clicksA: r.clicks, delta: d, impressionsA: r.impressions, position: r.position });
    }
  }
  return out.sort((a, b) => (b.clicksB - b.clicksA) - (a.clicksB - a.clicksA)).slice(0, 15);
};

const cannibalization = (queryPageA) => {
  const byQuery = {};
  for (const r of queryPageA) {
    const q = r.keys[0];
    if (/^site:/i.test(q) || BRAND.test(q) || q.length < 4) continue;
    const p = strip(r.keys[1]);
    byQuery[q] = byQuery[q] || [];
    byQuery[q].push({ page: p, clicks: r.clicks, impressions: r.impressions, position: r.position });
  }
  const out = [];
  for (const [q, pages] of Object.entries(byQuery)) {
    if (pages.length >= 2) {
      const totalImpressions = pages.reduce((a, p) => a + p.impressions, 0);
      if (totalImpressions < 20) continue;
      out.push({ query: q, totalImpressions, pages: pages.sort((a, b) => b.impressions - a.impressions).slice(0, 5) });
    }
  }
  return out.sort((a, b) => b.totalImpressions - a.totalImpressions).slice(0, 15);
};

const priorityRank = { P0: 0, P1: 1, P2: 2 };
const buildActions = ({ segments, opp, dec, cannib, indexation, sitemapsApi, sitemap, ga4, byType }) => {
  const actions = [];
  const pc = (x) => `${(x * 100).toFixed(0)} %`;

  if (sitemapsApi) {
    const errs = sitemapsApi.filter((s) => s.errors > 0);
    if (errs.length) actions.push({ priority: 'P0', theme: 'Technique', action: `${errs.length} sitemap(s) en erreur côté GSC — corriger en priorité`, impact: 'bloquant', effort: 'faible' });
  }
  if (opp.length) {
    const gain = Math.round(opp.reduce((a, o) => a + o.estClicksGain, 0));
    actions.push({ priority: 'P1', theme: 'CTR / méta-description', action: `Tester la méta-description sur ${opp.length} pages (gain estimé ~${gain} clics/période)`, impact: gain, effort: 'faible' });
  }
  if (indexation && indexation.indexationRate < 0.7) {
    const crawled = Object.entries(indexation.byCoverage).find(([k]) => /Crawled.*not indexed/i.test(k));
    actions.push({ priority: 'P1', theme: 'Indexation', action: `Taux ${pc(indexation.indexationRate)} (< 70 %)${crawled ? ` — ${crawled[1]} URLs « Crawled – not indexed »` : ''} : différencier (valeur unique) ou consolider (noindex)`, impact: 'élevé', effort: 'élevé' });
  }
  if (segments.ville && segments.ville.clicksB) {
    const d = (segments.ville.clicksA - segments.ville.clicksB) / segments.ville.clicksB;
    if (d <= -0.1) actions.push({ priority: 'P1', theme: 'Trafic', action: `/ville/* en baisse (${(d * 100).toFixed(1)} %) — corréler indexation + lastmod sitemap`, impact: 'élevé', effort: 'moyen' });
  }
  if (cannib.length) actions.push({ priority: 'P2', theme: 'Cannibalisation', action: `${cannib.length} requêtes servies par plusieurs pages — consolider ou canoniser`, impact: 'moyen', effort: 'moyen' });
  if (dec.length) actions.push({ priority: 'P2', theme: 'Déclins', action: `${dec.length} pages en baisse > 15 % — vérifier indexation, canonical, maillage`, impact: 'moyen', effort: 'moyen' });
  if (byType) {
    const disc = byType.find((t) => t.type === 'discover');
    if (disc && disc.impressions >= 1000) actions.push({ priority: 'P2', theme: 'Discover', action: `Discover : ${Math.round(disc.impressions)} imp — optimiser images/titres pour Discover`, impact: 'moyen', effort: 'faible' });
  }
  if (ga4 && ga4.devices) {
    const mob = ga4.devices.find((d) => d.device === 'mobile');
    const desk = ga4.devices.find((d) => d.device === 'desktop');
    if (mob && desk && desk.engagementRate - mob.engagementRate > 0.1) actions.push({ priority: 'P2', theme: 'UX mobile', action: `Engagement mobile ${pc(mob.engagementRate)} vs desktop ${pc(desk.engagementRate)} — auditer l'above-the-fold`, impact: 'moyen', effort: 'moyen' });
  }
  if (ga4 && ga4.searchNoResult && ga4.searchNoResult.length) actions.push({ priority: 'P2', theme: 'Contenu', action: `${ga4.searchNoResult.length} requêtes sans résultat (search_no_result) — créer pages/FAQ`, impact: 'moyen', effort: 'moyen' });
  for (const [k, v] of Object.entries(segments)) {
    if (v.clicksB >= 50 && (v.clicksA - v.clicksB) / v.clicksB > 0.5) actions.push({ priority: 'P2', theme: 'Capitaliser', action: `Segment « ${k} » en forte hausse (${(((v.clicksA - v.clicksB) / v.clicksB) * 100).toFixed(0)} %) — renforcer maillage/contenu`, impact: 'moyen', effort: 'faible' });
  }
  if (sitemap && sitemap.duplicates > 0) actions.push({ priority: 'P0', theme: 'Technique', action: `Sitemap : ${sitemap.duplicates} URLs en doublon — corriger`, impact: 'moyen', effort: 'faible' });
  if (!actions.length) actions.push({ priority: 'P2', theme: 'Stable', action: 'Aucune alerte majeure — trajectoire stable', impact: '—', effort: '—' });
  return actions.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
};

(async () => {
  const outDir = path.join(__dirname, '..', 'audit', period === 'week' ? 'weekly' : 'monthly', win.label);
  fs.mkdirSync(outDir, { recursive: true });

  const http = await gscClient();
  const base = { rowLimit };
  const safe = async (fn, fallback = null) => { try { return await fn(); } catch (e) { console.warn(`  (ignoré : ${e.message.slice(0, 80)})`); return fallback; } };

  const gsc = {
    daily: (await gscQuery(http, startA, endA, { dimensions: ['date'] })).map(gscRow),
    byTypeA: await safe(() => searchTypeTotals(http, startA, endA), []),
    byTypeB: await safe(() => searchTypeTotals(http, startB, endB), []),
    deviceA: (await gscQuery(http, startA, endA, { dimensions: ['device'] })).map(gscRow),
    countryA: (await gscQuery(http, startA, endA, { dimensions: ['country'] })).map(gscRow),
    pagesA: (await gscQuery(http, startA, endA, { dimensions: ['page'], ...base })).map(gscRow),
    pagesB: (await gscQuery(http, startB, endB, { dimensions: ['page'], ...base })).map(gscRow),
    queriesA: (await gscQuery(http, startA, endA, { dimensions: ['query'], ...base })).map(gscRow),
    queriesB: (await gscQuery(http, startB, endB, { dimensions: ['query'], ...base })).map(gscRow),
    queryPageA: (await gscQuery(http, startA, endA, { dimensions: ['query', 'page'], ...base })).map(gscRow)
  };

  gsc.totalsA = sumTotals(gsc.daily);
  gsc.totalsB = sumTotals(await gscQuery(http, startB, endB, { dimensions: ['date'] }).then((r) => r.map(gscRow)));
  gsc.segments = segmentPages(gsc.pagesA, gsc.pagesB);
  gsc.brandQueries = {
    brandA: gsc.queriesA.filter((r) => BRAND.test(r.keys[0])).length,
    brandClicksA: gsc.queriesA.filter((r) => BRAND.test(r.keys[0])).reduce((a, r) => a + r.clicks, 0),
    brandClicksB: gsc.queriesB.filter((r) => BRAND.test(r.keys[0])).reduce((a, r) => a + r.clicks, 0)
  };
  const curve = expectedCtrByPos(gsc.pagesA);
  gsc.expectedCtrByPos = curve;
  gsc.opportunities = opportunities(gsc.pagesA, curve);
  gsc.decliners = decliners(gsc.pagesA, gsc.pagesB);
  gsc.cannibalization = cannibalization(gsc.queryPageA);

  const sitemap = sitemapHealth();
  const sitemapsApi = await safe(() => gscSitemaps(http));

  const snapshot = {
    meta: {
      runDate,
      period,
      label: win.label,
      site,
      propertyId: propertyId || null,
      lagDays,
      windowA: { start: startA, end: endA },
      windowB: { start: startB, end: endB }
    },
    gsc,
    sitemap,
    sitemapsApi
  };

  if (propertyId) {
    const filt = { filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { value: 'Organic Search' } } };
    const landing = async (startDate, endDate) => (await ga4Query({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'landingPage' }],
      metrics: [{ name: 'sessions' }, { name: 'engagementRate' }, { name: 'averageSessionDuration' }, { name: 'keyEvents' }],
      dimensionFilter: filt,
      limit: 5000
    })).map((r) => ({ page: strip(r.dimensionValues[0].value), sessions: +r.metricValues[0].value, engagementRate: +r.metricValues[1].value, avgDuration: +r.metricValues[2].value, keyEvents: +r.metricValues[3].value }));

    const eventRows = (await ga4Query({
      dateRanges: [{ startDate: startA, endDate: endA }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }, { name: 'keyEvents' }],
      limit: 200
    })).map((r) => ({ event: r.dimensionValues[0].value, count: +r.metricValues[0].value, users: +r.metricValues[1].value, keyEvents: +r.metricValues[2].value }));

    snapshot.ga4 = {
      daily: await safe(() => ga4Query({
        dateRanges: [{ startDate: startA, endDate: endA }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }],
        dimensionFilter: filt
      }).then((rows) => rows.map((r) => ({ date: r.dimensionValues[0].value, sessions: +r.metricValues[0].value }))), []),
      channels: (await ga4Query({
        dateRanges: [{ startDate: startA, endDate: endA }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'engagementRate' }]
      })).map((r) => ({ channel: r.dimensionValues[0].value, sessions: +r.metricValues[0].value, users: +r.metricValues[1].value, engagementRate: +r.metricValues[2].value })),
      devices: (await ga4Query({
        dateRanges: [{ startDate: startA, endDate: endA }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }, { name: 'engagementRate' }, { name: 'averageSessionDuration' }],
        dimensionFilter: filt
      })).map((r) => ({ device: r.dimensionValues[0].value, sessions: +r.metricValues[0].value, engagementRate: +r.metricValues[1].value, avgDuration: +r.metricValues[2].value })),
      landingA: await landing(startA, endA),
      landingB: await landing(startB, endB),
      events: eventRows,
      keyEvents: eventRows.filter((e) => e.keyEvents > 0)
    };

    snapshot.ga4.searchNoResult = await safe(() => ga4Query({
      dateRanges: [{ startDate: startA, endDate: endA }],
      dimensions: [{ name: 'eventName' }, { name: 'customEvent:q' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'search_no_result' } } },
      limit: 50
    }).then((rows) => rows.map((r) => ({ q: r.dimensionValues[1].value, count: +r.metricValues[0].value }))), []);
  } else {
    console.warn('GA4_PROPERTY_ID absent — snapshot GA4 ignoré.');
  }

  const doIndexation = args.includes('--indexation') || period === 'month';
  let indexation = null;
  if (doIndexation && !args.includes('--no-indexation')) {
    try {
      const nCities = parseInt(getArg('index-cities', '20'), 10);
      const nDepts = parseInt(getArg('index-depts', '6'), 10);
      const { urls, nCities: nc, nDepts: nd } = sampleUrls({ nCities, nDepts, allDepts: args.includes('--all-depts') });
      console.log(`Indexation : inspection de ${urls.length} URLs (${nc} villes, ${nd} depts, ~7 s/URL)…`);
      const results = await inspectUrls(urls, (d, t, r) => {
        if (d % 10 === 0 || d === t) console.log(`  [${d}/${t}] ${r.url} -> ${r.error ? 'ERREUR' : r.verdict}`);
      }, 300000);
      indexation = { ...summarize(results), sample: { nCities: nc, nDepts: nd, total: urls.length }, results };
      fs.writeFileSync(path.join(outDir, 'indexation.json'), JSON.stringify(indexation, null, 2));
    } catch (e) {
      console.warn(`Indexation ignorée : ${e.message}`);
    }
  } else {
    const p = path.join(outDir, 'indexation.json');
    if (fs.existsSync(p)) {
      try { indexation = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { /* ignore */ }
    }
  }

  snapshot.indexation = indexation
    ? { indexationRate: indexation.indexationRate, valid: indexation.valid, pass: indexation.pass, sample: indexation.sample, byVerdict: indexation.byVerdict, byCoverage: indexation.byCoverage, notIndexed: indexation.notIndexed }
    : null;

  snapshot.actions = buildActions({
    segments: gsc.segments,
    opp: gsc.opportunities,
    dec: gsc.decliners,
    cannib: gsc.cannibalization,
    indexation: snapshot.indexation,
    sitemapsApi,
    sitemap,
    ga4: snapshot.ga4,
    byType: gsc.byTypeA
  });

  fs.writeFileSync(path.join(outDir, 'snapshot.json'), JSON.stringify(snapshot, null, 2));

  const pct = (x) => `${(x * 100).toFixed(2)} %`;
  const fmt = (n) => Number(n).toLocaleString('fr-FR');
  const lines = [];
  const H = (t) => lines.push(`\n## ${t}`);

  lines.push(`# Audit ${period === 'week' ? 'hebdomadaire' : 'mensuel'} — ${win.label}`);
  lines.push('');
  lines.push(`- Run : ${runDate}`);
  lines.push(`- Fenêtre A (courante) : ${startA} → ${endA}`);
  lines.push(`- Fenêtre B (précédente) : ${startB} → ${endB}`);
  lines.push(`- GSC : ${site} — GA4 : ${propertyId || 'n/a'}`);

  H('Plan d\'action priorisé');
  lines.push('| prio | thème | action | impact | effort |');
  lines.push('|---|---|---|---|---|');
  for (const a of snapshot.actions) lines.push(`| ${a.priority} | ${a.theme} | ${a.action} | ${a.impact} | ${a.effort} |`);

  H('Totaux GSC');
  lines.push(`- Clics : ${fmt(gsc.totalsB.clicks)} → ${fmt(gsc.totalsA.clicks)} (${(((gsc.totalsA.clicks - gsc.totalsB.clicks) / gsc.totalsB.clicks) * 100).toFixed(1)} %)`);
  lines.push(`- Impressions : ${fmt(gsc.totalsB.impressions)} → ${fmt(gsc.totalsA.impressions)}`);
  lines.push(`- CTR : ${pct(gsc.totalsB.ctr)} → ${pct(gsc.totalsA.ctr)}`);
  lines.push(`- Position moy. : ${gsc.totalsB.position.toFixed(1)} → ${gsc.totalsA.position.toFixed(1)}`);
  lines.push(`- Requêtes de marque (échantillon) : ${gsc.brandQueries.brandClicksB} → ${gsc.brandQueries.brandClicksA} clics`);

  if (gsc.byTypeA.length) {
    H('Par type de recherche (GSC)');
    lines.push('| type | clics B | clics A | imp A |');
    lines.push('|---|---|---|---|');
    const mb = new Map(gsc.byTypeB.map((r) => [r.type, r]));
    for (const r of gsc.byTypeA) {
      const b = mb.get(r.type);
      lines.push(`| ${r.type} | ${fmt(b ? b.clicks : 0)} | ${fmt(r.clicks)} | ${fmt(r.impressions)} |`);
    }
  }

  H('Segments (par type de page)');
  lines.push('| segment | clics B | clics A | Δ | imp A |');
  lines.push('|---|---|---|---|---|');
  for (const [k, v] of Object.entries(gsc.segments)) lines.push(`| ${k} | ${fmt(v.clicksB)} | ${fmt(v.clicksA)} | ${v.clicksB ? (((v.clicksA - v.clicksB) / v.clicksB) * 100).toFixed(1) : '—'} % | ${fmt(v.impressionsA)} |`);

  H('Opportunités CTR (pos 5-15, imp ≥ 200, CTR < 2 %) — triées par gain estimé');
  if (gsc.opportunities.length) {
    lines.push('| page | imp | CTR | CTR attendu | gain est. | pos |');
    lines.push('|---|---|---|---|---|---|');
    for (const o of gsc.opportunities) lines.push(`| ${o.page} | ${fmt(o.impressions)} | ${pct(o.ctr)} | ${pct(o.expectedCtr)} | +${Math.round(o.estClicksGain)} | ${o.position.toFixed(1)} |`);
  } else lines.push('_Aucune._');

  H('Cannibalisation (requêtes servies par ≥ 2 pages)');
  if (gsc.cannibalization.length) {
    for (const c of gsc.cannibalization) {
      lines.push(`- « ${c.query} » (${fmt(c.totalImpressions)} imp) : ${c.pages.map((p) => `${p.page} [${p.position.toFixed(1)}]`).join(' · ')}`);
    }
  } else lines.push('_Aucune détectée (échantillon visible)._');

  H('Déclins (clics B ≥ 5, > 15 %)');
  if (gsc.decliners.length) {
    lines.push('| page | clics B | clics A | Δ | imp A | pos A |');
    lines.push('|---|---|---|---|---|---|');
    for (const d of gsc.decliners) lines.push(`| ${d.page} | ${d.clicksB} | ${d.clicksA} | ${(d.delta * 100).toFixed(0)} % | ${fmt(d.impressionsA)} | ${d.position.toFixed(1)} |`);
  } else lines.push('_Aucun._');

  H('Indexation (GSC URL Inspection)');
  if (snapshot.indexation) {
    lines.push(`- Taux d'indexation (PASS) : ${pct(snapshot.indexation.indexationRate)} (${snapshot.indexation.pass}/${snapshot.indexation.valid}) — échantillon ${snapshot.indexation.sample.total} URLs`);
    lines.push('- Verdicts : ' + Object.entries(snapshot.indexation.byVerdict).map(([k, v]) => `${k} ${v}`).join(' · '));
    lines.push('- Couverture : ' + Object.entries(snapshot.indexation.byCoverage).map(([k, v]) => `${k} ${v}`).join(' · '));
  } else lines.push('_Non mesurée (mensuel uniquement, ou échec)._');

  H('Technique — sitemap');
  lines.push(`- Local : ${sitemap.files} fichiers, ${fmt(sitemap.urls)} URLs, ${sitemap.duplicates} doublon(s)`);
  lines.push('- lastmod par mois : ' + Object.entries(sitemap.lastmodByMonth).sort().map(([k, v]) => `${k} ${v}`).join(' · '));
  if (sitemapsApi) {
    const totalSubmitted = sitemapsApi.reduce((a, s) => a + (s.contents[0]?.submitted || 0), 0);
    const totalIndexed = sitemapsApi.reduce((a, s) => a + (s.contents[0]?.indexed || 0), 0);
    const errs = sitemapsApi.filter((s) => s.errors > 0).length;
    const warns = sitemapsApi.filter((s) => s.warnings > 0).length;
    const idxTxt = totalIndexed > 0 ? `, indexés ${fmt(totalIndexed)}` : ' (champ « indexés » non fourni par l\'API)';
    lines.push(`- GSC Sitemaps API : ${sitemapsApi.length} sitemap(s) — soumis ${fmt(totalSubmitted)}${idxTxt} | erreurs ${errs}, warnings ${warns}`);
  }

  H('Tendance (GSC clics par semaine ISO)');
  const wk = {};
  for (const r of gsc.daily) {
    const { isoYear, week } = isoWeekOf(new Date(`${r.keys[0]}T00:00:00Z`));
    const k = `${isoYear}-W${pad(week)}`;
    wk[k] = (wk[k] || 0) + r.clicks;
  }
  for (const [k, v] of Object.entries(wk).sort()) lines.push(`- ${k} : ${fmt(v)} clics`);
  if (snapshot.ga4 && snapshot.ga4.daily && snapshot.ga4.daily.length) {
    const gw = {};
    for (const r of snapshot.ga4.daily) {
      const { isoYear, week } = isoWeekOf(new Date(`${r.date.slice(0, 4)}-${r.date.slice(4, 6)}-${r.date.slice(6, 8)}T00:00:00Z`));
      const k = `${isoYear}-W${pad(week)}`;
      gw[k] = (gw[k] || 0) + r.sessions;
    }
    lines.push('- GA4 sessions organiques/semaine : ' + Object.entries(gw).sort().map(([k, v]) => `${k} ${fmt(v)}`).join(' · '));
  }

  if (snapshot.ga4) {
    H('GA4 — canaux (sessions)');
    for (const c of snapshot.ga4.channels) lines.push(`- ${c.channel} : ${fmt(c.sessions)} (engagement ${pct(c.engagementRate)})`);
    H('GA4 — appareils (search organique)');
    for (const d of snapshot.ga4.devices) lines.push(`- ${d.device} : ${fmt(d.sessions)} (engagement ${pct(d.engagementRate)})`);
    H('GA4 — top landing organiques');
    for (const l of snapshot.ga4.landingA.slice(0, 15)) lines.push(`- ${l.page} : ${fmt(l.sessions)} sessions (engagement ${pct(l.engagementRate)}, keyEvents ${l.keyEvents})`);
    H('GA4 — événements clés');
    if (snapshot.ga4.keyEvents.length) for (const e of snapshot.ga4.keyEvents) lines.push(`- ${e.event} : ${fmt(e.keyEvents)} (occurrences ${fmt(e.count)})`);
    else lines.push('_Aucun sur la période._');
    H('GA4 — top events');
    for (const e of snapshot.ga4.events.slice(0, 15)) lines.push(`- ${e.event} : ${fmt(e.count)}`);
    if (snapshot.ga4.searchNoResult && snapshot.ga4.searchNoResult.length) {
      H('GA4 — requêtes sans résultat (search_no_result)');
      for (const s of snapshot.ga4.searchNoResult.slice(0, 20)) lines.push(`- ${s.q} : ${fmt(s.count)}`);
    }
  }

  lines.push('');
  fs.writeFileSync(path.join(outDir, 'report.md'), lines.join('\n'));

  console.log(`Snapshot écrit : ${path.relative(path.join(__dirname, '..'), outDir)}/snapshot.json + report.md`);
  console.log(`Période ${period} — ${win.label} | Fenêtre A ${startA}→${endA} | B ${startB}→${endB}`);
  console.log(`Pages A ${gsc.pagesA.length} / B ${gsc.pagesB.length} | Requêtes A ${gsc.queriesA.length} / B ${gsc.queriesB.length}`);
  console.log(`Clics : ${fmt(gsc.totalsB.clicks)} → ${fmt(gsc.totalsA.clicks)} | Actions : ${snapshot.actions.length}`);
})();
