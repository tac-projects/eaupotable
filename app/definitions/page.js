import Navbar from '../components/Navbar';
import Link from 'next/link';
import '../styles/definitions.css';

export const metadata = {
  title: 'Définitions : PFAS, Nitrates, Pesticides, pH, Calcaire | Guide Eau Potable',
  description: 'Comprenez les 9 paramètres de qualité de l\'eau : PFAS, nitrates, pesticides, calcaire, chlore, microbiologie, pH, turbidité et conductivité. Guide complet sourcé données ARS.',
  alternates: {
    canonical: 'https://www.eaupotable.net/definitions',
  },
};

const definitions = [
  {
    id: 'microbiologie',
    title: 'Microbiologie',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M6 18h8"/></svg>',
    summary: 'La qualité microbiologique est le critère n°1 de la potabilité : elle mesure la présence de bactéries pathogènes.',
    details: 'Les principaux indicateurs sont Escherichia coli (E. coli) et les entérocoques, dont la présence signale une contamination fécale du réseau. Leur détection est un signal d\'alerte immédiat entraînant une restriction de consommation. Une eau conforme microbiologiquement ne contient aucune de ces bactéries par 100 mL.',
  },
  {
    id: 'nitrates',
    title: 'Nitrates',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/></svg>',
    summary: 'Les nitrates sont des composés azotés naturels dont la concentration excessive est principalement liée aux activités agricoles.',
    details: 'Issus des engrais chimiques et des déjections animales, ils s\'infiltrent dans les nappes phréatiques. La limite réglementaire est fixée à 50 mg/L. Les nitrates sont particulièrement surveillés pour les nourrissons (risque de méthémoglobinémie, ou « maladie bleue »). Au-delà de 25 mg/L, l\'eau est déjà considérée comme impactée par l\'activité humaine.',
  },
  {
    id: 'pesticides',
    title: 'Pesticides & Métabolites',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    summary: 'Les pesticides regroupent des centaines de molécules chimiques utilisées en agriculture pour protéger les cultures.',
    details: 'Herbicides, fongicides, insecticides : ces substances et leurs produits de dégradation (métabolites) peuvent persister des années dans les sols et contaminer les ressources en eau. La limite de qualité est de 0,1 µg/L par substance individuelle et 0,5 µg/L pour le total. Certains métabolites comme l\'ESA-métolachlore font l\'objet d\'une attention renforcée en raison de leur présence généralisée dans les nappes.',
  },
  {
    id: 'pfas',
    title: 'PFAS (Polluants Éternels)',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    summary: 'Les substances per- et polyfluoroalkylées (PFAS) sont des composés chimiques ultrarésistants surnommés « polluants éternels ».',
    details: 'Utilisés depuis les années 1950 dans les revêtements antiadhésifs, les textiles imperméables et les mousses anti-incendie, ils s\'accumulent dans l\'environnement et l\'organisme. Depuis janvier 2026, leur analyse est obligatoire dans l\'eau potable en France. Leur persistance exceptionnelle et leurs effets suspectés sur la santé (perturbation endocrinienne, cancers) en font un enjeu majeur de santé publique.',
  },
  {
    id: 'chlore',
    title: 'Chlore Libre',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>',
    summary: 'Le chlore est un désinfectant ajouté lors du traitement de l\'eau pour éliminer les micro-organismes pathogènes.',
    details: 'Son utilisation garantit la sécurité sanitaire de l\'eau tout au long de son parcours dans le réseau de distribution. Responsable du goût et de l\'odeur parfois perceptibles au robinet, le chlore résiduel est inoffensif aux concentrations utilisées. Un simple repos en carafe ouverte au réfrigérateur pendant une heure suffit à le faire disparaître par évaporation.',
  },
  {
    id: 'calcaire',
    title: 'Calcaire & Dureté',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
    summary: 'La dureté de l\'eau mesure sa concentration en calcium et magnésium, deux minéraux essentiels pour l\'organisme.',
    details: 'Exprimée en degrés français (°f), elle détermine le caractère « calcaire » de l\'eau. Une eau dure (>25°f) n\'est pas nocive pour la santé — elle contribue même aux apports journaliers en minéraux — mais peut entraîner des dépôts dans les canalisations et appareils électroménagers. Une eau douce (<15°f) est plus agréable au quotidien mais légèrement moins minéralisée.',
  },
  {
    id: 'ph',
    title: 'Acidité (pH)',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12"/><path d="m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z"/><path d="m2 22 .414-.414"/></svg>',
    summary: 'Le pH mesure l\'acidité ou l\'alcalinité de l\'eau sur une échelle de 0 à 14.',
    details: 'Une eau neutre a un pH de 7. La réglementation impose un pH compris entre 6,5 et 9. Une eau trop acide (pH bas) peut corroder les canalisations et libérer des métaux comme le plomb ou le cuivre. Une eau trop alcaline (pH élevé) peut donner un goût savonneux. Le pH idéal pour l\'eau potable se situe entre 7 et 8, garantissant un équilibre parfait entre saveur et sécurité sanitaire.',
  },
  {
    id: 'turbidite',
    title: 'Turbidité',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
    summary: 'La turbidité mesure la transparence de l\'eau, c\'est-à-dire la présence de particules en suspension.',
    details: 'Exprimée en NFU (Nephelometric Formazin Unit), elle indique la clarté de l\'eau. Une turbidité élevée peut signaler la présence de matières organiques, d\'argiles ou de micro-organismes. La limite réglementaire est de 2 NFU en sortie de traitement. Une eau limpide (<1 NFU) est gage de qualité : les particules en suspension pouvant protéger les bactéries des désinfectants sont quasi absentes.',
  },
  {
    id: 'conductivite',
    title: 'Conductivité',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
    summary: 'La conductivité électrique mesure la teneur globale en sels minéraux dissous dans l\'eau.',
    details: 'Exprimée en microsiemens par centimètre (µS/cm), elle reflète la minéralisation de l\'eau. Une eau faiblement minéralisée (<400 µS/cm) est légère et peu calcaire. Une eau très minéralisée (>800 µS/cm) est riche en sels mais peut avoir un goût prononcé. La conductivité ne présente pas de risque sanitaire direct : c\'est un indicateur de la composition minérale naturelle de l\'eau, qui varie selon les terrains traversés.',
  },
];

