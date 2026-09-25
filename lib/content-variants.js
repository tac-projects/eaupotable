/**
 * Système de variantes de contenu pour les pages ville.
 *
 * Objectif : donner à Google un contenu suffisamment différencié entre
 * chaque ville pour éviter la détection de "thin content" / template.
 *
 * Principe :
 * - 15 variantes "rédigées humainement" par slot
 * - 4 structures de paragraphe différentes selon le profil de la ville
 * - Sélection pseudo-aléatoire basée sur un hash de la ville (stable entre
 *   les builds mais différente d'une ville à l'autre)
 */

// ---------------------------------------------------------------------------
// Hash simple et stable pour une ville (ne change pas entre les builds)
// ---------------------------------------------------------------------------
export function hashCity(cityName, deptCode) {
  let h = 0;
  const str = cityName + deptCode;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Hash indépendant par (ville, slot) : évite les corrélations entre slots
// (deux slots qui tomberaient systématiquement sur le même indice).
// FNV-1a 32 bits, stable entre les builds.
// ---------------------------------------------------------------------------
export function slotHash(cityName, deptCode, slotIndex) {
  const str = `${cityName}|${deptCode}|${slotIndex}`;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Finalisation (avalanche) indispensable : sans elle, les bits de poids faible
  // de FNV-1a dépendent surtout des derniers caractères (ici le slot), ce qui
  // faisait retomber toutes les villes sur le même indice pour un slot donné.
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Sélectionne une variante de façon stable pour une ville + un slot donnés
// ---------------------------------------------------------------------------
export function pickFrom(variants, cityName, deptCode, slotIndex) {
  if (!variants || !variants.length) return '';
  return variants[slotHash(cityName, deptCode, slotIndex) % variants.length];
}

function pick(variants, cityName, deptCode, slotIndex) {
  return pickFrom(variants, cityName, deptCode, slotIndex);
}

// ---------------------------------------------------------------------------
// Helpers de formatage
// ---------------------------------------------------------------------------
function fmt(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value ?? ''));
  }
  return result.replace(/\{[^}]*\}/g, '');
}

// ===========================================================================
// SLOT A : PHRASE D'OUVERTURE (15 variantes)
// ===========================================================================
const INTRO_CONFORME = [
  "En {currentYear}, l'ARS a rendu son verdict pour {cityName} : l'eau du robinet est jugée **conforme** aux normes de potabilité. ",
  "Bonne nouvelle pour les habitants de {cityName} : les analyses ARS {currentYear} confirment une eau **conforme** sur tous les paramètres réglementaires. ",
  "L'ARS a publié ses relevés {currentYear} pour {cityName} : l'eau distribuée respecte l'ensemble des seuils sanitaires en vigueur. ",
  "Le dernier bulletin sanitaire de l'ARS est sans équivoque : à {cityName}, l'eau du robinet est **conforme** et propre à la consommation. ",
  "Les services de l'État ont contrôlé l'eau de {cityName} en {currentYear} : verdict **conforme**, sans réserve. ",
  "À {cityName}, les résultats d'analyse {currentYear} sont rassurants : l'eau est déclarée **conforme** par les autorités sanitaires. ",
  
  "L'eau qui coule à {cityName} en {currentYear} passe les tests de l'ARS avec succès : **conformité** totale. ",
  "Les habitants de {cityName} peuvent boire l'eau du robinet en toute confiance : l'ARS confirme sa **conformité** en {currentYear}. ",
  "D'après le rapport annuel de l'ARS, {cityName} figure parmi les communes dont l'eau est **conforme** en {currentYear}. ",
  "Le contrôle sanitaire de {currentYear} à {cityName} est formel : l'eau respecte toutes les exigences de qualité. ",
  "En {currentYear}, la qualité de l'eau à {cityName} satisfait pleinement aux exigences du Code de la Santé Publique. ",
  "Les prélèvements réalisés par l'ARS à {cityName} en {currentYear} attestent d'une eau **conforme** et sûre. ",
  "À {cityName}, les analyses {currentYear} montrent une eau de bonne facture, déclarée **conforme** par les autorités. ",
  "L'ARS n'a relevé aucune anomalie à {cityName} en {currentYear} : l'eau est **conforme** sur toute la ligne. ",
];

const INTRO_NON_CONFORME = [
  "Attention : l'ARS a classé l'eau de {cityName} comme **non conforme** en {currentYear}. Voici ce qu'il faut savoir. ",
  "Les relevés {currentYear} de l'ARS pour {cityName} indiquent une **non-conformité** sur certains paramètres. ",
  "L'alerte est donnée à {cityName} : l'eau du robinet présente des dépassements selon l'ARS en {currentYear}. ",
  "Les autorités sanitaires ont émis un avis **défavorable** pour l'eau de {cityName} en {currentYear}. Détails ci-dessous. ",
  "En {currentYear}, l'ARS a détecté des anomalies dans l'eau de {cityName} — le bilan est **non conforme**. ",
  "L'eau de {cityName} fait l'objet d'une surveillance renforcée : les analyses {currentYear} révèlent une **non-conformité**. ",
  "Le rapport de l'ARS pour {cityName} en {currentYear} pointe des dépassements : l'eau est **non conforme**. ",
  "Vigilance à {cityName} : l'ARS a classé l'eau comme **non conforme** en {currentYear}. On vous explique. ",
  "Les habitants de {cityName} doivent savoir : l'eau est **non conforme** selon l'ARS en {currentYear}. ",
  "L'ARS a rendu un verdict **défavorable** pour {cityName} en {currentYear}. Voici l'analyse détaillée. ",
  "En {currentYear}, la qualité de l'eau à {cityName} ne satisfait pas toutes les exigences : **non-conformité** constatée. ",
  "Les prélèvements ARS à {cityName} montrent des écarts par rapport aux normes en {currentYear}. ",
  "L'eau du robinet à {cityName} est sous surveillance : le bilan ARS {currentYear} est **non conforme**. ",
  "À {cityName}, l'ARS a identifié des problèmes de qualité de l'eau en {currentYear}. Analyse complète ci-dessous. ",
  "Le dernier contrôle sanitaire à {cityName} révèle une eau **non conforme** aux standards de potabilité. ",
];

// ===========================================================================
// SLOT B : DESCRIPTION DU RÉSEAU DE DISTRIBUTION (12 variantes)
// ===========================================================================
const RESEAU = [
  "La distribution est assurée par **{nomReseau}**, qui supervise un réseau de canalisations desservant les foyers de la commune. ",
  "C'est **{nomReseau}** qui gère l'acheminement de l'eau jusqu'aux robinets de {cityName}, avec des contrôles réguliers tout au long du parcours. ",
  "Le réseau, opéré par **{nomReseau}**, fait l'objet de prélèvements périodiques pour garantir la sécurité sanitaire des habitants. ",
  "Sous la supervision de **{nomReseau}**, l'eau parcourt des kilomètres de canalisations avant d'arriver chez vous, contrôlée à chaque étape. ",
  "La régie **{nomReseau}** est responsable du traitement et de la distribution de l'eau à {cityName}, dans le respect des normes sanitaires. ",
  "L'exploitation du réseau d'eau potable de {cityName} est confiée à **{nomReseau}**, qui veille à la qualité du service. ",
  "Depuis le point de captage jusqu'au robinet, **{nomReseau}** assure un suivi technique rigoureux de l'eau de {cityName}. ",
  "Le gestionnaire **{nomReseau}** publie régulièrement les résultats d'analyse pour {cityName}, en toute transparence. ",
  "À {cityName}, l'eau potable transite par le réseau de **{nomReseau}**, soumis à des inspections sanitaires fréquentes. ",
  "C'est à **{nomReseau}** qu'incombe la responsabilité de fournir une eau de qualité aux habitants de {cityName}. ",
  "Le service d'eau de {cityName}, géré par **{nomReseau}**, dessert l'ensemble des habitations et établissements de la commune. ",
  "L'infrastructure hydraulique de {cityName} est entretenue par **{nomReseau}**, garant d'une distribution fiable et sécurisée. ",
];

// ===========================================================================
// SLOT C : CONSOMMATION — EAU CONFORME (10 variantes)
// ===========================================================================
const CONSO_CONFORME = [
  "Concrètement, vous pouvez **boire l'eau du robinet à {cityName}** en toute tranquillité : elle respecte les normes de sécurité en vigueur. ",
  "Au quotidien, l'eau de {cityName} ne présente aucun risque sanitaire identifié : cuisine, boisson, hygiène — tout est permis. ",
  "Les résultats autorisent une consommation sans restriction : l'eau de {cityName} est parfaitement adaptée à toute la famille. ",
  "En pratique, l'eau du robinet à {cityName} peut être bue et utilisée pour la cuisine sans la moindre précaution particulière. ",
  "Les nourrissons, les femmes enceintes et les personnes âgées peuvent consommer l'eau de {cityName} sans inquiétude. ",
  "Aucun dépassement n'ayant été détecté, l'eau de {cityName} est recommandée pour un usage quotidien par toute la famille. ",
  "Vous pouvez remplir votre carafe directement au robinet : l'eau de {cityName} est saine et conforme aux exigences légales. ",
  "Fini les bouteilles en plastique : à {cityName}, l'eau du robinet est une alternative économique et écologique tout à fait sûre. ",
  "L'ARS ne signale aucun problème : l'eau de {cityName} peut être consommée par tous, sans exception. ",
  "La conformité étant totale, l'eau du robinet à {cityName} représente un choix sûr, économique et écologique. ",
];

