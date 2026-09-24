// Test CTR P2 (09/2026) — variante de méta-description sur un lot figé de 30 pages.
// Périmètre : la DESCRIPTION uniquement (le <title> reste inchangé, cf. AGENTS.md).
// Retrait du test = vider CTR_TEST_SLUGS. Aucune autre modification nécessaire.
//
// Lot sélectionné sur données GSC nettoyées (23/08→21/09/2026) :
// position 5–15, impressions ≥ 200, CTR < 3,5 %. Base : 16 571 imp / 350 clics / CTR 2,11 %.

export const CTR_TEST_SLUGS = new Set([
  '/ville/nantes',
  '/departement/07',
  '/ville/rians',
  '/ville/strasbourg',
  '/ville/les-contamines-montjoie',
  '/ville/clermont-ferrand',
  '/ville/bordeaux',
  '/ville/tours',
  '/departement/56',
  '/ville/grenoble',
  '/ville/nice',
  '/departement/974',
  '/departement/69',
  '/ville/limoges',
  '/ville/toulouse',
  '/departement/43',
  '/ville/aix-en-provence',
  '/ville/colmar',
  '/ville/rouen',
  '/ville/paris',
  '/ville/reims',
  '/ville/antibes',
  '/departement/22',
  '/ville/volvic',
  '/departement/24',
  '/departement/46',
  '/departement/60',
  '/ville/poitiers',
  '/ville/nancy',
  '/departement/74',
]);

// Variante ville : accroche interrogative + mot-clé exact « eau potable »,
// en conservant les valeurs data-driven (score, prix, date) pour l'unicité du snippet.
export function ctrTestCityDescription({ officialName, deptCode, scoreString, priceString, datePrelevement }) {
  const head = `L'eau potable à ${officialName}${deptCode ? ` (${deptCode})` : ''} est-elle saine ?`;
  const facts = [
    `Score ${scoreString}/10`,
    priceString ? `prix ${priceString}` : null,
    datePrelevement ? `prélèvement ARS du ${datePrelevement}` : null,
  ].filter(Boolean);
  return `${head} ${facts.join(', ')}. PFAS, nitrates, calcaire et conformité sanitaire.`;
}

// Variante département : même logique, base score moyen + nombre de communes.
export function ctrTestDeptDescription({ deptName, scoreString, cityCount }) {
  return `L'eau du robinet en ${deptName} est-elle saine ? Score moyen ${scoreString}/10 sur ${cityCount} communes. `
    + `Bilan calcaire, nitrates et PFAS.`;
}
