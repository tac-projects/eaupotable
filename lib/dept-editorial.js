/**
 * dept-editorial — Contenu éditorial data-driven pour les pages département.
 *
 * Objectif : différencier les 95 pages département (aujourd'hui 100 % template)
 * en générant un éditorial basé sur les données réelles de chaque département :
 * distributeurs, distribution des scores, prix, comparaison avec la région,
 * meilleures / pires communes.
 *
 * Toutes les fonctions sont pures : données JSON en entrée, texte en sortie.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseNum(val) {
  if (val === null || val === undefined || val === '') return NaN;
  return parseFloat(String(val).replace(/\s/g, '').replace(',', '.').replace('<', ''));
}

function fmtNum(val, digits = 1) {
  const n = parseNum(val);
  if (isNaN(n)) return null;
  return n.toFixed(digits).replace('.', ',');
}

function normalizeDistributor(name) {
  if (!name) return null;
  return String(name)
    .replace(/\s+/g, ' ')
    .replace(/\bCENTRE\s+NORMANDIE\b/i, 'Centre Normandie')
    .trim()
    .replace(/^([A-ZÀ-Ý])/, (m) => m.toUpperCase())
    .replace(/\b([a-zà-ÿ]{2,})\b/g, (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
}

function ordinal(n) {
  if (n === 1) return '1ère';
  return `${n}ème`;
}

// ---------------------------------------------------------------------------
// Calcul des statistiques éditoriales d'un département
// ---------------------------------------------------------------------------
export function computeDeptEditorial(deptData) {
  const deptInfo = deptData?.deptInfo || {};
  const regionalInfo = deptData?.regionalInfo || {};
  const citiesObj = deptData?.cities || {};
  const cities = Object.entries(citiesObj).map(([slug, c]) => ({ slug, ...c }));

  // 1. Distribution des scores
  const scored = cities
    .map(c => ({ name: c.cityName, slug: c.slug, score: c.crystal?.final }))
    .filter(c => typeof c.score === 'number');
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const goodCount = scored.filter(c => c.score >= 7).length;
  const badCount = scored.filter(c => c.score < 4).length;
  const avgScore = scored.length
    ? scored.reduce((sum, c) => sum + c.score, 0) / scored.length
    : 0;

  // 2. Distributeurs (top 5 par nombre de communes desservies)
  const distMap = new Map();
  cities.forEach(c => {
    const name = normalizeDistributor(c.meta?.nom_distributeur);
    if (name) distMap.set(name, (distMap.get(name) || 0) + 1);
  });
  const distributors = [...distMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      count,
      pct: cities.length ? Math.round((count / cities.length) * 100) : 0,
    }));

  // 3. Prix (€/m³)
  const prices = cities
    .map(c => c.prix?.total ?? c.prix?.aep)
    .filter(p => typeof p === 'number' && !isNaN(p));
  const priceStats = prices.length
    ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((sum, p) => sum + p, 0) / prices.length,
        count: prices.length,
      }
    : null;

  // 4. Conformité / non-conformité
  const nonConformCount = cities.filter(c => c.isConform === false).length;

  // 5. Fraîcheur des données (date max de prélèvement)
  let maxTs = 0;
  cities.forEach(c => {
    Object.values(c.stats || {}).forEach(s => {
      if (s?.timestamp && s.timestamp > maxTs) maxTs = s.timestamp;
    });
  });
  const latestDate = maxTs ? new Date(maxTs).toLocaleDateString('fr-FR') : null;

  // 6. Comparaison avec la région sur les indicateurs clés
  const regionCompare = [
    { key: 'score', label: 'Score Crystal moyen', dept: deptInfo.avgScore, region: regionalInfo?.score, unit: '/10' },
    { key: 'hardness', label: 'Dureté (calcaire)', dept: deptInfo.averages?.hardness?.val, region: regionalInfo?.averages?.hardness?.val, unit: '°f' },
    { key: 'nitrates', label: 'Nitrates', dept: deptInfo.averages?.nitrates?.val, region: regionalInfo?.averages?.nitrates?.val, unit: 'mg/L' },
    { key: 'pfas', label: 'PFAS', dept: deptInfo.averages?.pfas?.val, region: regionalInfo?.averages?.pfas?.val, unit: 'µg/L' },
    { key: 'chlorine', label: 'Chlore', dept: deptInfo.averages?.chlorine?.val, region: regionalInfo?.averages?.chlorine?.val, unit: 'mg/L' },
  ].map(item => {
    const deptNum = parseNum(item.dept);
    const regionNum = parseNum(item.region);
    let delta = null;
    if (!isNaN(deptNum) && !isNaN(regionNum)) {
      delta = deptNum - regionNum;
    }
    return { ...item, deptNum, regionNum, delta };
  });

  // 7. Profil éditorial du département
  const scoreNum = parseNum(deptInfo.avgScore);
  let profile = 'moyen';
  if (!isNaN(scoreNum)) {
    if (scoreNum >= 8) profile = 'excellent';
    else if (scoreNum >= 6.5) profile = 'bon';
    else if (scoreNum >= 5) profile = 'moyen';
    else profile = 'faible';
  }

  const hardnessNum = parseNum(deptInfo.averages?.hardness?.val);
  let hardnessProfile = 'moyen';
  if (!isNaN(hardnessNum)) {
    if (hardnessNum > 25) hardnessProfile = 'dur';
    else if (hardnessNum < 10) hardnessProfile = 'doux';
  }

  return {
    deptName: deptInfo.name,
    code: deptInfo.code,
    regionName: regionalInfo?.name,
    cityCount: cities.length,
    scores: { best, worst, avgScore, goodCount, badCount, goodPct: scored.length ? Math.round((goodCount / scored.length) * 100) : 0 },
    distributors,
    priceStats,
    nonConformCount,
    latestDate,
    regionCompare,
    profile,
    hardnessProfile,
    hardnessVal: fmtNum(deptInfo.averages?.hardness?.val),
    nitratesVal: fmtNum(deptInfo.averages?.nitrates?.val),
    pfasVal: deptInfo.averages?.pfas?.val,
  };
}

// ---------------------------------------------------------------------------
// Génération des textes éditoriaux (paragraphes uniques par département)
// ---------------------------------------------------------------------------

/** Verdict d'ouverture — 4 profils + données réelles injectées */
export function buildDeptVerdict(e) {
  const score = e.scores.avgScore.toFixed(1).replace('.', ',');
  const bestCity = e.scores.best?.name;
  const worstCity = e.scores.worst?.name;
  const worstScore = e.scores.worst?.score?.toFixed(1).replace('.', ',');
  const bestScore = e.scores.best?.score?.toFixed(1).replace('.', ',');

  const openers = {
    excellent: `Avec un score moyen de ${score}/10, l'eau du robinet en ${e.deptName} figure parmi les plus saines de France.`,
    bon: `Le bilan ${e.currentYear} des analyses sanitaires en ${e.deptName} est globalement positif, avec un score moyen de ${score}/10.`,
    moyen: `En ${e.deptName}, la qualité de l'eau présente un bilan contrasté : le score moyen de ${score}/10 reflète des situations très hétérogènes d'une commune à l'autre.`,
    faible: `Avec un score moyen de ${score}/10, l'eau de ${e.deptName} nécessite une attention particulière : la qualité varie fortement selon les communes.`,
  };

  const comparisons = [];
  if (bestCity && worstCity) {
    const gap = (e.scores.best.score - e.scores.worst.score);
    if (gap >= 3) {
      comparisons.push(
        `l'écart est marqué entre ${bestCity} (${bestScore}/10) et ${worstCity} (${worstScore}/10)`
      );
    } else {
      comparisons.push(
        `la meilleure commune est ${bestCity} (${bestScore}/10) et la moins bien notée ${worstCity} (${worstScore}/10)`
      );
    }
  }
  if (e.scores.goodPct) {
    comparisons.push(`${e.scores.goodPct} % des communes affichent un score supérieur ou égal à 7/10`);
  }
  if (e.nonConformCount > 0) {
    comparisons.push(`${e.nonConformCount} commune${e.nonConformCount > 1 ? 's' : ''} présente${e.nonConformCount > 1 ? 'nt' : ''} une non-conformité aux normes ARS`);
  }
  if (comparisons.length === 0) {
    comparisons.push(`la quasi-totalité des ${e.cityCount} communes analysées est conforme aux normes sanitaires`);
  }

  return `${openers[e.profile]} Concrètement, ${comparisons.join(', et ')}.`;
}

