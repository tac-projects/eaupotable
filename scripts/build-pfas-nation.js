const fs = require('fs');
const path = require('path');

const TRACE_THRESHOLD = 0.01;
const ALERT_THRESHOLD = 0.05;
const LIMIT_THRESHOLD = 0.1;

function parsePfasVal(val) {
  if (val === undefined || val === null || val === '--') return NaN;
  const s = String(val).toLowerCase();
  if (s.includes('absence') || s.includes('non détecté')) return 0;
  const clean = s.replace(/[^0-9,.]/g, '').replace(',', '.').trim();
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? NaN : parsed;
}

async function buildPfasNation() {
  console.log('🚀 Agrégation nationale des données PFAS...');

  const deptDir = path.join(process.cwd(), 'public', 'data', 'departments');
  const files = fs.readdirSync(deptDir).filter(f => f.endsWith('.json'));

  let national = { tested: 0, traces: 0, alerts: 0, overLimit: 0, noData: 0 };
  const departments = [];
  const topCities = [];

  for (const file of files) {
    const filePath = path.join(deptDir, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`❌ Erreur lecture ${file}:`, err.message);
      continue;
    }

    const deptCode = data.deptInfo?.code || file.replace('.json', '');
    const deptName = data.deptInfo?.name || `Département ${deptCode}`;
    const cities = data.cities || {};

    let tested = 0, traces = 0, alerts = 0, overLimit = 0;
    let maxVal = 0;

    for (const [slug, city] of Object.entries(cities)) {
      const p = city.stats?.pfas;
      if (!p || p.val === undefined || p.val === null || p.val === '--') {
        national.noData++;
        continue;
      }
      tested++;
      const v = parsePfasVal(p.val);
      if (isNaN(v)) continue;
      if (v > LIMIT_THRESHOLD) overLimit++;
      if (v > ALERT_THRESHOLD) alerts++;
      if (v > TRACE_THRESHOLD) {
        traces++;
        if (v > maxVal) maxVal = v;
      }
      if (v > 0) {
        topCities.push({
          name: city.cityName,
          slug,
          dept: deptCode,
          val: String(p.val),
          unit: (p.unit || '').trim()
        });
      }
    }

    departments.push({ code: deptCode, name: deptName, tested, traces, alerts, overLimit, maxVal: maxVal ? String(maxVal).replace('.', ',') : '--' });
    national.tested += tested;
    national.traces += traces;
    national.alerts += alerts;
    national.overLimit += overLimit;
  }

  departments.sort((a, b) => b.alerts - a.alerts || b.traces - a.traces || a.code.localeCompare(b.code));

  topCities.sort((a, b) => parsePfasVal(b.val) - parsePfasVal(a.val));
  const top50 = topCities.slice(0, 50);

  const output = {
    generatedAt: new Date().toISOString().split('T')[0],
    national,
    departments,
    topCities: top50
  };

  const outputPath = path.join(process.cwd(), 'public', 'data', 'pfas-nation.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n✨ Terminé !`);
  console.log(`   Communes testées : ${national.tested}`);
  console.log(`   Traces (> 0,01 µg/L) : ${national.traces}`);
  console.log(`   Alertes (> 0,05 µg/L) : ${national.alerts}`);
  console.log(`   Dépassements (> 0,1 µg/L) : ${national.overLimit}`);
  console.log(`   Sans donnée : ${national.noData}`);
  console.log(`   Départements agrégés : ${departments.length}`);
  console.log(`   Fichier généré : ${outputPath}`);
}

buildPfasNation();
