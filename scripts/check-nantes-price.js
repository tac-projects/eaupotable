const XLSX = require('xlsx');
const path = require('path');

const TARIFFS_FILE = path.join(__dirname, '..', 'source-data', 'tarifs_AEP_2024.xls');

try {
    const workbook = XLSX.readFile(TARIFFS_FILE);
    const sheetName = workbook.SheetNames.find(s => s.includes('Donn')) || workbook.SheetNames[1];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    const servicePrice = data.find(row => row[4] === 'ServiceId=129083' || row[4] === 129083);
    console.log("💰 Tarifs pour Nantes (Service 129083) :", JSON.stringify(servicePrice, null, 2));

} catch (error) {
    console.error("❌ Erreur :", error.message);
}
