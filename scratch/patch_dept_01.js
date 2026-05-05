const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/thoma/Documents/APP/eaupotable-net/public/data/departments/01.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Dictionnaire des patchs INSEE et Prix
const patches = {
  "argis": { insee: "01017", prix: { aep: 1.05, ac: 0, total: 1.05 } },
  "briord": { insee: "01064", prix: null },
  "challes-la-montagne": { insee: "01077", prix: null },
  "conand": { insee: "01111", prix: { aep: 1.05, ac: 0, total: 1.05 } },
  "haut-valromey": { insee: "01187", prix: { aep: 2, ac: 1.78, total: 3.78 } },
  "labalme": { insee: "01200", prix: null },
  "les-neyrolles": { insee: "01274", prix: { aep: 0, ac: 4.17, total: 4.17 } },
  "saint-alban": { insee: "01331", prix: null },
  "saint-martin-du-frene": { insee: "01373", prix: null },
  "sault-brenaz": { insee: "01396", prix: null }
};

let fixedCount = 0;

for (const slug in patches) {
  if (data.cities[slug]) {
    const patch = patches[slug];
    
    // Correction INSEE
    if (!data.cities[slug].meta.insee || data.cities[slug].meta.insee === "") {
        data.cities[slug].meta.insee = patch.insee;
    }
    
    // Correction Prix
    if (patch.prix && (!data.cities[slug].prix || data.cities[slug].prix.total === 0)) {
        data.cities[slug].prix = patch.prix;
    }
    
    fixedCount++;
  }
}

// 2. RECALCUL DES MOYENNES DU DÉPARTEMENT
const allCities = Object.values(data.cities);

// Taux de conformité
const conformCount = allCities.filter(c => c.isConform).length;
data.deptInfo.conformRate = Math.round((conformCount / allCities.length) * 100);

// Score Crystal moyen
const totalScore = allCities.reduce((acc, c) => acc + (c.crystal?.final || 0), 0);
data.deptInfo.avgScore = Math.round((totalScore / allCities.length) * 10) / 10;

// Sauvegarde
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

console.log(`✅ Réparation terminée pour le département 01.`);
console.log(`- Villes patchées (INSEE/Prix) : ${fixedCount}`);
console.log(`- Nouveau taux de conformité : ${data.deptInfo.conformRate}%`);
console.log(`- Nouveau Score Crystal moyen : ${data.deptInfo.avgScore}/10`);
