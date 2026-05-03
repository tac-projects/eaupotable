const XLSX = require('xlsx');
const path = require('path');

const COMPOSITION_FILE = path.join(__dirname, '..', 'source-data', 'sispea', 'composition_villes_services_2025.xlsx');

try {
    const workbook = XLSX.readFile(COMPOSITION_FILE);
    const sheetName = workbook.SheetNames.find(s => s.includes('Donn')) || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: '' }).slice(0, 1);
    
    console.log("\n📋 Scan de TOUTES les colonnes (0-60) :");
    data[0].forEach((cell, i) => console.log(`[${i}] ${cell}`));

} catch (error) {
    console.error("❌ Erreur :", error.message);
}