// ===========================================================================
// SLOT D : IMPACT DURETÉ (EAU CALCAIRE >25°f) (8 variantes)
// ===========================================================================
const CALCAIRE_ELEVE = [
  "Le verdict met en évidence une **eau calcaire** ({dureteVal}), ce qui peut accélérer l'entartrage de vos appareils électroménagers. ",
  "Avec une dureté de {dureteVal}, l'eau de {cityName} est classée comme **calcaire** : un adoucisseur peut prolonger la durée de vie de votre chauffe-eau. ",
  "Les habitants de {cityName} constateront probablement des dépôts de tartre sur leurs robinetteries, conséquence d'une eau à {dureteVal}. ",
  "La minéralisation élevée de l'eau ({dureteVal}) à {cityName} n'est pas dangereuse pour la santé, mais elle use prématurément les équipements. ",
  "L'eau de {cityName} affiche {dureteVal} de dureté : un niveau qui favorise les dépôts calcaires dans les ballons d'eau chaude. ",
  "À {dureteVal}, l'eau est franchement calcaire. Pensez à détartrer vos appareils régulièrement si vous habitez {cityName}. ",
  "Le calcaire est le principal inconvénient de l'eau à {cityName} ({dureteVal}) : sans traitement, le tartre s'accumule rapidement. ",
  "Avec {dureteVal} au compteur, l'eau de {cityName} figure parmi les plus minéralisées : un adoucisseur peut être un investissement judicieux. ",
];

// ===========================================================================
// SLOT D' : EAU DOUCE (<10°f) (6 variantes)
// ===========================================================================
const CALCAIRE_FAIBLE = [
  "Bonne nouvelle : avec seulement {dureteVal}, l'eau de {cityName} est **naturellement douce**, ce qui préserve vos canalisations. ",
  "L'eau est ici très douce ({dureteVal}), un atout pour votre peau et vos cheveux au quotidien. ",
  "À {dureteVal}, l'eau de {cityName} ne produira quasiment pas de tartre : vos appareils vous diront merci. ",
  "La faible minéralisation de l'eau ({dureteVal}) à {cityName} est idéale pour les peaux sensibles et les cheveux fragiles. ",
  "L'eau douce de {cityName} ({dureteVal}) limite naturellement l'usage de lessive et de produits détartrants. ",
  "À {cityName}, l'eau est si douce ({dureteVal}) qu'un adoucisseur serait totalement superflu. ",
];

// ===========================================================================
// SLOT D'' : EAU MOYENNE (10-25°f) (5 variantes)
// ===========================================================================
const CALCAIRE_MOYEN = [
  "Avec une dureté de {dureteVal}, l'eau de {cityName} présente un équilibre minéral correct, sans excès de calcaire. ",
  "La dureté mesurée ({dureteVal}) place {cityName} dans une moyenne confortable : ni trop calcaire, ni trop douce. ",
  "À {dureteVal}, l'eau de {cityName} offre un bon compromis : suffisamment minéralisée sans être agressive pour les canalisations. ",
  "Le taux de calcaire à {cityName} ({dureteVal}) reste dans des proportions raisonnables pour un usage domestique normal. ",
  "L'équilibre calco-carbonique de l'eau à {cityName} est satisfaisant ({dureteVal}) : pas de problème majeur à signaler. ",
];

// ===========================================================================
// SLOT E : NITRATES (6 variantes)
// ===========================================================================
const NITRATES_ELEVES = [
  "On note une présence de **nitrates** ({nitratesVal}), un taux qui reste sous la limite réglementaire de 50 mg/L mais mérite l'attention, surtout pour les nourrissons. ",
  "Les nitrates mesurés ({nitratesVal}) à {cityName} indiquent une influence agricole sur la ressource en eau, sans toutefois dépasser les seuils critiques. ",
  "Avec {nitratesVal} de nitrates, l'eau de {cityName} reste conforme mais la vigilance est de mise pour les biberons des tout-petits. ",
  "Le taux de nitrates ({nitratesVal}) à {cityName} est modéré : il reflète le contexte agricole du secteur sans constituer un danger immédiat. ",
  "Les relevés montrent {nitratesVal} de nitrates à {cityName} — un niveau acceptable pour les adultes mais qui justifie une surveillance continue. ",
  "La présence de nitrates ({nitratesVal}) à {cityName} est à surveiller, particulièrement pour l'alimentation des nourrissons de moins de 6 mois. ",
];

// ===========================================================================
// SLOT F : PFAS (8 variantes — présence vs absence)
// ===========================================================================
const PFAS_PRESENCE = [
  "Enfin, concernant les **PFAS (polluants éternels)** : les analyses à {cityName} révèlent une présence à surveiller ({pfasVal}), bien que sous le seuil de 0,1 µg/L préconisé par les futures normes européennes. ",
  "Le dossier PFAS à {cityName} mérite l'attention : les relevés indiquent {pfasVal}, un chiffre qui reste contenu mais qui rappelle l'importance de la surveillance de ces composés. ",
  "À {cityName}, les PFAS sont détectés à hauteur de {pfasVal} — un niveau inférieur au futur seuil européen mais qui illustre la persistance de ces substances dans l'environnement. ",
  "Les analyses PFAS à {cityName} ({pfasVal}) sont conformes aux exigences actuelles mais les normes se durcissent : ce paramètre est à suivre. ",
  "La présence de PFAS à {cityName} ({pfasVal}), même sous les seuils, rappelle que ces polluants industriels sont omniprésents dans les ressources en eau françaises. ",
  "Les polluants éternels sont mesurés à {pfasVal} à {cityName}. Ce taux, bien qu'inférieur aux normes, justifie une surveillance pérenne. ",
  "Le taux de PFAS à {cityName} ({pfasVal}) témoigne d'une contamination diffuse, commune à de nombreux territoires français, mais maîtrisée. ",
  "À {pfasVal}, les PFAS de {cityName} restent dans les clous réglementaires, mais la réglementation européenne évolue rapidement sur ce sujet. ",
];

const PFAS_ABSENCE = [
  "Côté **PFAS (polluants éternels)**, les analyses à {cityName} ne détectent aucune anomalie majeure ({pfasVal}), un très bon point pour la commune. ",
  "Bonne nouvelle : les PFAS sont quasiment absents de l'eau de {cityName} ({pfasVal}), un résultat rassurant pour les habitants. ",
  "Les relevés PFAS à {cityName} ({pfasVal}) sont excellents : la ressource locale est préservée de cette pollution émergente. ",
  "À {cityName}, l'eau affiche des taux de PFAS négligeables ({pfasVal}), ce qui place la commune parmi les bons élèves sur ce paramètre. ",
  "Les polluants éternels ne sont pas un sujet d'inquiétude à {cityName} : les mesures donnent {pfasVal}, un niveau très faible. ",
  "La recherche de PFAS à {cityName} ({pfasVal}) confirme la bonne qualité de la ressource sur ce paramètre émergent. ",
  "Avec {pfasVal} de PFAS, l'eau de {cityName} figure parmi les mieux notées sur ce critère dans le département. ",
  "Le bilan PFAS est rassurant à {cityName} ({pfasVal}) : la qualité de la ressource souterraine est préservée. ",
];

// ===========================================================================
// SLOT G : MISE EN PERSPECTIVE DÉPARTEMENT (10 variantes)
// ===========================================================================
const PERSPECTIVE_DEPT = [
  "À l'échelle du département, le taux de conformité atteint {conformRate}%, une dynamique dans laquelle **{cityName}** s'inscrit pleinement. ",
  "Pour situer {cityName} dans son contexte : le département affiche un taux de conformité global de {conformRate}%. ",
  "Comparée aux autres communes du département ({conformRate}% de conformité), {cityName} se situe dans la tendance générale. ",
  "Le département enregistre {conformRate}% d'analyses conformes : {cityName} participe à cette dynamique territoriale. ",
  "Avec {conformRate}% de conformité à l'échelle départementale, la qualité de l'eau à {cityName} reflète un contexte plutôt favorable. ",
  "Les chiffres du département ({conformRate}% de conformité) donnent un cadre de référence pour apprécier la situation de {cityName}. ",
  "Dans un département où {conformRate}% des prélèvements sont conformes, {cityName} illustre cette réalité du terrain. ",
  "La conformité départementale de {conformRate}% contextualise les résultats de {cityName} : la commune n'est pas un cas isolé. ",
  "Le panorama départemental ({conformRate}% conforme) permet de relativiser les performances de {cityName}. ",
  "À l'échelle du territoire ({conformRate}% de conformité), la situation de {cityName} est représentative des enjeux locaux. ",
];

// ===========================================================================
// STRUCTURES DE PARAGRAPHE (4 profils)
// ===========================================================================

/**
 * Profil EXCELLENT (score >= 9)
 * Angle : célébration, référence locale, fierté
 */
function buildExcellent(cityName, nomReseau, isConform, deptAvg, dpt, regionalInfo, currentYear, metrics) {
  const slots = {
    intro: pick(INTRO_CONFORME, cityName, dpt, 1),
    reseau: pick(RESEAU, cityName, dpt, 2),
    consommation: pick(CONSO_CONFORME, cityName, dpt, 3),
    durete: "", // rempli après
    nitrates: "",
    pfas: "",
    perspective: pick(PERSPECTIVE_DEPT, cityName, dpt, 7),
  };

  const durete = parseFloat(String(metrics.dureteVal).replace(",", "."));
  if (durete > 25) slots.durete = pick(CALCAIRE_ELEVE, cityName, dpt, 4);
  else if (durete > 0 && durete < 10) slots.durete = pick(CALCAIRE_FAIBLE, cityName, dpt, 4);
  else slots.durete = pick(CALCAIRE_MOYEN, cityName, dpt, 4);

  const nitrates = parseFloat(String(metrics.nitratesVal).replace(",", "."));
  if (nitrates > 20) slots.nitrates = pick(NITRATES_ELEVES, cityName, dpt, 5);

  const pfas = parseFloat(String(metrics.pfasVal).replace("<", "").replace(",", "."));
  if (!isNaN(pfas)) {
    if (pfas > 0.08) slots.pfas = pick(PFAS_PRESENCE, cityName, dpt, 6);
    else slots.pfas = pick(PFAS_ABSENCE, cityName, dpt, 6);
  }

  const phraseIntro = `Les chiffres parlent d'eux-mêmes : avec un Indice de Pureté de ${metrics.cityScore}/10, ${cityName} fait partie des meilleures communes françaises pour la qualité de l'eau en ${currentYear}. `;
  const phraseConclusion = `En résumé, les habitants de ${cityName} bénéficient d'une eau d'excellente qualité, parmi les plus sûres du territoire. Une fierté locale qui mérite d'être soulignée.`;

  return buildParagraph(slots, cityName, nomReseau, currentYear, metrics, phraseIntro, phraseConclusion);
}

