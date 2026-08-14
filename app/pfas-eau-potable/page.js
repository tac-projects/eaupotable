import Navbar from '../components/Navbar';
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

export async function generateMetadata() {
  const data = getPfasData();
  const n = data.national;
  return {
    title: 'PFAS dans l\'eau du robinet : le bilan 2026 par commune | EauPotable.net',
    description: `Polluants éternels : ${fmtFr(n.tested)} communes testées, ${fmtFr(n.traces)} avec traces détectées, ${fmtFr(n.alerts)} en alerte. Bilan national PFAS commune par commune, données ARS.`,
    alternates: {
      canonical: `${DOMAIN}/pfas-eau-potable`,
    },
  };
}

const FAQ_ITEMS = [
  {
    q: 'Que sont les PFAS (polluants éternels) ?',
    a: 'Les PFAS (substances per- et polyfluoroalkylées) sont des composés chimiques ultrarésistants utilisés depuis les années 1950 dans les revêtements antiadhésifs, les textiles imperméables et les mousses anti-incendie. Ils ne se dégradent quasiment pas dans l\'environnement et s\'accumulent dans l\'organisme, d\'où leur surnom de « polluants éternels ». Certains sont suspectés d\'effets perturbateurs endocriniens et cancérigènes.'
  },
  {
    q: 'Y a-t-il des PFAS dans l\'eau de ma commune ?',
    a: 'Depuis le 1er janvier 2026, la recherche des PFAS est obligatoire dans l\'eau potable en France. Sur les 32 455 communes analysées dans notre observatoire, 2 812 présentent des traces supérieures à 0,01 µg/L et 485 dépassent 0,05 µg/L. Consultez la fiche de votre ville pour connaître la valeur exacte mesurée par les ARS.'
  },
  {
    q: 'Quelle est la norme pour les PFAS dans l\'eau potable ?',
    a: 'La directive européenne de 2020 fixe un seuil de 0,1 µg/L pour la somme des 20 PFAS réglementés, applicable depuis le 1er janvier 2026 en France. En dessous de 0,05 µg/L, la présence est considérée comme des traces ; au-delà de 0,1 µg/L, l\'eau dépasse la limite de qualité réglementaire.'
  },
  {
    q: 'Comment EauPotable.net mesure-t-il les PFAS ?',
    a: 'Nous exploitons les prélèvements réels effectués par les Agences Régionales de Santé (ARS) et publiés en open data par le Ministère de la Santé. Chaque fiche ville affiche la valeur du dernier prélèvement PFAS, sa date et son unité, sans interprétation : la donnée brute, pour une transparence totale.'
  },
  {
    q: 'Que faire si ma commune dépasse le seuil PFAS ?',
    a: 'En cas de dépassement du seuil réglementaire, les autorités sanitaires peuvent restreindre la consommation et engager des travaux de traitement (filtration sur charbon actif, dilution avec une autre ressource). Les filtres domestiques à osmose inverse ou charbon actif certifié peuvent réduire la présence de PFAS, mais la priorité reste l\'action de l\'exploitant du réseau. Suivez les communications de votre ARS et de votre mairie.'
  }
];

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
              <span className="curr">PFAS</span>
            </nav>
            <h1 className="pfas-main-title">
              PFAS dans l&rsquo;eau du robinet : le bilan 2026
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

        {/* COMPRENDRE */}
        <section className="pfas-content-section">
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

        {/* CLASSEMENT DÉPARTEMENTS */}
        <section className="pfas-content-section alt">
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
        <section className="pfas-content-section">
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

        {/* FAQ */}
        <section className="pfas-content-section alt">
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
                    <p>{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
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
