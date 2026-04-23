export const POPULAR_CITIES = [
  { name: "Paris", slug: "paris" },
  { name: "Lyon", slug: "lyon" },
  { name: "Marseille", slug: "marseille" },
  { name: "Toulouse", slug: "toulouse" },
  { name: "Nice", slug: "nice" },
  { name: "Nantes", slug: "nantes" },
  { name: "Montpellier", slug: "montpellier" },
  { name: "Strasbourg", slug: "strasbourg" },
  { name: "Bordeaux", slug: "bordeaux" },
  { name: "Lille", slug: "lille" },
  { name: "Rennes", slug: "rennes" }
];

export const METROPOLIS_SCORES = [
  { name: "Paris", score: "5.5", dpt: "75", slug: "paris" },
  { name: "Marseille", score: "10", dpt: "13", slug: "marseille" },
  { name: "Lyon", score: "8.5", dpt: "69", slug: "lyon" },
  { name: "Toulouse", score: "10", dpt: "31", slug: "toulouse" },
  { name: "Nice", score: "9.5", dpt: "06", slug: "nice" },
  { name: "Nantes", score: "8", dpt: "44", slug: "nantes" },
  { name: "Montpellier", score: "7.5", dpt: "34", slug: "montpellier" },
  { name: "Strasbourg", score: "9", dpt: "67", slug: "strasbourg" },
  { name: "Bordeaux", score: "8", dpt: "33", slug: "bordeaux" },
  { name: "Lille", score: "5.5", dpt: "59", slug: "lille" }
];

export const PARAM_ICONS = {
    bacteria: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M6 18h8"/></svg>',
    microbiology: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M6 18h8"/></svg>',
    nitrates: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/></svg>',
    hardness: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
    ph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12"/><path d="m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z"/><path d="m2 22 .414-.414"/></svg>',
    cond: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
    conductivity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
    chlorine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>',
    turb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
    pesticides: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    iron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/><path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"/><path d="M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"/><path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/></svg>',
    manganese: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>',
    pfas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
};

export const RANGES = {
    nitrates: [5, 20, 50],
    pesticides: [0.05, 0.1, 0.15],
    ph: [5.9, 6.4, 6.8, 8.2, 8.6, 9.1], 
    chlorine: [0.05, 0.1, 0.5],
    pfas: [0.01, 0.05, 0.10],
    iron: [20, 100, 200],
    manganese: [5, 20, 50],
    turb: [0.1, 0.5, 2.0],
    cond: [400, 800, 1500],
    conductivity: [400, 800, 1500],
    copper: [1.0, 2.0, 3.0],
    ammonium: [0.1, 0.5, 1.0],
    hardness: [5, 10, 15, 30, 35, 40] 
};

export const CENTERED_PARAMS = ["ph", "hardness"];

export function parseValue(val) {
    if (val === undefined || val === null) return NaN;
    if (typeof val === 'number') return val;
    const s = val.toString().toLowerCase();
    if (s.includes('<')) return 0;
    if (s.includes('absence') || s.includes('non détecté')) return 0;
    const clean = s.replace(/[^0-9,.]/g, '').replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? NaN : parsed;
}

/**
 * UNIQUE CALCULATION ENGINE
 * Used by EVERY component of the application.
 */