/**
 * Profil BON (score 7-8.9)
 * Angle : rassurant, quelques nuances, recommandations
 */
function buildGood(cityName, nomReseau, isConform, deptAvg, dpt, regionalInfo, currentYear, metrics) {
  const slots = {
    intro: pick(INTRO_CONFORME, cityName, dpt, 1),
    reseau: pick(RESEAU, cityName, dpt, 2),
    consommation: pick(CONSO_CONFORME, cityName, dpt, 3),
    durete: "",
    nitrates: "",
    pfas: "",
    perspective: pick(PERSPECTIVE_DEPT, cityName, dpt, 7),
  };

  const durete = parseFloat(String(metrics.dureteVal).replace(",", "."));
  if (durete > 25) slots.durete = pick(CALCAIRE_ELEVE, cityName, dpt, 4);
  else if (durete > 0 && durete < 10) slots.durete = pick(CALCAIRE_FAIBLE, cityName, dpt, 4);
  else slots.durete = pick(CALCAIRE_MOYEN, cityName, dpt, 4);

  const nitrates = parseFloat(String(metrics.nitratesVal).replace(",", "."));
  if (nitrates > 20) slots.nitrates = pick(NITRATES_ELEVES, cityName, dpt, 5);

  const pfas = parseFloat(String(metrics.pfasVal).replace("<", "").replace(",", "."));
  if (!isNaN(pfas)) {
    if (pfas > 0.08) slots.pfas = pick(PFAS_PRESENCE, cityName, dpt, 6);
    else slots.pfas = pick(PFAS_ABSENCE, cityName, dpt, 6);
  }

  const phraseIntro = `Avec un score de ${metrics.cityScore}/10, l'eau de ${cityName} se situe dans une fourchette rassurante. `;
  const phraseConclusion = `Dans l'ensemble, les habitants de ${cityName} peuvent aborder leur consommation d'eau avec sérénité, tout en restant attentifs aux paramètres évoqués ci-dessus.`;

  return buildParagraph(slots, cityName, nomReseau, currentYear, metrics, phraseIntro, phraseConclusion);
}

/**
 * Profil MOYEN (score 4-6.9)
 * Angle : nuancé, points d'attention, conseils pratiques
 */
function buildAverage(cityName, nomReseau, isConform, deptAvg, dpt, regionalInfo, currentYear, metrics) {
  const introVariant = isConform
    ? pick(INTRO_CONFORME, cityName, dpt, 1)
    : pick(INTRO_NON_CONFORME, cityName, dpt, 1);

  const slots = {
    intro: introVariant,
    reseau: pick(RESEAU, cityName, dpt, 2),
    consommation: isConform ? pick(CONSO_CONFORME, cityName, dpt, 3) : "",
    durete: "",
    nitrates: "",
    pfas: "",
    perspective: pick(PERSPECTIVE_DEPT, cityName, dpt, 7),
  };

  const durete = parseFloat(String(metrics.dureteVal).replace(",", "."));
  if (durete > 25) slots.durete = pick(CALCAIRE_ELEVE, cityName, dpt, 4);
  else if (durete > 0 && durete < 10) slots.durete = pick(CALCAIRE_FAIBLE, cityName, dpt, 4);
  else slots.durete = pick(CALCAIRE_MOYEN, cityName, dpt, 4);

  const nitrates = parseFloat(String(metrics.nitratesVal).replace(",", "."));
  if (nitrates > 20) slots.nitrates = pick(NITRATES_ELEVES, cityName, dpt, 5);

  const pfas = parseFloat(String(metrics.pfasVal).replace("<", "").replace(",", "."));
  if (!isNaN(pfas)) {
    if (pfas > 0.08) slots.pfas = pick(PFAS_PRESENCE, cityName, dpt, 6);
    else slots.pfas = pick(PFAS_ABSENCE, cityName, dpt, 6);
  }

  const phraseIntro = `Avec un Indice de Pureté de ${metrics.cityScore}/10, l'eau de ${cityName} présente un bilan en demi-teinte : ni alarmant, ni exemplaire. `;
  const phraseConclusion = `Pour les habitants de ${cityName}, quelques gestes simples (carafe filtrante pour le goût, nettoyage régulier des robinets) suffisent à optimiser leur confort au quotidien.`;

  return buildParagraph(slots, cityName, nomReseau, currentYear, metrics, phraseIntro, phraseConclusion);
}

/**
 * Profil MAUVAIS (score < 4)
 * Angle : transparence, explication des risques, solutions concrètes
 */
function buildPoor(cityName, nomReseau, isConform, deptAvg, dpt, regionalInfo, currentYear, metrics) {
  const slots = {
    intro: pick(INTRO_NON_CONFORME, cityName, dpt, 1),
    reseau: pick(RESEAU, cityName, dpt, 2),
    durete: "",
    nitrates: "",
    pfas: "",
    perspective: pick(PERSPECTIVE_DEPT, cityName, dpt, 7),
  };

  const durete = parseFloat(String(metrics.dureteVal).replace(",", "."));
  if (durete > 25) slots.durete = pick(CALCAIRE_ELEVE, cityName, dpt, 4);
  else if (durete > 0 && durete < 10) slots.durete = pick(CALCAIRE_FAIBLE, cityName, dpt, 4);
  else slots.durete = pick(CALCAIRE_MOYEN, cityName, dpt, 4);

  const nitrates = parseFloat(String(metrics.nitratesVal).replace(",", "."));
  if (nitrates > 20) slots.nitrates = pick(NITRATES_ELEVES, cityName, dpt, 5);

  const pfas = parseFloat(String(metrics.pfasVal).replace("<", "").replace(",", "."));
  if (!isNaN(pfas)) {
    if (pfas > 0.08) slots.pfas = pick(PFAS_PRESENCE, cityName, dpt, 6);
    else slots.pfas = pick(PFAS_ABSENCE, cityName, dpt, 6);
  }

  const phraseIntro = `Le constat est clair : avec un score de ${metrics.cityScore}/10, l'eau de ${cityName} nécessite des améliorations. `;
  const phraseConclusion = `En attendant une amélioration du réseau, les habitants de ${cityName} peuvent investir dans une solution de filtration domestique (osmose inverse ou charbon actif) pour sécuriser leur consommation.`;

  return buildParagraph(slots, cityName, nomReseau, currentYear, metrics, phraseIntro, phraseConclusion);
}

// ---------------------------------------------------------------------------
// Assemblage final du paragraphe
// ---------------------------------------------------------------------------
function buildParagraph(slots, cityName, nomReseau, currentYear, metrics, phraseIntro, phraseConclusion) {
  const vars = { cityName, nomReseau, currentYear, ...metrics };
  let text = "";

  // Phrase d'intro contextuelle (propre au profil)
  text += fmt(phraseIntro, vars);

  // Slot A : Verdict ARS
  text += fmt(slots.intro, vars);

  // Slot B : Réseau
  text += fmt(slots.reseau, vars);

  // Slot C : Consommation (si applicable)
  if (slots.consommation) {
    text += fmt(slots.consommation, vars);
  }

  // Slot D : Dureté
  if (slots.durete) {
    text += fmt(slots.durete, vars);
  }

  // Slot E : Nitrates
  if (slots.nitrates) {
    text += fmt(slots.nitrates, vars);
  }

  // Slot F : PFAS
  if (slots.pfas) {
    text += fmt(slots.pfas, vars);
  }

  // Slot G : Perspective département
  if (slots.perspective) {
    text += fmt(slots.perspective, vars);
  }

  // Phrase de conclusion (propre au profil)
  text += fmt(phraseConclusion, vars);

  return text;
}

// ===========================================================================
// EXPORT PRINCIPAL
// ===========================================================================

/**
 * Génère le paragraphe "Verdict de l'Expert" pour une ville donnée.
 *
 * @param {object} params
 * @param {string} params.cityName   - Nom de la ville
 * @param {string} params.nomReseau  - Nom du gestionnaire de réseau
 * @param {boolean} params.isConform - Conformité ARS
 * @param {number} params.cityScore  - Score Crystal (1-10)
 * @param {object} params.deptAvg    - Moyennes départementales
 * @param {string} params.dpt        - Code département
 * @param {object} params.regionalInfo - Infos régionales
 * @param {number} params.currentYear - Année
 * @param {object} params.metrics    - Valeurs formatées (dureteVal, nitratesVal, pfasVal, etc.)
 * @returns {string} Paragraphe HTML
 */
export function generateExpertVerdict({ cityName, nomReseau, isConform, cityScore, deptAvg, dpt, regionalInfo, currentYear, metrics }) {
  const enrichedMetrics = { ...metrics, cityScore, conformRate: deptAvg?.conformRate };
  if (cityScore >= 9) {
    return buildExcellent(cityName, nomReseau, isConform, deptAvg, dpt, regionalInfo, currentYear, enrichedMetrics);
  } else if (cityScore >= 7) {
    return buildGood(cityName, nomReseau, isConform, deptAvg, dpt, regionalInfo, currentYear, enrichedMetrics);
  } else if (cityScore >= 4) {
    return buildAverage(cityName, nomReseau, isConform, deptAvg, dpt, regionalInfo, currentYear, enrichedMetrics);
  } else {
    return buildPoor(cityName, nomReseau, isConform, deptAvg, dpt, regionalInfo, currentYear, enrichedMetrics);
  }
}

