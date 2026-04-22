const fs = require('fs');
const path = require('path');

// Logic for department 44 harvesting - TRAWLER VERSION (Deep JS Filtering)
const DEPT_CODE = "44";

function parseValue(val) {
    if (val === undefined || val === null) return NaN;
    if (typeof val === 'number') return val;
    const s = val.toString().toLowerCase();
    if (s.includes('<')) return 0;
    if (s.includes('absence') || s.includes('non détecté')) return 0;
    const clean = s.replace(/[^0-9,.]/g, '').replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? NaN : parsed;
}

function calculateCrystalScore(s, isConform) {
    let score = 10.0;
    const isDetected = (p, threshold = 0) => {
        if (!p || !p.val || p.val === '--') return false;
        const valStr = p.val.toString().toLowerCase();
        if (valStr.includes('absence') || valStr.includes('non détecté')) return false;
        const numericVal = parseValue(p.val);
        return (numericVal > threshold);
    };

    if (!isConform) return { final: 2.1, label: "NON CONFORME", statusClass: "status-critical", explanation: "L'eau présente un défaut de conformité réglementaire." };

    if (s.microbiology && isDetected(s.microbiology)) score -= 10;
    if (s.nitrates && isDetected(s.nitrates, 10)) {
        const n = parseValue(s.nitrates.val);
        if (n > 50) score -= 8;
        else if (n > 40) score -= 3.0 + (n - 40) * 0.4;
        else if (n > 20) score -= 0.6 + (n - 20) * 0.15;
        else if (n > 10) score -= 0.2 + (n - 10) * 0.04;
    }
    if (s.pesticides && isDetected(s.pesticides, 0.05)) {
        const p = parseValue(s.pesticides.val);
        if (p > 0.1) score -= 6;
        else if (p > 0.05) score -= 2.5;
    }
    if (s.pfas && isDetected(s.pfas, 0.005)) {
        const p = parseValue(s.pfas.val);
        if (p > 0.1) score -= 4;
        else if (p > 0.01) score -= 1.0;
    }
    if (s.hardness) {
        const h = parseValue(s.hardness.val);
        if (h > 35) score -= 1.5; 
        else if (h > 25) score -= 0.8; 
    }
    if (s.chlorine) {
        const c = parseValue(s.chlorine.val);
        if (c > 0.5) score -= 1.2;
        else if (c > 0.1) score -= 0.6;
    }

    score = Math.max(0, Math.min(10, score));
    score = Math.round(score * 10) / 10;

    let label = "MOYENNE";
    let explanation = "";
    if (score >= 9.7) { label = "EXCEPTIONNELLE"; explanation = "Une pureté totale, digne des meilleures eaux de source."; }
    else if (score >= 9.2) { label = "EXCELLENTE"; explanation = "Qualité remarquable, quasiment aucun polluant détecté."; }
    else if (score >= 8.5) { label = "TRÈS BONNE"; explanation = "Très bonne qualité globale, malgré quelques paramètres mineurs."; }
    else if (score >= 7.0) { label = "SATISFAISANTE"; explanation = "Une eau saine qui respecte les équilibres fondamentaux."; }
    else if (score < 5.0) { label = "DÉGRADÉE"; explanation = "La qualité de l'eau est impactée par des paramètres critiques."; }
    else if (score < 7.0) { label = "MÉDIOCRE"; explanation = "Passable présentant des points de vigilance."; }

    let statusClass = "status-good";
    if (score >= 9.2) statusClass = "status-excellent";
    else if (score < 5.0) statusClass = "status-critical";
    else if (score < 7.0) statusClass = "status-warning";

    return { final: score, label, explanation, statusClass };
}

const config = {
    nitrates: { codes: [1340, 1342], keywords: ['nitrate'] },
    ph: { codes: [1301], keywords: ['potentiel hydrogene', 'ph'] },
    hardness: { codes: [1345, 2708, 1346], keywords: ['durete', 'th ', 'hydrotimetrique'] },
    chlorine: { codes: [1399, 1398, 1397], keywords: ['chlore'] },
    pesticides: { codes: [1107, 1667, 7150, 7144, 7151], keywords: ['pesticides totaux', 'pes.tot'] },
    pfas: { codes: [7149, 7148, 8194, 8847, 8215, 8216], keywords: ['pfas', 'perfluoro', 'substances perfluoroalkylees'] },
    microbiology: { codes: [1321, 1322, 1320, 1325, 1103, 1105], keywords: ['escherichia', 'enterocoques', 'micro-organismes'] },
    conductivity: { codes: [1303], keywords: ['conductivite'] },
    turbidity: { codes: [1305, 1306, 1706], keywords: ['turbidite'] },
    iron: { codes: [1393, 1374], keywords: ['fer total'] },
    manganese: { codes: [1394, 1373], keywords: ['manganese'] },
    ammonium: { codes: [1331, 1335], keywords: ['ammonium'] },
    copper: { codes: [1392, 1373, 1391], keywords: ['cuivre'] },
    cot: { codes: [1341, 1841], keywords: ['carbone organique total', 'cot'] }
};

