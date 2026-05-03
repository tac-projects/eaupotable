const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'CompositionCommunaleServices_AEP_2025.xlsx');

try {
    console.log(`🔍 Diagnostic : ${filePath}...`);
    const workbook = XLSX.readFile(filePath);
    console.log("📂 Feuilles :", workbook.SheetNames.join(', '));
    const sheetName = workbook.SheetNames.find(s => s.includes('Donn')) || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: '' }).slice(0, 10);
    
    console.log("\n📋 En-têtes détectés :");
    data[0].forEach((cell, i) => console.log(`[${i}] ${cell}`));

    console.log("\n📋 Exemple ligne 1 :");
    data[1].forEach((cell, i) => console.log(`[${i}] ${cell}`));

} catch (error) {
    console.error("❌ Erreur :", error.message);
}