// ===========================================================================
// FOCUS & SANTÉ : Variantes enrichies
// ===========================================================================

export const FOCUS_VARIANTS = {
  calcaire: {
    eleve: [
      { titre: "🧼 Alerte Calcaire à {cityName}", texte: "L'eau de {cityName} affiche une dureté importante ({dureteVal}). Sans adoucisseur, le tartre s'accumulera rapidement dans votre chauffe-eau et vos équipements. Un détartrage annuel est vivement conseillé." },
      { titre: "🪨 Eau calcaire : mode d'emploi à {cityName}", texte: "Avec {dureteVal} de dureté, l'eau de {cityName} est classée comme calcaire. Pour protéger vos appareils, installez un adoucisseur ou prévoyez un détartrage régulier de votre ballon d'eau chaude." },
      { titre: "⚠️ Tartre & Calcaire à {cityName}", texte: "La dureté de l'eau atteint {dureteVal} à {cityName}. Concrètement, vos robinets et votre bouilloire s'entartrent vite. Un adoucisseur au point d'entrée peut résoudre le problème à la source." },
      { titre: "🏠 Protégez votre maison du calcaire à {cityName}", texte: "L'eau de {cityName} ({dureteVal}) est riche en minéraux. Si vous constatez des traces blanches sur votre vaisselle, c'est le signe d'un calcaire actif. L'installation d'un adoucisseur est un investissement rentable sur le long terme." },
      { titre: "💧 Eau dure à {cityName} : ce qu'il faut savoir", texte: "À {dureteVal}, l'eau de {cityName} est considérée comme dure. Les peaux sensibles peuvent ressentir des tiraillements après la douche. Un adoucisseur ou un filtre de douche peut améliorer le confort." },
    ],
    douce: [
      { titre: "✨ Douceur de l'eau à {cityName}", texte: "L'équilibre minéral de {cityName} est parfait ({dureteVal}). Votre eau est naturellement douce, préservant ainsi vos équipements et votre peau au quotidien. Aucun traitement anti-calcaire nécessaire." },
      { titre: "🫧 Une eau naturellement douce à {cityName}", texte: "Avec seulement {dureteVal}, l'eau de {cityName} est remarquablement douce. Vos cheveux et votre peau vous remercieront, et vos appareils électroménagers dureront plus longtemps." },
      { titre: "🌟 L'eau douce, un privilège à {cityName}", texte: "La faible dureté de l'eau à {cityName} ({dureteVal}) est une excellente nouvelle : moins de tartre, moins de lessive, et une sensation soyeuse au quotidien." },
      { titre: "💎 Pureté minérale à {cityName}", texte: "L'eau de {cityName} ({dureteVal}) est pauvre en calcaire, ce qui en fait une eau idéale pour la toilette et l'entretien de la maison. Un vrai plus au quotidien." },
      { titre: "🛁 Confort & Douceur à {cityName}", texte: "Avec {dureteVal} de dureté, l'eau de {cityName} caresse la peau sans l'agresser. Les personnes sujettes à l'eczéma ou aux irritations cutanées apprécieront cette douceur naturelle." },
    ],
    moyenne: [
      { titre: "⚖️ Un bon équilibre minéral à {cityName}", texte: "Avec {dureteVal}, l'eau de {cityName} présente un équilibre satisfaisant. Ni trop calcaire, ni trop douce : vos appareils ne souffriront pas d'un entartrage excessif." },
      { titre: "✅ Dureté modérée à {cityName}", texte: "La dureté de {dureteVal} à {cityName} est dans la norme. Un entretien régulier de vos robinetteries suffit à prévenir les dépôts de tartre." },
    ],
  },
  chlore: {
    present: [
      { titre: "🧪 Atténuer le goût de chlore à {cityName}", texte: "Avec un taux de {chloreVal}, un léger goût de Javel peut être perceptible. Laissez reposer l'eau 15 minutes en carafe avant dégustation : le chlore s'évapore naturellement." },
      { titre: "💨 Une odeur de chlore ? Voici l'astuce", texte: "Le chlore mesuré à {cityName} ({chloreVal}) peut donner un goût chloré à l'eau. Remplissez une carafe et placez-la au réfrigérateur une heure : le goût disparaît." },
      { titre: "🍶 Eau chlorée à {cityName} : le bon geste", texte: "À {chloreVal}, le taux de chlore est modéré mais peut altérer le goût. L'astuce : une carafe en verre au frigo pendant 30 minutes suffit à retrouver une eau neutre." },
      { titre: "🔄 Chlore & Saveur à {cityName}", texte: "Le chlore ({chloreVal}) est essentiel pour la désinfection mais peut gêner au goût. Un filtre à charbon actif ou une simple carafe ouverte résout le problème en quelques minutes." },
    ],
    absent: [
      { titre: "💧 Une eau au goût neutre à {cityName}", texte: "Grâce à un réseau parfaitement optimisé, le taux de chlore à {cityName} est faible ({chloreVal}), garantissant une eau sans aucune odeur désagréable. Le goût est neutre et agréable." },
      { titre: "👌 Aucun arrière-goût à {cityName}", texte: "Le chlore est quasi indétectable à {cityName} ({chloreVal}). Vous pouvez boire l'eau du robinet sans aucune altération de saveur." },
      { titre: "🥛 Une eau pure au robinet à {cityName}", texte: "Avec {chloreVal} de chlore résiduel, l'eau de {cityName} ne présente aucun goût chloré. Une eau agréable à boire telle quelle." },
    ],
  },
  sante: {
    excellent: [
      { titre: "🥗 Pureté & Vitalité à {cityName}", texte: "Les indicateurs de santé (Nitrates : {nitratesVal}, PFAS : {pfasVal}) sont excellents. L'eau de {cityName} est parfaitement adaptée à une consommation quotidienne pour toute la famille." },
      { titre: "🏅 Une eau exemplaire à {cityName}", texte: "Nitrates, PFAS, pesticides : tous les voyants sont au vert à {cityName} ({nitratesVal} / {pfasVal}). Une eau irréprochable pour votre santé." },
      { titre: "💪 Eau saine & équilibrée à {cityName}", texte: "Avec des taux de nitrates ({nitratesVal}) et de PFAS ({pfasVal}) très bas, l'eau de {cityName} coche toutes les cases pour une hydratation quotidienne sans risque." },
    ],
    vigilance: [
      { titre: "🛡️ Vigilance & Santé à {cityName}", texte: "La qualité de l'eau à {cityName} présente des points d'attention (Nitrates : {nitratesVal}, PFAS : {pfasVal}). Une vigilance particulière est recommandée pour les nourrissons et les personnes immunodéprimées." },
      { titre: "🔍 Points de vigilance à {cityName}", texte: "Certains paramètres méritent votre attention à {cityName} : les taux de nitrates ({nitratesVal}) et de PFAS ({pfasVal}) sont à surveiller. Un filtre à charbon actif peut apporter une sécurité supplémentaire." },
      { titre: "⚠️ Surveillance recommandée à {cityName}", texte: "L'eau de {cityName} présente des traces de contaminants (nitrates : {nitratesVal}, PFAS : {pfasVal}). Pour les personnes fragiles, une filtration complémentaire est un choix prudent." },
    ],
    bonne: [
      { titre: "👍 Une eau saine dans l'ensemble à {cityName}", texte: "Les principaux indicateurs sont bons (Nitrates : {nitratesVal}, PFAS : {pfasVal}). L'eau de {cityName} convient pour un usage quotidien sans précaution particulière." },
      { titre: "✅ Qualité sanitaire correcte à {cityName}", texte: "Nitrates ({nitratesVal}) et PFAS ({pfasVal}) sont dans les normes à {cityName}. Une eau globalement saine pour la consommation courante." },
    ],
  },
};

// ===========================================================================
// FAQ : Variantes enrichies
// ===========================================================================

export const FAQ_VARIANTS = {
  qualite: {
    bonne: [
      `Oui, avec un score Crystal de {score}/10, l'eau de {cityName} est jugée de bonne qualité et respecte les normes sanitaires de l'ARS en {currentYear}.`,
      `Absolument. En {currentYear}, l'ARS attribue un score de {score}/10 à l'eau de {cityName}, ce qui la classe parmi les eaux de bonne qualité dans le département.`,
      `Oui, les analyses {currentYear} confirment que l'eau de {cityName} ({score}/10) satisfait aux exigences du Code de la Santé Publique.`,
    ],
    moyenne: [
      `Avec un score de {score}/10, l'eau de {cityName} est conforme mais présente quelques points d'amélioration. Consultez le détail dans notre analyse ci-dessus.`,
      `Globalement oui, mais avec des nuances. Le score de {score}/10 reflète une qualité correcte, sans être excellente. Certains paramètres méritent votre attention.`,
    ],
    mauvaise: [
      `La vigilance est de mise : le score de {score}/10 reflète des dépassements sur certains critères de qualité. L'eau est officiellement classée comme non conforme par l'ARS en {currentYear}.`,
      `Malheureusement non. Avec {score}/10, l'eau de {cityName} présente des non-conformités en {currentYear}. Nous vous recommandons de consulter les recommandations dans notre analyse.`,
    ],
  },
  calcaire: [
    "Les dernières analyses mesurent une dureté (TH) de {durete}°f à {cityName}. {conclusion}.",
  ],
  calcaireConclusion: {
    dur: "Une eau considérée comme très calcaire — un adoucisseur est recommandé pour protéger vos installations",
    moyen: "Une eau moyennement calcaire — un entretien régulier des robinetteries suffit",
    doux: "Une eau douce et agréable — aucun traitement anti-calcaire nécessaire",
  },
  pfas: {
    present: "La surveillance des PFAS devient systématique en 2026. À {cityName}, les derniers relevés indiquent des taux à surveiller ({pfas}). La situation reste sous contrôle mais mérite une attention continue.",
    absent: "La surveillance des PFAS devient systématique en 2026. À {cityName}, les derniers relevés ({pfas}) sont conformes aux futures normes européennes (0,1 µg/L). Une bonne nouvelle pour la commune.",
  },
  carafe: {
    calcaire: "L'eau étant calcaire ({dureteVal}), un adoucisseur protégera vos installations (chauffe-eau, lave-linge). Pour le goût, une carafe filtrante peut aider si vous êtes sensible au chlore.",
    douce: "L'eau est naturellement douce ({dureteVal}), un adoucisseur est inutile. Pour le goût, une simple carafe en verre au réfrigérateur suffit si vous percevez un léger goût de chlore.",
    moyenne: "L'eau a une dureté modérée ({dureteVal}). Un adoucisseur n'est pas indispensable. Pour le goût, une carafe filtrante peut améliorer votre confort si vous êtes sensible.",
  },
};

