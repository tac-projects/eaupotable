const XLSX = require('xlsx');
const path = require('path');

const AC_FILE = path.join(__dirname, '..', 'source-data', 'sispea', 'tarifs_assainissement_2024.xls');

try {
    const workbook = XLSX.readFile(AC_FILE);
    const sheetName = workbook.SheetNames.find(s => s.includes('Donn')) || workbook.SheetNames[1];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    const nantesAC = data.find(row => row[2]?.toString().includes('Nantes Métropole'));
    console.log("🌊 Assainissement Nantes :", JSON.stringify(nantesAC, null, 2));

} catch (error) {
    console.error("❌ Erreur :", error.message);
}
