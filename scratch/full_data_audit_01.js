const fs = require('fs');

const data = JSON.parse(fs.readFileSync('c:/Users/thoma/Documents/APP/eaupotable-net/public/data/departments/01.json', 'utf8'));

const cities = data.cities;
const indicators = [
  'nitrates', 'ph', 'temperature', 'hardness', 'chlorine', 
  'pesticides', 'pfas', 'microbiology', 'conductivity', 
  'turbidity', 'iron', 'manganese', 'ammonium', 'copper', 'organic_carbon'
];

const report = [];

for (const slug in cities) {
  const city = cities[slug];
  const missing = [];

  // Core fields
  if (!city.prix || !city.prix.total) missing.push('prix_total');
  if (!city.crystal || !city.crystal.final) missing.push('crystal_score');
  if (city.isConform === null || city.isConform === undefined) missing.push('conformity');
  
  // Stats
  if (!city.stats) {
    missing.push('all_stats');
  } else {
    indicators.forEach(ind => {
      const val = city.stats[ind];
      if (!val || val.val === '--' || val.date === 'N/A' || val.val === null || val.val === undefined) {
        missing.push(ind);
      }
    });
  }

  // Meta fields
  if (!city.meta || !city.meta.insee) missing.push('insee_code');
  if (!city.meta || !city.meta.nom_distributeur) missing.push('distributor_name');

  if (missing.length > 0) {
    report.push({
      name: city.cityName,
      slug: slug,
      missingCount: missing.length,
      missingFields: missing
    });
  }
}

// Sort by number of missing fields descending
report.sort((a, b) => b.missingCount - a.missingCount);

console.log(JSON.stringify({
  totalCities: Object.keys(cities).length,
  citiesWithGaps: report.length,
  topGaps: report // All problematic cities
}, null, 2));