export function calculateCrystalScore(s, isConform) {
    let score = 10.0;
    const isDetected = (p, threshold = 0) => {
        if (!p || !p.val || p.val === '--') return false;
        const valStr = p.val.toString().toLowerCase();
        if (valStr.includes('absence') || valStr.includes('non détecté')) return false;
        const numericVal = parseValue(p.val);
        return (numericVal > threshold);
    };

    if (!isConform) {
        return { 
            final: 2.1, 
            label: "NON CONFORME", 
            explanation: "L'eau présente des dépassements de seuils réglementaires sur des paramètres critiques.",
            statusClass: "status-critical"
        };
    }

    // 1. MICROBIOLOGIE (Critiue)
    const microData = s.microbiology || s.bacteria;
    if (microData && isDetected(microData)) {
        score -= 5;
    }

    // 2. POLLUANTS CHIMIQUES (Tolérance Zéro)
    if (s.pesticides && isDetected(s.pesticides, 0)) {
        const p = parseValue(s.pesticides.val);
        score -= (p > 0.1 ? 4 : 1.5);
    }
    if (s.pfas && isDetected(s.pfas, 0)) {
        const p = parseValue(s.pfas.val);
        score -= (p > 0.1 ? 4 : 1.5);
    }

    // 3. NITRATES (Pureté)
    if (s.nitrates) {
        const n = parseValue(s.nitrates.val);
        if (n > 15) score -= 1;
        if (n > 25) score -= 1;
        if (n > 40) score -= 2;
    }

    // 4. CHLORE (Bémol sur la pureté originelle)
    if (s.chlorine) {
        const c = parseValue(s.chlorine.val);
        if (c > 0.1) score -= 0.5;
        if (c > 0.4) score -= 0.5;
    }

    // 5. CONFORMITÉ ARS
    if (s.conformity && parseValue(s.conformity.val) < 100) {
        score -= 2.5;
    }

    // 6. AUTRES (Confort)
    if (s.hardness) {
        const h = parseValue(s.hardness.val);
        if (h > 25) score -= 0.5;
        if (h > 35) score -= 0.5;
    }

    score = Math.max(1, Math.min(10, score));
    score = parseFloat(score.toFixed(1));

    let label = "MOYENNE";
    let explanation = "Votre eau est conforme et de qualité standard.";
    
    if (score >= 9.7) { label = "EXCEPTIONNELLE"; explanation = "Une pureté totale, digne des meilleures eaux de source."; }
    else if (score >= 9.2) { label = "EXCELLENTE"; explanation = "Qualité remarquable, quasiment aucun polluant détecté."; }
    else if (score >= 8.5) { label = "TRÈS BONNE"; explanation = "Très bonne qualité globale, malgré quelques paramètres mineurs."; }
    else if (score >= 7.0) { label = "SATISFAISANTE"; explanation = "Une eau saine qui respecte les équilibres fondamentaux."; }
    else if (score < 5.0) { label = "DÉGRADÉE"; explanation = "La qualité de l'eau est impactée par des paramètres critiques."; }
    else if (score < 7.0) { label = "MÉDIOCRE"; explanation = "Qualité passable présentant plusieurs points de vigilance."; }

    let statusClass = "status-good";
    if (score >= 9.2) statusClass = "status-excellent";
    else if (score < 5.0) statusClass = "status-critical";
    else if (score < 7.0) statusClass = "status-warning";

    return { final: score, label, explanation, statusClass };
}

/**
 * UNIQUE HARVESTER ENGINE
 * Centralizes API logic, Fallbacks and Station Filtering.
 */