/** Comparaison département vs région */
export function buildRegionParagraph(e) {
  if (!e.regionName) return null;
  const scoreDelta = e.regionCompare.find(r => r.key === 'score');
  const hardnessDelta = e.regionCompare.find(r => r.key === 'hardness');
  const nitratesDelta = e.regionCompare.find(r => r.key === 'nitrates');

  const parts = [`Par rapport à la moyenne de la région ${e.regionName}, le département ${e.deptName} se positionne ainsi :`];
  if (scoreDelta && scoreDelta.delta !== null) {
    const cmp = scoreDelta.delta > 0 ? 'au-dessus' : scoreDelta.delta < 0 ? 'en dessous' : 'au niveau de';
    const sign = scoreDelta.delta > 0 ? '+' : '-';
    parts.push(`le score moyen est ${cmp} de celui de la région (${sign}${Math.abs(scoreDelta.delta).toFixed(1).replace('.', ',')} point)`);
  }
  if (hardnessDelta && hardnessDelta.delta !== null && hardnessDelta.delta !== 0) {
    const direction = hardnessDelta.delta > 0 ? 'plus' : 'moins';
    parts.push(`l'eau y est ${direction} calcaire (${e.hardnessVal} °f en moyenne)`);
  }
  if (nitratesDelta && nitratesDelta.delta !== null && nitratesDelta.delta !== 0) {
    const direction = nitratesDelta.delta > 0 ? 'plus élevés' : 'moins élevés';
    parts.push(`les nitrates sont ${direction} que la moyenne régionale`);
  }
  return parts.join(' ');
}

