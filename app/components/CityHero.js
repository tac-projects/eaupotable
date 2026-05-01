// Composant de rendu serveur pour un LCP optimal

import React from 'react';
import Image from 'next/image';

export default function CityHero({ cityName, dpt, dateAnalyse, score, label, nomReseau }) {
  return (
    <section className="city-hero-section">
      <div className="city-hero-mesh"></div>
      <div className="city-hero-grain"></div>
      
      <div className="seo-container">
        <nav className="city-hero-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Accueil</a>
          <span className="sep">›</span>
          <a href="/villes">France</a>
          <span className="sep">›</span>
          <a href={`/departement/${dpt}`}>Département {dpt}</a>
          <span className="sep">›</span>
          <span className="curr">{cityName}</span>
        </nav>
        
        <div className="hero-split-container">
          <div className="hero-left">
            <div className="city-hero-badge">
              <span className="badge-pulse"></span>
              RELEVÉ OFFICIEL ARS 2026
            </div>
            <h1 className="city-hero-title">
              Qualité de l'eau à <span className="highlight">{cityName}</span>
            </h1>
            <p className="city-hero-subtitle">
              Analyse complète du réseau de distribution <strong>{nomReseau || cityName}</strong> basée sur les dernières données du <strong>{dateAnalyse}</strong>.
            </p>
            
            <div className="seo-source-line">
              <div className="source-links">
                <a 
                  href="https://sante.gouv.fr/sante-et-environnement/eaux/eau" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="source-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="trust-icon">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Données ARS 2026
                </a>
                <a 
                  href="https://www.data.gouv.fr/fr/reuses/eaupotable-net-observatoire-citoyen-de-la-qualite-de-leau-et-des-pfas/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="source-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="trust-icon">
                    <path d="M12 2l10 5v10l-10 5L2 17V7l10-5z"/>
                    <path d="M12 22V12"/><path d="M22 7l-10 5L2 7"/>
                  </svg>
                  Référencé Data.gouv.fr
                </a>
                <a 
                  href="https://alliance.numerique.gouv.fr/licence-ouverte-open-licence/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="source-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="trust-icon">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C10.9 14.19 13.1 13 15 12"/>
                  </svg>
                  Partenaire Open Data
                </a>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-water-image-container city-variant">
              <Image 
                src="/images/hero-water-glass.png" 
                alt={`Qualité de l'eau potable à ${cityName} - Rapport 2026`}
                className="hero-water-image no-anim"
                width={600}
                height={600}
                priority={true}
                fetchPriority="high"
                sizes="(max-width: 1023px) 280px, 600px"
              />
              <div className="crystal-score-badge city-variant">
                <div className="crystal-badge-header">
                  <svg className="crystal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 3h12l4 6-10 13L2 9Z" />
                    <path d="M12 3l-4 6 4 13 4-13-4-6" />
                  </svg>
                  Crystal Score™
                </div>
                <div className="crystal-badge-val">{typeof score === 'number' ? score.toFixed(1) : score}<span>/10</span></div>
                <div className="crystal-badge-desc">Verdict : <strong>{label}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
