'use client';

import React from 'react';

export default function CityHero({ cityName, dpt, dateAnalyse, score, label, nomReseau }) {
  return (
    <section className="city-hero-section">
      <style dangerouslySetInnerHTML={{ __html: `
        .city-hero-section { min-height: 400px; contain: layout; background: #f1f5f9; position: relative; }
        .city-hero-container { opacity: 1 !important; visibility: visible !important; }
        .score-badge { contain: content; }
      `}} />
      <div className="city-hero-mesh"></div>
      <div className="city-hero-grain"></div>
      
      <div className="city-hero-container">
        <nav className="city-hero-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Accueil</a>
          <span className="sep">›</span>
          <a href="/villes">France</a>
          <span className="sep">›</span>
          <a href={`/departement/${dpt}`}>Département {dpt}</a>
          <span className="sep">›</span>
          <span className="curr">{cityName}</span>
        </nav>
        
        <div className="city-hero-main">
          <div className="city-hero-info">
            <div className="city-hero-badge">
              <span className="badge-pulse"></span>
              RELEVÉ OFFICIEL ARS 2026
            </div>
            <h1 className="city-hero-title">
              Qualité de l'eau à <span className="highlight">{cityName}</span>
            </h1>
            <p className="city-hero-subtitle">
              Analyse complète du réseau de distribution {nomReseau || cityName} basée sur les dernières données du {dateAnalyse}.
            </p>
          </div>

          <div className="city-hero-score-card">
            <div className={`score-badge ${label?.toLowerCase().replace(/\s/g, '-') || 'status-good'}`}>
              <div className="score-value">
                <span className="num">{score}</span>
                <span className="total">/10</span>
              </div>
              <div className="score-meta">
                <span className="label">CRYSTAL SCORE</span>
                <span className="verdict">&nbsp;{label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
