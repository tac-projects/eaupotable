// Script de calcul des scores pour les 8 métropoles
function parseValue(val) {
    if (val === null || val === undefined) return NaN;
    if (typeof val === 'number') return val;
    const clean = val.toString().replace(/[^0-9,.]/g, '').replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? (typeof val === 'string' && val.toLowerCase().includes('absence') ? 0 : NaN) : parsed;
}

const isDetected = (p, threshold = 0) => {
    if (!p || !p.val || p.val === '--') return false;
    const valStr = p.val.toString().toLowerCase();
    if (valStr.includes('absence') || valStr.includes('non détecté')) return false;
    const numericVal = parseValue(p.val);
    return (numericVal > threshold);
};

function calculateCrystalScore(s, isConform = true) {
    let score = 10.0;
    if (s.bacteria && isDetected(s.bacteria)) score -= 10;
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
        else if (p > 0) score -= (p * 25);
    }
    if (s.pfas && isDetected(s.pfas, 0.01)) {
        const p = parseValue(s.pfas.val);
        if (p > 0.1) score -= 4;
        else if (p > 0.01) score -= 1.0;
    }
    if (s.hardness) {
        const h = parseValue(s.hardness.val);
        if (h > 35) score -= 1.5; 
        else if (h > 25) score -= 0.8; 
        else if (h < 8) score -= 0.5;  
    }
    if (s.chlorine) {
        const c = parseValue(s.chlorine.val);
        if (c > 0.5) score -= 1.2;
        else if (c > 0.1) score -= 0.6;
    }
    const others = [
        { val: s.iron, limit: 200, penalty: 0.5 },
        { val: s.manganese, limit: 50, penalty: 0.5 },
        { val: s.lead, limit: 10, penalty: 2.0 },
        { val: s.aluminium, limit: 200, penalty: 0.5 },
        { val: s.turbidity, limit: 1.0, penalty: 0.5 },
        { val: s.ph, limit: 9.0, penalty: 0.5, lowLimit: 6.5 }
    ];
    others.forEach(o => {
        if (!o.val) return;
        const n = parseValue(o.val.val);
        if (isNaN(n) || n === 0) return;
        if (n > o.limit || (o.lowLimit !== undefined && n < o.lowLimit)) score -= o.penalty;
    });
    score = Math.max(0, Math.min(10, score));
    return Math.round(score * 10) / 10;
}

const CITIES = ["Paris", "Lyon", "Marseille", "Nantes", "Lille", "Montpellier", "Bordeaux", "Toulouse"];

const PARAMS = {
    nitrates: "1340",
    pesticides: "1107,1667,6272,6273,6274,6275,6276,6277,6278,6279,6280,7150",
    pfas: "7149,7148,8194,5980,6542,8738,6561,8740,6549,6025,8742",
    bacteria: "1321,1322",
    hardness: "1345",
    chlorine: "1342",
    ph: "1301",
    turbidity: "1305"
};

async function audit() {
    for (let city of CITIES) {
        let stats = {};
        for (let [key, codes] of Object.entries(PARAMS)) {
            const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(city)}&code_parametre=${codes}&size=1&sort=desc`;
            try {
                const res = await fetch(url);
                const json = await res.json();
                if (json.data && json.data.length > 0) {
                    const m = json.data[0];
                    stats[key] = { val: m.resultat_alphanumerique || m.resultat_numerique };
                }
            } catch(e) {}
        }
        const score = calculateCrystalScore(stats);
        console.log(`${city}: ${score.toFixed(1)}`);
    }
}

audit();
