const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};

const propertyId = process.env.GA4_PROPERTY_ID;
const keyFile = process.env.GA4_KEY_FILE
  || path.join(__dirname, '..', '.secrets', 'ga4-service-account.json');
const days = parseInt(getArg('days', '28'), 10);

if (!propertyId) {
  console.error('GA4_PROPERTY_ID manquant. Ex : GA4_PROPERTY_ID=532538500 npm run ga4:seo');
  process.exit(1);
}
if (!fs.existsSync(keyFile)) {
  console.error(`Clé de service introuvable : ${keyFile}`);
  process.exit(1);
}

const fmt = (n) => Number(n).toLocaleString('fr-FR');
const pct = (x) => `${(Number(x) * 100).toFixed(1)} %`;
const dur = (s) => `${Math.floor(Number(s) / 60)}m${String(Math.round(Number(s) % 60)).padStart(2, '0')}s`;

let httpClient;
async function client() {
  if (httpClient) return httpClient;
  const auth = new GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly']
  });
  httpClient = await auth.getClient();
  return httpClient;
}

async function runReport(body) {
  const c = await client();
  const { token } = await c.getAccessToken();
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        ...body
      })
    }
  );
  if (!res.ok) throw new Error(`GA4 ${res.status} : ${await res.text()}`);
  return res.json();
}

function table(rows, headers, mapper) {
  const cells = rows.map(mapper);
  const widths = headers.map((h, i) => Math.max(h.length, ...cells.map((r) => String(r[i]).length)));
  const line = (r) => r.map((c, i) => String(c).padEnd(widths[i])).join('  ');
  console.log(line(headers));
  console.log('-'.repeat(widths.reduce((s, w) => s + w + 2, 0)));
  for (const r of cells) console.log(line(r));
}

const dim = (r, i = 0) => r.dimensionValues[i].value;
const met = (r, i) => Number(r.metricValues[i].value);

(async () => {
  console.log(`GA4 — acquisition SEO, ${days} derniers jours (property ${propertyId})\n`);

  const channels = await runReport({
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'engagementRate' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
  });
  console.log('## Canaux d\'acquisition');
  table(channels.rows || [], ['canal', 'sessions', 'utilisateurs', 'engagement'],
    (r) => [dim(r), fmt(met(r, 0)), fmt(met(r, 1)), pct(met(r, 2))]);

  const organicFilter = {
    filter: {
      fieldName: 'sessionDefaultChannelGroup',
      stringFilter: { value: 'Organic Search' }
    }
  };

  const landing = await runReport({
    dimensions: [{ name: 'landingPage' }],
    metrics: [
      { name: 'sessions' },
      { name: 'engagementRate' },
      { name: 'averageSessionDuration' },
      { name: 'keyEvents' }
    ],
    dimensionFilter: organicFilter,
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 25
  });
  console.log('\n## Search organique — top 25 landing pages');
  table(landing.rows || [], ['landing page', 'sessions', 'engagement', 'durée', 'keyEvents'],
    (r) => [dim(r).replace('https://www.eaupotable.net', ''), fmt(met(r, 0)), pct(met(r, 1)), dur(met(r, 2)), fmt(met(r, 3))]);

  const devices = await runReport({
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'sessions' }, { name: 'engagementRate' }, { name: 'averageSessionDuration' }],
    dimensionFilter: organicFilter,
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
  });
  console.log('\n## Search organique — appareils');
  table(devices.rows || [], ['appareil', 'sessions', 'engagement', 'durée'],
    (r) => [dim(r), fmt(met(r, 0)), pct(met(r, 1)), dur(met(r, 2))]);

  const events = await runReport({
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 20
  });
  console.log('\n## Top 20 events (tous canaux)');
  table(events.rows || [], ['event', 'occurrences', 'utilisateurs'],
    (r) => [dim(r), fmt(met(r, 0)), fmt(met(r, 1))]);
})();