export default function DefinitionsPage() {
  return (
    <>
      <Navbar />
      <main className="definitions-page">
        {/* HERO */}
        <section className="definitions-hero">
          <div className="seo-container">
            <nav className="seo-breadcrumb" aria-label="Breadcrumb">
              <a href="/">Accueil</a>
              <span className="sep">›</span>
              <span className="curr">Définitions</span>
            </nav>
            <h1 className="definitions-main-title">
              Le Lexique de l&rsquo;Eau Potable
            </h1>
            <p className="definitions-main-subtitle">
              PFAS, nitrates, pesticides, pH, calcaire&hellip; Les 9 paramètres
              qui composent la qualité de votre eau du robinet. Des définitions
              claires, basées sur les données officielles des ARS.
            </p>
          </div>
        </section>

        {/* GRILLE DE DÉFINITIONS */}
        <section className="definitions-content-section">
          <div className="seo-container">
            <div className="definitions-grid">
              {definitions.map((def) => (
                <article key={def.id} id={def.id} className="definition-card">
                  <div className="definition-card-header">
                    <div className="definition-card-icon" dangerouslySetInnerHTML={{ __html: def.icon }} />
                    <h2 className="definition-card-title">{def.title}</h2>
                  </div>
                  <p className="definition-card-summary">{def.summary}</p>
                  <p className="definition-card-details">{def.details}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FOOTER */}
        <section className="definitions-footer-cta">
          <div className="seo-container">
            <div className="definitions-cta-card">
              <h3>Vérifiez la qualité de votre eau</h3>
              <p>
                Consultez gratuitement l&rsquo;analyse détaillée de votre commune :
                Crystal Score, PFAS, nitrates et plus encore.
              </p>
              <Link href="/" className="cta-btn-premium">
                Rechercher ma ville
              </Link>
            </div>
          </div>
        </section>

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Accueil',
                    item: 'https://www.eaupotable.net',
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Définitions',
                    item: 'https://www.eaupotable.net/definitions',
                  },
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: definitions.map((def) => ({
                  '@type': 'Question',
                  name: `Qu'est-ce que ${def.title.split(' ')[0]} dans l'eau potable ?`,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: def.summary,
                  },
                })),
              },
            ]),
          }}
        />
      </main>
    </>
  );
}
