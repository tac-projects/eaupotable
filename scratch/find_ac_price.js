const XLSX = require('xlsx');

const acFile = 'c:/Users/thoma/Documents/APP/eaupotable-net/source-data/sispea/tarifs_assainissement_2024.xls';
const workbook = XLSX.readFile(acFile);
const sheet = workbook.Sheets['Détail tarifaire'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const target = "Abergement-de-Varey";
const results = data.filter(row => row && row.some(cell => cell && cell.toString().includes(target)));

console.log(JSON.stringify(results, null, 2));
