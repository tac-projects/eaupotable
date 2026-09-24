const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const keyFile = process.env.GSC_KEY_FILE
  || process.env.GA4_KEY_FILE
  || path.join(__dirname, '..', '.secrets', 'ga4-service-account.json');
const site = process.env.GSC_SITE || 'sc-domain:eaupotable.net';
const domain = 'https://www.eaupotable.net';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function shuffle(arr, seed) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sampleUrls({ nCities = 150, nDepts = 20, allDepts = false } = {}) {
  const cityIndex = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'city-index.json'), 'utf8'));
  const slugs = Object.keys(cityIndex).filter((s) => !/^\d{5}$/.test(s));
  const depts = [...new Set(Object.values(cityIndex).filter((d) => /^(\d{2,3}|2[AB])$/.test(d)))];
  const sampleCities = shuffle(slugs, 42).slice(0, nCities);
  const sampleDepts = allDepts ? depts : shuffle(depts, 7).slice(0, nDepts);
  const urls = [
    ...sampleCities.map((s) => `${domain}/ville/${s}`),
    ...sampleDepts.map((d) => `${domain}/departement/${d}`),
    `${domain}/`,
    `${domain}/pfas-eau-potable`,
    `${domain}/villes`,
    `${domain}/eau-bebe`
  ];
  return { urls, nCities: sampleCities.length, nDepts: sampleDepts.length };
}

async function inspectUrls(urls, onProgress, maxMs) {
  const auth = new GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  const results = [];
  const started = Date.now();
  let done = 0;
  for (const url of urls) {
    if (maxMs && Date.now() - started > maxMs) break;
    let j = null;
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
          const ra = parseInt(res.headers.get('retry-after') || '0', 10);
          await sleep(ra > 0 ? ra * 1000 : 5000 * (attempt + 1));
          continue;
        }
        j = await res.json();
        break;
      } catch (e) {
        clearTimeout(timer);
        await sleep(1000 * (attempt + 1));
      }
    }
    done++;
    if (!j) {
      results.push({ url: url.replace(domain, ''), error: 'timeout/échec' });
    } else if (j.error) {
      results.push({ url: url.replace(domain, ''), error: `${j.error.status}: ${j.error.message}` });
    } else {
      const s = j.inspectionResult.indexStatusResult || {};
      results.push({
        url: url.replace(domain, ''),
        verdict: s.verdict,
        coverage: s.coverageState,
        robots: s.robotsTxtState,
        fetch: s.pageFetchState,
        userCanonical: s.userCanonical,
        googleCanonical: s.googleCanonical
      });
    }
    if (onProgress) onProgress(done, urls.length, results[results.length - 1]);
    await sleep(150);
  }
  return results;
}

function summarize(results) {
  const byCoverage = {};
  const byVerdict = {};
  const notIndexed = [];
  for (const r of results) {
    if (r.error) {
      const k = `ERREUR (${r.error.slice(0, 40)})`;
      byCoverage[k] = (byCoverage[k] || 0) + 1;
      continue;
    }
    byCoverage[r.coverage] = (byCoverage[r.coverage] || 0) + 1;
    byVerdict[r.verdict] = (byVerdict[r.verdict] || 0) + 1;
    if (r.verdict !== 'PASS') notIndexed.push(r);
  }
  const valid = results.filter((r) => !r.error).length;
  const pass = results.filter((r) => r.verdict === 'PASS').length;
  return { total: results.length, valid, pass, indexationRate: valid ? pass / valid : 0, byVerdict, byCoverage, notIndexed };
}

module.exports = { sampleUrls, inspectUrls, summarize };

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    const getArg = (n, d) => {
      const hit = args.find((a) => a.startsWith(`--${n}=`));
      return hit ? hit.split('=')[1] : d;
    };
    const { urls, nCities, nDepts } = sampleUrls({
      nCities: parseInt(getArg('n', '150'), 10),
      nDepts: parseInt(getArg('depts', '20'), 10),
      allDepts: args.includes('--all-depts')
    });
    console.log(`Inspection de ${urls.length} URLs (${nCities} villes, ${nDepts} depts, 4 statiques)…`);
    const results = await inspectUrls(urls, (d, t, r) => {
      if (r.error) console.log(`[${d}/${t}] ${r.url} -> ${r.error.slice(0, 40)}`);
      else console.log(`[${d}/${t}] ${r.url} -> ${r.verdict} | ${r.coverage}`);
    });
    const s = summarize(results);
    console.log(`\nTaux d'indexation (PASS) : ${(s.indexationRate * 100).toFixed(1)} % (${s.pass}/${s.valid})`);
    const out = getArg('out', path.join(__dirname, '..', '.secrets', 'gsc-inspection.json'));
    fs.writeFileSync(out, JSON.stringify({ summary: s, results }, null, 2));
    console.log(`Détail : ${out}`);
  })();
}
