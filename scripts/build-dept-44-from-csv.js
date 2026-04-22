const fs = require('fs');
const path = require('path');
const readline = require('readline');

// SISE-EAUX SUPREME ARCHIVIST (Multi-Network aware for Large Cities)
const DEPT_CODE = "044";
const YEARS = ["2026", "2025", "2024", "2023", "2022"];
const DIRS = YEARS.map(y => path.join(__dirname, '..', 'data', 'archives', y));

const config = {
    nitrates: { codes: ["1340", "1342"] },
    ph: { codes: ["1302"] },
    temperature: { codes: ["1301"] },
    hardness: { codes: ["1345"] },
    chlorine: { codes: ["1398", "1399"] },
    pesticides: { codes: ["1107", "1667", "7150"] },
    pfas: { codes: ["7149", "8847"] },
    microbiology: { codes: ["1321", "1322", "1449", "1447", "1042"] },
    conductivity: { codes: ["1303"] },
    turbidity: { codes: ["1305", "1706"] },
    iron: { codes: ["1393", "1391"] },
    manganese: { codes: ["1394"] },
    ammonium: { codes: ["1331"] },
    copper: { codes: ["1392"] }
};

function splitCsv(line) {
    const result = [];
    let current = ''; let inQuotes = false;
    for (let char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else current += char;
    }
    result.push(current.trim());
    return result;
}

function parseValue(val) {
    if (!val) return NaN;
    const s = val.toString().toLowerCase();
    if (s.includes('<') || s.includes('absence')) return 0;
    const clean = s.replace(/[^0-9,.]/g, '').replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? NaN : parsed;
}

function calculateCrystalScore(s, isConform) {
    let score = 10.0;
    if (!isConform) return { final: 3.5, label: "NON CONFORME", statusClass: "status-critical", explanation: "L'eau ne respecte pas les limites de qualité ARS." };
    
    const nv = (k) => s[k] ? parseValue(s[k].val) : NaN;
    
    const microRaw = s.microbiology ? s.microbiology.val.toLowerCase() : "";
    const isMicroAbsence = microRaw.includes("absence") || microRaw.includes("<") || microRaw === "0" || microRaw === "--";
    if (microRaw && !isMicroAbsence) {
        score -= 5.0;
    }

    // 2. Polluants (PFAS / Pesticides)
    const pfas = nv('pfas');
    if (!isNaN(pfas) && pfas > 0) score -= (pfas > 0.1 ? 4 : 1.5);
    
    const pest = nv('pesticides');
    if (!isNaN(pest) && pest > 0) score -= (pest > 0.1 ? 4 : 1.5);

    // 3. Nitrates (Pureté)
    const nit = nv('nitrates');
    if (!isNaN(nit)) {
        if (nit > 15) score -= 1.0;
        if (nit > 25) score -= 1.0;
        if (nit > 40) score -= 2.0;
    }

    // 4. Chlore (Additifs chimiques)
    const chlo = nv('chlorine');
    if (!isNaN(chlo)) {
        if (chlo > 0.1) score -= 0.5;
        if (chlo > 0.4) score -= 0.5;
    }

    // 5. Calcaire
    const dur = nv('hardness');
    if (!isNaN(dur) && dur > 25) score -= 0.5;

    score = Math.max(1, Math.min(10, score));
    score = Math.round(score * 10) / 10;
    
    return { 
        final: score, 
        label: score >= 9.0 ? "EXCELLENTE" : (score >= 7.5 ? "SATISFAISANTE" : "MÉDIOCRE"), 
        explanation: "Indice de Pureté EauPotable.net basé sur 12 paramètres sanitaires.", 
        statusClass: score >= 9.0 ? "status-excellent" : (score >= 7.5 ? "status-good" : "status-warning") 
    };
}

