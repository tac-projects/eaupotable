// Composant de rendu serveur pour un LCP optimal

import React from 'react';

export default function CityHero({ cityName, dpt, dateAnalyse, score, label, nomReseau }) {
  return (
    <section className="city-hero-section">
      <style dangerouslySetInnerHTML={{ __html: `
        .city-hero-section { min-height: 450px; contain: layout; background: #f8fafc; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; width: 100%; }
        .city-hero-container { width: 100%; max-width: 1200px; padding: 0 20px; z-index: 10; opacity: 1 !important; visibility: visible !important; }
        .city-hero-title { font-size: 3rem; font-weight: 800; color: #0f172a; margin-bottom: 20px; line-height: 1.1; }
        .score-badge { background: white; border-radius: 24px; padding: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.06); display: flex; flex-direction: column; align-items: center; min-width: 140px; contain: content; }
        .num { font-size: 3.5rem; font-weight: 900; line-height: 1; color: #0f172a; }
        .badge-pulse { display: block; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 8px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
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
