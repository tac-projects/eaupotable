const XLSX = require('xlsx');
const path = require('path');

const COMPOSITION_FILE = path.join(__dirname, '..', 'source-data', 'CompositionCommunaleServices_AEP_2025.xlsx');

try {
    const workbook = XLSX.readFile(COMPOSITION_FILE);
    const sheetName = workbook.SheetNames.find(s => s.includes('Donn')) || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    const nantes = data.find(row => row[2] === 'Nantes' || row[4] === 44109 || row[4] === '44109');
    console.log("📍 Nantes dans la Composition :", JSON.stringify(nantes, null, 2));

} catch (error) {
    console.error("❌ Erreur :", error.message);
}
