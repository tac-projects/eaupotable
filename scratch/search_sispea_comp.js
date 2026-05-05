const XLSX = require('xlsx');
const path = require('path');

const compFile = 'c:/Users/thoma/Documents/APP/eaupotable-net/source-data/sispea/composition_villes_eau_potable_2024.xlsx';
const workbook = XLSX.readFile(compFile);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

const missingCities = [
  "Argis", "Briord", "Challes-La-Montagne", "Conand", "Haut Valromey", 
  "Labalme", "Les Neyrolles", "Saint-Alban", "Saint-Martin-Du-Frene", "Sault-Brenaz"
];

const results = data.filter(row => {
  const cityName = row['Nom de la commune'] || row['Commune'] || '';
  return missingCities.some(mc => cityName.toLowerCase().includes(mc.toLowerCase()));
});

console.log(JSON.stringify(results, null, 2));