/** Paragraphe distributeurs */
export function buildDistributorParagraph(e) {
  if (!e.distributors.length) return null;
  const main = e.distributors[0];
  const others = e.distributors.slice(1, 3).map(d => d.name);
  let text = `La distribution de l'eau potable en ${e.deptName} est assurée par ${e.distributors.length > 1 ? 'plusieurs opérateurs' : 'un opérateur principal'}. `;
  text += `${main.name} dessert à lui seul ${main.count} communes (${main.pct} % du département).`;
  if (others.length) {
    text += ` Sont également présents : ${others.join(', ')}.`;
  }
  if (e.priceStats) {
    const avg = e.priceStats.avg.toFixed(2).replace('.', ',');
    const min = e.priceStats.min.toFixed(2).replace('.', ',');
    const max = e.priceStats.max.toFixed(2).replace('.', ',');
    text += ` Le prix moyen de l'eau y est de ${avg} €/m³, allant de ${min} € à ${max} € selon les communes.`;
  }
  return text;
}

/** Génère une intro éditoriale complète (3-4 paragraphes uniques) */
export function buildDeptEditorialText(deptData, currentYear) {
  const e = { ...computeDeptEditorial(deptData), currentYear };
  const verdict = buildDeptVerdict(e);
  const region = buildRegionParagraph(e);
  const distributors = buildDistributorParagraph(e);

  const paragraphs = [verdict];
  if (region) paragraphs.push(region);
  if (distributors) paragraphs.push(distributors);
  return paragraphs;
}

