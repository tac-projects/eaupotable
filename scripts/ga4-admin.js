const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const KEY_EVENTS = [
  'pwa_install_click',
  'bebe_check',
  'contact_submit',
  'share',
  'search_no_result'
];

const CUSTOM_DIMENSIONS = [
  { parameterName: 'q', displayName: 'Recherche sans resultat' },
  { parameterName: 'outcome', displayName: 'Issue' },
  { parameterName: 'hasPrompt', displayName: 'Prompt PWA disponible' }
];

const propertyId = process.env.GA4_PROPERTY_ID;
const keyFile = process.env.GA4_KEY_FILE
  || path.join(__dirname, '..', '.secrets', 'ga4-service-account.json');
const dryRun = process.argv.includes('--dry-run');

if (!propertyId) {
  console.error('GA4_PROPERTY_ID manquant. Ex : GA4_PROPERTY_ID=532538500 npm run ga4:admin');
  process.exit(1);
}
if (!fs.existsSync(keyFile)) {
  console.error(`Clé de service introuvable : ${keyFile}`);
  process.exit(1);
}

const BASE = `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}`;

let httpClient;
async function client() {
  if (httpClient) return httpClient;
  const auth = new GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/analytics.edit']
  });
  httpClient = await auth.getClient();
  return httpClient;
}

async function call(method, url, body) {
  const c = await client();
  const { token } = await c.getAccessToken();
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status} : ${text}`);
  return json;
}

async function listAll(url, key) {
  const out = [];
  let pageToken = '';
  do {
    const sep = url.includes('?') ? '&' : '?';
    const json = await call('GET', `${url}${sep}pageSize=200${pageToken ? `&pageToken=${pageToken}` : ''}`);
    out.push(...(json[key] || []));
    pageToken = json.nextPageToken || '';
  } while (pageToken);
  return out;
}

(async () => {
  console.log(`GA4 Admin — property ${propertyId}${dryRun ? ' (DRY-RUN)' : ''}\n`);

  const existingKeyEvents = await listAll(`${BASE}/keyEvents`, 'keyEvents');
  const existingNames = new Set(existingKeyEvents.map((k) => k.eventName));
  console.log(`## Événements clés (${existingNames.size} existant(s))`);
  for (const name of KEY_EVENTS) {
    if (existingNames.has(name)) {
      console.log(`  = ${name} (déjà présent)`);
      continue;
    }
    if (dryRun) {
      console.log(`  + ${name} (à créer)`);
      continue;
    }
    await call('POST', `${BASE}/keyEvents`, { eventName: name });
    console.log(`  + ${name} créé`);
  }

  const existingDims = await listAll(`${BASE}/customDimensions`, 'customDimensions');
  const existingParams = new Set(existingDims.map((d) => d.parameterName));
  console.log(`\n## Dimensions personnalisées (${existingParams.size} existante(s))`);
  for (const dim of CUSTOM_DIMENSIONS) {
    if (existingParams.has(dim.parameterName)) {
      console.log(`  = ${dim.parameterName} (déjà présente)`);
      continue;
    }
    if (dryRun) {
      console.log(`  + ${dim.parameterName} (à créer)`);
      continue;
    }
    await call('POST', `${BASE}/customDimensions`, {
      parameterName: dim.parameterName,
      displayName: dim.displayName,
      scope: 'EVENT'
    });
    console.log(`  + ${dim.parameterName} créée`);
  }

  console.log('\nTerminé.');
})();
