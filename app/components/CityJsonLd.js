/**
 * CityJsonLd — Composant serveur pour le JSON-LD des pages ville.
 *
 * Génère BreadcrumbList, FAQPage et Dataset dans le HTML initial,
 * sans dépendre de l'exécution JavaScript côté client.
 */
import { parseValue } from '@/lib/water-utils';
import { pickFrom, FAQ_QUALITE, FAQ_CALCAIRE_INTRO, FAQ_CALCAIRE_CONCLUSION, FAQ_PFAS, FAQ_CARAFE, FAQ_NITRATES, HOT_WATER_TIPS, BEBE_NOTES } from '@/lib/content-variants';
import { PARAMS } from '@/lib/params-registry';

// Paramètres exposés en données structurées (ordre stable) — unités issues du registre.
const SCHEMA_MEASURES = [
  { dataKey: 'pfas', name: 'PFAS' },
  { dataKey: 'pesticides', name: 'Pesticides' },
  { dataKey: 'nitrates', name: 'Nitrates' },
  { dataKey: 'hardness', name: 'Dureté' }
];

export default function CityJsonLd({ cityName, cleanSlug, dpt, isConform, crystal, stats }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date());
  const currentMonthYear = `${currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)} ${currentYear}`;

  const score = crystal?.final ?? '--';

  // --- FAQ items (mêmes sélecteurs que CitySEOContent pour rester synchronisé) ---

  // Qualité
  let qualiteAnswer;
  if (score >= 7) {
    qualiteAnswer = pickFrom(FAQ_QUALITE.bonne, cityName, dpt, 40);
  } else if (score >= 4) {
    qualiteAnswer = pickFrom(FAQ_QUALITE.moyenne, cityName, dpt, 40);
  } else {
    qualiteAnswer = pickFrom(FAQ_QUALITE.mauvaise, cityName, dpt, 40);
  }
  qualiteAnswer = qualiteAnswer
    .replace(/\{score\}/g, String(score))
    .replace(/\{cityName\}/g, cityName)
    .replace(/\{currentYear\}/g, String(currentYear));

  // Calcaire
  const durete = parseValue(stats.hardness?.val);
  let dureteConclusion;
  if (durete > 25) dureteConclusion = pickFrom(FAQ_CALCAIRE_CONCLUSION.dur, cityName, dpt, 43);
  else if (durete > 10) dureteConclusion = pickFrom(FAQ_CALCAIRE_CONCLUSION.moyen, cityName, dpt, 43);
  else dureteConclusion = pickFrom(FAQ_CALCAIRE_CONCLUSION.doux, cityName, dpt, 43);
  const calcaireAnswer = pickFrom(FAQ_CALCAIRE_INTRO, cityName, dpt, 44)
    .replace(/\{durete\}/g, String(stats.hardness?.val || '--'))
    .replace(/\{cityName\}/g, cityName)
    .replace(/\{conclusion\}/g, dureteConclusion);

  // PFAS
  const pfasVal = stats.pfas?.val || '--';
  const pfasValNum = parseFloat(String(pfasVal).replace('<', '').replace(',', '.'));
  const pfasKey = (pfasValNum > 0.08) ? 'present' : 'absent';
  const pfasAnswer = pickFrom(FAQ_PFAS[pfasKey], cityName, dpt, 45)
    .replace(/\{cityName\}/g, cityName)
    .replace(/\{pfas\}/g, String(pfasVal));

  // Carafe
  let carafeKey = 'moyenne';
  if (durete > 25) carafeKey = 'calcaire';
  else if (durete < 10) carafeKey = 'douce';
  const carafeAnswer = pickFrom(FAQ_CARAFE[carafeKey], cityName, dpt, 46)
    .replace(/\{cityName\}/g, cityName)
    .replace(/\{dureteVal\}/g, String(stats.hardness?.val ? `${stats.hardness.val} °f` : '--'));

  // Nitrates (wording varié, version texte pur = celle du rendu visible)
  const nit = stats.nitrates ? parseValue(stats.nitrates.val) : NaN;
  const nitTxt = `${stats.nitrates?.val || '--'} mg/L`;
  const bebeNote = pickFrom(BEBE_NOTES, cityName, dpt, 47);
  const nitratesAnswer = pickFrom(FAQ_NITRATES, cityName, dpt, 41)
    .replace(/\{cityName\}/g, cityName)
    .replace(/\{nitVal\}/g, nitTxt)
    .replace(/\{bebeNote\}/g, nit > 15 ? ` ${bebeNote}` : "");

  // Eau chaude (wording varié)
  const hotWaterAnswer = pickFrom(HOT_WATER_TIPS, cityName, dpt, 42);

  const faqItems = [
    {
      q: `L'eau du robinet à ${cityName} est-elle de bonne qualité en ${currentYear} ?`,
      a: qualiteAnswer,
    },
    {
      q: `Quel est le taux exact de calcaire à ${cityName} ?`,
      a: calcaireAnswer,
    },
    {
      q: `Y a-t-il des nitrates dans l'eau de ${cityName} ?`,
      a: nitratesAnswer,
    },
    {
      q: `L'eau de ${cityName} contient-elle des PFAS (polluants éternels) ?`,
      a: pfasAnswer,
    },
    {
      q: `Dois-je utiliser une carafe filtrante ou un adoucisseur à ${cityName} ?`,
      a: carafeAnswer,
    },
    {
      q: `Peut-on boire l'eau chaude du robinet à ${cityName} ?`,
      a: hotWaterAnswer,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://www.eaupotable.net/' },
          { '@type': 'ListItem', position: 2, name: 'France', item: 'https://www.eaupotable.net/villes' },
          { '@type': 'ListItem', position: 3, name: `Département ${dpt}`, item: `https://www.eaupotable.net/departement/${dpt}` },
          { '@type': 'ListItem', position: 4, name: cityName },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      {
        '@type': 'Dataset',
        name: `Qualité de l'eau potable à ${cityName} (${currentMonthYear})`,
        description: `Données officielles ARS sur la potabilité, les PFAS, les pesticides et les nitrates pour le réseau de distribution de ${cityName}. Analyse mise à jour en ${currentMonthYear}.`,
        url: `https://www.eaupotable.net/ville/${cleanSlug}`,
        variableMeasured: [
          { '@type': 'PropertyValue', name: 'Conformité sanitaire', value: isConform ? 'Conforme' : 'Non conforme' },
          ...SCHEMA_MEASURES.map((m) => {
            const p = PARAMS.find((x) => x.dataKey === m.dataKey);
            return {
              '@type': 'PropertyValue',
              name: m.name,
              unitText: p ? p.unit : undefined,
              value: parseValue(stats[m.dataKey]?.val) || 0
            };
          }),
        ],
        creator: {
          '@type': 'Person',
          name: 'Thomas-Alexis Cailleau',
          url: 'https://www.linkedin.com/in/thomasalexiscailleau',
        },
        isAccessibleForFree: true,
        license: 'https://www.eaupotable.net/mentions-legales',
        spatialCoverage: { '@type': 'Place', name: cityName },
        temporalCoverage: `${currentYear}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
