
const { fetchCitySummary, calculateCrystalScore } = require('./lib/water-utils');
const waterUtils = require('./lib/water-utils');

async function debug() {
    const cityName = "Lyon";
    const isMetropole = true;
    const size = 5000;
    const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&size=${size}`;
    const response = await fetch(url);
    const data = await response.json();
    let reports = data.data;
    reports.sort((a, b) => new Date(b.date_prelevement) - new Date(a.date_prelevement));

    // Simulation de fetchCitySummary internal logic
    const getParamLegacy = (codes, keywords, requiredUnits = []) => {
      const match = reports.find(r => {
        const unit = (r.libelle_unite || "").toLowerCase();
        const label = (r.libelle_parametre || "").toLowerCase();
        const code = `${r.code_parametre}`;
        const isCodeMatch = codes.some(c => code === `${c}`);
        const isWordMatch = keywords.some(kw => label.includes(kw));
        return (isCodeMatch || isWordMatch) && (r.resultat_numerique !== null || r.resultat_alphanumerique !== null);
      });
      if (!match) return null;
      const rawVal = (match.resultat_alphanumerique && match.resultat_alphanumerique !== "null") ? match.resultat_alphanumerique : match.resultat_numerique;
      return { val: rawVal !== null ? `${rawVal}` : '--', label: match.libelle_parametre };
    };

    const stats = {
      pesticides: getParamLegacy([1107, 1667, 6272, 6273, 6274, 6275, 6276, 6277, 6278, 6279, 6280, 7150], ["pesticide"]),
      hardness: getParamLegacy([1345, 2708], ["hydrotimetrique", "durete", "th"]),
      nitrates: getParamLegacy([1340, 1342], []),
      chlorine: getParamLegacy([1399, 1398], ["chlore libre", "chlore total"]),
      pfas: getParamLegacy([7149, 7148], ["pfas", "perfluores"]),
      ph: getParamLegacy([1301, 1302], ["ph", "potentiel hydrogene"]),
      microbiology: getParamLegacy([1447, 1449, 1042, 6455], ["microbiologie", "coliformes", "escherichia"]),
      conductivity: getParamLegacy([1302, 1303], ["conductivite"]),
      turbidity: getParamLegacy([1305], ["turbidite"]),
      iron: getParamLegacy([1393, 1374], ["fer total"]),
      manganese: getParamLegacy([1394, 1373], ["manganese"]),
      ammonium: getParamLegacy([1331, 1335], ["ammonium"]),
      copper: getParamLegacy([1392], ["cuivre"])
    };

    console.log("STATS:", JSON.stringify(stats, null, 2));
    const res = calculateCrystalScore(stats, true);
    console.log("SCORE:", res.final);
}

debug();
