const XLSX = require('xlsx');

const priceFile = 'c:/Users/thoma/Documents/APP/eaupotable-net/source-data/sispea/tarifs_eau_potable_2024.xls';
const workbook = XLSX.readFile(priceFile);
const sheet = workbook.Sheets['Détail tarifaire'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const target = "Abergement";
const results = data.filter(row => row && row.some(cell => cell && cell.toString().includes(target)));

console.log(JSON.stringify(results.slice(0, 5), null, 2));
