/**
 * CityJsonLd — Composant serveur pour le JSON-LD des pages ville.
 *
 * Génère BreadcrumbList, FAQPage et Dataset dans le HTML initial,
 * sans dépendre de l'exécution JavaScript côté client.
 */
import { parseValue } from '@/lib/water-utils';
import { hashCity, FAQ_VARIANTS } from '@/lib/content-variants';

export default function CityJsonLd({ cityName, cleanSlug, dpt, isConform, crystal, stats }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date());
  const currentMonthYear = `${currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)} ${currentYear}`;

  const score = crystal?.final ?? '--';
  const h = hashCity(cityName, dpt);

  // --- FAQ items (même logique que CitySEOContent, exécutée côté serveur) ---

  // Qualité
  let qualiteAnswer;
  if (score >= 7) {
    const pool = FAQ_VARIANTS.qualite.bonne;
    qualiteAnswer = pool[h % pool.length];
  } else if (score >= 4) {
    const pool = FAQ_VARIANTS.qualite.moyenne;
    qualiteAnswer = pool[h % pool.length];
  } else {
    const pool = FAQ_VARIANTS.qualite.mauvaise;
    qualiteAnswer = pool[h % pool.length];
  }
  qualiteAnswer = qualiteAnswer
    .replace(/\{score\}/g, String(score))
    .replace(/\{cityName\}/g, cityName)
    .replace(/\{currentYear\}/g, String(currentYear));

  // Calcaire
  const durete = parseValue(stats.hardness?.val);
  let dureteConclusion;
  if (durete > 25) dureteConclusion = FAQ_VARIANTS.calcaireConclusion.dur;
  else if (durete > 10) dureteConclusion = FAQ_VARIANTS.calcaireConclusion.moyen;
  else dureteConclusion = FAQ_VARIANTS.calcaireConclusion.doux;
  const calcaireAnswer = FAQ_VARIANTS.calcaire[0]
    .replace(/\{durete\}/g, String(stats.hardness?.val || '--'))
    .replace(/\{cityName\}/g, cityName)
    .replace(/\{conclusion\}/g, dureteConclusion);

  // PFAS
  const pfasVal = stats.pfas?.val || '--';
  const pfasValNum = parseFloat(String(pfasVal).replace('<', '').replace(',', '.'));
  const pfasKey = (pfasValNum > 0.08) ? 'present' : 'absent';
  const pfasAnswer = FAQ_VARIANTS.pfas[pfasKey]
    .replace(/\{cityName\}/g, cityName)
    .replace(/\{pfas\}/g, String(pfasVal));

  // Carafe
  let carafeKey = 'moyenne';
  if (durete > 25) carafeKey = 'calcaire';
  else if (durete < 10) carafeKey = 'douce';
  const carafeAnswer = FAQ_VARIANTS.carafe[carafeKey]
    .replace(/\{cityName\}/g, cityName)
    .replace(/\{dureteVal\}/g, String(stats.hardness?.val ? `${stats.hardness.val} °f` : '--'));

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
      a: `Le taux de nitrates relevé est de ${stats.nitrates?.val || '--'} mg/L. La limite de qualité sanitaire est fixée à 50 mg/L par les autorités.`,
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
      a: "Non, il est fortement déconseillé de boire ou de cuisiner avec l'eau chaude. La chaleur favorise le développement bactérien et la dissolution de métaux lourds issus de votre installation intérieure. Utilisez toujours l'eau froide.",
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
          { '@type': 'PropertyValue', name: 'Conformité bactériologique', value: isConform ? 'Conforme' : 'Non conforme' },
          { '@type': 'PropertyValue', name: 'PFAS', unitText: 'µg/L', value: parseValue(stats.pfas?.val) || 0 },
          { '@type': 'PropertyValue', name: 'Pesticides', unitText: 'µg/L', value: parseValue(stats.pesticides?.val) || 0 },
          { '@type': 'PropertyValue', name: 'Nitrates', unitText: 'mg/L', value: parseValue(stats.nitrates?.val) || 0 },
          { '@type': 'PropertyValue', name: 'Dureté', unitText: '°f', value: parseValue(stats.hardness?.val) || 0 },
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
