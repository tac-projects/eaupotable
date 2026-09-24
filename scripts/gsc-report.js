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
const days = parseInt(getArg('days', '28'), 10);
const end = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
const start = new Date(Date.now() - (days + 3) * 864e5).toISOString().slice(0, 10);

if (!fs.existsSync(keyFile)) {
  console.error(`Clé de service introuvable : ${keyFile}`);
  process.exit(1);
}

const fmt = (n) => Number(n).toLocaleString('fr-FR');
const pct = (x) => `${(x * 100).toFixed(2)} %`;

async function client() {
  const auth = new GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });
  return auth.getClient();
}

async function query(httpClient, body) {
  const { token } = await httpClient.getAccessToken();
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: start, endDate: end, ...body })
    }
  );
  if (!res.ok) throw new Error(`GSC ${res.status} : ${await res.text()}`);
  return res.json();
}

function table(rows, headers, mapper) {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(mapper(r)[i]).length)));
  const line = (cells) => cells.map((c, i) => String(c).padEnd(widths[i])).join('  ');
  console.log(line(headers));
  console.log('-'.repeat(widths.reduce((s, w) => s + w + 2, 0)));
  for (const r of rows) console.log(line(mapper(r)));
}

(async () => {
  const http = await client();
  console.log(`Search Console — ${site}`);
  console.log(`Période : ${start} → ${end} (${days} j)\n`);

  const daily = await query(http, { dimensions: ['date'] });
  let clicks = 0;
  let impressions = 0;
  for (const r of daily.rows || []) {
    clicks += r.clicks;
    impressions += r.impressions;
  }
  const avgCtr = impressions ? clicks / impressions : 0;
  const avgPos = daily.rows && daily.rows.length
    ? daily.rows.reduce((s, r) => s + r.position, 0) / daily.rows.length
    : 0;
  console.log('## Totaux');
  console.log(`Clics        : ${fmt(clicks)}`);
  console.log(`Impressions  : ${fmt(impressions)}`);
  console.log(`CTR moyen    : ${pct(avgCtr)}`);
  console.log(`Position moy.: ${avgPos.toFixed(1)}`);

  const devices = await query(http, { dimensions: ['device'] });
  console.log('\n## Appareils');
  table(devices.rows || [], ['appareil', 'clics', 'impressions', 'CTR', 'position'],
    (r) => [r.keys[0], fmt(r.clicks), fmt(r.impressions), pct(r.ctr), r.position.toFixed(1)]);

  const countries = await query(http, { dimensions: ['country'], rowLimit: 10 });
  console.log('\n## Pays (top 10)');
  table(countries.rows || [], ['pays', 'clics', 'impressions', 'CTR', 'position'],
    (r) => [r.keys[0], fmt(r.clicks), fmt(r.impressions), pct(r.ctr), r.position.toFixed(1)]);

  const queries = await query(http, { dimensions: ['query'], rowLimit: 25 });
  console.log('\n## Top 25 requêtes');
  table(queries.rows || [], ['requête', 'clics', 'impressions', 'CTR', 'position'],
    (r) => [r.keys[0], fmt(r.clicks), fmt(r.impressions), pct(r.ctr), r.position.toFixed(1)]);

  const pages = await query(http, { dimensions: ['page'], rowLimit: 25 });
  console.log('\n## Top 25 pages');
  table(pages.rows || [], ['page', 'clics', 'impressions', 'CTR', 'position'],
    (r) => [r.keys[0].replace('https://www.eaupotable.net', ''), fmt(r.clicks), fmt(r.impressions), pct(r.ctr), r.position.toFixed(1)]);

  const oppQuery = await query(http, { dimensions: ['query'], rowLimit: 25, dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'includingRegex', expression: 'eau' }] }] });
  const opportunities = (oppQuery.rows || [])
    .filter((r) => r.impressions >= 100 && r.position >= 4 && r.position <= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);
  console.log('\n## Opportunités requêtes (impressions ≥ 100, position 4–20)');
  table(opportunities, ['requête', 'impressions', 'clics', 'CTR', 'position'],
    (r) => [r.keys[0], fmt(r.impressions), fmt(r.clicks), pct(r.ctr), r.position.toFixed(1)]);

  const pageWins = (pages.rows || [])
    .filter((r) => r.impressions >= 300 && r.ctr < 0.02)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);
  console.log('\n## Quick wins pages (impressions ≥ 300, CTR < 2 %)');
  table(pageWins, ['page', 'impressions', 'clics', 'CTR', 'position'],
    (r) => [r.keys[0].replace('https://www.eaupotable.net', ''), fmt(r.impressions), fmt(r.clicks), pct(r.ctr), r.position.toFixed(1)]);
})();