async function harvestCity(cityName) {
    try {
        const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&code_departement=${DEPT_CODE}&size=1000&sort=date_prelevement,desc`;
        const res = await fetch(url);
        if (!res.ok) {
            console.log(`❌ API Error for ${cityName}: ${res.status}`);
            return null;
        }
        const data = await res.json();
        const reports = data.data || [];
        console.log(`📡 ${cityName}: ${reports.length} rapports trouvés.`);

        if (reports.length === 0) return null;


        const findParam = (key) => {
            const { codes, keywords } = config[key];
            const match = reports.find(r => {
                const c = parseInt(r.code_parametre);
                const label = (r.libelle_parametre || "").toLowerCase();
                const isCodeMatch = codes.includes(c);
                const isWordMatch = keywords.some(kw => label.includes(kw.toLowerCase()));
                
                if (isCodeMatch || isWordMatch) {
                    const rawVal = (r.resultat_alphanumerique && r.resultat_alphanumerique !== "null") ? r.resultat_alphanumerique : r.resultat_numerique;
                    return rawVal !== null && rawVal !== undefined;
                }
                return false;
            });

            if (!match) return { val: '--', unit: '', date: 'N/A' };

            const val = (match.resultat_alphanumerique && match.resultat_alphanumerique !== "null") ? match.resultat_alphanumerique : match.resultat_numerique;
            let valStr = `${val}`;

            if (key === 'microbiology') {
                if (valStr === '0' || valStr.toLowerCase().includes('absence')) valStr = 'Absence';
            }

            return {
                val: valStr,
                unit: (match.libelle_unite || '').replace(/\(.*\)/g, '').replace('unité ', '').trim() || '',
                date: new Date(match.date_prelevement).toLocaleDateString('fr-FR')
            };
        };

        const stats = {};
        for (const key of Object.keys(config)) {
            stats[key] = findParam(key);
        }

        const conclusion = reports[0].conclusion_conformite_prelevement || "";
        const isConform = conclusion.toLowerCase().includes("conforme") && !conclusion.toLowerCase().includes("non conforme");
        const crystal = calculateCrystalScore(stats, isConform);

        return {
            cityName,
            reseau: reports[0].nom_distributeur || reports[0].nom_reseau || cityName,
            isConform,
            crystal,
            stats,
            meta: {
                nom_distributeur: reports[0].nom_distributeur,
                code_departement: reports[0].code_departement,
                date_prelevement: reports[0].date_prelevement
            }
        };
    } catch (e) {
        console.error(`Error for ${cityName}:`, e.message);
        return null;
    }
}

async function main() {
    console.log(`🚀 Moissonnage CHALUTIER pour le département ${DEPT_CODE} (20 premières villes)...`);
    
    const geoRes = await fetch(`https://geo.api.gouv.fr/departements/${DEPT_CODE}/communes`);
    const communes = await geoRes.json();
    
    const output = {
        deptInfo: {
            code: DEPT_CODE,
            name: "Loire-Atlantique",
            avgScore: 0, conformRate: 0,
            averages: { nitrates: 12.4, ph: 7.4, pesticides: 0.02, chlorine: 0.1, hardness: 22, pfas: 0.01, turbidity: 0.2, conductivity: 450, microbiology: "Absence" },
            topCities: []
        },
        cities: {}
    };

    const limit = 20; 
    const targetCities = communes.sort((a, b) => b.population - a.population).slice(0, limit);

    let totalScore = 0;
    let conformCount = 0;
    let citiesCount = 0;

    for (let i = 0; i < targetCities.length; i++) {
        const c = targetCities[i];
        const data = await harvestCity(c.nom);
        if (data) {
            const slug = c.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');
            output.cities[slug] = data;
            totalScore += data.crystal.final;
            if (data.isConform) conformCount++;
            citiesCount++;
            output.deptInfo.topCities.push({ name: data.cityName, score: data.crystal.final, slug: slug });
        }
        // Small delay to be polite
        await new Promise(r => setTimeout(r, 200));
    }

    if (citiesCount > 0) {
        output.deptInfo.avgScore = Math.round((totalScore / citiesCount) * 10) / 10;
        output.deptInfo.conformRate = Math.round((conformCount / citiesCount) * 100);
        output.deptInfo.topCities.sort((a, b) => b.score - a.score);
    }

    const dataPath = path.join(__dirname, '..', 'data', 'departments', '44.json');
    fs.writeFileSync(dataPath, JSON.stringify(output, null, 2));
    console.log(`\n✅ Moissonnage CHALUTIER terminé ! (${citiesCount} villes enregistrées)`);
}

main();
