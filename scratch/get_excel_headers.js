const XLSX = require('xlsx');

const compFile = 'c:/Users/thoma/Documents/APP/eaupotable-net/source-data/sispea/composition_villes_eau_potable_2024.xlsx';
const workbook = XLSX.readFile(compFile, { sheetRows: 1 });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log(JSON.stringify(data[0], null, 2));
