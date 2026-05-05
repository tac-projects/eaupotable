const XLSX = require('xlsx');

const priceFile = 'c:/Users/thoma/Documents/APP/eaupotable-net/source-data/sispea/tarifs_eau_potable_2024.xls';
const workbook = XLSX.readFile(priceFile);
const sheet = workbook.Sheets['Détail tarifaire'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const missingCities = [
  "Argis", "Briord", "Challes-La-Montagne", "Conand", "Haut Valromey", 
  "Labalme", "Les Neyrolles", "Saint-Alban", "Saint-Martin-Du-Frene", "Sault-Brenaz"
];

const found = [];
data.forEach(row => {
  if (row[0] === '001') {
    const name = (row[2] || '').toString().toLowerCase();
    const match = missingCities.find(mc => name.includes(mc.toLowerCase()));
    if (match) {
      found.push({
        city: row[2],
        type: row[3],
        status: row[8],
        priceM3: row[12],
        total120m3: row[15]
      });
    }
  }
});

console.log(JSON.stringify(found, null, 2));
