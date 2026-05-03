const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data', 'departments');
const PRICES_PATH = path.join(__dirname, '..', 'source-data', 'prices.json');
const COMP_AEP = path.join(__dirname, '..', 'source-data', 'sispea', 'composition_villes_eau_potable_2024.xlsx');

function normalize(str) {
    if (!str) return "";
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlever accents
        .replace(/[^a-z0-9]/g, ""); // Enlever tout sauf lettres/chiffres
}

async function runAll() {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && !f.startsWith('0') && f.length <= 8); // On évite les 044.json et longs fichiers
    console.log(`🌍 Préparation de l'injection pour ${files.length} départements...`);
    
    // On pré-charge la table SISPEA une seule fois pour tout le monde (gain de temps énorme)
    const nameToInsee = await buildMappingTable();
    const prices = JSON.parse(fs.readFileSync(PRICES_PATH, 'utf8'));

    for (const file of files) {
        const deptCode = file.replace('.json', '');
        await runSingle(deptCode, nameToInsee, prices);
    }
}

async function buildMappingTable() {
    console.log("📖 Préparation de la table de correspondance SISPEA...");
    const wb = XLSX.readFile(COMP_AEP);
    const sh = wb.Sheets[wb.SheetNames.find(s => s.includes('Donn')) || wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sh, { header: 1 });
    
    const nameToInsee = {};
    for (let i = 1; i < rows.length; i++) {
        let insee = rows[i][4]?.toString().trim();
        const rawName = rows[i][2]?.toString().trim();
        if (insee && rawName) {
            if (insee.length === 4) insee = '0' + insee;
            const dCode = insee.substring(0, 2);
            const key = normalize(rawName) + "_" + dCode;
            nameToInsee[key] = insee;
        }
    }
    return nameToInsee;
}

async function runSingle(deptCode, nameToInsee, prices) {
    const filePath = path.join(DATA_DIR, `${deptCode}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let injectCount = 0;

    if (data.cities) {
        for (const slug in data.cities) {
            const city = data.cities[slug];
            const key = normalize(city.cityName) + "_" + deptCode;
            const insee = nameToInsee[key];

            if (insee && prices[insee]) {
                city.prix = prices[insee];
                if (!city.meta) city.meta = {};
                city.meta.insee = insee;
                injectCount++;
            }
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ ${deptCode} : ${injectCount} prix injectés.`);
}

const arg = process.argv[2] || "01";
if (arg === "--all") {
    runAll().catch(err => console.error(err));
} else {
    // Mode unitaire (pour le test déjà fait)
    buildMappingTable().then(map => {
        const prices = JSON.parse(fs.readFileSync(PRICES_PATH, 'utf8'));
        runSingle(arg, map, prices);
    });
}
