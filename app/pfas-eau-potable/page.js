import Navbar from '../components/Navbar';
import PfasMap from '../components/PfasMap';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import '../styles/pfas.css';

export const revalidate = 86400;

const DOMAIN = 'https://www.eaupotable.net';

let pfasDataCache = null;

function getPfasData() {
  if (pfasDataCache) return pfasDataCache;
  const filePath = path.join(process.cwd(), 'public', 'data', 'pfas-nation.json');
  if (fs.existsSync(filePath)) {
    pfasDataCache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return pfasDataCache || { national: { tested: 0, traces: 0, alerts: 0, overLimit: 0, noData: 0 }, departments: [], topCities: [], generatedAt: '' };
}

function fmtFr(n) {
  return Number(n).toLocaleString('fr-FR');
}

function buildFaq(n) {
  return [
    {
      q: 'Que sont les PFAS (polluants éternels) ?',
      a: 'Les PFAS (substances per- et polyfluoroalkylées) sont des composés chimiques ultrarésistants utilisés depuis les années 1950 dans les revêtements antiadhésifs, les textiles imperméables et les mousses anti-incendie. Ils ne se dégradent quasiment pas dans l\'environnement et s\'accumulent dans l\'organisme, d\'où leur surnom de « polluants éternels ». Certains sont suspectés d\'effets perturbateurs endocriniens et cancérigènes.'
    },
    {
      q: 'Y a-t-il des PFAS dans l\'eau de ma commune ?',
      a: `Depuis le 1er janvier 2026, la recherche des PFAS est obligatoire dans l'eau potable en France. Sur les ${fmtFr(n.tested)} communes analysées dans notre observatoire, ${fmtFr(n.traces)} présentent des traces supérieures à 0,01 µg/L, ${fmtFr(n.alerts)} dépassent le seuil de vigilance de 0,05 µg/L et ${fmtFr(n.overLimit)} dépassent la limite de qualité de 0,1 µg/L. Consultez la fiche de votre ville pour connaître la valeur exacte mesurée par les ARS.`,
      aHtml: <>Depuis le 1er janvier 2026, la recherche des PFAS est obligatoire dans l&rsquo;eau potable en France. Sur les {fmtFr(n.tested)} communes analysées dans notre observatoire, {fmtFr(n.traces)} présentent des traces supérieures à 0,01 µg/L, {fmtFr(n.alerts)} dépassent le seuil de vigilance de 0,05 µg/L et {fmtFr(n.overLimit)} dépassent la limite de qualité de 0,1 µg/L. <Link href="/villes">Consultez la fiche de votre ville</Link> pour connaître la valeur exacte mesurée par les ARS.</>
    },
    {
      q: 'Quelle est la norme pour les PFAS dans l\'eau potable ?',
      a: 'La directive européenne 2020/2184, applicable depuis le 1er janvier 2026 en France, fixe une limite de qualité de 0,1 µg/L pour la somme des 20 PFAS réglementés, et de 0,5 µg/L pour le « PFAS total » (toutes substances PFAS mesurables). En dessous de 0,05 µg/L, la présence est considérée comme des traces ; entre 0,05 et 0,1 µg/L, une vigilance renforcée s\'impose.'
    },
    {
      q: 'Comment EauPotable.net mesure-t-il les PFAS ?',
      a: 'Nous exploitons les prélèvements réels effectués par les Agences Régionales de Santé (ARS) et publiés en open data par le Ministère de la Santé. Chaque fiche ville affiche la valeur du dernier prélèvement PFAS, sa date et son unité, sans interprétation : la donnée brute, pour une transparence totale.',
      aHtml: <>Nous exploitons les prélèvements réels effectués par les Agences Régionales de Santé (ARS) et publiés en open data par le Ministère de la Santé. Chaque <Link href="/villes">fiche ville</Link> affiche la valeur du dernier prélèvement PFAS, sa date et son unité, sans interprétation&nbsp;: la donnée brute, pour une transparence totale.</>
    },
    {
      q: 'Que faire si ma commune dépasse le seuil PFAS ?',
      a: 'En cas de dépassement du seuil réglementaire, les autorités sanitaires peuvent restreindre la consommation et engager des travaux de traitement (filtration sur charbon actif, dilution avec une autre ressource). Les filtres domestiques à osmose inverse ou charbon actif certifié peuvent réduire la présence de PFAS, mais la priorité reste l\'action de l\'exploitant du réseau. Suivez les communications de votre ARS et de votre mairie.'
    },
    {
      q: 'Les PFAS sont-ils dangereux pour la santé ?',
      a: 'La science s\'accorde sur plusieurs effets à long terme : augmentation du cholestérol, atteintes du foie et de la thyroïde, réduction de la réponse vaccinale chez les enfants, effets sur la fertilité et le développement du fœtus. Le PFOA est classé cancérogène pour l\'homme (groupe 1) par le CIRC depuis 2023, le PFOS possiblement cancérogène (groupe 2B). Les concentrations dans l\'eau du robinet restent très inférieures aux expositions professionnelles ayant établi ces effets.'
    },
    {
      q: 'Peut-on éliminer les PFAS en faisant bouillir l\'eau ?',
      a: 'Non, c\'est même l\'inverse : l\'ébullition évapore l\'eau mais pas les PFAS, ce qui augmente leur concentration. Les seuls traitements efficaces sont le charbon actif en grains, les membranes (nanofiltration, osmose inverse) et certaines résines échangeuses d\'ions, déployés par les collectivités en cas de dépassement.'
    },
    {
      q: 'Faut-il filtrer son eau du robinet pour éliminer les PFAS ?',
      a: 'Un filtre n\'est utile que si votre commune dépasse réellement les seuils : vérifiez d\'abord la fiche de votre ville. L\'osmose inverse domestique réduit fortement les PFAS mais coûte cher et génère de l\'eau de rejet. Les carafes à charbon actif ont une efficacité partielle et variable selon les modèles, et un filtre mal entretenu devient un nid bactérien.',
      aHtml: <>Un filtre n&rsquo;est utile que si votre commune dépasse réellement les seuils&nbsp;: vérifiez d&rsquo;abord la <Link href="/villes">fiche de votre ville</Link>. L&rsquo;osmose inverse domestique réduit fortement les PFAS mais coûte cher et génère de l&rsquo;eau de rejet. Les carafes à charbon actif ont une efficacité partielle et variable selon les modèles, et un filtre mal entretenu devient un nid bactérien.</>
    },
    {
      q: 'L\'eau en bouteille contient-elle moins de PFAS que l\'eau du robinet ?',
      a: 'Pas nécessairement : des contrôles récents ont mis en évidence des traces de PFAS dans certaines eaux embouteillées. L\'obligation de recherche PFAS de 2026 s\'applique à l\'eau du réseau public, dont les analyses sont publiées en open data — une transparence que n\'offre pas systématiquement le marché des eaux conditionnées.'
    },
    {
      q: 'Les femmes enceintes et les nourrissons doivent-ils éviter l\'eau du robinet ?',
      a: 'En dessous des seuils réglementaires, l\'eau du robinet reste le produit alimentaire le plus contrôlé et peut être consommée par tous. En cas d\'alerte PFAS dans votre commune, l\'ARS peut recommander des restrictions ciblées : suivez alors ses consignes, notamment pour la préparation des biberons.'
    },
    {
      q: 'Les PFAS sont-ils présents ailleurs que dans l\'eau ?',
      a: 'Oui, l\'eau ne représente qu\'une partie de l\'exposition : les PFAS sont présents dans les poêles antiadhésives, certains emballages alimentaires, les textiles imperméabilisés et les mousses anti-incendie. L\'alimentation en est souvent la principale source d\'exposition.'
    },
    {
      q: 'Depuis quand les PFAS sont-ils recherchés dans l\'eau potable en France ?',
      a: 'Des campagnes exploratoires ont été menées dès 2023 par les ARS, en réponse aux recommandations de l\'ANSES. Depuis le 1er janvier 2026, la recherche des PFAS est devenue obligatoire pour tous les réseaux publics, en application de la directive européenne 2020/2184.'
    }
  ];
}

export async function generateMetadata() {
  const data = getPfasData();
  const n = data.national;
  const ogImage = `${DOMAIN}/api/og?pfas=1&tested=${encodeURIComponent(fmtFr(n.tested))}&alerts=${encodeURIComponent(fmtFr(n.alerts))}&over=${encodeURIComponent(fmtFr(n.overLimit))}`;
  return {
    title: 'Carte des PFAS en France : le bilan 2026 par commune | EauPotable.net',
    description: `Polluants éternels (PFAS) : carte de France et bilan commune par commune. ${fmtFr(n.tested)} communes testées, ${fmtFr(n.alerts)} en alerte, ${fmtFr(n.overLimit)} dépassements du seuil. Données officielles ARS.`,
    alternates: {
      canonical: `${DOMAIN}/pfas-eau-potable`,
    },
    openGraph: {
      title: 'Carte des PFAS en France : le bilan 2026 par commune',
      description: `Polluants éternels : ${fmtFr(n.tested)} communes testées, ${fmtFr(n.alerts)} en alerte. Carte de France et données ARS.`,
      url: `${DOMAIN}/pfas-eau-potable`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: 'Bilan PFAS 2026 dans l\'eau du robinet en France'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Carte des PFAS en France : le bilan 2026 par commune',
      description: `Polluants éternels : ${fmtFr(n.tested)} communes testées, ${fmtFr(n.alerts)} en alerte. Carte de France et données ARS.`,
      images: [ogImage]
    }
  };
}

function pfasStatus(val) {
  const v = parseFloat(String(val).replace('<', '').replace(',', '.'));
  if (isNaN(v)) return { label: '--', cls: '' };
  if (v > 0.1) return { label: 'Dépassement', cls: 'pfas-status-over' };
  if (v > 0.05) return { label: 'Alerte', cls: 'pfas-status-alert' };
  return { label: 'Traces', cls: 'pfas-status-trace' };
}

export default function PfasPage() {
  const data = getPfasData();
  const { national, departments, topCities, generatedAt } = data;
  const maxAlerts = Math.max(1, ...departments.map(d => d.alerts));
  const FAQ_ITEMS = buildFaq(national);

  return (
    <>
      <Navbar />
      <main className="pfas-page">
        {/* HERO */}
        <section className="pfas-hero">
          <div className="seo-container">
            <nav className="seo-breadcrumb" aria-label="Breadcrumb">
              <a href="/">Accueil</a>
              <span className="sep">›</span>
              <span className="curr">PFAS dans l&rsquo;eau du robinet</span>
            </nav>
            <h1 className="pfas-main-title">
              PFAS dans l&rsquo;eau du robinet : carte de France et bilan 2026
            </h1>
            <p className="pfas-main-subtitle">
              Polluants éternels, obligation de test, seuils réglementaires&hellip;
              Découvrez l&rsquo;état réel de la contamination aux PFAS en France,
              commune par commune, à partir des données officielles des ARS.
            </p>

            <div className="pfas-stats-band">
              <div className="pfas-stat-item">
                <span className="pfas-stat-val">{fmtFr(national.tested)}</span>
                <span className="pfas-stat-label">Communes testées</span>
              </div>
              <div className="pfas-stat-item">
                <span className="pfas-stat-val">{fmtFr(national.traces)}</span>
                <span className="pfas-stat-label">Traces détectées</span>
              </div>
              <div className="pfas-stat-item">
                <span className="pfas-stat-val alert">{fmtFr(national.alerts)}</span>
                <span className="pfas-stat-label">Communes en alerte</span>
              </div>
              <div className="pfas-stat-item">
                <span className="pfas-stat-val critical">{fmtFr(national.overLimit)}</span>
                <span className="pfas-stat-label">Dépassements du seuil</span>
              </div>
            </div>
            <p className="pfas-stats-source">
              Données issues des prélèvements officiels ARS &mdash; mis à jour le {generatedAt}
            </p>
          </div>
        </section>

        {/* CARTE DE FRANCE */}
        <section className="pfas-content-section">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Carte des PFAS en France : les départements en alerte</h2>
              <p className="seo-main-subtitle">
                Chaque département est coloré selon son nombre de communes en alerte
                (PFAS supérieur à 0,05 µg/L). Cliquez sur un département pour voir le détail.
              </p>
            </div>
            <PfasMap departments={departments} />
          </div>
        </section>

        {/* COMPRENDRE */}
        <section className="pfas-content-section alt">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Comprendre les polluants éternels</h2>
              <p className="seo-main-subtitle">Pourquoi tout le monde en parle, et pourquoi 2026 est une année charnière.</p>
            </div>
            <div className="pfas-understand-grid">
              <article className="pfas-understand-card">
                <div className="pfas-understand-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <h3>Qu&rsquo;est-ce que les PFAS ?</h3>
                <p>
                  Les substances per- et polyfluoroalkylées sont des composés chimiques
                  ultrarésistants, utilisés depuis les années 1950 dans les antiadhésifs,
                  textiles imperméables et mousses anti-incendie. Leur persistance
                  exceptionnelle dans l&rsquo;environnement et l&rsquo;organisme leur vaut le
                  surnom de « polluants éternels ».
                </p>
                <Link href="/definitions#pfas" className="seo-card-link">Définition complète des PFAS</Link>
              </article>
              <article className="pfas-understand-card">
                <div className="pfas-understand-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <h3>La réglementation 2026</h3>
                <p>
                  Depuis le 1er janvier 2026, la recherche des PFAS est <strong>obligatoire</strong> dans
                  l&rsquo;eau potable en France, en application de la directive européenne de 2020.
                  Le seuil de qualité est fixé à <strong>0,1 µg/L</strong> pour la somme des 20 PFAS
                  réglementés. Entre 0,05 et 0,1 µg/L, une vigilance renforcée s&rsquo;impose.
                </p>
                <Link href="/methodologie" className="seo-card-link">Notre méthodologie d&rsquo;analyse</Link>
              </article>
              <article className="pfas-understand-card">
                <div className="pfas-understand-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
                </div>
                <h3>Nos données, en toute transparence</h3>
                <p>
                  EauPotable.net agrège les prélèvements réels effectués par les ARS
                  et publiés en open data par le Ministère de la Santé. Chaque fiche ville
                  affiche la valeur brute du dernier prélèvement PFAS, sa date et son unité.
                  Aucune interprétation : la donnée telle quelle.
                </p>
                <Link href="/villes" className="seo-card-link">Consulter toutes les communes</Link>
              </article>
            </div>
          </div>
        </section>

        {/* EFFETS SUR LA SANTÉ */}
        <section className="pfas-content-section">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Quels sont les effets des PFAS sur la santé ?</h2>
              <p className="seo-main-subtitle">Ce que dit la science sur l&rsquo;exposition aux polluants éternels.</p>
            </div>
            <div className="pfas-prose">
              <p>
                L&rsquo;exposition chronique aux PFAS est associée à plusieurs effets sur la santé,
                documentés par les agences sanitaires françaises et internationales&nbsp;:
              </p>
              <ul>
                <li><strong>Cholestérol</strong> : l&rsquo;augmentation du cholestérol sanguin est l&rsquo;effet le mieux documenté.</li>
                <li><strong>Fertilité et grossesse</strong> : diminution du poids de naissance, effets sur la fertilité.</li>
                <li><strong>Immunité</strong> : réponse vaccinale réduite chez les enfants exposés.</li>
                <li><strong>Foie et thyroïde</strong> : atteintes hépatiques et perturbations thyroïdiennes.</li>
                <li><strong>Cancers</strong> : le PFOA est classé cancérogène pour l&rsquo;homme (groupe 1) par le CIRC depuis 2023&nbsp;; le PFOS est classé possiblement cancérogène (groupe 2B).</li>
              </ul>
              <p>
                Dans l&rsquo;eau potable, l&rsquo;enjeu est l&rsquo;exposition quotidienne à faible dose sur
                plusieurs années&nbsp;: les PFAS s&rsquo;accumulent dans le sang, le foie et les reins,
                avec une demi-vie de plusieurs années. C&rsquo;est cette accumulation qui a motivé
                le durcissement réglementaire de 2026.
              </p>
              <p>
                Les concentrations mesurées dans l&rsquo;eau du robinet en France restent très
                inférieures aux niveaux des expositions professionnelles ayant permis
                d&rsquo;établir ces effets. Le risque individuel dépend de la dose et de la durée
                d&rsquo;exposition, selon l&rsquo;ANSES.
              </p>
            </div>
          </div>
        </section>

        {/* NORMES ET SEUILS */}
        <section className="pfas-content-section alt">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Normes et seuils PFAS dans l&rsquo;eau potable</h2>
              <p className="seo-main-subtitle">La grille de lecture des résultats, appliquée à chaque prélèvement.</p>
            </div>
            <div className="pfas-prose">
              <p>
                La directive européenne 2020/2184, applicable depuis le 1er janvier 2026 en
                France, impose deux limites&nbsp;:
              </p>
              <ul>
                <li><strong>0,1 µg/L</strong> pour la <strong>somme des 20 PFAS réglementés</strong>&nbsp;: c&rsquo;est la limite de qualité à ne pas dépasser.</li>
                <li><strong>0,5 µg/L</strong> pour le <strong>« PFAS total »</strong>, c&rsquo;est-à-dire l&rsquo;ensemble des PFAS mesurables dans l&rsquo;eau.</li>
              </ul>
              <p>
                Pour rendre ces résultats lisibles, EauPotable.net applique la grille
                suivante à chaque prélèvement&nbsp;:
              </p>
            </div>
            <div className="pfas-threshold-table">
              <table>
                <thead>
                  <tr>
                    <th>Concentration (somme des 20 PFAS)</th>
                    <th>Lecture du résultat</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Moins de 0,01 µg/L</td>
                    <td>Aucune trace détectée</td>
                  </tr>
                  <tr>
                    <td>De 0,01 à 0,05 µg/L</td>
                    <td>Traces détectées</td>
                  </tr>
                  <tr>
                    <td>De 0,05 à 0,1 µg/L</td>
                    <td>Vigilance renforcée (alerte)</td>
                  </tr>
                  <tr>
                    <td>Plus de 0,1 µg/L</td>
                    <td>Dépassement de la limite de qualité réglementaire</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CLASSEMENT DÉPARTEMENTS */}
        <section className="pfas-content-section">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Les départements les plus concernés</h2>
              <p className="seo-main-subtitle">Nombre de communes avec des PFAS détectés au-dessus de 0,05 µg/L, par département.</p>
            </div>

            <div className="pfas-dept-chart">
              {departments.slice(0, 30).map((d) => (
                <div key={d.code} className="pfas-dept-row">
                  <div className="pfas-dept-name">
                    <Link href={`/departement/${d.code}`}>{d.name} ({d.code})</Link>
                  </div>
                  <div className="pfas-dept-bar-track">
                    <div
                      className={`pfas-dept-bar ${d.alerts > 0 ? 'has-alerts' : ''}`}
                      style={{ width: `${Math.max((d.alerts / maxAlerts) * 100, d.alerts > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                  <div className="pfas-dept-count">{d.alerts} <span>alertes</span></div>
                </div>
              ))}
            </div>

            {departments.length > 30 && (
              <p className="pfas-chart-note">
                Graphique limité aux 30 départements les plus concernés — {fmtFr(departments.length)} départements analysés au total.
              </p>
            )}
          </div>
        </section>

        {/* TOP COMMUNES */}
        <section className="pfas-content-section alt">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Les communes les plus concernées</h2>
              <p className="seo-main-subtitle">Les 50 communes avec la valeur PFAS la plus élevée au dernier prélèvement ARS.</p>
            </div>

            <div className="pfas-table-container">
              <table className="pfas-table">
                <thead>
                  <tr>
                    <th>Commune</th>
                    <th>Département</th>
                    <th>Valeur PFAS</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {topCities.map((city) => {
                    const status = pfasStatus(city.val);
                    return (
                      <tr key={city.slug}>
                        <td><Link href={`/ville/${city.slug}`} className="pfas-city-link">{city.name}</Link></td>
                        <td>{city.dept}</td>
                        <td className="pfas-table-val">{city.val} {city.unit}</td>
                        <td><span className={`pfas-status-badge ${status.cls}`}>{status.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="pfas-table-note">
              Valeurs brutes issues des derniers prélèvements ARS. Seuil réglementaire : 0,1 µg/L
              (somme des 20 PFAS). Traces : 0,01 à 0,05 µg/L &mdash; Alerte : 0,05 à 0,1 µg/L &mdash;
              Dépassement : au-delà de 0,1 µg/L.
            </p>
          </div>
        </section>

        {/* ÉLIMINER LES PFAS */}
        <section className="pfas-content-section">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Filtre PFAS : comment éliminer les PFAS de l&rsquo;eau ?</h2>
              <p className="seo-main-subtitle">Traitements collectifs, filtres domestiques, et une idée reçue à corriger.</p>
            </div>
            <div className="pfas-prose">
              <p>
                <strong>Faire bouillir l&rsquo;eau n&rsquo;élimine pas les PFAS</strong>&nbsp;: l&rsquo;ébullition
                évapore l&rsquo;eau mais pas les polluants, et augmente donc leur concentration.
                C&rsquo;est la fausse bonne idée la plus répandue.
              </p>
              <p>
                En cas de dépassement, les collectivités déploient des traitements éprouvés&nbsp;:
                filtration sur <strong>charbon actif en grains</strong>, <strong>membranes haute pression</strong>
                (nanofiltration, osmose inverse) ou <strong>résines échangeuses d&rsquo;ions</strong>,
                éventuellement dilution avec une ressource moins contaminée.
              </p>
              <p>
                À domicile, l&rsquo;<strong>osmose inverse</strong> offre la meilleure réduction (souvent
                supérieure à 90&nbsp;%), mais son coût et son rejet d&rsquo;eau sont conséquents. Les
                <strong> carafes filtrantes à charbon actif</strong> ont une efficacité partielle et
                variable selon les modèles&nbsp;; un filtre mal entretenu peut relarguer des
                bactéries. Avant tout achat, vérifiez la valeur réelle dans votre commune et
                suivez les consignes de l&rsquo;ARS&nbsp;: en dessous des seuils, aucune filtration
                n&rsquo;est nécessaire.
              </p>
            </div>
          </div>
        </section>

        {/* EAU EN BOUTEILLE */}
        <section className="pfas-content-section alt">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">PFAS dans l&rsquo;eau en bouteille&nbsp;: qu&rsquo;en est-il ?</h2>
              <p className="seo-main-subtitle">Le réflexe bouteille n&rsquo;est pas une garantie.</p>
            </div>
            <div className="pfas-prose">
              <p>
                L&rsquo;eau en bouteille n&rsquo;est pas systématiquement exempte de PFAS&nbsp;: des
                contrôles récents ont mis en évidence des traces dans certaines eaux
                embouteillées commercialisées en France. Le cadre réglementaire des eaux
                conditionnées est distinct de celui de l&rsquo;eau du robinet&nbsp;: l&rsquo;obligation
                de recherche PFAS entrée en vigueur le 1er janvier 2026 concerne les
                réseaux publics.
              </p>
              <p>
                L&rsquo;eau du robinet présente un avantage décisif&nbsp;: ses analyses sont
                publiées en open data et consultables commune par commune, alors que la
                transparence des eaux en bouteille reste limitée. Avant de basculer vers
                la bouteille, vérifiez la valeur PFAS de votre commune&nbsp;: dans la grande
                majorité des cas, l&rsquo;eau du robinet reste le choix le plus sain et le plus
                écologique.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="pfas-content-section">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Questions fréquentes sur les PFAS</h2>
              <p className="seo-main-subtitle">Les réponses essentielles sur les polluants éternels dans l&rsquo;eau potable.</p>
            </div>
            <div className="seo-faq-accordion">
              {FAQ_ITEMS.map((item, i) => (
                <details key={i} className="seo-faq-item" open={i === 0}>
                  <summary className="seo-faq-question">
                    <h3>{item.q}</h3>
                    <span className="faq-icon"></span>
                  </summary>
                  <div className="seo-faq-answer">
                    <p>{item.aHtml || item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* SOURCES */}
        <section className="pfas-content-section alt">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Sources officielles</h2>
              <p className="seo-main-subtitle">Les références sur lesquelles s&rsquo;appuie cette page.</p>
            </div>
            <ul className="pfas-sources-list">
              <li><a href="https://www.anses.fr/fr/content/pfas" target="_blank" rel="noopener noreferrer">ANSES — Dossier PFAS (per- et polyfluoroalkylées)</a></li>
              <li><a href="https://www.santepubliquefrance.fr/pfas" target="_blank" rel="noopener noreferrer">Santé publique France — PFAS et santé</a></li>
              <li><a href="https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX%3A32020L2184" target="_blank" rel="noopener noreferrer">Directive (UE) 2020/2184 — qualité des eaux destinées à la consommation humaine</a></li>
              <li><a href="https://www.data.gouv.fr/fr/" target="_blank" rel="noopener noreferrer">data.gouv.fr — données ouvertes des contrôles sanitaires (ARS / Ministère de la Santé)</a></li>
              <li><a href="https://www.iarc.who.int/fr/" target="_blank" rel="noopener noreferrer">CIRC / OMS — classement cancérogène des PFAS (PFOA, PFOS)</a></li>
            </ul>
          </div>
        </section>

        {/* CTA FOOTER */}
        <section className="pfas-footer-cta">
          <div className="seo-container">
            <div className="pfas-cta-card">
              <h3>Des PFAS dans l&rsquo;eau de votre commune ?</h3>
              <p>
                Vérifiez en quelques secondes la valeur exacte mesurée par les ARS
                dans votre ville : Crystal Score, PFAS, nitrates et pesticides.
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
                  { '@type': 'ListItem', position: 1, name: 'Accueil', item: DOMAIN },
                  { '@type': 'ListItem', position: 2, name: 'PFAS dans l\'eau du robinet', item: `${DOMAIN}/pfas-eau-potable` }
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
              },
              {
                '@context': 'https://schema.org',
                '@type': 'Dataset',
                name: 'Contamination PFAS dans l\'eau potable en France — données communales',
                description: `Aggrégation des prélèvements PFAS (ARS) pour ${fmtFr(national.tested)} communes françaises : traces, alertes et dépassements du seuil réglementaire.`,
                publisher: { '@id': `${DOMAIN}/#organization` },
                url: `${DOMAIN}/pfas-eau-potable`,
                temporalCoverage: `2026-01-01/${generatedAt}`
              }
            ])
          }}
        />
      </main>
    </>
  );
}