// ===========================================================================
// VARIANTES ÉTENDUES (pools élargis + sous-titres de sections + note bébé)
// ===========================================================================

export const FAQ_QUALITE = {
  bonne: [
    `Oui, avec un score Crystal de {score}/10, l'eau de {cityName} est jugée de bonne qualité et respecte les normes sanitaires de l'ARS en {currentYear}.`,
    `Absolument. En {currentYear}, l'ARS attribue un score de {score}/10 à l'eau de {cityName}, ce qui la classe parmi les eaux de bonne qualité dans le département.`,
    `Oui, les analyses {currentYear} confirment que l'eau de {cityName} ({score}/10) satisfait aux exigences du Code de la Santé Publique.`,
    `Tout à fait : le score de {score}/10 obtenu par {cityName} place la commune dans la bonne fourchette de qualité pour {currentYear}.`,
    `Les contrôles ARS sont clairs : avec {score}/10, l'eau de {cityName} peut être consommée sans réserve en {currentYear}.`,
    `Oui. Le Crystal Score de {score}/10 reflète une eau conforme et régulièrement contrôlée à {cityName} en {currentYear}.`,
  ],
  moyenne: [
    `Avec un score de {score}/10, l'eau de {cityName} est conforme mais présente quelques points d'amélioration. Consultez le détail dans notre analyse ci-dessus.`,
    `Globalement oui, mais avec des nuances. Le score de {score}/10 reflète une qualité correcte, sans être excellente. Certains paramètres méritent votre attention.`,
    `L'eau de {cityName} obtient {score}/10 : conforme aux limites, elle présente toutefois des marges de progrès sur quelques paramètres.`,
    `Le bilan est correct sans être parfait. À {score}/10, l'eau de {cityName} reste potable mais certains indicateurs invitent à la vigilance.`,
    `La conformité est assurée, mais le score de {score}/10 à {cityName} signale des points perfectibles détaillés plus haut.`,
  ],
  mauvaise: [
    `La vigilance est de mise : le score de {score}/10 reflète des dépassements sur certains critères de qualité. L'eau est officiellement classée comme non conforme par l'ARS en {currentYear}.`,
    `Malheureusement non. Avec {score}/10, l'eau de {cityName} présente des non-conformités en {currentYear}. Nous vous recommandons de consulter les recommandations dans notre analyse.`,
    `Non : le score de {score}/10 traduit des dépassements de limites de qualité à {cityName} en {currentYear}. Suivez les consignes de l'ARS.`,
    `L'eau de {cityName} n'est pas conforme aux exigences sanitaires en {currentYear} ({score}/10). Des restrictions d'usage peuvent s'appliquer.`,
    `Le verdict est défavorable : {score}/10 à {cityName}, avec des dépassements documentés par l'ARS en {currentYear}.`,
  ],
};

export const FAQ_CALCAIRE_INTRO = [
  "Les dernières analyses mesurent une dureté (TH) de {durete}°f à {cityName}. {conclusion}.",
  "La dureté de l'eau s'établit à {durete}°f à {cityName}, d'après les relevés ARS. {conclusion}.",
  "À {cityName}, le titre hydrotimétrique atteint {durete}°f. {conclusion}.",
  "Les prélèvements indiquent une dureté de {durete}°f à {cityName}. {conclusion}.",
  "Avec {durete}°f de dureté mesurés à {cityName}, {conclusion}.",
];

export const FAQ_CALCAIRE_CONCLUSION = {
  dur: [
    "Une eau considérée comme très calcaire — un adoucisseur est recommandé pour protéger vos installations",
    "Une eau dure, qui entartre rapidement les équipements — l'installation d'un adoucisseur est conseillée",
    "Une eau très minéralisée : pensez à détartrer régulièrement vos appareils ou à installer un adoucisseur",
    "Une eau calcaire qui use prématurément chauffe-eau et robinetterie — un adoucisseur est un bon investissement",
    "Une eau franchement dure : sans adoucisseur, le tartre s'accumulera vite dans vos équipements",
    "Une dureté élevée, à traiter par adoucisseur pour limiter l'entartrage des canalisations",
    "Une eau très calcaire qui demande un entretien suivi, voire un adoucisseur au point d'entrée",
    "Une minéralisation forte : un adoucisseur prolongera nettement la durée de vie de vos appareils",
  ],
  moyen: [
    "Une eau moyennement calcaire — un entretien régulier des robinetteries suffit",
    "Une dureté dans la moyenne — aucun traitement particulier n'est indispensable",
    "Un équilibre minéral correct : un détartrage d'entretien de temps à autre suffit",
    "Une eau ni trop dure ni trop douce — une maintenance courante suffit à éviter le tartre",
    "Une dureté modérée, sans conséquence notable sur les équipements",
    "Une eau équilibrée : quelques gestes d'entretien suffisent au quotidien",
    "Une minéralisation moyenne, qui ne nécessite pas d'adoucisseur",
    "Une eau dans la norme, sans risque majeur d'entartrage",
  ],
  doux: [
    "Une eau douce et agréable — aucun traitement anti-calcaire nécessaire",
    "Une eau naturellement douce, idéale pour la peau et les équipements",
    "Une faible dureté : aucun adoucisseur n'est requis",
    "Une eau peu minéralisée, qui ne produira quasiment pas de tartre",
    "Une eau très douce, confortable pour la toilette comme pour les appareils",
    "Une douceur naturelle : inutile d'investir dans un adoucisseur",
    "Une eau faiblement minéralisée, sans dépôts calcaires notables",
    "Une eau douce, un atout pour la peau sensible et la longévité des équipements",
  ],
};

export const FAQ_PFAS = {
  present: [
    "La surveillance des PFAS devient systématique en 2026. À {cityName}, les derniers relevés indiquent des taux à surveiller ({pfas}). La situation reste sous contrôle mais mérite une attention continue.",
    "Les PFAS sont détectés à {cityName} ({pfas}), sous le seuil réglementaire de 0,1 µg/L mais dans une zone de vigilance. La réglementation européenne se durcit : ce paramètre est à suivre.",
    "À {cityName}, les polluants éternels affichent {pfas}. Ce taux reste contenu, mais la persistance de ces composés justifie une surveillance pérenne depuis 2026.",
    "Les analyses PFAS de {cityName} ({pfas}) sont conformes aux exigences actuelles, sans être nulles : la ressource présente une contamination diffuse à surveiller.",
    "Présence de PFAS mesurée à {pfas} à {cityName}. Bien qu'en deçà de la limite de 0,1 µg/L, ce résultat appelle une vigilance renforcée en 2026.",
  ],
  absent: [
    "La surveillance des PFAS devient systématique en 2026. À {cityName}, les derniers relevés ({pfas}) sont conformes aux futures normes européennes (0,1 µg/L). Une bonne nouvelle pour la commune.",
    "Bonne nouvelle : les PFAS sont quasiment absents de l'eau de {cityName} ({pfas}). La ressource locale est préservée de cette pollution émergente.",
    "Les relevés PFAS à {cityName} ({pfas}) sont excellents : aucun dépassement du seuil de 0,1 µg/L fixé pour 2026.",
    "À {cityName}, les polluants éternels affichent un niveau négligeable ({pfas}), signe d'une ressource bien protégée.",
    "Les contrôles PFAS de 2026 ne détectent rien d'inquiétant à {cityName} ({pfas}). Un atout pour la commune.",
  ],
};

