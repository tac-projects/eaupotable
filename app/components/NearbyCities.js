'use client';
import { Fragment } from 'react';
import { NEARBY_INTROS, pickFrom } from '@/lib/content-variants';

export default function NearbyCities({ cities, dpt, isMetropolis = false, cityName = '' }) {
  if (!cities || cities.length === 0) return null;
  const intro = pickFrom(NEARBY_INTROS, cityName, dpt, 71).replace(/\{dpt\}/g, dpt);
  return (
    <Fragment>
      <div className="seo-section-header">
        <h2 className="seo-main-title">
          {isMetropolis ? "Villes Populaires en France" : "Communes du département"}
        </h2>
        <p className="seo-main-subtitle">
          {isMetropolis 
            ? "Découvrez la qualité de l'eau dans les autres grandes métropoles nationales."
            : intro}
        </p>
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
