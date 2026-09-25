import { notFound } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import '../../styles/reseau.css';

export const revalidate = 86400;

const DOMAIN = 'https://www.eaupotable.net';
const UDI_RE = /^[0-9A-Z]{6,12}$/;

let reseauxCache = null;

function getReseauxData() {
  if (reseauxCache) return reseauxCache;
  const filePath = path.join(process.cwd(), 'public', 'data', 'reseaux-index.json');
  if (fs.existsSync(filePath)) {
    try {
      reseauxCache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      reseauxCache = { reseaux: {} };
    }
  }
  return reseauxCache || { reseaux: {} };
}

function getReseau(udi) {
  if (!udi || !UDI_RE.test(udi)) return null;
  return getReseauxData().reseaux?.[udi] || null;
}

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('fr-FR');
}

export async function generateMetadata({ params }) {
  const { udi } = await params;
  const r = getReseau(udi);
  if (!r) return { title: "Réseau d'eau potable - EauPotable.net" };

  const name = r.installation || `Réseau ${udi}`;
  const n = r.communes.length;
  const depts = r.departements.join(', ');
  const dateStr = fmtDate(r.derniereAnalyse);
  const title = `${name} (${udi}) : qualité de l'eau du réseau | EauPotable.net`;
  const description = `Réseau d'eau potable « ${name} » (UDI ${udi}) : ${n} commune${n > 1 ? 's' : ''} desservie${n > 1 ? 's' : ''} (${depts}), ${r.nbAnalyses} analyses ARS, ${r.conformRate != null ? `${r.conformRate} % de conformité` : 'conformité suivie'}${dateStr ? `, dernier prélèvement le ${dateStr}` : ''}.`;

  const ogImage = `/api/og?reseau=1&name=${encodeURIComponent(name)}&communes=${encodeURIComponent(String(n))}&depts=${encodeURIComponent(depts)}&conf=${encodeURIComponent(r.conformRate != null ? `${r.conformRate} %` : '--')}`;

  return {
    title,
    description,
    alternates: { canonical: `${DOMAIN}/reseau/${udi}` },
    openGraph: { title, description, url: `${DOMAIN}/reseau/${udi}`, images: [ogImage] },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function ReseauPage({ params }) {
  const { udi } = await params;
  const r = getReseau(udi);

  if (!r) {
    notFound();
  }

  const name = r.installation || `Réseau ${udi}`;
  const n = r.communes.length;
  const depts = r.departements;
  const dateDerniere = fmtDate(r.derniereAnalyse);
  const datePremiere = fmtDate(r.premiereAnalyse);
  const confRate = r.conformRate != null ? `${r.conformRate} %` : '--';
  const sameCommunes = n > 1;

  const rows = [
    { k: "Installation / ressource", v: r.installation },
    { k: "Maître d'ouvrage", v: r.maitreOuvrage },
    { k: "Exploitant", v: r.exploitant },
    { k: "Réseau amont", v: r.reseauAmont },
    { k: "Code réseau (UDI)", v: udi },
    { k: "Département(s)", v: depts.join(', ') },
    { k: "Communes desservies (fichier ARS)", v: `${n}${r.nbCommunesAnnonce && r.nbCommunesAnnonce !== n ? ` (${r.nbCommunesAnnonce} annoncées par la source)` : ''}` },
    { k: "Analyses enregistrées", v: r.nbAnalyses ? String(r.nbAnalyses) : null },
    { k: "Période couverte", v: datePremiere && dateDerniere ? `du ${datePremiere} au ${dateDerniere}` : null },
    { k: "Conformité aux limites de qualité", v: r.conformRate != null ? `${confRate} des analyses` : null },
  ].filter((row) => row.v);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: DOMAIN },
        ...(depts.length === 1
          ? [{ '@type': 'ListItem', position: 2, name: `Département ${depts[0]}`, item: `${DOMAIN}/departement/${depts[0]}` }]
          : []),
        { '@type': 'ListItem', position: depts.length === 1 ? 3 : 2, name: `Réseau ${name}`, item: `${DOMAIN}/reseau/${udi}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `Contrôles sanitaires du réseau d'eau potable « ${name} » (UDI ${udi})`,
      description: `Analyses ARS du réseau ${udi} desservant ${n} commune${n > 1 ? 's' : ''} (${depts.join(', ')}).`,
      creator: { '@type': 'Organization', '@id': `${DOMAIN}/#organization`, name: 'EauPotable.net', url: DOMAIN },
      license: `${DOMAIN}/mentions-legales`,
      url: `${DOMAIN}/reseau/${udi}`,
      spatialCoverage: { '@type': 'Place', name: depts.length === 1 ? `Département ${depts[0]}` : 'France' },
      ...(r.premiereAnalyse && r.derniereAnalyse ? { temporalCoverage: `${r.premiereAnalyse}/${r.derniereAnalyse}` } : {}),
    },
  ];

  return (
    <>
      <Navbar />
      <main className="reseau-page">
        <section className="reseau-hero">
          <div className="seo-container">
            <nav className="seo-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Accueil</Link>
              <span className="sep">›</span>
              {depts.length === 1 && (
                <>
                  <Link href={`/departement/${depts[0]}`}>Département {depts[0]}</Link>
                  <span className="sep">›</span>
                </>
              )}
              <span className="curr">{name}</span>
            </nav>
            <p className="reseau-eyebrow">Réseau de distribution d&rsquo;eau potable</p>
            <h1 className="reseau-title">{name}</h1>
            <p className="reseau-subtitle">
              Code réseau (UDI) <strong>{udi}</strong> &mdash; {n} commune{n > 1 ? 's' : ''} desservie{n > 1 ? 's' : ''}
              {depts.length === 1 ? ` dans le département ${depts[0]}` : ` (${depts.join(', ')})`}.
            </p>

            <div className="reseau-stats-band">
              <div className="reseau-stat">
                <span className="reseau-stat-val">{n}</span>
                <span className="reseau-stat-label">Commune{n > 1 ? 's' : ''} desservie{n > 1 ? 's' : ''}</span>
              </div>
              <div className="reseau-stat">
                <span className="reseau-stat-val">{r.nbAnalyses || '--'}</span>
                <span className="reseau-stat-label">Analyses enregistrées</span>
              </div>
              <div className="reseau-stat">
                <span className="reseau-stat-val">{confRate}</span>
                <span className="reseau-stat-label">Conformité aux limites</span>
              </div>
              <div className="reseau-stat">
                <span className="reseau-stat-val">{dateDerniere || '--'}</span>
                <span className="reseau-stat-label">Dernier prélèvement</span>
              </div>
            </div>
          </div>
        </section>

        <section className="reseau-section">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Caractéristiques du réseau</h2>
              <p className="seo-main-subtitle">
                Informations déclarées par l&rsquo;Agence Régionale de Santé (données SISE-Eaux).
              </p>
            </div>
            <div className="reseau-table-wrapper">
              <table className="reseau-table">
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.k}>
                      <th scope="row">{row.k}</th>
                      <td>{row.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="reseau-section alt">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">
                {sameCommunes ? 'Communes desservies par ce réseau' : 'Commune desservie par ce réseau'}
              </h2>
              <p className="seo-main-subtitle">
                {sameCommunes
                  ? 'Ces communes partagent la même installation et la même eau du robinet. Chaque fiche affiche les valeurs mesurées par les ARS.'
                  : 'Cette commune est desservie par le réseau. Sa fiche affiche les valeurs mesurées par les ARS.'}
              </p>
            </div>
            <div className="reseau-communes-grid">
              {r.communes.map((c) => (
                <Link key={c.slug} href={`/ville/${c.slug}`} className="reseau-commune-card">
                  <span className="reseau-commune-name">{c.nom}</span>
                  <span className="reseau-commune-dept">Département {c.dept}</span>
                  <span className="reseau-commune-link">Voir l&rsquo;analyse &rsaquo;</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="reseau-section">
          <div className="seo-container">
            <div className="reseau-note">
              <h2 className="reseau-note-title">Comprendre les données de ce réseau</h2>
              <p>
                Le détail des paramètres (nitrates, calcaire, pesticides, PFAS, microbiologie&hellip;) est publié
                sur la fiche de chaque commune desservie, car c&rsquo;est à ce niveau que les prélèvements
                sont rattachés. Un réseau peut desservir plusieurs communes : les résultats d&rsquo;analyses
                y sont alors identiques, puisque l&rsquo;eau distribuée est la même.
              </p>
              <p>
                Retrouvez l&rsquo;ensemble des réseaux et des communes sur{' '}
                {depts.map((d, i) => (
                  <span key={d}>
                    {i > 0 ? ', ' : ''}
                    <Link href={`/departement/${d}`}>le département {d}</Link>
                  </span>
                ))}
                {' '}ou consultez <Link href="/villes">toutes les communes de France</Link>.
              </p>
            </div>
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </main>
    </>
  );
}
