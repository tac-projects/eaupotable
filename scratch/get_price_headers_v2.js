const XLSX = require('xlsx');

const priceFile = 'c:/Users/thoma/Documents/APP/eaupotable-net/source-data/sispea/tarifs_eau_potable_2024.xls';
const workbook = XLSX.readFile(priceFile, { sheetRows: 5 }); // Get a few rows
const sheet = workbook.Sheets['Détail tarifaire'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log(JSON.stringify(data.slice(0, 5), null, 2));
