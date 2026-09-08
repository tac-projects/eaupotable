import Navbar from '../components/Navbar';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import BabyChecker from '../components/BabyChecker';
import { PARAMS } from '../../lib/params-registry';
import '../styles/bebe.css';

export const revalidate = 86400;

const DOMAIN = 'https://www.eaupotable.net';

let bebeDataCache = null;

function getBebeData() {
  if (bebeDataCache) return bebeDataCache;
  const filePath = path.join(process.cwd(), 'public', 'data', 'bebe-nation.json');
  if (fs.existsSync(filePath)) {
    bebeDataCache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return bebeDataCache || {
    national: {
      citiesTotal: 0, conformCount: 0, conformTotal: 0, testedNitrates: 0,
      biberonOk: 0, vigilance: 0, over50: 0, noData: 0, generatedAt: ''
    }
  };
}

function fmtFr(n) {
  return Number(n).toLocaleString('fr-FR');
}

// Limites réglementaires issues du registre (source de vérité des paramètres),
// formatées à la française pour l'affichage éditorial.
function paramLimit(key) {
  const p = PARAMS.find((x) => x.key === key);
  if (!p) return '';
  return p.limit.replace('.', ',').replace(' - ', ' – ');
}

const NITRATES_LIMIT = paramLimit('nitrates');
const PFAS_LIMIT = paramLimit('pfas');

const FAQ = [
  {
    q: 'Peut-on utiliser l\u2019eau du robinet pour préparer les biberons ?',
    a: 'Oui, dans la grande majorité des communes. L\u2019eau du robinet est le produit alimentaire le plus contrôlé de France et peut être utilisée pour les biberons dès lors qu\u2019elle est conforme aux contrôles ARS et raisonnablement pauvre en nitrates. Vérifiez simplement le dernier prélèvement de votre commune : si les nitrates restent sous 15 mg/L et que l\u2019eau est conforme, elle convient sans réserve.'
  },
  {
    q: 'Quel est le taux de nitrates acceptable pour un bébé dans l\u2019eau ?',
    a: 'La limite réglementaire française est de 50 mg/L pour tous (arrêté du 11 janvier 2007), une valeur que l\u2019OMS reprend dans ses recommandations pour l\u2019eau de boisson. Pour la préparation des biberons, EauPotable.net recommande un seuil de vigilance plus strict de 15 mg/L, cohérent avec l\u2019esprit de la norme : plus l\u2019eau est pauvre en nitrates, plus elle est sûre pour un nourrisson.'
  },
  {
    q: 'Qu\u2019est-ce que la méthémoglobinémie, ou « maladie bleue » ?',
    a: 'Chez le nourrisson de moins de 6 mois, des nitrates en excès peuvent être transformés en nitrites par sa flore digestive encore immature. Les nitrites oxydent l\u2019hémoglobine en méthémoglobine, incapable de transporter l\u2019oxygène : c\u2019est la méthémoglobinémie. Ses signes sont une coloration bleutée de la peau (cyanose), d\u2019où le nom de « maladie bleue ». Elle est très rare en France avec l\u2019eau du robinet, mais c\u2019est le risque historique qui justifie la vigilance sur les nitrates.'
  },
  {
    q: 'Faut-il faire bouillir l\u2019eau du robinet pour un biberon ?',
    a: 'Faire bouillir n\u2019élimine ni les nitrates ni les PFAS : l\u2019ébullition évapore une partie de l\u2019eau et concentre au contraire ces substances. Pour une eau conforme et pauvre en nitrates, la simple utilisation de l\u2019eau froide du robinet suffit. Une ébullition préalable ne se justifie que sur avis médical ou consigne officielle (par exemple après une alerte bactériologique), et dans ce cas suivez précisément les instructions de l\u2019ARS.'
  },
  {
    q: 'Les PFAS de l\u2019eau sont-ils dangereux pour un bébé ?',
    a: 'Il n\u2019existe pas de seuil « bébé » distinct pour les PFAS : les mêmes limites s\u2019appliquent à tous (0,1 µg/L pour la somme des 20 PFAS réglementés depuis 2026). La vigilance est toutefois accrue pour les nourrissons car l\u2019exposition en bas âge est associée à une réponse vaccinale réduite et à un moindre poids de naissance. Si votre commune est proche d\u2019un dépassement, la prudence s\u2019impose pour les biberons. Retrouvez la carte des PFAS commune par commune.'
  },
  {
    q: 'L\u2019eau en bouteille est-elle plus sûre que l\u2019eau du robinet pour bébé ?',
    a: 'Pas systématiquement. L\u2019eau du robinet est analysée en continu et ses résultats sont publics, ce que n\u2019offrent pas toutes les eaux en bouteille. Si vous choisissez la bouteille, privilégiez une eau portant la mention « convient à la préparation des aliments des nourrissons », très peu minéralisée et pauvre en nitrates. Dans la plupart des communes, l\u2019eau du robinet conforme reste le choix le plus simple, le moins cher et le plus écologique.'
  },
  {
    q: 'Comment éviter le plomb et l\u2019eau stagnante dans les biberons ?',
    a: 'Deux réflexes simples : laissez couler l\u2019eau froide 30 secondes le matin ou après une longue inactivité avant de remplir le biberon, pour évacuer l\u2019eau stagnée dans les canalisations. Utilisez toujours l\u2019eau froide, jamais l\u2019eau chaude du robinet qui a stagné dans le cumulus et peut être plus chargée en métaux. Dans un logement ancien (avant 1950), le plomb dans les canalisations privées reste une raison supplémentaire de purger.'
  },
  {
    q: 'Le calcaire est-il mauvais pour bébé ?',
    a: 'Non. Le calcaire d\u2019une eau dure est essentiellement du calcium et du magnésium, deux minéraux utiles. Une eau calcaire n\u2019est pas nocive pour un nourrisson, elle peut seulement laisser un dépôt blanchâtre au fond du biberon, sans effet sanitaire. Le critère déterminant pour les biberons reste la teneur en nitrates, pas la dureté.'
  }
];

export async function generateMetadata() {
  const n = getBebeData().national;
  const ogImage = `${DOMAIN}/api/og?bebe=1&communes=${encodeURIComponent(fmtFr(n.citiesTotal))}&ok=${encodeURIComponent(fmtFr(n.biberonOk))}&vigilance=${encodeURIComponent(fmtFr(n.vigilance))}&alerte=${encodeURIComponent(fmtFr(n.over50))}`;
  return {
    title: 'Eau du robinet pour bébé : nitrates, PFAS et biberons | EauPotable.net',
    description: `L'eau du robinet est-elle sûre pour les biberons ? Nitrates et méthémoglobinémie, seuils de vigilance, PFAS, purge des canalisations : vérifiez votre commune (Crystal Score + analyses ARS).`,
    alternates: {
      canonical: `${DOMAIN}/eau-bebe`,
    },
    openGraph: {
      title: 'Eau du robinet pour bébé : nitrates, PFAS et biberons',
      description: `${fmtFr(n.biberonOk)} communes ont une eau adaptée à la préparation des biberons. Vérifiez votre commune en quelques secondes.`,
      url: `${DOMAIN}/eau-bebe`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: 'Qualité de l\'eau du robinet pour bébé : nitrates, PFAS et biberons'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Eau du robinet pour bébé : nitrates, PFAS et biberons',
      description: 'Nitrates et méthémoglobinémie, seuils de vigilance, PFAS et biberons : vérifiez votre commune.',
      images: [ogImage]
    }
  };
}

export default function EauBebePage() {
  const n = getBebeData().national;
  const FAQ_ITEMS = FAQ;

  return (
    <>
      <Navbar />
      <main className="bebe-page">
        {/* HERO */}
        <section className="bebe-hero">
          <div className="seo-container">
            <nav className="seo-breadcrumb" aria-label="Breadcrumb">
              <a href="/">Accueil</a>
              <span className="sep">›</span>
              <span className="curr">Eau pour bébé</span>
            </nav>
            <h1 className="bebe-main-title">
              L&rsquo;eau du robinet pour bébé&nbsp;: nitrates, PFAS et biberons
            </h1>
            <p className="bebe-main-subtitle">
              Peut-on préparer les biberons avec l&rsquo;eau du robinet&nbsp;? Méthémoglobinémie,
              seuils de vigilance, polluants éternels, purge des canalisations&hellip; Le guide
              complet pour nourrir votre nourrisson en toute sécurité, commune par commune.
            </p>

            <div className="bebe-stats-band">
              <div className="bebe-stat-item">
                <span className="bebe-stat-val">{fmtFr(n.citiesTotal)}</span>
                <span className="bebe-stat-label">Communes analysées</span>
              </div>
              <div className="bebe-stat-item">
                <span className="bebe-stat-val ok">{fmtFr(n.biberonOk)}</span>
                <span className="bebe-stat-label">Eau adaptée biberon</span>
              </div>
              <div className="bebe-stat-item">
                <span className="bebe-stat-val alert">{fmtFr(n.vigilance)}</span>
                <span className="bebe-stat-label">Vigilance nitrates</span>
              </div>
              <div className="bebe-stat-item">
                <span className="bebe-stat-val critical">{fmtFr(n.over50)}</span>
                <span className="bebe-stat-label">Nitrates au-dessus de 50 mg/L</span>
              </div>
            </div>
            <p className="bebe-stats-source">
              Eau dite «&nbsp;adaptée biberon&nbsp;»&nbsp;: nitrates sous 15 mg/L et contrôles ARS conformes. Données
              des prélèvements officiels ARS &mdash; mis à jour le {n.generatedAt}
            </p>
          </div>
        </section>

        {/* VÉRIFICATEUR PAR COMMUNE */}
        <section id="verifier" className="bebe-checker-section alt">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Vérifiez l&rsquo;eau de votre commune pour les biberons</h2>
              <p className="seo-main-subtitle">
                Saisissez votre ville : nous affichons le Crystal Score, les nitrates, les PFAS et un
                verdict adapté à la préparation des biberons, sur la base du dernier prélèvement ARS.
              </p>
            </div>
            <div className="bebe-checker-card">
              <BabyChecker />
              <p className="bebe-checker-note">
                Verdict indicatif d&rsquo;EauPotable.net fondé sur les contrôles officiels. Il ne remplace ni
                l&rsquo;avis de votre médecin ou de la PMI, ni les consignes de votre ARS.
              </p>
            </div>
          </div>
        </section>

        {/* NITRATES & MÉTHÉMOGLOBINÉMIE */}
        <section className="bebe-content-section">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Nitrates et méthémoglobinémie : pourquoi le bébé est plus fragile</h2>
              <p className="seo-main-subtitle">Le risque historique qui explique toutes les recommandations sur l&rsquo;eau des nourrissons.</p>
            </div>
            <div className="bebe-prose">
              <p>
                Les <strong>nitrates</strong> sont des composés azotés présents naturellement dans les sols, dont la
                concentration augmente avec les engrais agricoles et les rejets d&rsquo;élevage. Dans l&rsquo;eau potable,
                leur limite de qualité est fixée à <strong>{NITRATES_LIMIT}</strong> en France
                (arrêté du 11 janvier 2007), une valeur reprise par l&rsquo;OMS dans ses recommandations pour
                l&rsquo;eau de boisson.
              </p>
              <p>
                Chez un adulte, ces concentrations sont sans effet. Chez le <strong>nourrisson de moins de 6 mois</strong>,
                en revanche, l&rsquo;acidité de l&rsquo;estomac est encore faible et sa flore digestive peut transformer une
                partie des nitrates ingérés en <strong>nitrites</strong>. Ces nitrites oxydent l&rsquo;hémoglobine en
                méthémoglobine, une forme qui ne transporte plus l&rsquo;oxygène vers les tissus.
              </p>
              <p>
                C&rsquo;est la <strong>méthémoglobinémie</strong>, surnommée «&nbsp;maladie bleue&nbsp;» : le bébé développe une
                coloration bleutée des lèvres et de la peau (cyanose), signe d&rsquo;un manque d&rsquo;oxygénation qui
                nécessite une prise en charge rapide. Les cas documentés concernent surtout des eaux de puits privés
                très contaminés (au-delà de 100 mg/L) et des préparations diluées avec une eau non contrôlée&nbsp;: le
                risque est <strong>très faible avec l&rsquo;eau du robinet française</strong>, contrôlée en continu, mais il
                justifie la prudence pour les tout-petits.
              </p>
              <div className="bebe-tip-box">
                <p>
                  <strong>Ce qu&rsquo;il faut retenir&nbsp;:</strong> plus l&rsquo;eau est pauvre en nitrates, plus elle est sûre
                  pour un nourrisson. C&rsquo;est pourquoi EauPotable.net place la barre de vigilance à 15 mg/L pour les
                  biberons, bien en dessous de la limite réglementaire.
                </p>
              </div>
              <p>
                À noter&nbsp;: les nitrates ne viennent pas que de l&rsquo;eau. Certains légumes frais comme les épinards ou
                les betteraves en contiennent naturellement, et le volume d&rsquo;eau absorbé par un bébé entre aussi en
                ligne de compte dans l&rsquo;exposition totale. Notre <Link href="/definitions#nitrates" className="seo-card-link">définition complète des nitrates</Link> détaille le sujet.
              </p>
            </div>
          </div>
        </section>

        {/* GRILLE DE LECTURE */}
        <section className="bebe-content-section alt">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Comment lire le taux de nitrates de votre commune</h2>
              <p className="seo-main-subtitle">La grille de lecture appliquée par EauPotable.net à chaque résultat.</p>
            </div>
            <div className="bebe-table">
              <table>
                <thead>
                  <tr>
                    <th>Taux de nitrates</th>
                    <th>Lecture pour la préparation des biberons</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Moins de 15 mg/L</td>
                    <td>Eau adaptée aux biberons sans réserve, sous réserve de la conformité ARS globale.</td>
                  </tr>
                  <tr>
                    <td>De 15 à 50 mg/L</td>
                    <td>Eau conforme pour les adultes mais vigilance pour un nourrisson : préférez une eau pauvre en nitrates pour les biberons ou demandez conseil à votre médecin.</td>
                  </tr>
                  <tr>
                    <td>Plus de 50 mg/L</td>
                    <td>Dépassement de la limite de qualité : ne pas utiliser pour les biberons ni pour la boisson. Suivez les consignes de l&rsquo;ARS.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="bebe-table-note">
              Pour rappel, la limite de qualité des PFAS est fixée à {PFAS_LIMIT} (somme des 20 PFAS réglementés) et
              celle des pesticides à {paramLimit('pesticides')} par substance. Ces seuils sont dérivés du registre des
              paramètres d&rsquo;EauPotable.net, lui-même aligné sur la réglementation.
            </p>
          </div>
        </section>

        {/* PFAS & BIBERONS */}
        <section className="bebe-content-section">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">PFAS et biberons : ce qu&rsquo;il faut surveiller</h2>
              <p className="seo-main-subtitle">Pas de seuil propre au nourrisson, mais une vigilance renforcée qui se justifie.</p>
            </div>
            <div className="bebe-prose">
              <p>
                Les <strong>PFAS</strong> (polluants éternels) n&rsquo;ont pas de norme «&nbsp;bébé&nbsp;» distincte&nbsp;: la même
                limite de qualité de {PFAS_LIMIT} s&rsquo;applique à tous les usages depuis janvier 2026. En revanche,
                les nourrissons constituent une population sensible&nbsp;: l&rsquo;exposition précoce aux PFAS est associée à
                une <strong>réponse vaccinale réduite</strong> chez l&rsquo;enfant et à un moindre poids de naissance, effets
                documentés par les agences sanitaires. Comme le bébé boit proportionnellement plus d&rsquo;eau que
                l&rsquo;adulte, la qualité de l&rsquo;eau des biberons pèse davantage dans son exposition.
              </p>
              <p>
                Si un PFAS est détecté dans l&rsquo;eau de votre commune sans dépasser la limite, il n&rsquo;y a pas de motif
                d&rsquo;arrêter le robinet&nbsp;: les niveaux mesurés restent très inférieurs aux expositions ayant établi ces
                effets. En cas de dépassement, l&rsquo;ARS peut recommander des restrictions ciblées pour les biberons&nbsp;:
                suivez ses consignes. Consultez la <Link href="/pfas-eau-potable" className="seo-card-link">carte des PFAS en France</Link> pour situer votre commune.
              </p>
              <p>
                Autre point souvent confondu&nbsp;: le <strong>biberon en plastique</strong>. Chauffer un contenant en plastique
                peut favoriser le relargage de particules dans le liquide, un sujet de vigilance documenté par
                l&rsquo;ANSES. Sans lien direct avec les PFAS de l&rsquo;eau, cela plaide pour des <strong>biberons en verre</strong>,
                ou pour chauffer l&rsquo;eau ou le lait dans un récipient adapté avant de le verser dans le biberon.
              </p>
            </div>
          </div>
        </section>

        {/* CONSEILS PRATIQUES */}
        <section className="bebe-content-section alt">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Préparer un biberon : les bons réflexes</h2>
              <p className="seo-main-subtitle">Quatre gestes simples pour une eau de biberon irréprochable.</p>
            </div>
            <div className="bebe-understand-grid">
              <article className="bebe-understand-card">
                <div className="bebe-understand-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
                </div>
                <h3>Purger les canalisations</h3>
                <p>
                  Le matin ou après quelques heures sans usage, laissez couler l&rsquo;eau <strong>froide</strong> environ
                  30 secondes avant de remplir le biberon. Cela évacue l&rsquo;eau stagnée, qui a pu stagner dans les
                  canalisations et se charger en métaux.
                </p>
              </article>
              <article className="bebe-understand-card">
                <div className="bebe-understand-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h.01"/><path d="M11 15h.01"/><path d="M15 15h.01"/></svg>
                </div>
                <h3>Toujours l&rsquo;eau froide</h3>
                <p>
                  N&rsquo;utilisez jamais l&rsquo;eau <strong>chaude du robinet</strong> pour un biberon&nbsp;: elle provient du cumulus
                  ou du chauffe-eau où elle a stagné, et peut être plus chargée en métaux. Remplissez le biberon à
                  l&rsquo;eau froide puis chauffez selon les recommandations du fabricant du lait.
                </p>
              </article>
              <article className="bebe-understand-card">
                <div className="bebe-understand-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <h3>Préférer le verre</h3>
                <p>
                  Pour chauffer l&rsquo;eau ou le lait, le <strong>verre</strong> reste le contenant le plus neutre. Si vous utilisez
                  un biberon en plastique, évitez de le chauffer directement et respectez scrupuleusement les
                  durées indiquées.
                </p>
              </article>
              <article className="bebe-understand-card">
                <div className="bebe-understand-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <h3>Ne pas stocker</h3>
                <p>
                  L&rsquo;eau du robinet se conserve au maximum <strong>24 heures au réfrigérateur</strong> dans une carafe propre
                  et fermée. Un biberon préparé ne doit pas attendre&nbsp;: consommez-le rapidement ou jetez le reste,
                  et ne réutilisez jamais l&rsquo;eau d&rsquo;un biberon entamé.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* EAU EN BOUTEILLE */}
        <section className="bebe-content-section">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Eau en bouteille ou eau du robinet pour bébé&nbsp;?</h2>
              <p className="seo-main-subtitle">Le réflexe bouteille n&rsquo;est pas une garantie automatique.</p>
            </div>
            <div className="bebe-prose">
              <p>
                L&rsquo;eau du robinet présente un avantage décisif pour les jeunes parents&nbsp;: elle est <strong>analysée en
                continu</strong> et ses derniers prélèvements sont <strong>publics</strong>, commune par commune. Aucun fabricant
                d&rsquo;eau en bouteille n&rsquo;offre une telle transparence, et des contrôles ont mis en évidence des traces
                de PFAS dans certaines eaux embouteillées.
              </p>
              <p>
                Si votre commune est en vigilance nitrates, ou par simple précaution, choisissez alors une eau en
                bouteille portant la mention <strong>«&nbsp;convient à la préparation des aliments des nourrissons&nbsp;»</strong>&nbsp;:
                des eaux très faiblement minéralisées et pauvres en nitrates, conçues pour les biberons. Dans la
                grande majorité des cas, l&rsquo;eau du robinet conforme reste le choix le plus sain, le plus économique
                et le plus écologique.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bebe-content-section alt">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Questions fréquentes sur l&rsquo;eau des biberons</h2>
              <p className="seo-main-subtitle">Les réponses essentielles pour préparer les biberons en confiance.</p>
            </div>
            <div className="seo-faq-accordion">
              {FAQ_ITEMS.map((item, i) => (
                <details key={i} className="seo-faq-item" open={i === 0}>
                  <summary className="seo-faq-question">
                    <h3>{item.q}</h3>
                    <span className="faq-icon"></span>
                  </summary>
                  <div className="seo-faq-answer">
                    <p>{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
            <div className="faq-more-cta">
              <Link href="/faq" className="faq-more-btn">Voir toutes nos questions fréquentes</Link>
            </div>
          </div>
        </section>

        {/* SOURCES */}
        <section className="bebe-content-section">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Sources officielles</h2>
              <p className="seo-main-subtitle">Les références sur lesquelles s&rsquo;appuie cette page.</p>
            </div>
            <ul className="bebe-sources-list">
              <li><a href="https://www.who.int/teams/environment-climate-change-and-health/water-sanitation-and-health/chemical-hazards-in-drinking-water/nitrate-nitrite" target="_blank" rel="noopener noreferrer">OMS — Nitrate et nitrite dans l&rsquo;eau de boisson (Guidelines for Drinking-water Quality)</a></li>
              <li><a href="https://www.anses.fr/fr" target="_blank" rel="noopener noreferrer">ANSES — Nitrates et nitrites, risques pour la santé</a></li>
              <li><a href="https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000465980/" target="_blank" rel="noopener noreferrer">Arrêté du 11 janvier 2007 — limites et références de qualité des eaux destinées à la consommation humaine</a></li>
              <li><a href="https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX%3A32020L2184" target="_blank" rel="noopener noreferrer">Directive (UE) 2020/2184 — qualité des eaux destinées à la consommation humaine</a></li>
              <li><a href="https://www.data.gouv.fr/fr/" target="_blank" rel="noopener noreferrer">data.gouv.fr — contrôles sanitaires ARS des réseaux d&rsquo;eau</a></li>
            </ul>
          </div>
        </section>

        {/* CTA FOOTER */}
        <section className="bebe-footer-cta">
          <div className="seo-container">
            <div className="bebe-cta-card">
              <h3>Un biberon à préparer&nbsp;? Vérifiez d&rsquo;abord votre eau.</h3>
              <p>
                Crystal Score, nitrates, PFAS et verdict biberon sur la base du dernier contrôle ARS
                de votre commune. Gratuit, sans inscription.
              </p>
              <a href="#verifier" className="cta-btn-premium">
                Vérifier ma commune
              </a>
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
                  { '@type': 'ListItem', position: 1, name: 'Accueil', item: DOMAIN },
                  { '@type': 'ListItem', position: 2, name: 'Eau pour bébé', item: `${DOMAIN}/eau-bebe` }
                ]
              },
              {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: FAQ_ITEMS.map((item) => ({
                  '@type': 'Question',
                  name: item.q,
                  acceptedAnswer: { '@type': 'Answer', text: item.a }
                }))
              }
            ])
          }}
        />
      </main>
    </>
  );
}
