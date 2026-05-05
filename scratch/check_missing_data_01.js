const fs = require('fs');

const data = JSON.parse(fs.readFileSync('c:/Users/thoma/Documents/APP/eaupotable-net/public/data/departments/01.json', 'utf8'));

const cities = data.cities;
const missingDataCities = [];

for (const slug in cities) {
  const city = cities[slug];
  const missing = [];

  if (!city.prix || city.prix.total === null || city.prix.total === undefined || city.prix.total === 0) {
    missing.push('Prix manquant ou à 0');
  }

  if (!city.crystal || city.crystal.final === null || city.crystal.final === undefined || city.crystal.final === 0) {
    missing.push('Score Crystal manquant ou à 0');
  }

  // PFAS is often missing in older data, let's see if that's what the user means
  if (city.stats && city.stats.pfas && (city.stats.pfas.val === '--' || city.stats.pfas.date === 'N/A' || city.stats.pfas.val === '0')) {
    missing.push('Données PFAS manquantes ou non détectées (0/--)');
  }

  if (missing.length > 0) {
    missingDataCities.push({
      name: city.cityName,
      slug: slug,
      missing: missing
    });
  }
}

console.log(JSON.stringify(missingDataCities, null, 2));