export const FAQ_CARAFE = {
  calcaire: [
    "L'eau étant calcaire ({dureteVal}), un adoucisseur protégera vos installations (chauffe-eau, lave-linge). Pour le goût, une carafe filtrante peut aider si vous êtes sensible au chlore.",
    "Face à une eau dure ({dureteVal}), un adoucisseur limite le tartre. Côté goût, une carafe filtrante suffit si le chlore vous gêne.",
    "Avec {dureteVal} de dureté, prévoyez un adoucisseur pour vos équipements. Une carafe filtrante améliorera le goût en cas de sensibilité au chlore.",
    "Une eau à {dureteVal} gagnera à être adoucie pour protéger chauffe-eau et lave-linge. Pour le goût, la carafe filtrante est optionnelle.",
    "Devant une eau aussi dure ({dureteVal}), l'adoucisseur est l'option recommandée. Une carafe filtrante reste utile pour atténuer un goût chloré.",
    "À {dureteVal}, protégez vos appareils avec un adoucisseur. Si le goût vous importe, une carafe filtrante apporte un confort supplémentaire.",
    "Une dureté de {dureteVal} justifie un adoucisseur pour vos installations. Pour le goût, la carafe filtrante est un simple plus.",
    "Une eau très minéralisée ({dureteVal}) : adoucisseur conseillé pour le matériel, carafe filtrante optionnelle pour le goût.",
  ],
  douce: [
    "L'eau est naturellement douce ({dureteVal}), un adoucisseur est inutile. Pour le goût, une simple carafe en verre au réfrigérateur suffit si vous percevez un léger goût de chlore.",
    "Inutile d'investir dans un adoucisseur : l'eau est douce ({dureteVal}). Une carafe au réfrigérateur suffit à gommer un éventuel goût de chlore.",
    "Avec une eau aussi douce ({dureteVal}), aucun traitement anti-calcaire n'est requis. Pour le goût, la carafe en verre au frigo est la solution la plus simple.",
    "Pas besoin d'adoucisseur ({dureteVal}). Si le goût vous gêne, laissez l'eau une heure en carafe au réfrigérateur.",
    "Une dureté faible ({dureteVal}) rend l'adoucisseur superflu. Pour le goût, la carafe au frais est amplement suffisante.",
    "L'eau est douce ({dureteVal}) : économisez l'adoucisseur. Une carafe en verre au réfrigérateur affine le goût si besoin.",
    "Aucun adoucisseur nécessaire avec {dureteVal}. Pour une eau plus agréable, une carafe au frais fait l'affaire.",
    "Une eau faiblement minéralisée ({dureteVal}) : pas de traitement anti-calcaire. La carafe au réfrigérateur suffit pour le goût.",
  ],
  moyenne: [
    "L'eau a une dureté modérée ({dureteVal}). Un adoucisseur n'est pas indispensable. Pour le goût, une carafe filtrante peut améliorer votre confort si vous êtes sensible.",
    "Dureté moyenne ({dureteVal}) : pas d'adoucisseur nécessaire, un entretien courant suffit. Une carafe filtrante peut affiner le goût.",
    "À {dureteVal}, l'eau est équilibrée : aucun traitement obligatoire. Côté goût, la carafe filtrante reste une option confort.",
    "Une dureté dans la norme ({dureteVal}). Un adoucisseur est superflu ; une carafe filtrante suffit pour le goût.",
    "Une minéralisation moyenne ({dureteVal}) : adoucisseur non requis. Pour le goût, la carafe filtrante est un choix confort.",
    "À {dureteVal}, aucun adoucisseur n'est imposé. Une carafe filtrante peut améliorer le goût si vous y êtes sensible.",
    "Dureté intermédiaire ({dureteVal}) : entretien courant recommandé, adoucisseur optionnel. La carafe filtrante répond aux sensibilités au goût.",
    "Une eau équilibrée ({dureteVal}) : pas de traitement indispensable. La carafe filtrante reste utile pour le goût.",
  ],
};

export const BEBE_NOTES = [
  "Retrouvez les seuils nourrissons et la méthode de vérification sur notre page eau du robinet pour bébé.",
  "Les seuils applicables aux nourrissons et la conduite à tenir sont détaillés sur notre page eau du robinet pour bébé.",
  "Consultez notre page eau du robinet pour bébé pour connaître les seuils et les précautions pour les nourrissons.",
  "Notre page eau du robinet pour bébé détaille les seuils adaptés aux nourrissons et les vérifications à faire.",
  "Retrouvez les seuils et précautions pour les nourrissons sur notre page eau du robinet pour bébé.",
];

// Sous-titres de sections (CORPS, pas des titres) — variés par ville.
export const SECTION_SUBTITLES = {
  verdict: [
    "Interprétation détaillée des analyses ARS et conclusion de nos spécialistes en santé environnementale.",
    "Lecture détaillée des derniers contrôles ARS, avec l'éclairage de nos analystes.",
    "Analyse commentée des prélèvements officiels et synthèse de nos spécialistes.",
    "Décryptage des résultats ARS et conclusion de notre équipe santé environnement.",
    "Ce que disent les derniers prélèvements, expliqué par nos experts en santé environnementale.",
    "Synthèse pédagogique des contrôles sanitaires et avis de nos spécialistes.",
    "Passage en revue des analyses ARS et lecture d'expert, paramètre par paramètre.",
    "Notre interprétation des données officielles, pour comprendre ce que révèle votre eau.",
  ],
  focus: [
    "Conseils personnalisés pour optimiser l'usage de votre eau au quotidien.",
    "Recommandations pratiques selon les paramètres mesurés dans votre commune.",
    "Des conseils concrets pour tirer le meilleur de votre eau du robinet.",
    "Ce que ces indicateurs changent concrètement à la maison.",
    "Gestes et bonnes pratiques adaptés aux résultats de votre commune.",
    "Comment utiliser votre eau sereinement, au vu des derniers relevés.",
    "Des astuces simples pour préserver confort et qualité au robinet.",
    "Recommandations d'usage selon les caractéristiques de votre eau.",
  ],
  price: [
    "Détail des tarifs officiels (TTC) pour la part Eau Potable et la part Assainissement.",
    "Composition du prix de l'eau (TTC) : distribution et assainissement.",
    "Décomposition du tarif officiel de l'eau potable et de l'assainissement.",
    "Ce que vous payez au mètre cube, entre eau potable et assainissement.",
    "Le prix de l'eau expliqué, du service potable à l'assainissement collectif.",
    "Structure du tarif (TTC), part distribution et part traitement des eaux usées.",
    "Comment se répartit votre facture d'eau, entre potable et assainissement.",
    "Le détail des tarifs appliqués (TTC) sur votre commune.",
  ],
  priceAep: [
    "Production, pompage et distribution jusqu'à votre robinet.",
    "Captage, traitement et acheminement de l'eau jusqu'aux abonnés.",
    "Le coût du service d'eau potable, du captage au compteur.",
    "La part correspondant à la fourniture d'eau potable.",
    "Ce que couvre le service d'eau potable : ressources, traitement et réseau.",
    "Financement du cycle urbain de l'eau potable, de la source au robinet.",
    "Le prix de l'eau livrée chez vous, traitement et distribution compris.",
    "La composante « eau potable » de votre facture.",
  ],
  priceAc: [
    "Collecte et traitement des eaux usées en station d'épuration.",
    "Assainissement collectif : évacuation et dépollution des eaux usées.",
    "Le coût de la collecte et du traitement des eaux usées.",
    "La part assainissement, de la collecte à la station d'épuration.",
    "Traitement des eaux usées, du tout-à-l'égout à la station.",
    "Ce que finance la part assainissement : réseau et stations d'épuration.",
    "La composante « assainissement » de votre facture d'eau.",
    "Collecte puis dépollution des eaux usées avant retour au milieu naturel.",
  ],
  priceTotal: [
    "Coût global au mètre cube basé sur une consommation de 120 m³.",
    "Prix de référence calculé pour une consommation annuelle de 120 m³.",
    "Montant total estimé sur la base de 120 m³ par an.",
    "Coût moyen au mètre cube pour un foyer consommant 120 m³.",
    "Estimation du prix total pour un usage annuel de 120 m³.",
    "Base de calcul : 120 m³ consommés sur l'année.",
    "Prix cumulé (potable + assainissement) pour 120 m³ par an.",
    "Tarif global estimé à partir d'une consommation de référence de 120 m³.",
  ],
  faq: [
    "Réponses aux interrogations les plus fréquentes des habitants de {cityName}.",
    "Les questions les plus posées par les habitants de {cityName}, et nos réponses.",
    "Ce que les habitants de {cityName} demandent le plus souvent à propos de leur eau.",
    "Les réponses courtes aux questions courantes sur l'eau de {cityName}.",
    "Foire aux questions : ce que vous voulez savoir sur l'eau à {cityName}.",
    "Les interrogations récurrentes des habitants de {cityName}, traitées simplement.",
    "Vos questions sur l'eau de {cityName}, et les réponses de nos experts.",
    "L'essentiel des questions posées sur la qualité de l'eau à {cityName}.",
  ],
  methodology: [
    "Les analyses de l'eau à {cityName} sont extraites en temps réel des bases de données SISE-Eaux du Ministère de la Santé (données Hub'Eau).",
    "Les données affichées pour {cityName} proviennent des bases SISE-Eaux du Ministère de la Santé, via Hub'Eau.",
    "Chaque résultat présenté pour {cityName} est issu des contrôles officiels SISE-Eaux (Ministère de la Santé).",
    "Les relevés de {cityName} sont puisés dans les bases publiques SISE-Eaux, alimentées par les ARS.",
    "Pour {cityName}, nous exploitons les données ouvertes SISE-Eaux (Hub'Eau) du Ministère de la Santé.",
    "Toutes les mesures affichées pour {cityName} viennent des bases officielles SISE-Eaux.",
    "La source de référence pour {cityName} : les contrôles sanitaires SISE-Eaux, publiés en open data.",
    "Les chiffres de {cityName} reposent sur les prélèvements ARS disponibles dans SISE-Eaux (Hub'Eau).",
  ],
  priceNotes: [
    "Source : Observatoire National SISPEA ({currentYear}). Les tarifs incluent les taxes et redevances.",
    "Données tarifaires SISPEA ({currentYear}), taxes et redevances incluses.",
    "Source : SISPEA ({currentYear}) — montants TTC, taxes et redevances comprises.",
    "Tarifs issus de l'Observatoire national SISPEA ({currentYear}) ; les taxes et redevances sont incluses.",
    "Chiffres SISPEA ({currentYear}). Tous les montants incluent taxes et redevances.",
    "Référence : Observatoire SISPEA ({currentYear}), tarifs TTC.",
  ],
  linkCalcaire: [
    "Qu'est-ce que le calcaire ?",
    "Comprendre le calcaire",
    "En savoir plus sur le calcaire",
    "Définition du calcaire",
  ],
  linkChlore: [
    "Qu'est-ce que le chlore libre ?",
    "Comprendre le chlore",
    "En savoir plus sur le chlore",
    "Définition du chlore libre",
  ],
};

