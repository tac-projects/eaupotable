const fs = require('fs');
const path = require('path');

// Construit l'index des codes postaux pour la recherche par code postal.
// Jointure : city-index.json (slugs canoniques, homonymes suffixés `base-dept`)
// × departments/*.json (meta.insee) × communes-geo.json (codesPostaux,
// population, regionNom). Sortie : public/data/postal-index.json.
//   - codes    : code postal -> [ { s:slug, n:nom, p:population, d:dept, c:[codes] } ]
//                trié par population décroissante.
//   - codeDept : code postal -> département (repli « voir le département »).
//   - depts    : département -> { n: nom, r: région }.
// Fichier committé (comme communes-geo.json), régénéré par `npm run sitemap`.

function canonicalSlugFor(cityIndex, baseSlug, deptCode) {
  if (!cityIndex) return baseSlug;
  const deptOf = (val) => (typeof val === 'string' ? val : val && val.d);
  if (deptOf(cityIndex[baseSlug]) === deptCode) return baseSlug;
  const suffixed = `${baseSlug}-${deptCode}`;
  return cityIndex[suffixed] ? suffixed : baseSlug;
}

function buildPostalIndex() {
  const root = process.cwd();
  const deptDir = path.join(root, 'public', 'data', 'departments');
  const indexPath = path.join(root, 'public', 'city-index.json');
  const geoPath = path.join(root, 'public', 'data', 'communes-geo.json');

  const cityIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const geo = JSON.parse(fs.readFileSync(geoPath, 'utf8'));
  const files = fs.readdirSync(deptDir).filter(f => f.endsWith('.json')).sort();

  const codes = {};
  const codeDept = {};
  const depts = {};
  let totalCommunes = 0;
  let sansGeo = 0;

  for (const file of files) {
    const deptCode = file.replace('.json', '');
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(deptDir, file), 'utf8'));
    } catch (e) {
      console.error(`❌ Lecture ${file}:`, e.message);
      continue;
    }

    if (data.deptInfo) {
      depts[deptCode] = { n: data.deptInfo.name || deptCode, r: null };
    }

    for (const [baseSlug, city] of Object.entries(data.cities || {})) {
      totalCommunes++;
      const insee = city.meta && city.meta.insee;
      const g = insee ? geo[insee] : null;
      if (!g || !Array.isArray(g.codesPostaux) || g.codesPostaux.length === 0) { sansGeo++; continue; }
      if (depts[deptCode] && !depts[deptCode].r && g.regionNom) depts[deptCode].r = g.regionNom;

      const slug = canonicalSlugFor(cityIndex, baseSlug, deptCode);
      const entry = {
        s: slug,
        n: g.nom || city.cityName,
        p: g.population || 0,
        d: deptCode,
        c: g.codesPostaux,
      };
      for (const cp of g.codesPostaux) {
        (codes[cp] = codes[cp] || []).push(entry);
        if (!codeDept[cp]) codeDept[cp] = deptCode;
      }
    }
  }

  for (const cp of Object.keys(codes)) {
    codes[cp].sort((a, b) => b.p - a.p);
  }

  const output = {
    generatedAt: new Date().toISOString().split('T')[0],
    count: Object.keys(codes).length,
    codes,
    codeDept,
    depts,
  };

  const outPath = path.join(root, 'public', 'data', 'postal-index.json');
  fs.writeFileSync(outPath, JSON.stringify(output));
  console.log(`✨ Index postal : ${output.count} codes, ${totalCommunes} communes (${sansGeo} sans géo).`);
  console.log(`   Fichier généré : ${outPath}`);
}

buildPostalIndex();
