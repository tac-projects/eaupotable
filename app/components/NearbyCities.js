'use client';
import { Fragment } from 'react';

export default function NearbyCities({ cities, dpt }) {
  if (!cities || cities.length === 0) return null;
  return (
    <Fragment>
      <div className="seo-section-header">
        <h2 className="seo-main-title">Communes du département</h2>
        <p className="seo-main-subtitle">Explorez les rapports de pureté des autres territoires du département {dpt}.</p>
      </div>
      <div className="seo-tags-grid">
        {cities.filter(c => !c.isCurrent).map(c => {
          const slug = c.code || c.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');
          return (<a key={slug} href={`/ville/${slug}`} className="seo-city-tag">Eau à {c.nom}</a>)
        })}
      </div>
    </Fragment>
  );
}
