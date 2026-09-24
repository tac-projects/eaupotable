const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

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

const strip = (u) => String(u).replace('https://www.eaupotable.net', '');
const gscRow = (r) => ({ keys: r.keys, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
const sumTotals = (rows) => {
  const t = rows.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 });
  const pos = rows.length ? rows.reduce((a, r) => a + r.position, 0) / rows.length : 0;
  return { clicks: t.clicks, impressions: t.impressions, ctr: t.impressions ? t.clicks / t.impressions : 0, position: pos };
};
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

(async () => {
  const outDir = path.join(__dirname, '..', 'audit', period === 'week' ? 'weekly' : 'monthly', win.label);
  fs.mkdirSync(outDir, { recursive: true });

  const http = await gscClient();
  const base = { rowLimit };

  const gsc = {
    daily: (await gscQuery(http, startA, endA, { dimensions: ['date'] })).map(gscRow),
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
    gsc
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

    snapshot.ga4 = {
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
      events: (await ga4Query({
        dateRanges: [{ startDate: startA, endDate: endA }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
        limit: 200
      })).map((r) => ({ event: r.dimensionValues[0].value, count: +r.metricValues[0].value, users: +r.metricValues[1].value }))
    };
  } else {
    console.warn('GA4_PROPERTY_ID absent — snapshot GA4 ignoré.');
  }

  fs.writeFileSync(path.join(outDir, 'snapshot.json'), JSON.stringify(snapshot, null, 2));

  const pct = (x) => `${(x * 100).toFixed(2)} %`;
  const fmt = (n) => Number(n).toLocaleString('fr-FR');
  const seg = snapshot.gsc.segments;
  const lines = [
    `# Audit ${period === 'week' ? 'hebdomadaire' : 'mensuel'} — ${win.label}`,
    '',
    `- Run : ${runDate}`,
    `- Fenêtre A (courante) : ${startA} → ${endA}`,
    `- Fenêtre B (précédente) : ${startB} → ${endB}`,
    `- GSC : ${site} — GA4 : ${propertyId || 'n/a'}`,
    '',
    '## Totaux GSC',
    `- Clics : ${fmt(gsc.totalsB.clicks)} → ${fmt(gsc.totalsA.clicks)} (${(((gsc.totalsA.clicks - gsc.totalsB.clicks) / gsc.totalsB.clicks) * 100).toFixed(1)} %)`,
    `- Impressions : ${fmt(gsc.totalsB.impressions)} → ${fmt(gsc.totalsA.impressions)}`,
    `- CTR : ${pct(gsc.totalsB.ctr)} → ${pct(gsc.totalsA.ctr)}`,
    `- Position moy. : ${gsc.totalsB.position.toFixed(1)} → ${gsc.totalsA.position.toFixed(1)}`,
    '',
    '## Segments (par type de page)',
    '| segment | clics B | clics A | Δ | imp A |',
    '|---|---|---|---|---|',
    ...Object.entries(seg).map(([k, v]) => `| ${k} | ${fmt(v.clicksB)} | ${fmt(v.clicksA)} | ${v.clicksB ? (((v.clicksA - v.clicksB) / v.clicksB) * 100).toFixed(1) : '—'} % | ${fmt(v.impressionsA)} |`),
    '',
    `- Requêtes de marque (échantillon) : ${gsc.brandQueries.brandClicksB} → ${gsc.brandQueries.brandClicksA} clics`,
    `- Pages A : ${gsc.pagesA.length} | Pages B : ${gsc.pagesB.length} | Requêtes A : ${gsc.queriesA.length}`,
    ''
  ];
  fs.writeFileSync(path.join(outDir, 'report.md'), lines.join('\n'));

  console.log(`Snapshot écrit : ${path.relative(path.join(__dirname, '..'), outDir)}/snapshot.json + report.md`);
  console.log(`Période ${period} — ${win.label} | Fenêtre A ${startA}→${endA} | B ${startB}→${endB}`);
  console.log(`Pages A ${gsc.pagesA.length} / B ${gsc.pagesB.length} | Requêtes A ${gsc.queriesA.length} / B ${gsc.queriesB.length}`);
  console.log(`Clics : ${fmt(gsc.totalsB.clicks)} → ${fmt(gsc.totalsA.clicks)}`);
})();
