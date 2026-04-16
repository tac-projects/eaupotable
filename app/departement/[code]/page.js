"use client";
import { useState, useEffect, use } from 'react';
import Navbar from '../../components/Navbar';
import '../../styles/seo.css';

export default function DepartementPage({ params }) {
  const unwrappedParams = use(params);
  const code = unwrappedParams.code;
  const [cities, setCities] = useState([]);
  const [deptName, setDeptName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;

    // 1. Fetch Dept Name
    fetch(`https://geo.api.gouv.fr/departements/${code}`)
      .then(r => r.json())
      .then(data => setDeptName(data.nom))
      .catch(() => setDeptName(`Département ${code}`));

    // 2. Fetch Cities
    fetch(`https://geo.api.gouv.fr/departements/${code}/communes`)
      .then(r => r.json())
      .then(data => {
        // Sort by population to have main cities first
        const sorted = data.sort((a, b) => (b.population || 0) - (a.population || 0));
        setCities(sorted);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [code]);

  return (
    <div className="dept-page">
      <Navbar />
      
      <main className="dept-main">
        <div className="seo-container">
          <nav className="seo-breadcrumb">
             <a href="/">Accueil</a>
             <span className="sep">›</span>
             <a href="/villes">France</a>
             <span className="sep">›</span>
             <span className="curr">{deptName || code}</span>
          </nav>

          <header className="dept-header">
            <h1>Qualité de l'eau : Répertoire des communes {deptName && /^[aeiouyh]/i.test(deptName) ? "de l'" : "du "}{deptName} ({code})</h1>
            <p className="dept-subtitle">
              Sélectionnez votre ville ci-dessous pour accéder au verdict de <strong>pureté et de conformité 2026</strong>. 
              Données certifiées ARS pour le département {deptName && /^[aeiouyh]/i.test(deptName) ? "de l'" : "du "}{deptName}.
            </p>
          </header>

          {loading ? (
            <div className="loading-state">Analyse des données départementales en cours...</div>
          ) : (
            <div className="city-list-grid">
              {cities.map(city => {
                const slug = city.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');
                return (
                  <a key={city.code} href={`/ville/${slug}`} className="city-link-card">
                    <span className="city-name">{city.nom}</span>
                    <span className="city-pop">{city.population?.toLocaleString()} hab.</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .dept-main {
          padding-top: 100px;
          min-height: 80vh;
        }
        .dept-header {
          margin-bottom: 50px;
        }
        .dept-header h1 {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          color: var(--text-main);
          margin-bottom: 15px;
        }
        .dept-subtitle {
          font-size: 1.1rem;
          color: var(--text-muted);
          max-width: 800px;
          line-height: 1.6;
        }
        .city-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 80px;
        }
        .city-link-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          gap: 5px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .city-link-card:hover {
          transform: translateY(-3px);
          border-color: var(--primary-solid);
          box-shadow: 0 10px 20px rgba(0, 102, 255, 0.05);
        }
        .city-name {
          color: var(--text-main);
          font-weight: 700;
          font-size: 1.1rem;
        }
        .city-pop {
          font-size: 0.85rem;
          color: var(--text-light);
        }
        .loading-state {
          padding: 50px;
          text-align: center;
          color: var(--text-light);
        }
        .dept-footer {
          padding: 40px 0;
          background: #fdfdfd;
          border-top: 1px solid rgba(0,0,0,0.05);
          color: var(--text-light);
          font-size: 0.9rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
