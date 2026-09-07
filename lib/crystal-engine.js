/**
 * MOTEUR DE SCORE CANONIQUE — Crystal Score (source de vérité unique).
 *
 * CommonJS volontaire : importé tel quel par les scripts de build node
 * (`require`) et ré-exporté par `lib/water-utils.js` pour le runtime Next.
 * Ne doit importer aucun module applicatif (aucun alias, aucune donnée).
 *
 * Philosophie (assumée — cf. chantier « uniformisation des indicateurs ») :
 *   « Afficher ≠ noter ». Le score ne pénalise QUE les paramètres à enjeu
 *   sanitaire (microbiologie, pesticides, PFAS, nitrates) plus, à la marge,
 *   les EXTREMES de confort (chlore > 0,4 « goût marqué », calcaire > 35 °f
 *   « entartrage fort »). Les autres paramètres affichés (pH, turbidité,
 *   conductivité, fer, manganèse, cuivre, ammonium…) sont informatifs et
 *   n'impactent pas le score.
 *
 * La conformité ARS est un BADGE binaire distinct (affiché séparément dans
 * l'UI) : elle ne fige plus la note à 2,1/10. Si la commune est déclarée
 * non conforme, la note paramétrique est plafonnée selon la gravité :
 *   - cause sanitaire avérée (bactérie, pesticide/PFAS > 0,1, nitrates ≥ 50)
 *     → plafond 2,0 (alerte critique) ;
 *   - cause technique/administrative (calcaire, fer, goût, réseau…) → plafond 6,0.
 *
 * Seuils nitrates conservés « calés pureté » (15/25/40 mg/L), distincts de la
 * limite réglementaire 50 mg/L : gradient éditorial volontairement sensible
 * pour différencier les eaux les plus pures.
 */

function parseValue(val) {
    if (val === undefined || val === null) return NaN;
    const s = val.toString().toLowerCase();
    if (s.includes('<')) return 0;
    if (s.includes('absence') || s.includes('non détecté')) return 0;
    const clean = s.replace(/[^0-9,.]/g, '').replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? NaN : parsed;
}

function isDetected(p) {
    if (!p || !p.val || p.val === '--') return false;
    const s = String(p.val).toLowerCase();
    if (s.includes('absence') || s.includes('non détecté')) return false;
    return parseValue(p.val) > 0;
}

function calculateCrystalScore(s, isConform) {
    const stats = s || {};
    let score = 10.0;

    // 1. Microbiologie (enjeu sanitaire critique)
    const microDetected = isDetected(stats.microbiology);
    if (microDetected) score -= 5.0;

    // 2. Pesticides — tolérance zéro (limite 0,1 µg/L par substance)
    if (isDetected(stats.pesticides)) {
        score -= (parseValue(stats.pesticides.val) > 0.1 ? 4.0 : 1.5);
    }

    // 3. PFAS — tolérance zéro
    if (isDetected(stats.pfas)) {
        score -= (parseValue(stats.pfas.val) > 0.1 ? 4.0 : 1.5);
    }

    // 4. Nitrates — gradient pureté 15/25/40 (norme 50 mg/L)
    const nit = stats.nitrates ? parseValue(stats.nitrates.val) : NaN;
    if (!isNaN(nit)) {
        if (nit > 15) score -= 1.0;
        if (nit > 25) score -= 1.0;
        if (nit > 40) score -= 2.0;
    }

    // 5. Confort — EXTREMES uniquement (n'inflige rien pour un chlore/calcaire courant)
    const chlo = stats.chlorine ? parseValue(stats.chlorine.val) : NaN;
    if (!isNaN(chlo) && chlo > 0.4) score -= 0.5; // goût marqué
    const dur = stats.hardness ? parseValue(stats.hardness.val) : NaN;
    if (!isNaN(dur) && dur > 35) score -= 0.5; // entartrage fort

    score = Math.max(1, Math.min(10, score));
    score = parseFloat(score.toFixed(1));

    // 6. Conformité ARS (badge binaire distinct — plafond nuancé, plus de 2,1 forfaitaire)
    let label;
    let explanation;
    let statusClass;

    if (isConform === false) {
        const nitCrit = !isNaN(nit) && nit >= 50;
        const pestCrit = isDetected(stats.pesticides) && parseValue(stats.pesticides.val) > 0.1;
        const pfasCrit = isDetected(stats.pfas) && parseValue(stats.pfas.val) > 0.1;
        const critical = microDetected || pestCrit || pfasCrit || nitCrit;

        score = Math.min(score, critical ? 2.0 : 6.0);
        label = "NON CONFORME";
        statusClass = "status-critical";
        explanation = critical
            ? "L'eau est déclarée non conforme avec un dépassement sanitaire avéré (bactérie ou substance au-dessus du seuil réglementaire)."
            : "L'eau est déclarée non conforme par l'ARS (cause technique, calcaire, fer, goût…). Les polluants majeurs mesurés sont sous les seuils.";
        return { final: score, label, explanation, statusClass };
    }

    if (score >= 9.7) { label = "EXCEPTIONNEL"; explanation = "Une pureté totale, digne des meilleures eaux de source."; statusClass = "status-excellent"; }
    else if (score >= 9.2) { label = "EXCELLENT"; explanation = "Qualité remarquable, quasiment aucun polluant détecté."; statusClass = "status-excellent"; }
    else if (score >= 8.5) { label = "TRÈS BON"; explanation = "Très bonne qualité globale, malgré quelques paramètres mineurs."; statusClass = "status-good"; }
    else if (score >= 7.0) { label = "SATISFAISANT"; explanation = "Une eau saine qui respecte les équilibres fondamentaux."; statusClass = "status-good"; }
    else if (score < 5.0) { label = "DÉGRADÉ"; explanation = "La qualité de l'eau est impactée par des paramètres critiques."; statusClass = "status-critical"; }
    else { label = "MÉDIOCRE"; explanation = "Qualité passable présentant plusieurs points de vigilance."; statusClass = "status-warning"; }

    return { final: score, label, explanation, statusClass };
}

module.exports = { calculateCrystalScore, parseValue };