export async function harvestWaterData(cityName) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Sécurité anti-timeout serveur

        const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&size=500`;
        const initialRes = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!initialRes.ok) return null;
        const initialType = initialRes.headers.get("content-type");
        if (!initialType || !initialType.includes("application/json")) return null;

        let data = await initialRes.json();

        // --- INTELLIGENT FALLBACK (Espace vs Tiret) ---
        if ((!data.data || data.data.length === 0) && cityName.includes('-')) {
            const spaceName = cityName.replace(/-/g, ' ');
            const resSpace = await fetch(`https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(spaceName)}&size=5000`);
            if (resSpace.ok) {
                const dataSpace = await resSpace.json();
                if (dataSpace.data && dataSpace.data.length > 0) {
                    data = dataSpace;
                }
            }
        }

        if (!data.data || data.data.length === 0) return null;
        let reports = data.data;

        // 1. Filtrage Station (Anti-Pollution par villes limitrophes)
        const cleanTarget = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, ' ');
        const exactMatch = reports.filter(r => {
            const c = r.nom_commune.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, ' ');
            const metropoles = ['lyon', 'paris', 'marseille', 'bordeaux', 'toulouse', 'nantes', 'lille', 'montpellier'];
            if (metropoles.includes(cleanTarget)) {
                return c === cleanTarget || c.startsWith(cleanTarget + " ") || c.startsWith(cleanTarget + "-");
            }
            return c === cleanTarget || c.startsWith(cleanTarget + " ");
        });
        if (exactMatch.length > 0) reports = exactMatch;
        reports.sort((a, b) => new Date(b.date_prelevement) - new Date(a.date_prelevement));

        const getParam = (codes, keywords, requiredUnits = []) => {
            const match = reports.find(r => {
                const unit = (r.libelle_unite || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const label = (r.libelle_parametre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const code = `${r.code_parametre}`;
                const isTemp = label.includes("temp") || label.includes("t°") || unit.includes("°c") || unit.includes("celsius");
                if (isTemp) return false;
                if (requiredUnits.length > 0) {
                    const hasRequiredUnit = requiredUnits.some(ru => unit.includes(ru.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
                    if (!hasRequiredUnit) return false;
                }
                const isCodeMatch = codes.some(c => code === `${c}`);
                const isWordMatch = keywords.some(kw => {
                    const lowKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (lowKw.length <= 3) {
                        const regex = new RegExp(`\\b${lowKw}\\b`, 'i');
                        return regex.test(label) || (lowKw === 'ph' && label.includes('potentiel hydrogene'));
                    }
                    return label.includes(lowKw);
                });
                return (isCodeMatch || isWordMatch) && (r.resultat_numerique !== null || r.resultat_alphanumerique !== null);
            });
            if (!match) return null;
            const rawVal = (match.resultat_alphanumerique && match.resultat_alphanumerique !== "null") ? match.resultat_alphanumerique : match.resultat_numerique;
            let valStr = rawVal !== null ? `${rawVal}` : '--';
            
            // Unification Microbiologie : 0 ou "absence" -> "Absence"
            const isBact = codes.includes(1321) || codes.includes(1322);
            if (isBact && (valStr === '0' || valStr.toLowerCase().includes('absence'))) {
                valStr = 'Absence';
            }

            return {
                val: valStr,
                unit: match.libelle_unite?.replace(/\(.*\)/g, '').replace('unité ', '').trim() || '',
                date: new Date(match.date_prelevement).toLocaleDateString('fr-FR'),
                label: match.libelle_parametre
            };
        };

        const stats = {
            nitrates: getParam([1340, 1342], []),
            ph: getParam([1301, 1302], ["ph", "potentiel hydrogene"], ["ph"]),
            hardness: getParam([1345, 2708], ["hydrotimetrique", "durete", "th"]),
            chlorine: getParam([1399, 1398], ["chlore libre", "chlore total"]),
            conductivity: getParam([1302, 1303], ["conductivite"], ["µS", "siemens", "us/cm"]),
            turbidity: getParam([1305], ["turbidite", "turb"]),
            pesticides: getParam([1107, 1667, 6272, 6273, 6274, 6275, 6276, 6277, 6278, 6279, 6280, 7150], ["pesticide"]),
            pfas: getParam([7149, 7148, 8194], ["pfas", "perfluoro"]),
            microbiology: getParam([1321, 1322], ["escherichia", "enterocoques", "coliformes"]),
            iron: getParam([1393, 1374], ["fer total", "fer dissous"]),
            manganese: getParam([1394, 1373], ["manganese"]),
            ammonium: getParam([1331, 1335], ["ammonium"]),
            copper: getParam([1392], ["cuivre"]),
            cot: getParam([1341], ["organique total", "cot"])
        };

        const conclusion = reports[0].conclusion_conformite_prelevement || "";
        const isConform = conclusion.toLowerCase().includes("conforme") && !conclusion.toLowerCase().includes("non conforme");
        
        // 2. Fallback Réseau (Zéro-Vide) - On scanne PROFONDÉMENT pour les métropoles (Angers, Nantes, etc.)
        const allReseauCodes = [...new Set(reports.flatMap(r => r.reseaux?.map(res => res.code) || []))].filter(Boolean);
        if (allReseauCodes.length > 0) {
            const reseauQuery = allReseauCodes.join(',');
            const fallbackConfig = {
                nitrates: "1340,1342", ph: "1301,1302", hardness: "1345,2708", chlorine: "1399,1398", 
                conductivity: "1302,1303", turbidity: "1305", pesticides: "1107,1667,6272,6273,6274,6275,6276,6277,6278,6279,6280,7150", 
                pfas: "7149,7148,8194,5980,6542,8738,6561,8740,6549,6025,8742", microbiology: "1321,1322",
                iron: "1393,1374", manganese: "1394,1373", ammonium: "1331,1335", copper: "1392", cot: "1341"
            };
            
            const missingKeys = Object.keys(fallbackConfig).filter(k => !stats[k] || stats[k].val === '--');
            
            if (missingKeys.length > 0) {
                // Pour les métropoles, 1000 est un bon compromis (10 000 était trop lourd)
                const batchUrl = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_reseau=${reseauQuery}&size=1000&sort=desc`;
                
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    const bRes = await fetch(batchUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (bRes.ok) {
                        const bData = await bRes.json();
                        if (bData.data && bData.data.length > 0) {
                            missingKeys.forEach(key => {
                                const codes = fallbackConfig[key].split(',');
                                const match = bData.data.find(m => codes.includes(String(m.code_parametre)));
                                if (match) {
                                    const val = (match.resultat_alphanumerique && match.resultat_alphanumerique !== "null") ? match.resultat_alphanumerique : match.resultat_numerique;
                                    if (val !== null) {
                                        let finalVal = `${val}`;
                                        if (key === 'microbiology' && (finalVal === '0' || finalVal.toLowerCase().includes('absence'))) {
                                            finalVal = 'Absence';
                                        }
                                        stats[key] = {
                                            val: finalVal,
                                            unit: match.libelle_unite?.replace(/\(.*\)/g, '').replace('unité ', '').trim() || '',
                                            date: new Date(match.date_prelevement).toLocaleDateString('fr-FR'),
                                            label: match.libelle_parametre
                                        };
                                    }
                                }
                            });
                        }
                    }
                } catch (e) { console.warn("Deep Network Fallback Timeout"); }
            }
        }

        const crystal = calculateCrystalScore(stats, isConform);
        const rawName = reports[0].nom_commune || cityName;
        const officialCityName = rawName.toLowerCase()
            .split('-')
            .map(part => part.split(' ').map(sub => sub.charAt(0).toUpperCase() + sub.slice(1)).join(' '))
            .join('-');

        
        return { stats, isConform, crystal, meta: reports[0], cityName: officialCityName };
    } catch (e) {
        console.error("Harvester Error:", e);
        return null;
    }
}