async function processCSV() {
    console.log("🏺 Lancement de l'ARCHIVISTE SUPRÊME (Multi-Network Edition)...");

    const udiMap = {}; const udiHistory = {}; const resultsByRef = {}; 

    // 1. Charger UDI_COM : On mappe par CODE INSEE et on capture TOUS les réseaux
    const rlUdi = readline.createInterface({ input: fs.createReadStream(path.join(DIRS[0], 'DIS_COM_UDI_2026.txt')) });
    for await (const line of rlUdi) {
        const p = splitCsv(line);
        if (!p[1] || p[1] === 'nomcommune') continue;
        const key = p[1].toUpperCase().trim(), cd = p[3];
        if (!udiMap[key]) udiMap[key] = [];
        if (!udiMap[key].includes(cd)) udiMap[key].push(cd);
    }

    // 2. PLV : On indexe par réseau ET on construit l'arborescence de parenté
    const parentTree = {}; // cdreseau -> cdreseauamont
    for (let i = 0; i < YEARS.length; i++) {
        const f = path.join(DIRS[i], `DIS_PLV_${YEARS[i]}_${DEPT_CODE}.txt`);
        if (!fs.existsSync(f)) continue;
        const rl = readline.createInterface({ input: fs.createReadStream(f) });
        for await (const line of rl) {
            const p = splitCsv(line); if (p[1] === 'cdreseau' || !p[1]) continue;
            const cd = p[1], amont = p[4], ref = p[7], date = p[8], conclusion = p[10];
            
            if (amont && amont.trim() && amont !== cd) {
                parentTree[cd] = amont.trim();
            }

            if (!udiHistory[cd]) udiHistory[cd] = [];
            udiHistory[cd].push({ ref, date, conclusion });
        }
    }
    Object.keys(udiHistory).forEach(cd => udiHistory[cd].sort((a,b) => new Date(b.date) - new Date(a.date)));

    // 3. Charger RESULT
    for (let i = 0; i < YEARS.length; i++) {
        const f = path.join(DIRS[i], `DIS_RESULT_${YEARS[i]}_${DEPT_CODE}.txt`);
        if (!fs.existsSync(f)) continue;
        const rl = readline.createInterface({ input: fs.createReadStream(f) });
        for await (const line of rl) {
            const p = splitCsv(line);
            const ref = p[1], paramId = p[3], val = p[9], unit = p[10];
            if (!resultsByRef[ref]) resultsByRef[ref] = {};
            resultsByRef[ref][paramId] = { val, unit };
        }
    }

    // 4. Assemblage final
    const output = {
        deptInfo: { code: "44", name: "Loire-Atlantique", avgScore: 0, conformRate: 0, averages: {}, topCities: [] },
        cities: {}
    };

    for (const cityName of Object.keys(udiMap)) {
        const udis = udiMap[cityName];
        const stats = {}; Object.keys(config).forEach(k => stats[k] = { val: '--', unit: '', date: 'N/A' });
        let isConform = true, lastDate = "N/A";

        // Fonction de recherche récursive dans la hiérarchie
        const findParamInHierarchy = (udisList) => {
            let visited = new Set();
            let queue = [...udisList];
            
            while (queue.length > 0) {
                const currentUdi = queue.shift();
                if (visited.has(currentUdi)) continue;
                visited.add(currentUdi);

                const history = udiHistory[currentUdi] || [];
                // On scanne l'historique du réseau actuel
                for (const entry of history.slice(0, 50)) {
                    const refRes = resultsByRef[entry.ref] || {};
                    for (const [key, pConf] of Object.entries(config)) {
                        if (stats[key].val !== '--') continue; // Déjà trouvé plus récent/local
                        for (const code of pConf.codes) {
                            if (refRes[code]) {
                                let v = refRes[code].val;
                                if (key === 'microbiology' && (v === '0' || v.toLowerCase().includes('absence'))) v = "Absence";
                                let unit = refRes[code].unit.replace('mg(Cl2)/L', 'mg/L').replace('unité pH', 'pH');
                                stats[key] = { val: v, unit: " " + unit, date: new Date(entry.date).toLocaleDateString('fr-FR') };
                                if (lastDate === "N/A") { lastDate = entry.date; isConform = entry.conclusion.toLowerCase().includes("conforme") && !entry.conclusion.toLowerCase().includes("non conforme"); }
                                break;
                            }
                        }
                    }
                }

                // Si on a encore des manques, on ajoute le parent à la file
                if (parentTree[currentUdi]) {
                    queue.push(parentTree[currentUdi]);
                }
                
                // Si on a tout rempli, on peut s'arrêter tôt
                if (Object.values(stats).every(s => s.val !== '--')) break;
            }
        };

        findParamInHierarchy(udis);
        const crystal = calculateCrystalScore(stats, isConform);
        const slug = cityName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-$/, '');
        output.cities[slug] = {
            cityName: cityName.split('-').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join('-'),
            reseau: udis[0], isConform, crystal, stats,
            meta: { nom_distributeur: "ARS (SISE-Eaux)", code_departement: "44", date_prelevement: lastDate }
        };
    }

    const all = Object.values(output.cities);
    
    // CALCUL DES MOYENNES DÉPARTEMENTALES
    const avgData = {};
    Object.keys(config).forEach(indicator => {
        const values = all.map(c => parseValue(c.stats[indicator].val)).filter(v => !isNaN(v));
        if (values.length > 0) {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            if (indicator === 'microbiology') avgData[indicator] = { val: "Absence", unit: "" };
            else {
                let formatted = mean.toFixed(2).replace('.', ',');
                if (mean > 10) formatted = Math.round(mean).toString();
                else if (mean < 0.1) {
                    if (mean <= 0.01) formatted = "< 0,01";
                    else formatted = mean.toFixed(3).replace('.', ',');
                }
                
                let unit = all.find(c => c.stats[indicator].unit)?.stats[indicator].unit || "";
                // Nettoyage unité
                unit = unit.replace('mg(Cl2)/L', 'mg/L').replace('unité pH', 'pH');
                avgData[indicator] = { val: formatted, unit: " " + unit };
            }
        } else avgData[indicator] = { val: "--", unit: "" };
    });

    output.deptInfo.avgScore = Math.round((all.reduce((a,b) => a + b.crystal.final, 0) / all.length) * 10) / 10;
    output.deptInfo.conformRate = Math.round((all.filter(c => c.isConform).length / all.length) * 100);
    output.deptInfo.averages = avgData;
    output.deptInfo.topCities = all.map(c => ({ name: c.cityName, score: c.crystal.final, slug: c.cityName.toLowerCase().replace(/[^a-z0-9]/g, '-') })).sort((a,b) => b.score - a.score).slice(0, 50);

    fs.writeFileSync(path.join(__dirname, '..', 'data', 'departments', '44.json'), JSON.stringify(output, null, 2));
    console.log(`\n🏆 ARCHIVISTE SUPRÊME : Mission terminée. Les grandes villes sont désormais synchronisées avec leurs réseaux amont.`);
}

processCSV().catch(console.error);
