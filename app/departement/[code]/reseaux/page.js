import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import '../../../styles/reseau.css';

export const revalidate = 86400;

const DOMAIN = 'https://www.eaupotable.net';
const DEPT_CODE_RE = /^(?:2[AB]|\d{2,3})$/;

let reseauxIndexCache = null;
function getReseaux() {
  if (reseauxIndexCache) return reseauxIndexCache;
  const p = path.join(process.cwd(), 'public', 'data', 'reseaux-index.json');
  try {
    const data = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : { reseaux: {} };
    reseauxIndexCache = Object.values(data.reseaux || {});
  } catch {
    reseauxIndexCache = [];
  }
  return reseauxIndexCache;
}

let deptNameCache = {};
function getDeptName(code) {
  if (deptNameCache[code]) return deptNameCache[code];
  const p = path.join(process.cwd(), 'public', 'data', 'departments', `${code}.json`);
  try {
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    deptNameCache[code] = d.deptInfo?.name || `Département ${code}`;
  } catch {
    deptNameCache[code] = `Département ${code}`;
  }
  return deptNameCache[code];
}

function reseauxForDept(code) {
  return getReseaux()
    .filter((r) => r.departements?.includes(code))
    .sort((a, b) => b.communes.length - a.communes.length || (a.installation || '').localeCompare(b.installation || '', 'fr'));
}

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('fr-FR');
}

export async function generateMetadata({ params }) {
  const { code } = await params;
  if (!DEPT_CODE_RE.test(code)) return { title: "Réseaux d'eau potable - EauPotable.net" };
  const deptName = getDeptName(code);
  const list = reseauxForDept(code);
  const title = `Réseaux d'eau potable du ${deptName} (${code}) : ${list.length} réseaux | EauPotable.net`;
  const description = `Annuaire des ${list.length} réseaux de distribution d'eau potable du département ${deptName} (${code}) : exploitant, nombre de communes desservies, analyses ARS et conformité.`;
  return {
    title,
    description,
    alternates: { canonical: `${DOMAIN}/departement/${code}/reseaux` },
    openGraph: { title, description, url: `${DOMAIN}/departement/${code}/reseaux` },
  };
}

export default async function DeptReseauxPage({ params }) {
  const { code } = await params;
  if (!DEPT_CODE_RE.test(code)) notFound();

  const deptName = getDeptName(code);
  const list = reseauxForDept(code);
  if (!list.length) notFound();
  const multi = list.filter((r) => r.communes.length > 1).length;
  const mono = list.length - multi;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Réseaux d'eau potable du département ${deptName} (${code})`,
    numberOfItems: list.length,
    itemListElement: list.slice(0, 200).map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: r.installation || `Réseau ${r.udi}`,
      url: `${DOMAIN}/reseau/${r.slug || r.udi}`,
    })),
  };

  return (
    <>
      <Navbar />
      <main className="reseau-page">
        <section className="reseau-hero">
          <div className="seo-container">
            <nav className="seo-breadcrumb" aria-label="Breadcrumb">
              <a href="/">Accueil</a>
              <span className="sep">›</span>
              <a href={`/departement/${code}`}>Département {deptName}</a>
              <span className="sep">›</span>
              <span className="curr">Réseaux d&rsquo;eau potable</span>
            </nav>
            <p className="reseau-eyebrow">Annuaire départemental</p>
            <h1 className="reseau-title">Réseaux d&rsquo;eau potable du {deptName}</h1>
            <p className="reseau-subtitle">
              {list.length} réseaux de distribution recensés dans le département {code} &mdash; {multi} desservent
              plusieurs communes, {mono} une seule. Données officielles ARS / SISE-Eaux.
            </p>
          </div>
        </section>

        <section className="reseau-section">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Les réseaux du département</h2>
              <p className="seo-main-subtitle">
                Triés par nombre de communes desservies. Chaque fiche détaille l&rsquo;exploitant, les communes
                desservies et l&rsquo;historique des prélèvements.
              </p>
            </div>

            <div className="reseau-list">
              {list.map((r) => {
                const conf = r.conformRate != null ? `${r.conformRate} %` : '--';
                return (
                  <a key={r.udi} href={`/reseau/${r.slug || r.udi}`} className="reseau-list-item">
                    <span className="reseau-list-name">{r.installation || `Réseau ${r.udi}`}</span>
                    <span className="reseau-list-meta">
                      <span>{r.communes.length} commune{r.communes.length > 1 ? 's' : ''}</span>
                      <span className="reseau-list-sep">·</span>
                      <span>{r.nbAnalyses || 0} analyses</span>
                      <span className="reseau-list-sep">·</span>
                      <span>conformité {conf}</span>
                      {fmtDate(r.derniereAnalyse) && (
                        <>
                          <span className="reseau-list-sep">·</span>
                          <span>dernier prélèvement {fmtDate(r.derniereAnalyse)}</span>
                        </>
                      )}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="reseau-section alt">
          <div className="seo-container">
            <div className="reseau-note">
              <h2 className="reseau-note-title">Comment lire cet annuaire</h2>
              <p>
                Un même opérateur (syndicat, régie, délégataire) peut exploiter plusieurs réseaux
                distincts, identifiés chacun par un code UDI. C&rsquo;est pourquoi un opérateur n&rsquo;est
                pas lié à une page unique : la liste ci-dessus regroupe les réseaux réels du département.
              </p>
              <p>
                Pour connaître la qualité de l&rsquo;eau de votre commune, consultez la{' '}
                <a href={`/departement/${code}`}>page du département {deptName}</a> ou{' '}
                <a href="/villes">toutes les communes de France</a>.
              </p>
            </div>
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </main>
    </>
  );
}
