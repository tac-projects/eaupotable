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
// Sélectionne une variante de façon stable pour une ville donnée
// ---------------------------------------------------------------------------
function pick(variants, cityName, deptCode, slotIndex) {
  const h = hashCity(cityName, deptCode);
  const idx = (h + slotIndex * 127 + (deptCode ? parseInt(deptCode) || 0 : 0) * 31) % variants.length;
  return variants[Math.abs(idx)];
}

// ---------------------------------------------------------------------------
// Helpers de formatage
// ---------------------------------------------------------------------------
function fmt(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value ?? ''));
  }
  return result;
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
  const enrichedMetrics = { ...metrics, cityScore };
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
