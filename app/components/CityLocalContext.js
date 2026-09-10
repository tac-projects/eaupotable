'use client';

import Link from 'next/link';

// Blocs de contenu unique par commune / par réseau : contexte communal (population,
// superficie…), réseau de distribution, historique des prélèvements et communes sœurs.
// Objectif : différencier les fiches ville qui partagent les mêmes mesures d'eau.

function formatInt(n) {
  return typeof n === 'number' ? n.toLocaleString('fr-FR') : null;
}

function formatSurface(hectares) {
  if (typeof hectares !== 'number') return null;
  return `${(hectares / 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km²`;
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('fr-FR');
}

// Code postal : on ne condense en plage "min – max" que si les codes sont consécutifs
// ET partagent le même préfixe (sinon une plage suggérerait des codes inexistants).
// La liste complète reste dans l'attribut title (indexable, non affichée).
function formatPostalCodes(codes) {
  if (!Array.isArray(codes) || codes.length === 0) return null;
  const list = codes.map(String);
  if (list.length === 1) return { text: list[0], title: null, count: 1 };
  if (list.length === 2) return { text: list.join(' / '), title: null, count: 2 };

  const sorted = [...list].sort((a, b) => Number(a) - Number(b));
  const samePrefix = sorted.every((c) => c.slice(0, 3) === sorted[0].slice(0, 3));
  const consecutive = sorted.every((c, i) => i === 0 || Number(c) === Number(sorted[i - 1]) + 1);

  if (samePrefix && consecutive) {
    return {
      text: `${sorted[0]} – ${sorted[sorted.length - 1]}`,
      title: `${list.length} codes postaux : ${list.join(' / ')}`,
      count: list.length,
    };
  }
  return { text: `${list.length} codes postaux`, title: list.join(' / '), count: list.length };
}

