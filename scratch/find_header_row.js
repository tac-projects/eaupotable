const XLSX = require('xlsx');

const priceFile = 'c:/Users/thoma/Documents/APP/eaupotable-net/source-data/sispea/tarifs_eau_potable_2024.xls';
const workbook = XLSX.readFile(priceFile);
const sheet = workbook.Sheets['Détail tarifaire'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

for (let i = 0; i < 15; i++) {
  console.log(`Row ${i}:`, JSON.stringify(data[i]));
}
