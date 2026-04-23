const fs = require('fs');
const path = require('path');

const METROPOLIS_LIST = [
  { name: "Paris", dpt: "75", slug: "paris" },
  { name: "Marseille", dpt: "13", slug: "marseille" },
  { name: "Lyon", dpt: "69", slug: "lyon" },
  { name: "Toulouse", dpt: "31", slug: "toulouse" },
  { name: "Nice", dpt: "06", slug: "nice" },
  { name: "Nantes", dpt: "44", slug: "nantes" },
  { name: "Montpellier", dpt: "34", slug: "montpellier" },
  { name: "Strasbourg", dpt: "67", slug: "strasbourg" },
  { name: "Bordeaux", dpt: "33", slug: "bordeaux" },
  { name: "Lille", dpt: "59", slug: "lille" }
];

async function syncMetropolisScores() {
  console.log("🚀 Synchronisation des scores des métropoles...");
  
  const results = [];

  for (const city of METROPOLIS_LIST) {
    const filePath = path.join(process.cwd(), 'public', 'data', 'departments', `${city.dpt}.json`);
    
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        // On cherche le score dans deptInfo.topCities (déjà calculé)
        const cityData = data.deptInfo && data.deptInfo.topCities ? data.deptInfo.topCities.find(c => c.slug === city.slug) : null;

        
        if (cityData) {
          results.push({
            ...city,
            score: cityData.score.toString()
          });
          console.log(`✅ ${city.name} : ${cityData.score}/10`);
        } else {
          console.warn(`⚠️ Ville non trouvée dans topCities pour ${city.name}`);
          results.push({ ...city, score: "0" });
        }
      } catch (err) {
        console.error(`❌ Erreur lecture ${city.name}:`, err.message);
        results.push({ ...city, score: "0" });
      }
    } else {
      console.warn(`⚠️ Fichier manquant pour le département ${city.dpt} (${city.name})`);
      results.push({ ...city, score: "0" });
    }
  }

  const outputPath = path.join(process.cwd(), 'public', 'data', 'metropolis.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✨ Terminé ! Fichier généré : ${outputPath}`);
}

syncMetropolisScores();