const Icon = ({ name }) => {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  switch (name) {
    case 'population':
      return (<svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
    case 'surface':
      return (<svg {...common}><path d="M3 3h18v18H3z" /><path d="M3 9h18M9 21V9" /></svg>);
    case 'region':
      return (<svg {...common}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>);
    case 'network':
      return (<svg {...common}><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M12 7.5v4M12 11.5 6.5 17M12 11.5 17.5 17" /></svg>);
    case 'history':
      return (<svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></svg>);
    case 'link':
      return (<svg {...common}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></svg>);
    default:
      return null;
  }
};

export default function CityLocalContext({ cityName, data }) {
  const geo = data?.geo || null;
  const reseau = data?.reseauInfo || null;
  const communes = Array.isArray(data?.reseauCommunes) ? data.reseauCommunes : [];
  const regionName = data?.regionalInfo?.name || null;
  const dpt = data?.meta?.code_departement || '';

  if (!geo && !reseau) return null;

  const population = formatInt(geo?.population);
  const surface = formatSurface(geo?.surface);
  const densite = (geo?.population && geo?.surface)
    ? Math.round(geo.population / (geo.surface / 100)).toLocaleString('fr-FR')
    : null;
  const codePostal = formatPostalCodes(geo?.codesPostaux);

  const nbCommunes = formatInt(reseau?.nbCommunes);
  const nbAnalyses = formatInt(reseau?.nbAnalyses);
  const debut = formatDate(reseau?.premiereAnalyse);
  const fin = formatDate(reseau?.derniereAnalyse);
  const periode = debut && fin ? `de ${debut} à ${fin}` : (fin ? `jusqu'en ${fin}` : null);
  const conformRate = typeof reseau?.conformRate === 'number' ? reseau.conformRate : null;

  const localStats = [
    population && { label: 'Population', value: population, sub: 'habitants', icon: 'population' },
    surface && { label: 'Superficie', value: surface, sub: 'territoire communal', icon: 'surface' },
    densite && { label: 'Densité', value: densite, sub: 'hab./km²', icon: 'population' },
    regionName && { label: 'Région', value: regionName, sub: dpt ? `Département ${dpt}` : null, icon: 'region' },
  ].filter(Boolean);

  const reseauRows = reseau ? [
    reseau.installation && { label: "Installation de production", value: reseau.installation },
    reseau.maitreOuvrage && { label: "Maître d'ouvrage", value: reseau.maitreOuvrage },
    reseau.exploitant && { label: 'Exploitant', value: reseau.exploitant },
    reseau.reseauAmont && { label: 'Réseau amont', value: reseau.reseauAmont },
    nbCommunes && { label: 'Communes desservies', value: nbCommunes },
    reseau.code && { label: 'Code réseau (UDI)', value: reseau.code },
  ].filter(Boolean) : [];

  return (
    <div className="city-context-master">
      {localStats.length > 0 && (
        <div className="seo-section-header">
          <h2 className="seo-main-title">{cityName} en bref</h2>
          <p className="seo-main-subtitle">
            Le contexte de la commune et le réseau d'eau qui l'alimente, d'après les données publiques INSEE et SISE-Eaux.
          </p>
        </div>
      )}

      {localStats.length > 0 && (
        <div className="city-local-stats">
          {localStats.map((s) => (
            <div className="city-local-stat" key={s.label}>
              <span className="city-local-stat-icon"><Icon name={s.icon} /></span>
              <span className="city-local-stat-label">{s.label}</span>
              <span className="city-local-stat-value">{s.value}</span>
              {s.sub && <span className="city-local-stat-sub">{s.sub}</span>}
            </div>
          ))}
          {codePostal && (
            <div className="city-local-stat" title={codePostal.title || undefined}>
              <span className="city-local-stat-icon"><Icon name="region" /></span>
              <span className="city-local-stat-label">{codePostal.count > 1 ? 'Codes postaux' : 'Code postal'}</span>
              <span className="city-local-stat-value">{codePostal.text}</span>
            </div>
          )}
        </div>
      )}

      {reseauRows.length > 0 && (
        <div className="city-network-card">
          <div className="city-network-head">
            <span className="city-network-icon"><Icon name="network" /></span>
            <div>
              <h3>Le réseau qui dessert {cityName}</h3>
              <p>Caractéristiques du réseau de distribution d'eau potable (données ARS / SISE-Eaux).</p>
            </div>
          </div>
          <dl className="city-network-list">
            {reseauRows.map((r) => (
              <div className="city-network-row" key={r.label}>
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {(nbAnalyses || periode || conformRate !== null) && (
        <div className="city-network-card">
          <div className="city-network-head">
            <span className="city-network-icon"><Icon name="history" /></span>
            <div>
              <h3>Historique des prélèvements</h3>
              <p>Suivi des analyses réalisées sur ce réseau par l'Agence Régionale de Santé.</p>
            </div>
          </div>
          <div className="city-history-stats">
            {nbAnalyses && (
              <div className="city-history-stat">
                <span className="city-history-value">{nbAnalyses}</span>
                <span className="city-history-label">analyses enregistrées</span>
              </div>
            )}
            {conformRate !== null && (
              <div className="city-history-stat">
                <span className="city-history-value">{conformRate} %</span>
                <span className="city-history-label">de conformité aux limites</span>
              </div>
            )}
            {periode && (
              <div className="city-history-stat wide">
                <span className="city-history-value">{periode}</span>
                <span className="city-history-label">période couverte</span>
              </div>
            )}
          </div>
        </div>
      )}

      {communes.length > 0 && (
        <div className="city-network-card">
          <div className="city-network-head">
            <span className="city-network-icon"><Icon name="link" /></span>
            <div>
              <h3>Autres communes desservies par ce réseau</h3>
              <p>Ces communes partagent la même installation et la même eau du robinet que {cityName}.</p>
            </div>
          </div>
          <div className="city-network-communes">
            {communes.map((c) => (
              <Link key={c.code} href={`/ville/${c.code}`} className="city-network-commune">
                Eau à {c.nom}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