export const NEARBY_INTROS = [
  "Explorez les rapports de pureté des autres territoires du département {dpt}.",
  "Comparez avec les autres communes du département {dpt}.",
  "Découvrez la qualité de l'eau des communes voisines dans le département {dpt}.",
  "Poursuivez votre exploration des communes du département {dpt}.",
];


const POSITION_BEST = [
  "affiche un bilan remarquable. Avec un Indice de Pureté de {cityScore}/10, la commune se positionne au-dessus des moyennes de {deptLabel} ({deptScore}/10) et de {regionName} ({regionScore}/10). Cette performance témoigne d'une gestion rigoureuse et place le réseau local parmi les plus sûrs de la zone.",
  "est une excellente élève. Son score de {cityScore}/10 dépasse à la fois {deptLabel} ({deptScore}/10) et {regionName} ({regionScore}/10). Un résultat qui reflète un investissement sérieux dans la qualité de l'eau.",
  "confirme son excellence. Avec {cityScore}/10, la commune fait mieux que {deptLabel} ({deptScore}/10) et que la moyenne régionale ({regionScore}/10). Les habitants peuvent être fiers de leur eau.",
  "se distingue nettement. Le score de {cityScore}/10 surpasse les références départementales ({deptScore}/10) et régionales ({regionScore}/10). Une eau parmi les plus fiables du secteur.",
  "brille par ses résultats. Avec {cityScore}/10, elle dépasse {deptLabel} ({deptScore}/10) et se hisse au-dessus de {regionName} ({regionScore}/10). Une performance solide et durable.",
  "caracole en tête du classement local : {cityScore}/10, contre {deptScore}/10 pour {deptLabel} et {regionScore}/10 pour {regionName}. Un écart qui traduit la constance du suivi sanitaire.",
  "est en haut du tableau. Le score de {cityScore}/10 devance les moyennes départementales ({deptScore}/10) et régionales ({regionScore}/10). Une qualité d'eau qui ne se dément pas.",
  "obtient un résultat brillant : {cityScore}/10, au-dessus de {deptLabel} ({deptScore}/10) et de {regionName} ({regionScore}/10). De quoi rassurer les abonnés du réseau.",
  "s'illustre par la qualité de son eau. Avec {cityScore}/10, la commune dépasse le niveau de {deptLabel} ({deptScore}/10) et de {regionName} ({regionScore}/10).",
  "décroche une note élevée ({cityScore}/10) qui surclasse {deptLabel} ({deptScore}/10) comme {regionName} ({regionScore}/10). Le réseau local fait figure de référence.",
  "se hisse au-dessus de la moyenne : {cityScore}/10 contre {deptScore}/10 pour {deptLabel} et {regionScore}/10 pour {regionName}. Un résultat qui valide les choix d'exploitation.",
  "présente un profil exemplaire, avec un score de {cityScore}/10 supérieur aux repères de {deptLabel} ({deptScore}/10) et de {regionName} ({regionScore}/10).",
];

const POSITION_GOOD = [
  "se situe dans une dynamique positive. Son score de {cityScore}/10 surclasse la moyenne de {deptLabel} ({deptScore}/10) et s'aligne sur les performances de {regionName} ({regionScore}/10). Le réseau garantit une sécurité sanitaire solide.",
  "fait mieux que son département. Avec {cityScore}/10, elle dépasse {deptLabel} ({deptScore}/10) et se rapproche de la moyenne de {regionName} ({regionScore}/10). Une tendance encourageante.",
  "affiche des résultats encourageants. Le score de {cityScore}/10 est supérieur à {deptLabel} ({deptScore}/10), même s'il reste en deçà de {regionName} ({regionScore}/10). La direction est bonne.",
  "montre une progression notable face à {deptLabel} ({deptScore}/10) avec un score de {cityScore}/10. La commune s'aligne progressivement sur les standards régionaux ({regionScore}/10).",
  "témoigne d'une amélioration continue. Avec {cityScore}/10, la commune devance {deptLabel} ({deptScore}/10) et converge vers le niveau de {regionName} ({regionScore}/10).",
  "se place au-dessus de la moyenne départementale : {cityScore}/10 contre {deptScore}/10 pour {deptLabel}. Le niveau régional ({regionScore}/10) reste un objectif atteignable.",
  "enregistre un score de {cityScore}/10, supérieur à {deptLabel} ({deptScore}/10) et proche de {regionName} ({regionScore}/10). Un bilan globalement satisfaisant.",
  "confirme une qualité solide avec {cityScore}/10, au-dessus de {deptLabel} ({deptScore}/10). Le réseau reste fiable, avec une marge de progression vers {regionName} ({regionScore}/10).",
  "se situe dans la bonne moitié du classement : {cityScore}/10 face à {deptScore}/10 pour {deptLabel}. La trajectoire demeure positive.",
  "affiche des indicateurs favorables ({cityScore}/10), meilleurs que {deptLabel} ({deptScore}/10) et cohérents avec {regionName} ({regionScore}/10).",
  "progresse à un rythme régulier. Le score de {cityScore}/10 dépasse {deptLabel} ({deptScore}/10), sans encore rejoindre {regionName} ({regionScore}/10).",
  "présente un bilan rassurant ({cityScore}/10) au-dessus de {deptLabel} ({deptScore}/10), avec une qualité de service conforme aux attentes.",
];

const POSITION_ATTENTION = [
  "présente des indicateurs à surveiller. Avec un score de {cityScore}/10, la qualité de l'eau est en retrait par rapport à {deptLabel} ({deptScore}/10) et à {regionName} ({regionScore}/10). Ce décalage mérite une attention particulière sur les paramètres techniques locaux.",
  "nécessite une vigilance accrue. Le score de {cityScore}/10 est inférieur à {deptLabel} ({deptScore}/10) et à {regionName} ({regionScore}/10). Des améliorations sont nécessaires pour rejoindre les standards du territoire.",
  "accuse un retard par rapport à son territoire. Avec {cityScore}/10, la commune est en dessous de {deptLabel} ({deptScore}/10) et de {regionName} ({regionScore}/10). Un plan d'action serait bénéfique.",
  "doit poursuivre ses efforts. Le score de {cityScore}/10 reste inférieur aux références de {deptLabel} ({deptScore}/10) et de {regionName} ({regionScore}/10). La situation n'est pas critique mais mérite un suivi.",
  "a une marge de progression. Avec {cityScore}/10, la qualité de l'eau est moins bonne qu'à l'échelle de {deptLabel} ({deptScore}/10) et de {regionName} ({regionScore}/10). Une surveillance renforcée est conseillée.",
  "reste en retrait : {cityScore}/10 contre {deptScore}/10 pour {deptLabel}. Les paramètres locaux devront être surveillés de près.",
  "enregistre un score de {cityScore}/10 inférieur à la moyenne régionale ({regionScore}/10). Le suivi sanitaire mérite d'être renforcé dans les prochains mois.",
  "se situe sous les repères du territoire ({deptScore}/10 pour {deptLabel}, {regionScore}/10 pour {regionName}). Des actions correctives sur le réseau sont à envisager.",
  "présente un bilan à consolider. Avec {cityScore}/10, la commune est en dessous de {deptLabel} ({deptScore}/10). Une analyse plus fine des paramètres est recommandée.",
  "affiche un écart défavorable par rapport à {regionName} ({regionScore}/10) avec {cityScore}/10. La situation appelle un suivi régulier.",
  "doit combler un retard : {cityScore}/10 contre {deptScore}/10 pour {deptLabel}. Les indicateurs techniques seront à réévaluer.",
  "nécessite un accompagnement : son score de {cityScore}/10 est inférieur aux moyennes départementale ({deptScore}/10) et régionale ({regionScore}/10).",
];

/**
 * Deuxième paragraphe "Verdict de l'expert" : position du score de la commune
 * face aux moyennes départementale et régionale. Variantes par situation.
 */
export function generateExpertPosition({ cityName, dpt, cityScore, deptScore, regionScore, deptLabel, regionName }) {
  let pool;
  if (cityScore >= deptScore && cityScore >= regionScore) pool = POSITION_BEST;
  else if (cityScore >= deptScore) pool = POSITION_GOOD;
  else pool = POSITION_ATTENTION;
  return fmt(pickFrom(pool, cityName, dpt, 21), {
    cityName,
    cityScore,
    deptScore,
    regionScore,
    deptLabel,
    regionName,
  });
}

// ===========================================================================
// SLOTS DE CONTENU FIXE (ex-100 % identiques sur toutes les villes)
// ===========================================================================

// Méthodologie Crystal Score (HTML conservé via dangerouslySetInnerHTML)
export const METHODOLOGY_INTROS = [
  "Le <strong>Crystal Score™</strong> (0-10) est notre indice de pureté, calculé à partir des données officielles <strong>ARS</strong> de la base SISE-Eaux. La méthode complète, les sources et la pondération des paramètres (PFAS, nitrates, pesticides) sont détaillées sur la page dédiée.",
  "Notre <strong>Crystal Score™</strong> synthétise en une note de 0 à 10 les prélèvements officiels <strong>ARS</strong> (base SISE-Eaux). Pondération, seuils et sources sont expliqués en détail sur notre méthodologie.",
  "Le <strong>Crystal Score™</strong> est un indice de 0 à 10 construit sur les analyses publiques <strong>ARS</strong>. Chaque paramètre compte selon son enjeu sanitaire : retrouvez la méthode complète sur la page dédiée.",
  "Pour rendre les données <strong>ARS</strong> lisibles, nous calculons un <strong>Crystal Score™</strong> de 0 à 10. La pondération (PFAS, nitrates, pesticides, calcaire…) et les sources sont documentées dans notre méthodologie.",
  "Le <strong>Crystal Score™</strong> (0-10) agrège les contrôles sanitaires officiels <strong>ARS</strong>. Il ne remplace pas l'avis d'un professionnel de santé : sa construction est détaillée sur la page méthodologie.",
  "Construit sur la base publique SISE-Eaux (<strong>ARS</strong>), le <strong>Crystal Score™</strong> résume la qualité de l'eau sur une échelle de 0 à 10. Méthode, seuils et limites sont explicités sur notre page dédiée.",
  "Notre <strong>Crystal Score™</strong> traduit en note de 0 à 10 les résultats bruts des <strong>ARS</strong>. Vous trouverez la pondération exacte et les sources officielles sur la page méthodologie.",
  "Le <strong>Crystal Score™</strong> est calculé uniquement à partir des données officielles <strong>ARS</strong> (SISE-Eaux), sans donnée déclarative. La grille de notation complète est publiée sur notre page méthodologie.",
];

