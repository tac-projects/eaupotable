// Inspecte une ou plusieurs URLs via l'API GSC URL Inspection.
// Affiche le verdict, l'état de couverture, la canonique Google et la dernière exploration.
//
// Usage :
//   node scripts/gsc-inspect.js https://www.eaupotable.net/departement/63/reseaux
//   node scripts/gsc-inspect.js /departement/63/reseaux /reseau/siaep-de-la-faye-063001922
//   (les chemins relatifs sont préfixés par le domaine)
//
// Prérequis : service account avec accès GSC (lecture suffit).

const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const keyFile = process.env.GSC_KEY_FILE
  || process.env.GA4_KEY_FILE
  || path.join(__dirname, '..', '.secrets', 'ga4-service-account.json');
const site = process.env.GSC_SITE || 'sc-domain:eaupotable.net';
const domain = 'https://www.eaupotable.net';

if (!fs.existsSync(keyFile)) {
  console.error(`Clé de service introuvable : ${keyFile}`);
  process.exit(1);
}

const rawUrls = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!rawUrls.length) {
  console.error('Usage : node scripts/gsc-inspect.js <url|chemin> [<url|chemin> ...]');
  process.exit(1);
}

const urls = rawUrls.map((u) => (/^https?:\/\//.test(u) ? u : `${domain}${u.startsWith('/') ? '' : '/'}${u}`));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function verdictLabel(v) {
  switch (v) {
    case 'PASS': return 'INDEXÉE';
    case 'PARTIAL': return 'PARTIELLE';
    case 'FAIL': return 'NON INDEXÉE';
    case 'NEUTRAL': return 'NEUTRE (non indexée)';
    default: return v || 'INCONNU';
  }
}

async function inspect(httpClient, url) {
  const { token } = await httpClient.getAccessToken();
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionUrl: url, siteUrl: site }),
        signal: ctrl.signal
      });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} : ${(await res.text()).slice(0, 200)}`);
      return res.json();
    } catch (e) {
      clearTimeout(timer);
      if (attempt === 2) throw e;
      await sleep(3000 * (attempt + 1));
    }
  }
  throw new Error('échec après 3 tentatives');
}

async function main() {
  const auth = new GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const httpClient = await auth.getClient();

  for (const url of urls) {
    console.log(`\n=== ${url} ===`);
    try {
      const json = await inspect(httpClient, url);
      const r = json.inspectionResult || {};
      const idx = r.indexStatusResult || {};
      const mob = r.mobileUsabilityResult || {};
      console.log(`Verdict          : ${verdictLabel(idx.verdict)}`);
      console.log(`Couverture       : ${idx.coverageState || '--'}`);
      console.log(`Robots           : ${idx.robotsTxtState || '--'}`);
      console.log(`Indexation autor. : ${idx.indexingState || '--'}`);
      console.log(`Canonique Google : ${idx.googleCanonical || '--'}`);
      console.log(`Déclarée (user)  : ${idx.userCanonical || '--'}`);
      console.log(`Dernier crawl    : ${idx.lastCrawlTime || '--'}`);
      if (mob.verdict) console.log(`Mobile           : ${mob.verdict}`);
    } catch (e) {
      console.log(`ERREUR : ${e.message}`);
    }
    // L'API est lente (~7 s/requête) : on espace les appels.
    await sleep(1500);
  }
}

main().catch((e) => {
  console.error('Erreur :', e.message);
  process.exit(1);
});
