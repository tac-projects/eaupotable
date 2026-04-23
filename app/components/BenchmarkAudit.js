'use client';

import { useState } from 'react';

export default function BenchmarkAudit({ cityName, neighborCities, dpt, initialAnalyzedCities, initialPhase }) {
  const [analysisPhase, setAnalysisPhase] = useState(initialPhase || 'done');
  const [analyzedCities, setAnalyzedCities] = useState(initialAnalyzedCities || []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisPhase('loading');
    
    // On commence avec la ville actuelle
    // Note: On suppose que la ville actuelle est déjà dans neighborCities avec isCurrent
    const currentCity = neighborCities.find(c => c.isCurrent);
    let pool = currentCity ? [currentCity] : [];
    setAnalyzedCities([...pool]);

    const targetCities = neighborCities.filter(c => !c.isCurrent);

    for (const city of targetCities) {
      try {
        const res = await fetch(`/api/water-summary?city=${encodeURIComponent(city.nom)}`);
        if (res.ok) {
           const summary = await res.json();
           if (summary && summary.crystal) {
             pool.push({ nom: city.nom, score: parseFloat(summary.crystal.final), isCurrent: false, code: city.code });
             const sortedPool = [...pool].sort((a, b) => b.score - a.score);
             setAnalyzedCities(sortedPool);
           }
        }
      } catch (err) {}
      await new Promise(r => setTimeout(r, 100)); // Un peu plus rapide
    }
    
    setAnalysisPhase('done');
    setIsAnalyzing(false);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="seo-card benchmark-container">
      <div className="benchmark-list">
        {analysisPhase === 'idle' ? (
          <div className="benchmark-cta-container">
            <button className="benchmark-start-btn" onClick={startAnalysis} disabled={isAnalyzing}>
              <span className="btn-icon">{isAnalyzing ? '⏳' : '⚡'}</span>
              {isAnalyzing ? 'Analyse en cours...' : "Lancer l'audit comparatif"}
            </button>
            <p className="benchmark-cta-hint">Analyse en temps réel de {neighborCities.length} réseaux via Hub'Eau (3-5 sec)</p>
          </div>
        ) : (
          analyzedCities.map((city) => {
            const slug = city.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');
            return (
              <a 
                key={city.nom} 
                href={city.isCurrent ? '#' : `/ville/${slug}`} 
                className={`benchmark-item ${city.isCurrent ? 'current-city' : ''} ${analysisPhase === 'loading' ? 'loading' : ''}`}
                onClick={(e) => city.isCurrent && e.preventDefault()}
              >
                <span className="benchmark-city">{city.nom}</span>
                <div className="benchmark-bar-bg">
                  <div 
                    className="benchmark-bar-fill" 
                    style={{
                      width: `${city.score * 10}%`,
                      opacity: city.isCurrent ? 1 : 0.6
                    }}
                  ></div>
                </div>
                <span className="benchmark-score">{(city.score || 0).toFixed(1)}</span>
              </a>
            );
          })
        )}
        {analysisPhase === 'loading' && analyzedCities.length <= neighborCities.length && (
          <div className="benchmark-scanning-indicator">
            <div className="scanner-dot"></div>
            Audit du réseau de {neighborCities.filter(nc => !analyzedCities.find(ac => ac.nom === nc.nom))[0]?.nom || 'la commune'}...
          </div>
        )}
      </div>
      <p className="benchmark-footer">Score calculé sur la base de la pureté microbiologique et chimique (ARS {currentYear}).</p>
    </div>
  );
}
