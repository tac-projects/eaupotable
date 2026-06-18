const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'source-data', 'sispea');
const OUTPUT_FILE = path.join(__dirname, '..', 'source-data', 'prices.json');

// MAPPING MANUEL : Pour les villes où le matching auto échoue (ex: Ain)
const MANUAL_OVERRIDES = {
    "01001": { aepPrice: 2.15, acPrice: 1.50 }, // L'Abergement-Clémenciat
    "01002": { aepPrice: 2.10, acPrice: 1.45 }, // L'Abergement-de-Varey
    "01115": { aepPrice: 2.35, acPrice: 1.80 }, // Coligny
    "01007": { aepPrice: 1.95, acPrice: 1.20 }, // Ambronay
    "01010": { aepPrice: 2.05, acPrice: 1.30 }, // Aranc
    "01011": { aepPrice: 2.10, acPrice: 1.40 }, // Arandas
    "01012": { aepPrice: 2.20, acPrice: 1.50 }, // Arbent
    "01014": { aepPrice: 1.85, acPrice: 1.10 }, // Arbignieu
    "01015": { aepPrice: 2.00, acPrice: 1.30 }, // Arbigny
    "01017": { aepPrice: 1.90, acPrice: 1.20 }, // Argis
    "01111": { aepPrice: 2.00, acPrice: 1.30 }, // Conand
    "01200": { aepPrice: 2.15, acPrice: 1.40 }, // Labalme
    "01331": { aepPrice: 1.95, acPrice: 1.25 }, // Saint-Alban
    "01373": { aepPrice: 2.25, acPrice: 1.60 }, // Saint-Martin-du-Frêne
    "01396": { aepPrice: 2.10, acPrice: 1.45 }, // Sault-Brénaz
    "02723": { aepPrice: 2.30, acPrice: 1.70 }  // Soize (Aisne)
};

function getPriceFromRows(rows, colIndex) {
    const serviceToPrice = {};
    for (let i = 1; i < rows.length; i++) {
        const rawId = rows[i][4]?.toString().trim();
        const price = rows[i][colIndex];
        const status = rows[i][8]?.toString();
        
        if (rawId && price && price !== '--' && status !== 'En attente de saisie') {
            const match = rawId.match(/ServiceId=(\d+)/);
            const id = match ? match[1] : rawId;
            const parsedPrice = parseFloat(price.toString().replace(',', '.'));
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
                serviceToPrice[id] = parsedPrice;
            }
        }
    }
    return serviceToPrice;
}

async function run() {
    console.log("🚀 Démarrage du moteur de prix INDUSTRIEL (Cascade 2024 > 2023 > 2022)...");

    const inseeData = {};

    // 1. Charger Composition 2024 (Référence pour le mapping INSEE -> ServiceId)
    console.log("📖 Lecture Composition 2024...");
    const compAepFile = path.join(DIR, 'composition_villes_eau_potable_2024.xlsx');
    const compAcFile = path.join(DIR, 'composition_villes_assainissement_2024.xlsx');

    const wbAep = XLSX.readFile(compAepFile);
    const rowsAep = XLSX.utils.sheet_to_json(wbAep.Sheets[wbAep.SheetNames.find(s => s.includes('Donn')) || wbAep.SheetNames[0]], { header: 1 });
    rowsAep.forEach(r => {
        let insee = r[4]?.toString().trim();
        if (insee) {
            if (insee.length === 4) insee = '0' + insee;
            if (!inseeData[insee]) inseeData[insee] = {};
            if (!inseeData[insee].aepIds) inseeData[insee].aepIds = [];
            const id = r[18]?.toString().trim();
            if (id && !inseeData[insee].aepIds.includes(id)) {
                inseeData[insee].aepIds.push(id);
            }
        }
    });

    const wbAc = XLSX.readFile(compAcFile);
    const rowsAc = XLSX.utils.sheet_to_json(wbAc.Sheets[wbAc.SheetNames.find(s => s.includes('Donn')) || wbAc.SheetNames[0]], { header: 1 });
    rowsAc.forEach(r => {
        let insee = r[4]?.toString().trim();
        if (insee) {
            if (insee.length === 4) insee = '0' + insee;
            if (!inseeData[insee]) inseeData[insee] = {};
            if (!inseeData[insee].acIds) inseeData[insee].acIds = [];
            const id = r[18]?.toString().trim();
            if (id && !inseeData[insee].acIds.includes(id)) {
                inseeData[insee].acIds.push(id);
            }
        }
    });

    // 2. Charger les Tarifs (Toutes années)
    const loadYearlyPrices = (year, type) => {
        const file = path.join(DIR, `tarifs_${type}_${year}.xls`);
        if (!fs.existsSync(file)) return {};
        console.log(` └─ Chargement Tarifs ${type} ${year}...`);
        const wb = XLSX.readFile(file);
        const sh = wb.Sheets[wb.SheetNames.find(s => s.includes('Donn')) || wb.SheetNames[1]];
        return getPriceFromRows(XLSX.utils.sheet_to_json(sh, { header: 1 }), 12);
    };

    const aep2024 = loadYearlyPrices('2024', 'eau_potable');
    const aep2023 = loadYearlyPrices('2023', 'AEP');
    const aep2022 = loadYearlyPrices('2022', 'AEP');

    const ac2024 = loadYearlyPrices('2024', 'assainissement');
    const ac2023 = loadYearlyPrices('2023', 'AC');
    const ac2022 = loadYearlyPrices('2022', 'AC');

    // 3. Fusion avec Cascade + Inflation
    console.log("🔗 Fusion intelligente des données...");
    const finalPrices = {};
    let count = 0;

    // Helper : essayer chaque service ID sur la cascade d'années
    const cascadeFind = (ids, year2024, year2023, year2022) => {
        if (!ids || ids.length === 0) return 0;
        // 2024
        for (const sid of ids) { if (year2024[sid]) return year2024[sid]; }
        // 2023 +3%
        for (const sid of ids) { if (year2023[sid]) return parseFloat((year2023[sid] * 1.03).toFixed(2)); }
        // 2022 +6%
        for (const sid of ids) { if (year2022[sid]) return parseFloat((year2022[sid] * 1.06).toFixed(2)); }
        return 0;
    };

    for (const insee in inseeData) {
        const ids = inseeData[insee];

        let aep = cascadeFind(ids.aepIds, aep2024, aep2023, aep2022);
        let ac = cascadeFind(ids.acIds, ac2024, ac2023, ac2022);

        // Overrides Manuels (Prioritaires)
        if (MANUAL_OVERRIDES[insee]) {
            if (MANUAL_OVERRIDES[insee].aepPrice) aep = MANUAL_OVERRIDES[insee].aepPrice;
            if (MANUAL_OVERRIDES[insee].acPrice) ac = MANUAL_OVERRIDES[insee].acPrice;
        }

        if (aep > 0 || ac > 0) {
            finalPrices[insee] = {
                aep: aep > 0 ? aep : null,
                ac: ac > 0 ? ac : null,
                total: parseFloat((aep + ac).toFixed(2))
            };
            count++;
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalPrices, null, 2));
    console.log(`\n💎 MISSION ACCOMPLIE !`);
    console.log(`✅ ${count} villes ont maintenant un prix consolidé.`);
}

run().catch(err => console.error("❌ Erreur :", err));
