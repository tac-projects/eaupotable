// Resoumet les sitemaps à Google Search Console (scope webmasters en écriture).
//
// Usage :
//   node scripts/gsc-submit.js                       (soumet le sitemap principal)
//   node scripts/gsc-submit.js --all                 (soumet l'index + tous les sous-sitemaps)
//   node scripts/gsc-submit.js --url=https://.../sitemap.xml
//
// Prérequis : service account avec accès GSC (siteFullUser) et scope webmasters.

const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const getArg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};

const keyFile = process.env.GSC_KEY_FILE
  || process.env.GA4_KEY_FILE
  || path.join(__dirname, '..', '.secrets', 'ga4-service-account.json');
const site = process.env.GSC_SITE || 'sc-domain:eaupotable.net';
const domain = 'https://www.eaupotable.net';

if (!fs.existsSync(keyFile)) {
  console.error(`Clé de service introuvable : ${keyFile}`);
  process.exit(1);
}

// Liste des sitemaps à soumettre : le principal + (option --all) les sous-sitemaps.
function collectSitemaps() {
  const explicit = getArg('url', null);
  if (explicit) return [explicit];

  const out = [`${domain}/sitemap.xml`];
  if (hasFlag('all')) {
    const dir = path.join(__dirname, '..', 'public', 'sitemaps');
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.xml')).sort()) {
        out.push(`${domain}/sitemaps/${f}`);
      }
    }
  }
  return out;
}

async function main() {
  const auth = new GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/webmasters'] });
  const httpClient = await auth.getClient();
  const { token } = await httpClient.getAccessToken();

  const sitemaps = collectSitemaps();
  console.log(`Soumission de ${sitemaps.length} sitemap(s) — propriété ${site}\n`);

  let ok = 0;
  let ko = 0;
  for (const sitemapUrl of sitemaps) {
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
      { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      ok++;
      console.log(`  OK   ${sitemapUrl}`);
    } else {
      ko++;
      const body = await res.text();
      console.log(`  ECHEC ${sitemapUrl} — HTTP ${res.status} ${body.slice(0, 160)}`);
    }
  }

  console.log(`\nTerminé : ${ok} soumis, ${ko} en échec.`);
  if (ko) process.exit(1);
}

main().catch((e) => {
  console.error('Erreur :', e.message);
  process.exit(1);
});
