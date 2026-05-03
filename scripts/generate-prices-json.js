const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const COMPOSITION_FILE = path.join(__dirname, '..', 'source-data', 'CompositionCommunaleServices_AEP_2025.xlsx');
const TARIFFS_FILE = path.join(__dirname, '..', 'source-data', 'tarifs_AEP_2024.xls');
const OUTPUT_FILE = path.join(__dirname, '..', 'source-data', 'prices.json');

async function run() {
    console.log("🚀 Démarrage de la fusion des prix...");

    // 1. Lire la Composition (Commune -> ServiceId)
    console.log("📖 Lecture du dictionnaire Communes <-> Services...");
    const wbComp = XLSX.readFile(COMPOSITION_FILE);
    const shComp = wbComp.Sheets[wbComp.SheetNames.find(s => s.includes('Donn')) || wbComp.SheetNames[0]];
    const compRows = XLSX.utils.sheet_to_json(shComp, { header: 1, range: 0, defval: '' });

    const inseeToService = {};
    for (let i = 1; i < compRows.length; i++) {
        const row = compRows[i];
        let insee = row[4]?.toString().trim();
        const serviceId = row[18]?.toString().trim();

        if (insee && serviceId) {
            // Padding INSEE à 5 caractères (ex: 1001 -> 01001)
            if (insee.length === 4) insee = '0' + insee;
            inseeToService[insee] = serviceId;
        }
    }
    console.log(`✅ Dictionnaire chargé : ${Object.keys(inseeToService).length} communes.`);

    // 2. Lire les Tarifs (ServiceId -> Price)
    console.log("📖 Lecture des tarifs SISPEA...");
    const wbTariff = XLSX.readFile(TARIFFS_FILE);
    const shTariff = wbTariff.Sheets[wbTariff.SheetNames.find(s => s.includes('Donn')) || wbTariff.SheetNames[1]];
    const tariffRows = XLSX.utils.sheet_to_json(shTariff, { header: 1, range: 0, defval: '' });

    const serviceToPrice = {};
    for (let i = 1; i < tariffRows.length; i++) {
        const row = tariffRows[i];
        const rawServiceId = row[4]?.toString().trim(); // ex: "ServiceId=182640"
        const price = row[12];
        
        if (rawServiceId && price && price !== '--' && price !== 'En attente de saisie') {
            const match = rawServiceId.match(/ServiceId=(\d+)/);
            const serviceId = match ? match[1] : rawServiceId;
            serviceToPrice[serviceId] = price;
        }
    }
    console.log(`✅ Tarifs chargés : ${Object.keys(serviceToPrice).length} services avec prix.`);

    // 3. Fusionner
    console.log("🔗 Jointure finale...");
    const finalPrices = {};
    let count = 0;
    
    for (const [insee, serviceId] of Object.entries(inseeToService)) {
        const price = serviceToPrice[serviceId];
        if (price) {
            finalPrices[insee] = price;
            count++;
        }
    }

    // 4. Sauvegarder
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalPrices, null, 2));
    console.log(`\n💎 SUCCÈS ! ${count} prix de l'eau ont été associés aux codes INSEE.`);
    console.log(`📂 Fichier généré : ${OUTPUT_FILE}`);
}

run().catch(err => console.error("❌ Erreur :", err));
