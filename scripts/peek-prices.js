const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'tarifs_AEP_2025.xls');

try {
    console.log(`🔍 Lecture du fichier : ${filePath}...`);
    const workbook = XLSX.readFile(filePath);
    console.log("📂 Feuilles disponibles :", workbook.SheetNames.join(', '));
    
    // On essaie la feuille qui contient "Données" ou la deuxième si la première est vide
    const sheetName = workbook.SheetNames.find(s => s.includes('Donn')) || workbook.SheetNames[1] || workbook.SheetNames[0];
    console.log(`🎯 Analyse de la feuille : ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    
    // On récupère toutes les lignes (pour la recherche d'en-tête on limitera si besoin)
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: '' });
    
    const headerRow = data[0] || [];
    console.log("\n📋 En-têtes (Ligne 0) :");
    headerRow.slice(0, 20).forEach((cell, i) => console.log(`[${i}] ${cell}`));

    const firstDataRow = data[1] || [];
    console.log("\n📋 Première ligne de données (Ligne 1) :");
    firstDataRow.slice(0, 20).forEach((cell, i) => console.log(`[${i}] ${cell}`));

    if (indicatorCol !== -1 && serviceIdCol !== -1) {
        console.log("\n💰 Données extraites (20 premiers services avec prix) :");
        let count = 0;
        for(let r=1; r<data.length; r++) {
            const row = data[r] || [];
            const price = row[indicatorCol];
            if (price && price !== '--' && price !== 'En attente de saisie') {
                console.log(`- Service ${row[serviceIdCol]} (${row[2] || '?'}) : ${price} €/m3`);
                count++;
            }
            if (count > 20) break;
        }
    }

} catch (error) {
    console.error("❌ Erreur lors de la lecture du fichier Excel :", error.message);
}
