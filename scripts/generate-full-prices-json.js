const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'source-data', 'sispea');
const COMP_AEP = path.join(DIR, 'composition_villes_eau_potable_2024.xlsx');
const COMP_AC = path.join(DIR, 'composition_villes_assainissement_2024.xlsx');
const TAR_AEP = path.join(DIR, 'tarifs_eau_potable_2024.xls');
const TAR_AC = path.join(DIR, 'tarifs_assainissement_2024.xls');
const OUTPUT_FILE = path.join(__dirname, '..', 'source-data', 'prices.json');

async function run() {
    console.log("🚀 Démarrage de la fusion ULTIMATE (AEP + AC 2024)...");

    const inseeData = {}; // { insee: { aepId, acId, aepPrice, acPrice, total } }

    // 1. Charger Composition AEP
    console.log("📖 Lecture Composition AEP...");
    const wbCompAEP = XLSX.readFile(COMP_AEP);
    const shCompAEP = wbCompAEP.Sheets[wbCompAEP.SheetNames.find(s => s.includes('Donn')) || wbCompAEP.SheetNames[0]];
    const rowsCompAEP = XLSX.utils.sheet_to_json(shCompAEP, { header: 1, range: 0, defval: '' });
    for (let i = 1; i < rowsCompAEP.length; i++) {
        let insee = rowsCompAEP[i][4]?.toString().trim();
        const serviceId = rowsCompAEP[i][18]?.toString().trim();
        if (insee && serviceId) {
            if (insee.length === 4) insee = '0' + insee;
            if (!inseeData[insee]) inseeData[insee] = {};
            inseeData[insee].aepId = serviceId;
        }
    }

    // 2. Charger Composition AC
    console.log("📖 Lecture Composition AC...");
    const wbCompAC = XLSX.readFile(COMP_AC);
    const shCompAC = wbCompAC.Sheets[wbCompAC.SheetNames.find(s => s.includes('Donn')) || wbCompAC.SheetNames[0]];
    const rowsCompAC = XLSX.utils.sheet_to_json(shCompAC, { header: 1, range: 0, defval: '' });
    for (let i = 1; i < rowsCompAC.length; i++) {
        let insee = rowsCompAC[i][4]?.toString().trim();
        const serviceId = rowsCompAC[i][18]?.toString().trim();
        if (insee && serviceId) {
            if (insee.length === 4) insee = '0' + insee;
            if (!inseeData[insee]) inseeData[insee] = {};
            inseeData[insee].acId = serviceId;
        }
    }

    // 3. Charger Tarifs AEP
    console.log("📖 Lecture Tarifs AEP...");
    const serviceToPriceAEP = {};
    const wbTarAEP = XLSX.readFile(TAR_AEP);
    const shTarAEP = wbTarAEP.Sheets[wbTarAEP.SheetNames.find(s => s.includes('Donn')) || wbTarAEP.SheetNames[1]];
    const rowsTarAEP = XLSX.utils.sheet_to_json(shTarAEP, { header: 1, range: 0, defval: '' });
    for (let i = 1; i < rowsTarAEP.length; i++) {
        const rawId = rowsTarAEP[i][4]?.toString().trim();
        const price = rowsTarAEP[i][12];
        if (rawId && price && price !== '--' && price !== 'En attente de saisie') {
            const match = rawId.match(/ServiceId=(\d+)/);
            const id = match ? match[1] : rawId;
            serviceToPriceAEP[id] = parseFloat(price);
        }
    }

    // 4. Charger Tarifs AC
    console.log("📖 Lecture Tarifs AC...");
    const serviceToPriceAC = {};
    const wbTarAC = XLSX.readFile(TAR_AC);
    const shTarAC = wbTarAC.Sheets[wbTarAC.SheetNames.find(s => s.includes('Donn')) || wbTarAC.SheetNames[1]];
    const rowsTarAC = XLSX.utils.sheet_to_json(shTarAC, { header: 1, range: 0, defval: '' });
    for (let i = 1; i < rowsTarAC.length; i++) {
        const rawId = rowsTarAC[i][4]?.toString().trim();
        const price = rowsTarAC[i][12];
        if (rawId && price && price !== '--' && price !== 'En attente de saisie') {
            const match = rawId.match(/ServiceId=(\d+)/);
            const id = match ? match[1] : rawId;
            serviceToPriceAC[id] = parseFloat(price);
        }
    }

    // 5. Fusionner tout
    console.log("🔗 Calcul des prix par ville...");
    const finalPrices = {};
    let count = 0;
    for (const insee in inseeData) {
        const d = inseeData[insee];
        const aep = serviceToPriceAEP[d.aepId] || 0;
        const ac = serviceToPriceAC[d.acId] || 0;
        
        if (aep > 0 || ac > 0) {
            const total = parseFloat((aep + ac).toFixed(2));
            finalPrices[insee] = {
                aep: aep > 0 ? aep : null,
                ac: ac > 0 ? ac : null,
                total: total
            };
            count++;
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalPrices, null, 2));
    console.log(`\n💎 MISSION ACCOMPLIE !`);
    console.log(`✅ ${count} villes ont maintenant un prix (Eau, Assainissement ou Total).`);
    console.log(`📂 Données sauvegardées dans : ${OUTPUT_FILE}`);
    
    // Petit check pour Nantes
    if (finalPrices['44109']) {
        console.log("📍 Check Nantes (44109) :", finalPrices['44109']);
    }
}

run().catch(err => console.error("❌ Erreur :", err));
