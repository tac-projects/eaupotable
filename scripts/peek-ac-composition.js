const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'source-data', 'sispea', 'composition_villes_assainissement_2024.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames.find(s => s.includes('Donn')) || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: '' }).slice(0, 1);
    
    console.log("\n📋 Colonnes Assainissement :");
    data[0].forEach((cell, i) => console.log(`[${i}] ${cell}`));

} catch (error) {
    console.error("❌ Erreur :", error.message);
}
