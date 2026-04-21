import Navbar from '../components/Navbar';
import FAQClient from './FAQClient';

export const metadata = {
  title: 'FAQ 2026 Qualité de l\'eau : PFAS, Nitrates, Santé & Sécurité | EauPotable.net',
  description: 'Le guide complet (20 questions d\'experts) sur l\'eau du robinet : polluants éternels (PFAS), pesticides, biberons, calcaire et conservation. Données officielles ARS.',
  openGraph: {
    title: 'Tout savoir sur votre Eau : Le Guide des 20 Questions Clés',
    description: 'PFAS, Nitrates, Santé des nourrissons : l\'expertise de l\'observatoire citoyen.',
  },
};

const faqData = [
  {
    category: "Santé, Famille & Usage Quotidien",
    questions: [
      {
        q: "Peut-on utiliser l'eau du robinet pour la préparation des biberons ?",
        a: "<strong>Oui, l'eau du robinet est utilisable pour les biberons</strong> à condition que son <strong>Crystal Score soit élevé</strong> et sa teneur en <strong>nitrates inférieure à 50mg/L</strong>. Conseil d'expert : laissez toujours couler l'eau 30 secondes avant de remplir le biberon pour évacuer l'eau stagnante des canalisations."
      },
      {
        q: "L'eau calcaire est-elle dangereuse pour la santé ?",
        a: "<strong>Non, l'eau calcaire n'est pas nocive pour l'organisme.</strong> Le calcaire est essentiellement composé de <strong>calcium</strong> et de <strong>magnésium</strong>, deux minéraux indispensables. Une eau dure contribue même modestement à vos apports minéraux journaliers, bien qu'elle puisse être irritante pour les peaux très sensibles."
      },
      {
        q: "Est-il plus sain de boire l'eau du robinet ou de l'eau en bouteille ?",
        a: "<strong>L'eau du robinet est globalement l'option la plus saine et écologique.</strong> Elle subit des <strong>contrôles sanitaires quotidiens</strong> et, contrairement à l'eau en bouteille, elle ne contient pas de <strong>microplastiques</strong> liés à la dégradation du plastique PET lors du stockage."
      },
      {
        q: "Comme éliminer le goût de chlore de mon eau ?",
        a: "<strong>Le goût de chlore s'élimine par simple évaporation.</strong> Pour une saveur neutre, remplissez une carafe et laissez-la reposer au <strong>réfrigérateur pendant 1 heure sans bouchon</strong>. Le chlore, étant un gaz volatil, disparaîtra naturellement sans nécessiter de filtration coûteuse."
      },
      {
        q: "Combien de temps peut-on conserver l'eau du robinet ?",
        a: "L'eau du robinet doit être consommée dans les <strong>24 heures à température ambiante</strong>, ou sous <strong>48 heures au réfrigérateur</strong>. Pour garantir sa pureté, utilisez une carafe propre, de préférence en verre, et gardez-la fermée pour éviter l'absorption d'odeurs alimentaires."
      },
      {
        q: "L'eau du robinet est-elle assez minéralisée pour les sportifs ?",
        a: "<strong>Oui, la plupart des eaux du robinet sont riches en minéraux.</strong> Elles contiennent souvent autant de <strong>calcium, potassium et magnésium</strong> que les eaux minérales classiques, ce qui en fait une excellente boisson pour la <strong>récupération après l'effort</strong>."
      }
    ]
  },
  {
    category: "Polluants & Sécurité Sanitaire",
    questions: [
      {
        q: "L'eau de mon robinet contient-elle des PFAS (polluants éternels)?",
        a: "Depuis le 1er janvier 2026, <strong>l'analyse des PFAS est obligatoire</strong> en France. <strong>EauPotable.net intègre ces données en temps réel</strong>. Un score supérieur à 90 suggère l'utilisation de <strong>charbon actif</strong> ou d'<strong>osmose inverse</strong> dans votre usine de traitement pour filtrer ces polluants éternels."
      },
      {
        q: "Pourquoi existe-t-il des traces de pesticides dans l'eau potable ?",
        a: "Une eau peut être déclarée <strong>'Potable'</strong> tout en contenant des <strong>résidus ou métabolites de pesticides</strong>, tant qu'ils restent sous les limites de qualité fixées par le <strong>Code de la Santé Publique</strong>. EauPotable.net valorise la pureté totale en sanctionnant la moindre détection."
      },
      {
        q: "Que faire en cas d'alerte de non-potabilité (E. coli)?",
        a: "En cas de <strong>non-conformité bactériologique</strong>, suivez ces étapes : <ul><li><strong>Ne consommez plus l'eau</strong> pour la boisson ou le brossage des dents.</li><li><strong>Faites bouillir l'eau</strong> 5 minutes avant de l'utiliser pour la cuisine.</li><li>Attendez le <strong>feu vert officiel</strong> de votre mairie ou de l'ARS.</li></ul>"
      },
      {
        q: "Existe-t-il encore du plomb dans les canalisations ?",
        a: "Le <strong>plomb est strictement interdit</strong> dans les réseaux publics. Cependant, des <strong>canalisations en plomb</strong> peuvent subsister dans le réseau intérieur des habitations construites avant <strong>1950</strong>. En cas de suspicion, une analyse spécifique par un laboratoire accrédité est conseillée."
      },
      {
        q: "Trouve-t-on des résidus de médicaments dans l'eau ?",
        a: "Des <strong>traces infimes de résidus médicamenteux</strong> (hormones, antibiotiques) sont parfois détectées par les laboratoires ultra-sensibles. Bien que les doses soient <strong>sans risque avéré</strong> pour l'adulte, l'observatoire surveille ces indicateurs pour la protection des plus fragiles."
      },
      {
        q: "L'eau du robinet contient-elle des microplastiques ?",
        a: "<strong>Le taux de microplastiques est extrêmement faible au robinet</strong> comparé à l'eau en bouteille. Le traitement en usine (floculation, filtration sur sable) retient la grande majorité de ces particules avant qu'elles ne parviennent à votre domicile."
      },
      {
        q: "Quelles sont les limites de sécurité pour les nitrates ?",
        a: "La <strong>limite légale est de 50 mg/L</strong>. Pour une sécurité optimale des populations vulnérables (nourrissons, femmes enceintes), EauPotable.net définit un seuil de recommandation strict à <strong>15 mg/L</strong>."
      }
    ]
  },
  {
    category: "Phénomènes Visuels & Odeurs",
    questions: [
      {
        q: "Pourquoi mon eau a-t-elle parfois une odeur de 'soufre' (œuf pourri) ?",
        a: "Cette odeur est souvent causée par de l'<strong>hydrogène sulfuré</strong> généré par des bactéries inoffensives dans votre <strong>chauffe-eau</strong> ou des conduits peu utilisés. Si l'odeur disparaît après avoir laissé couler l'eau, le problème est interne à votre installation."
      },
      {
        q: "Pourquoi mon eau est-elle trouble ou blanche au robinet ?",
        a: "L'aspect blanc est dû à des <strong>micro-bulles d'air</strong> sous pression dans le réseau. C'est un phénomène <strong>purement physique et sans danger</strong>. Versez l'eau dans un verre : elle redeviendra limpide en quelques secondes une fois l'air évacué."
      },
      {
        q: "L'eau laisse des traces blanches sur ma vaisselle, est-ce grave ?",
        a: "Non, c'est l'indicateur d'une <strong>eau riche en calcium (calcaire)</strong>. Une vaisselle blanche signifie simplement que les minéraux se déposent lors de l'évaporation de l'eau. Une dose de <strong>sel régénérant</strong> dans votre lave-vaisselle corrige ce phénomène."
      }
    ]
  },
  {
    category: "Méthodologie & Sources Officielles",
    questions: [
      {
        q: "Comment est calculé le Crystal Score ?",
        a: "Le <strong>Crystal Score</strong> est un algorithme qui pondère <strong>15 familles de données sanitaires</strong> (PFA, Pesticides, Nitrates, etc.). Un score de <strong>100/100</strong> certifie l'absence totale de polluants détectables par les méthodes d'analyse actuelles."
      },
      {
        q: "D'où viennent les données de votre observatoire ?",
        a: "Nous extrayons nos données depuis l'<strong>API officielle Hub'Eau</strong>, qui concentre les résultats des prélèvements effectués par les <strong>Agences Régionales de Santé (ARS)</strong> et le Ministère de la Santé en sortie de robinet."
      },
      {
        q: "À quelle fréquence mettez-vous à jour les résultats ?",
        a: "La <strong>mise à jour est quotidienne</strong>. EauPotable.net est synchronisé aux bases de données nationales pour garantir que la dernière analyse publiée par votre ARS soit immédiatement visible sur notre site."
      },
      {
        q: "Puis-je utiliser ces résultats pour un recours officiel ?",
        a: "Nos informations sont <strong>fournies à titre informel et citoyen</strong>. Pour un recours juridique, seule une analyse réalisée par un <strong>laboratoire agréé COFRAC</strong> directement à votre robinet fera foi."
      }
    ]
  }
];

export default function FAQPage() {
  const allQuestions = faqData.flatMap(group => group.questions);
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allQuestions.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a.replace(/<\/?[^>]+(>|$)/g, "")
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <FAQClient faqData={faqData} />
    </>
  );
}
