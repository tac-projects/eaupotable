/**
 * Registre unique des paramètres analysés (source de vérité).
 * Toute liste de paramètres affichée ou transmise doit être dérivée d'ici,
 * jamais réécrite en dur ailleurs.
 *
 * Champs d'une entrée :
 * - key          : clé d'affichage (icône/statut/plages). Diffère de dataKey
 *                  uniquement pour turbidity (-> turb) et conductivity (-> cond).
 * - dataKey      : clé canonique de la donnée (stats du JSON de build).
 * - name         : libellé affiché sur les cartes d'analyse (Analyse Techniques).
 * - seoLabel     : libellé affiché dans la table SEO (se replie sur name si absent).
 * - limit        : texte « Norme / Limite » de la table SEO.
 * - unit         : unité officielle d'affichage (données structurées, référence).
 * - dossier      : regroupement table SEO : sante | confort | traces.
 * - dossierOrder : ordre au sein du dossier SEO.
 * - cardOrder    : ordre dans les cartes « Analyses Techniques » (null si non affiché).
 * - scored       : true si le paramètre impacte réellement le Crystal Score
 *                  (moteur V3 — cf. lib/crystal-engine.js).
 */
export const PARAMS = [
  { key: 'microbiology', dataKey: 'microbiology', name: 'Microbiologie', seoLabel: 'Microbiologie', limit: '0 n/mL', unit: 'germes', dossier: 'sante', dossierOrder: 1, cardOrder: 1, scored: true },
  { key: 'nitrates', dataKey: 'nitrates', name: 'Nitrates', seoLabel: 'Nitrates', limit: '50 mg/L', unit: 'mg/L', dossier: 'sante', dossierOrder: 2, cardOrder: 2, scored: true },
  { key: 'pesticides', dataKey: 'pesticides', name: 'Pesticides', seoLabel: 'Pesticides totaux', limit: '0.1 µg/L', unit: 'µg/L', dossier: 'sante', dossierOrder: 3, cardOrder: 3, scored: true },
  { key: 'pfas', dataKey: 'pfas', name: 'PFAS (Polluants éternels)', seoLabel: 'PFAS (Polluants éternels)', limit: '0.1 µg/L', unit: 'µg/L', dossier: 'sante', dossierOrder: 4, cardOrder: 4, scored: true },
  { key: 'ammonium', dataKey: 'ammonium', name: 'Ammonium', seoLabel: 'Ammonium', limit: '0.1 mg/L', unit: 'mg/L', dossier: 'sante', dossierOrder: 5, cardOrder: null, scored: false },
  { key: 'hardness', dataKey: 'hardness', name: 'Calcaire', seoLabel: 'Calcaire (Dureté TH)', limit: 'Indicateur', unit: '°f', dossier: 'confort', dossierOrder: 1, cardOrder: 6, scored: true },
  { key: 'chlorine', dataKey: 'chlorine', name: 'Chlore Libre', seoLabel: 'Chlore Libre', limit: '< 0.1 recommandé', unit: 'mg/L', dossier: 'confort', dossierOrder: 2, cardOrder: 5, scored: true },
  { key: 'ph', dataKey: 'ph', name: 'Acidité (pH)', seoLabel: 'Potentiel Hydrogène (pH)', limit: '6.5 - 9.0', unit: 'pH', dossier: 'confort', dossierOrder: 3, cardOrder: 7, scored: false },
  { key: 'cond', dataKey: 'conductivity', name: 'Conductivité', seoLabel: 'Conductivité', limit: '1100 µS/cm', unit: 'µS/cm', dossier: 'confort', dossierOrder: 4, cardOrder: 9, scored: false },
  { key: 'turb', dataKey: 'turbidity', name: 'Turbidité', seoLabel: 'Turbidité', limit: '< 2 NFU', unit: 'NFU', dossier: 'confort', dossierOrder: 5, cardOrder: 8, scored: false },
  { key: 'iron', dataKey: 'iron', name: 'Fer total', seoLabel: 'Fer total', limit: '200 µg/L', unit: 'µg/L', dossier: 'traces', dossierOrder: 1, cardOrder: null, scored: false },
  { key: 'manganese', dataKey: 'manganese', name: 'Manganèse', seoLabel: 'Manganèse', limit: '50 µg/L', unit: 'µg/L', dossier: 'traces', dossierOrder: 2, cardOrder: null, scored: false },
  { key: 'copper', dataKey: 'copper', name: 'Cuivre', seoLabel: 'Cuivre', limit: '2.0 mg/L', unit: 'mg/L', dossier: 'traces', dossierOrder: 3, cardOrder: null, scored: false },
  { key: 'organic_carbon', dataKey: 'organic_carbon', name: 'Carbone Org. Total', seoLabel: 'Carbone Org. Total', limit: 'Inconnu', unit: 'mg/L', dossier: 'traces', dossierOrder: 4, cardOrder: null, scored: false }
];

const sortBy = (arr, prop) => [...arr].sort((a, b) => (a[prop] ?? Infinity) - (b[prop] ?? Infinity));

/** Les 9 paramètres affichés en cartes « Analyses Techniques » (ordre d'affichage). */
export const ANALYSIS_CARDS = sortBy(PARAMS.filter((p) => p.cardOrder), 'cardOrder')
  .map(({ key, dataKey, name }) => ({ key, dataKey, name }));

export const SEO_GROUPS = [
  { id: 'sante', name: 'Santé & Vigilance', icon: '🔬' },
  { id: 'confort', name: 'Confort & Usage', icon: '🛁' },
  { id: 'traces', name: 'Traces & Minéraux', icon: '🏗️' }
];

/** Les 14 paramètres de la table SEO, groupés (structure attendue par SeoDataTable). */
export const SEO_DOSSIERS = SEO_GROUPS.map((g) => ({
  name: g.name,
  icon: g.icon,
  keys: sortBy(PARAMS.filter((p) => p.dossier === g.id), 'dossierOrder')
    .map(({ dataKey, seoLabel, name, limit }) => ({ key: dataKey, label: seoLabel || name, limit }))
}));

/** Clés stats transmises au client pour les pages ville (payload). */
export const CITY_STATS_KEYS = PARAMS.map((p) => p.dataKey);

/** Nombre de paramètres réellement pris en compte par le Crystal Score aujourd'hui. */
export const SCORED_COUNT = PARAMS.filter((p) => p.scored).length;
