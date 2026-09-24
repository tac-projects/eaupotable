const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const PWA_EVENTS = [
  'pwa_install_click',
  'pwa_install_prompt',
  'pwa_install_dismiss',
  'pwa_installed',
  'standalone_view'
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};

const propertyId = process.env.GA4_PROPERTY_ID;
const keyFile = process.env.GA4_KEY_FILE
  || path.join(__dirname, '..', '.secrets', 'ga4-service-account.json');
const days = parseInt(getArg('days', '28'), 10);
const byOutcome = args.includes('--by-outcome');

if (!propertyId) {
  console.error('GA4_PROPERTY_ID manquant. Ex : GA4_PROPERTY_ID=123456789 node scripts/ga4-report.js');
  process.exit(1);
}
if (!fs.existsSync(keyFile)) {
  console.error(`Clé de service introuvable : ${keyFile}`);
  process.exit(1);
}

async function runReport(body) {
  const auth = new GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly']
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 ${res.status} : ${text}`);
  }
  return res.json();
}

function printTable(report, extraDim) {
  const dims = ['eventName', ...(extraDim ? [extraDim] : [])];
  const rows = (report.rows || []).map((r) => {
    const values = r.dimensionValues.map((d) => d.value);
    const count = Number(r.metricValues[0].value);
    const users = Number(r.metricValues[1].value);
    return { values, count, users };
  });

  const pad = (s, n) => String(s).padEnd(n);
  const header = [...dims.map((d) => pad(d, 20)), pad('eventCount', 12), pad('users', 10)].join(' ');
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const row of rows) {
    console.log([
      ...row.values.map((v) => pad(v || '(non défini)', 20)),
      pad(row.count, 12),
      pad(row.users, 10)
    ].join(' '));
  }

  const totalClicks = rows
    .filter((r) => r.values[0] === 'pwa_install_click')
    .reduce((s, r) => s + r.count, 0);
  console.log(`\nTotal clics sur « Installer » (pwa_install_click) : ${totalClicks}`);
}

(async () => {
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];
  const dimensionFilter = {
    filter: { fieldName: 'eventName', inListFilter: { values: PWA_EVENTS } }
  };
  const metrics = [{ name: 'eventCount' }, { name: 'totalUsers' }];

  console.log(`GA4 — events PWA, ${days} derniers jours (property ${propertyId})\n`);

  try {
    const report = await runReport({
      dateRanges,
      dimensions: [{ name: 'eventName' }],
      metrics,
      dimensionFilter,
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }]
    });
    printTable(report, null);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  if (byOutcome) {
    console.log('\nDétail par outcome (dimension custom « outcome ») :\n');
    try {
      const report = await runReport({
        dateRanges,
        dimensions: [{ name: 'eventName' }, { name: 'customEvent:outcome' }],
        metrics,
        dimensionFilter,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }]
      });
      printTable(report, 'outcome');
    } catch (err) {
      console.error(err.message);
      console.error(
        '\nIndice : la dimension « outcome » doit être enregistrée dans GA4 '
        + '(Admin → Définitions personnalisées → dimension personnalisée de portée événement, '
        + 'paramètre « outcome ») puis attendre ~24 h avant de pouvoir la requêter.'
      );
    }
  }
})();
