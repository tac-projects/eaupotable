'use strict';

/**
 * SOURCE DE VÉRITÉ des codes paramètres SISE-Eaux (cdparametre).
 *
 * ⚠️ Ne JAMAIS dupliquer ces codes ailleurs. Ils sont consommés par :
 *   - scripts/build-dept-generic.js (génération des fiches)
 *   - lib/water-utils.js (harvestWaterData, runtime)
 * et validés automatiquement contre le référentiel officiel par
 * scripts/check-sise-codes.js (`npm run check:codes`).
 *
 * Les correspondances code → libellé ont été vérifiées sur le référentiel
 * PAR de data.gouv (dataset eaurob, ressource `eaurob-ref-*.zip`).
 * Un code erroné produit des valeurs fausses silencieuses (ex. cuivre = 1370
 * était l'aluminium). Voir historique git : commit « fix(data): correction du
 * mapping des codes SISE ».
 */

const SISE_CODES = {
  nitrates: ['1340'], // NITRATES (EN NO3)
  ph: ['1302'], // PH
  temperature: ['1301'], // TEMPÉRATURE DE L'EAU
  hardness: ['1345'], // ESSAI MARBRE TH
  chlorine: ['1398', '1399', '1754'], // CHLORE LIBRE, CHLORE TOTAL, BIOXYDE DE CHLORE
  pesticides: ['6276'], // TOTAL DES PESTICIDES ANALYSÉS (jamais une molécule isolée)
  pfas: ['8847', '9268'], // SOMME DE 20 PFAS, SOMME DE 4 PFAS
  microbiology: ['1449', '1447', '1042', '6455', '1448'], // ECOLI, coliformes, spores, entérocoques, coliformes thermotolérants
  conductivity: ['1303', '1304'], // CONDUCTIVITÉ À 25°C / 20°C
  turbidity: ['1295'], // TURBIDITÉ NÉPHÉLOMÉTRIQUE
  iron: ['1393'], // FER (dissous/total)
  manganese: ['1394'], // MANGANÈSE (total/dissous/particulaire)
  ammonium: ['1335'], // AMMONIUM (EN NH4)
  copper: ['1392'], // CUIVRE
  organic_carbon: ['1841'], // CARBONE ORGANIQUE (dissous/total)
};

// Unité officielle d'affichage (alignée sur lib/params-registry.js).
const SISE_UNITS = {
  nitrates: 'mg/L',
  ph: 'pH',
  temperature: '°C',
  hardness: '°f',
  chlorine: 'mg/L',
  pesticides: 'µg/L',
  pfas: 'µg/L',
  microbiology: 'Absence',
  conductivity: 'µS/cm',
  turbidity: 'NFU',
  iron: 'µg/L',
  manganese: 'µg/L',
  ammonium: 'mg/L',
  copper: 'mg/L',
  organic_carbon: 'mg/L',
};

// Motifs de libellé attendus dans le référentiel PAR, pour le contrôle
// automatique (scripts/check-sise-codes.js). Un libellé normalisé doit
// contenir l'un de ces mots-clés.
const SISE_LABEL_HINTS = {
  nitrates: ['NITRATES'],
  ph: ['PH'],
  temperature: ['TEMPERATURE'],
  hardness: ['MARBRE TH'],
  chlorine: ['CHLORE LIBRE', 'CHLORE TOTAL', 'BIOXYDE DE CHLORE'],
  pesticides: ['TOTAL DES PESTICIDES'],
  pfas: ['SOMME DE 20 PFAS', 'SOMME DE 4 PFAS'],
  microbiology: ['ECOLI', 'COLIFORMES', 'SPORES', 'ENTEROCOQUES'],
  conductivity: ['CONDUCTIVITE'],
  turbidity: ['TURBIDITE'],
  iron: ['FER'],
  manganese: ['MANGANESE'],
  ammonium: ['AMMONIUM'],
  copper: ['CUIVRE'],
  organic_carbon: ['CARBONE ORGANIQUE'],
};

module.exports = { SISE_CODES, SISE_UNITS, SISE_LABEL_HINTS };