// Peut-on boire l'eau chaude du robinet ?
export const HOT_WATER_TIPS = [
  "Non, il est fortement déconseillé de boire ou de cuisiner avec l'eau chaude. La chaleur favorise le développement bactérien et la dissolution de métaux lourds issus de votre installation intérieure. Utilisez toujours l'eau froide.",
  "L'eau chaude du robinet n'est pas destinée à la consommation : elle peut dissoudre métaux et bactéries présents dans le chauffe-eau. Privilégiez l'eau froide, puis chauffée si besoin.",
  "Évitez l'eau chaude pour boire ou cuisiner : son passage dans le ballon d'eau chaude peut charger l'eau en métaux et en micro-organismes. L'eau froide reste la référence sanitaire.",
  "Boire l'eau chaude du robinet est déconseillé : le chauffe-eau n'est pas conçu pour l'alimentaire. Utilisez l'eau froide et faites-la chauffer séparément.",
  "L'eau chaude sanitaire ne doit pas être bue : les dépôts calcaires et métalliques du circuit intérieur s'y dissolvent plus facilement. Réservez-la à la toilette.",
  "Pour boire ou cuisiner, prenez toujours l'eau froide. L'eau chaude peut contenir des bactéries et des traces de métaux relargués par les canalisations et le ballon.",
  "L'eau chaude du robinet est impropre à la consommation selon les recommandations sanitaires : elle dissout davantage de substances de l'installation. Chauffez de l'eau froide si nécessaire.",
  "Mieux vaut éviter l'eau chaude pour l'alimentation : le tartre, les métaux et d'éventuelles bactéries du système de production d'eau chaude peuvent s'y concentrer.",
];

// Conseil en cas de non-conformité
export const NON_COMPLIANT_TIPS = [
  "Une eau peut rester propre à la consommation malgré un dépassement de limite de qualité : suivez les consignes de l'ARS.",
  "Un dépassement ne signifie pas forcément une eau impropre : respectez les recommandations de l'ARS, qui peuvent inclure des restrictions temporaires.",
  "En cas de dépassement, l'ARS adapte ses consignes (usage, restriction, travaux). Tenez-vous informé auprès de votre mairie et de l'exploitant.",
  "Un paramètre hors limite appelle des mesures correctives : l'ARS précise les usages autorisés et la conduite à tenir pour les habitants.",
  "Même en dépassement, l'eau reste encadrée : suivez les préconisations officielles, notamment pour les publics sensibles (nourrissons, femmes enceintes).",
  "Un écart aux limites de qualité déclenche un suivi renforcé : l'ARS et l'exploitant informent les abonnés et engagent les actions nécessaires.",
];

// FAQ nitrates
export const FAQ_NITRATES = [
  "Le taux de nitrates relevé à {cityName} est de {nitVal} mg/L. La limite de qualité sanitaire est fixée à 50 mg/L par les autorités{bebeNote}",
  "Les dernières analyses mesurent {nitVal} mg/L de nitrates à {cityName}, à comparer à la limite réglementaire de 50 mg/L{bebeNote}",
  "À {cityName}, le taux de nitrates atteint {nitVal} mg/L pour une limite officielle de 50 mg/L{bebeNote}",
  "Le nitrate, indicateur d'activité agricole, est mesuré à {nitVal} mg/L à {cityName}. Le seuil réglementaire est de 50 mg/L{bebeNote}",
  "Les relevés ARS indiquent {nitVal} mg/L de nitrates à {cityName}, sous la limite de qualité de 50 mg/L{bebeNote}",
  "La concentration en nitrates de l'eau de {cityName} s'établit à {nitVal} mg/L. La norme sanitaire est fixée à 50 mg/L{bebeNote}",
  "Côté nitrates, {cityName} affiche {nitVal} mg/L. La limite de qualité réglementaire est de 50 mg/L{bebeNote}",
  "Le taux de nitrates à {cityName} est de {nitVal} mg/L. La référence réglementaire reste fixée à 50 mg/L{bebeNote}",
];

// Encart « eau pour bébé » (maillage contextuel vers /eau-bebe)
export const BABY_CTA = {
  critical: [
    {
      title: 'Biberons : eau non recommandée',
      text: "Ne préparez pas les biberons avec l'eau de {cityName} tant que la levée de restriction n'a pas été annoncée par l'ARS{nitVal}. Suivez les consignes officielles et utilisez une eau en bouteille adaptée.",
    },
    {
      title: 'Préparation des biberons : à éviter',
      text: "L'eau de {cityName} fait l'objet d'un verdict non conforme. En attendant le retour à la normale signalé par l'ARS{nitVal}, privilégiez une eau embouteillée de faible minéralisation pour les biberons.",
    },
    {
      title: 'Biberons : suivez les restrictions ARS',
      text: "Une restriction est en cours sur l'eau de {cityName}. Tant qu'elle n'est pas levée par l'ARS{nitVal}, utilisez une eau conditionnée adaptée aux nourrissons.",
    },
    {
      title: 'Nourrissons : eau déconseillée',
      text: "Pour les biberons, évitez l'eau de {cityName} jusqu'à nouvel avis de l'ARS{nitVal}. Une eau en bouteille pauvre en nitrates est la solution la plus sûre.",
    },
    {
      title: 'Biberons : eau à remplacer',
      text: "En raison d'une non-conformité, n'utilisez pas l'eau du robinet de {cityName} pour les biberons{nitVal}. Suivez les préconisations de l'ARS et choisissez une eau adaptée.",
    },
    {
      title: 'Vigilance biberons : eau non conforme',
      text: "L'eau de {cityName} dépasse les limites de qualité. En attendant la levée de restriction par l'ARS{nitVal}, préparez les biberons avec une eau en bouteille dédiée.",
    },
  ],
  warning: [
    {
      title: 'Préparation des biberons : vigilance recommandée',
      text: "Avec {nitVal}, l'eau reste conforme pour les adultes mais la prudence s'impose pour les biberons d'un nourrisson de moins de 6 mois. Préférez une eau pauvre en nitrates ou demandez conseil à votre médecin.",
    },
    {
      title: 'Biberons : un taux de nitrates modéré',
      text: "Le taux de nitrates de {cityName} ({nitVal}) invite à la prudence pour les nourrissons. Une eau embouteillée faiblement minéralisée est souvent recommandée avant 6 mois.",
    },
    {
      title: 'Nourrissons : restez attentif',
      text: "À {nitVal}, l'eau de {cityName} convient aux adultes, mais mieux vaut limiter son usage pour les biberons et consulter un professionnel en cas de doute.",
    },
    {
      title: 'Biberons : mieux vaut une eau dédiée',
      text: "Avec {nitVal}, l'eau de {cityName} n'est pas idéale pour les tout-petits. Pour un nourrisson de moins de 6 mois, préférez une eau faiblement minéralisée.",
    },
    {
      title: 'Préparation des biberons : prudence',
      text: "Le taux de nitrates ({nitVal}) impose une vigilance pour les nourrissons à {cityName}. Demandez l'avis de votre médecin pour l'eau des biberons.",
    },
    {
      title: 'Biberons : seuil de vigilance atteint',
      text: "À {nitVal}, l'eau de {cityName} dépasse le seuil de vigilance maison de 15 mg/L pour les biberons. Une eau en bouteille adaptée reste plus sûre avant 6 mois.",
    },
  ],
  ok: [
    {
      title: 'Une eau adaptée pour les biberons',
      text: "Faible en nitrates ({nitVal}) et conforme aux contrôles ARS, l'eau de {cityName} convient à la préparation des biberons : laissez couler l'eau froide quelques secondes avant de remplir le biberon.",
    },
    {
      title: 'Biberons : eau conforme',
      text: "Avec un taux de nitrates de {nitVal}, l'eau de {cityName} peut être utilisée pour les biberons. Pensez simplement à laisser couler l'eau froide avant remplissage.",
    },
    {
      title: 'Nourrissons : eau du robinet adaptée',
      text: "Les contrôles ARS confirment une eau pauvre en nitrates ({nitVal}) à {cityName}. Elle convient aux biberons, en utilisant toujours l'eau froide après purge.",
    },
    {
      title: 'Biberons : conforme et sûre',
      text: "Conforme aux contrôles ARS et faiblement nitratée ({nitVal}), l'eau de {cityName} est adaptée aux nourrissons. Faites couler l'eau froide quelques secondes avant usage.",
    },
    {
      title: 'Une eau sans souci pour les biberons',
      text: "Avec {nitVal} de nitrates et une conformité ARS, l'eau de {cityName} peut servir à préparer les biberons. Utilisez l'eau froide, après avoir purgé les canalisations.",
    },
    {
      title: 'Biberons : feu vert des analyses',
      text: "Les derniers prélèvements ({nitVal}) placent l'eau de {cityName} dans la norme pour les biberons. Laissez couler l'eau froide avant de préparer le repas de bébé.",
    },
  ],
};