/** Legacy Wrappers for backward compatibility **/
export async function fetchCitySummary(cityName) {
    const data = await harvestWaterData(cityName);
    if (!data) return null;
    return {
        score: data.crystal.final,
        label: data.crystal.label,
        statusClass: data.crystal.statusClass,
        cityName: data.cityName
    };
}

export async function fetchRealCityScore(cityName) {
    const data = await harvestWaterData(cityName);
    return data ? data.crystal.final : null;
}

export function getParameterStatus(key, val) {
    if (val === undefined || val === null || val === "null") return { class: "", statusLabel: "Inconnu", subtitle: "Non analysé", status: "none" };
    if (key === "bacteria" || key === "microbiology") {
        const s = val.toString().toLowerCase();
        if (s.includes("absence") || s.includes("<")) return { class: "status-excellent", statusLabel: "Sain", subtitle: "Aucun germe détecté", status: "perfect" };
        return { class: "status-critical", statusLabel: "Danger", subtitle: "Présence bactérienne", status: "critical" };
    }
    const n = parseValue(val);
    switch(key) {
        case "nitrates":
            if (n <= 5) return { class: "status-excellent", statusLabel: "Exceptionnel", subtitle: "Pureté maximale", status: "perfect" };
            if (n <= 20) return { class: "status-good", statusLabel: "Sain", subtitle: "Taux très faible", status: "perfect" };
            if (n <= 50) return { class: "status-warning", statusLabel: "Vigilance", subtitle: "Taux modéré", status: "warning" };
            return { class: "status-critical", statusLabel: "Hors Norme", subtitle: "Seuil dépassé", status: "critical" };
        case "hardness":
            if (n >= 15 && n <= 30) return { class: "status-excellent", statusLabel: "Idéal", subtitle: "Équilibre minéral parfait", status: "perfect" };
            if ((n >= 10 && n < 15) || (n > 30 && n <= 35)) return { class: "status-good", statusLabel: n < 15 ? "Eau Douce" : "Calcaire", subtitle: n < 15 ? "Peu calcaire, sain" : "Entartrage léger", status: "perfect" };
            if ((n >= 5 && n < 10) || (n > 35 && n <= 40)) return { class: "status-warning", statusLabel: n < 10 ? "Corrosive" : "Très Calcaire", subtitle: n < 10 ? "Sous-minéralisée" : "Entartrage fort", status: "warning" };
            return { class: "status-critical", statusLabel: "Extrême", subtitle: "Hors normes idéales", status: "critical" };
        case "pesticides":
            const p = parseValue(val);
            if (isNaN(p) || p === 0) return { class: "status-excellent", statusLabel: "Indétectable", subtitle: "Aucun résidu détecté", status: "perfect" };
            if (p <= 0.05) return { class: "status-excellent", statusLabel: "Excellent", subtitle: "Traces infimes", status: "perfect" };
            if (p <= 0.1) return { class: "status-good", statusLabel: "Bon", subtitle: "Présence de résidus", status: "perfect" };
            if (p <= 0.15) return { class: "status-warning", statusLabel: "Médiocre", subtitle: "Limite de conformité", status: "warning" };
            return { class: "status-critical", statusLabel: "Alerte", subtitle: "Dépassement de seuil", status: "critical" };
        case "pfas":
            const pf = parseValue(val);
            if (isNaN(pf) || pf === 0) return { class: "status-excellent", statusLabel: "Indétectable", subtitle: "Aucun pfas détecté", status: "perfect" };
            if (pf <= 0.01) return { class: "status-excellent", statusLabel: "Sain", subtitle: "Traces extrêmes", status: "perfect" };
            if (pf <= 0.05) return { class: "status-warning", statusLabel: "Vigilance", subtitle: "Traces détectées", status: "warning" };
            return { class: "status-critical", statusLabel: "Alerte", subtitle: "Polluant éternel présent", status: "critical" };
        case "ph":
            if (n >= 6.8 && n <= 8.2) return { class: "status-excellent", statusLabel: "Neutre", subtitle: "PH idéal", status: "perfect" };
            if ((n >= 6.4 && n < 6.8) || (n > 8.2 && n <= 8.6)) return { class: "status-good", statusLabel: "Correct", subtitle: "Équilibre sain", status: "perfect" };
            if ((n >= 5.9 && n < 6.4) || (n > 8.6 && n <= 9.1)) return { class: "status-warning", statusLabel: "Déséquilibré", subtitle: "Acidité/Alcalinité", status: "warning" };
            return { class: "status-critical", statusLabel: "Instable", subtitle: "Très corrosif ou entartrant", status: "critical" };
        case "chlorine":
            if (n <= 0.05) return { class: "status-excellent", statusLabel: "Indétectable", subtitle: "Aucun goût détecté", status: "perfect" };
            if (n <= 0.1) return { class: "status-good", statusLabel: "Sain", subtitle: "Goût imperceptible", status: "perfect" };
            if (n <= 0.5) return { class: "status-warning", statusLabel: "Marqué", subtitle: "Léger goût de chlore", status: "warning" };
            return { class: "status-critical", statusLabel: "Fort", subtitle: "Goût très présent", status: "critical" };
        case "iron":
            if (n <= 20 || isNaN(n)) return { class: "status-excellent", statusLabel: "Excellent", subtitle: "Traces infimes", status: "perfect" };
            if (n <= 100) return { class: "status-good", statusLabel: "Correct", subtitle: "Traces minimes", status: "perfect" };
            return { class: "status-warning", statusLabel: "Traces", subtitle: "Eau ferreuse", status: "warning" };
        case "manganese":
            if (n <= 5 || isNaN(n)) return { class: "status-excellent", statusLabel: "Excellent", subtitle: "Traces infimes", status: "perfect" };
            if (n <= 20) return { class: "status-good", statusLabel: "Correct", subtitle: "Traces minimes", status: "perfect" };
            return { class: "status-warning", statusLabel: "Traces", subtitle: "Légère présence", status: "warning" };
        case "cond":
        case "conductivity":
            if (n <= 400) return { class: "status-excellent", statusLabel: "Stable", subtitle: "Faiblement minéralisée", status: "perfect" };
            if (n <= 800) return { class: "status-good", statusLabel: "Équilibré", subtitle: "Minéralisation moyenne", status: "perfect" };
            return { class: "status-warning", statusLabel: "Chargée", subtitle: "Eau riche en minéraux", status: "warning" };
        case "turb":
        case "turbidity":
            if (n <= 0.1) return { class: "status-excellent", statusLabel: "Cristalline", subtitle: "Eau ultra-pure", status: "perfect" };
            if (n <= 0.5) return { class: "status-good", statusLabel: "Limpide", subtitle: "Excellente visibilité", status: "perfect" };
            return { class: "status-warning", statusLabel: "Trouble", subtitle: "Légère opacité", status: "warning" };
        default:
            return { class: "status-good", statusLabel: "Satisfaisant", subtitle: "Dans les normes", status: "perfect" };
    }
}
