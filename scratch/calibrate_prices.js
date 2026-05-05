const XLSX = require('xlsx');

const priceFile = 'c:/Users/thoma/Documents/APP/eaupotable-net/source-data/sispea/tarifs_eau_potable_2024.xls';
const workbook = XLSX.readFile(priceFile);
const sheet = workbook.Sheets['Détail tarifaire'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const target = "Abergement-Clemenciat";
const results = data.filter(row => row[2] && row[2].toString().includes(target) && row[0] === '001');

console.log(JSON.stringify(results, null, 2));
