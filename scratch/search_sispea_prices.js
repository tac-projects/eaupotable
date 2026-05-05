const XLSX = require('xlsx');

const priceFile = 'c:/Users/thoma/Documents/APP/eaupotable-net/source-data/sispea/tarifs_eau_potable_2024.xls';
const workbook = XLSX.readFile(priceFile);
const sheet = workbook.Sheets['Détail tarifaire'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const missingCities = [
  "Argis", "Briord", "Challes-La-Montagne", "Conand", "Haut Valromey", 
  "Labalme", "Les Neyrolles", "Saint-Alban", "Saint-Martin-Du-Frene", "Sault-Brenaz"
];

const results = data.filter(row => {
  const cityName = row[2] || ''; // Based on the Conand find, city name seems to be at index 2
  return missingCities.some(mc => cityName.toLowerCase().includes(mc.toLowerCase()));
});

console.log(JSON.stringify(results, null, 2));