// ---------------------------------------------------------------------------
// FAQ contextuelle — questions/réponses basées sur les données réelles
// ---------------------------------------------------------------------------
export function buildDeptFaq(deptData, currentYear) {
  const e = { ...computeDeptEditorial(deptData), currentYear };
  const score = e.scores.avgScore.toFixed(1).replace('.', ',');
  const faq = [];

  // 1. Question principale sur la potabilité (dépend du profil)
  if (e.profile === 'excellent' || e.profile === 'bon') {
    faq.push({
      q: `Peut-on boire l'eau du robinet en ${e.deptName} en ${currentYear} ?`,
      a: `Oui. Avec un score moyen de ${score}/10 et un taux de conformité de ${deptData.deptInfo?.conformRate || '--'} %, l'eau distribuée dans les ${e.cityCount} communes du ${e.deptName} respecte les normes sanitaires de l'ARS.`,
    });
  } else {
    faq.push({
      q: `Peut-on boire l'eau du robinet en ${e.deptName} en ${currentYear} ?`,
      a: `Dans l'ensemble oui, mais la qualité varie selon les communes. Le score moyen de ${score}/10 cache des écarts : consultez la fiche de votre ville pour vérifier le détail des analyses (${e.nonConformCount > 0 ? e.nonConformCount + ' commune(s) en non-conformité' : 'aucune non-conformité déclarée'}).`,
    });
  }

  // 2. Question distributeur — uniquement si plusieurs opérateurs
  if (e.distributors.length > 0) {
    const main = e.distributors[0];
    const list = e.distributors.map(d => `${d.name} (${d.count} communes)`).join(', ');
    faq.push({
      q: `Qui gère l'eau potable en ${e.deptName} ?`,
      a: `La distribution est assurée par plusieurs opérateurs. Le principal est ${main.name}, qui dessert ${main.pct} % des communes. On trouve également : ${list}.`,
    });
  }

  // 3. Question prix — si données disponibles
  if (e.priceStats) {
    const avg = e.priceStats.avg.toFixed(2).replace('.', ',');
    const min = e.priceStats.min.toFixed(2).replace('.', ',');
    const max = e.priceStats.max.toFixed(2).replace('.', ',');
    faq.push({
      q: `Quel est le prix de l'eau en ${e.deptName} ?`,
      a: `Le prix moyen constaté dans les ${e.priceStats.count} communes du département est de ${avg} €/m³. Selon les communes et le distributeur, il varie de ${min} € à ${max} € par mètre cube.`,
    });
  }

  // 4. Question calcaire — dépend du profil de dureté
  if (e.hardnessProfile === 'dur') {
    faq.push({
      q: `L'eau est-elle calcaire en ${e.deptName} ?`,
      a: `Oui, avec une dureté moyenne de ${e.hardnessVal} °f, l'eau du ${e.deptName} est considérée comme calcaire. Protégez vos chauffe-eau et lave-linge : un adoucisseur ou un détartrage régulier est recommandé selon les communes.`,
    });
  } else if (e.hardnessProfile === 'doux') {
    faq.push({
      q: `L'eau est-elle calcaire en ${e.deptName} ?`,
      a: `Non, avec une dureté moyenne de ${e.hardnessVal} °f, l'eau du ${e.deptName} est naturellement douce. Un adoucisseur est inutile : vos canalisations et appareils sont préservés.`,
    });
  } else {
    faq.push({
      q: `L'eau est-elle calcaire en ${e.deptName} ?`,
      a: `La dureté moyenne de l'eau du ${e.deptName} est de ${e.hardnessVal} °f, un niveau modéré. Sans être excessivement calcaire, un entretien régulier des robinetteries reste conseillé.`,
    });
  }

  // 5. Question PFAS — toujours pertinente
  const pfasVal = e.pfasVal || '--';
  faq.push({
    q: `Y a-t-il des PFAS dans l'eau en ${e.deptName} ?`,
    a: `Depuis le 1er janvier 2026, la recherche des PFAS (polluants éternels) est systématique. Dans le ${e.deptName}, les moyennes départementales indiquent un taux de ${pfasVal} µg/L. Consultez la carte nationale des PFAS puis la fiche de votre commune pour le détail exact.`,
  });

  // 6. Question sur la meilleure commune — différenciation forte
  if (e.scores.best) {
    const bestScore = e.scores.best.score.toFixed(1).replace('.', ',');
    const worst = e.scores.worst ? ` À l'inverse, ${e.scores.worst.name} affiche ${e.scores.worst.score.toFixed(1).replace('.', ',')}/10.` : '';
    faq.push({
      q: `Quelles sont les meilleures communes du ${e.deptName} pour l'eau ?`,
      a: `${e.scores.best.name} obtient la meilleure note du département avec ${bestScore}/10.${worst} Consultez le classement complet ci-dessus pour comparer toutes les communes.`,
    });
  }

  return faq;
}
