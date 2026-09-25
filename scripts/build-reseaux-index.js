const fs = require('fs');
const path = require('path');

// Agrège les 101 fichiers départementaux par UDI (unité de distribution, champ `reseau`)
// pour alimenter les pages /reseau/<udi>. Une même UDI peut couvrir plusieurs départements :
// l'agrégation est nationale. Le slug canonique des communes (homonymes suffixés `base-dept`)
// est résolu via public/city-index.json, comme le maillage des pages ville.

function canonicalSlugFor(cityIndex, baseSlug, deptCode) {
  if (!cityIndex) return baseSlug;
  if (cityIndex[baseSlug] === deptCode) return baseSlug;
  const suffixed = `${baseSlug}-${deptCode}`;
  return cityIndex[suffixed] ? suffixed : baseSlug;
}

function minDate(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return a < b ? a : b;
}

function maxDate(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return a > b ? a : b;
}

async function buildReseauxIndex() {
  console.log('🚀 Agrégation nationale des réseaux (UDI)...');

  const deptDir = path.join(process.cwd(), 'public', 'data', 'departments');
  const indexPath = path.join(process.cwd(), 'public', 'city-index.json');
  const files = fs.readdirSync(deptDir).filter(f => f.endsWith('.json'));

  const cityIndex = fs.existsSync(indexPath)
    ? JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    : null;

  const reseaux = new Map();
  let totalCommunes = 0;
  let sansReseau = 0;

  for (const file of files) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(deptDir, file), 'utf8'));
    } catch (err) {
      console.error(`❌ Erreur lecture ${file}:`, err.message);
      continue;
    }

    const deptCode = data.deptInfo?.code || file.replace('.json', '');

    for (const [baseSlug, city] of Object.entries(data.cities || {})) {
      totalCommunes++;
      const udi = city.reseau;
      if (!udi) { sansReseau++; continue; }

      const ri = city.reseauInfo || {};
      const slug = canonicalSlugFor(cityIndex, baseSlug, deptCode);

      let r = reseaux.get(udi);
      if (!r) {
        r = {
          udi,
          installation: null,
          maitreOuvrage: null,
          exploitant: null,
          reseauAmont: null,
          nbCommunesAnnonce: 0,
          nbAnalyses: 0,
          conformRate: null,
          premiereAnalyse: null,
          derniereAnalyse: null,
          departements: new Set(),
          communes: []
        };
        reseaux.set(udi, r);
      }

      if (!r.installation && ri.installation) r.installation = ri.installation;
      if (!r.maitreOuvrage && ri.maitreOuvrage) r.maitreOuvrage = ri.maitreOuvrage;
      if (!r.exploitant && ri.exploitant) r.exploitant = ri.exploitant;
      if (!r.reseauAmont && ri.reseauAmont) r.reseauAmont = ri.reseauAmont;

      if (typeof ri.nbCommunes === 'number') r.nbCommunesAnnonce = Math.max(r.nbCommunesAnnonce, ri.nbCommunes);
      if (typeof ri.nbAnalyses === 'number') r.nbAnalyses = Math.max(r.nbAnalyses, ri.nbAnalyses);
      if (typeof ri.conformRate === 'number') {
        r.conformRate = r.conformRate == null ? ri.conformRate : Math.min(r.conformRate, ri.conformRate);
      }
      r.premiereAnalyse = minDate(r.premiereAnalyse, ri.premiereAnalyse);
      r.derniereAnalyse = maxDate(r.derniereAnalyse, ri.derniereAnalyse);

      r.departements.add(deptCode);
      r.communes.push({ nom: city.cityName, slug, dept: deptCode });
    }
  }

  const output = {
    generatedAt: new Date().toISOString().split('T')[0],
    totalReseaux: reseaux.size,
    totalCommunes,
    sansReseau,
    reseaux: {}
  };

  for (const [udi, r] of reseaux) {
    r.departements = [...r.departements].sort();
    r.communes.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    output.reseaux[udi] = r;
  }

  const outputPath = path.join(process.cwd(), 'public', 'data', 'reseaux-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(output));

  const mono = [...reseaux.values()].filter(r => r.communes.length === 1).length;
  const multi = [...reseaux.values()].filter(r => r.communes.length > 1).length;
  console.log(`\n✨ Terminé !`);
  console.log(`   Communes : ${totalCommunes} (sans réseau : ${sansReseau})`);
  console.log(`   Réseaux (UDI) : ${reseaux.size} — mono-commune : ${mono}, multi-communes : ${multi}`);
  console.log(`   Fichier généré : ${outputPath}`);
}

buildReseauxIndex();
