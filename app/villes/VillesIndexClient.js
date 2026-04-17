"use client";
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import '../styles/seo.css';

export default function VillesIndexClient({ initialDepartements }) {
  const [departements, setDepartements] = useState(initialDepartements || []);
  const [loading, setLoading] = useState(!initialDepartements);

  useEffect(() => {
    if (!initialDepartements) {
      fetch('https://geo.api.gouv.fr/departements')
        .then(r => r.json())
        .then(data => {
          setDepartements(data);
          setLoading(false);
        })
        .catch(e => {
          console.error(e);
          setLoading(false);
        });
    }
  }, [initialDepartements]);

  return (
    <div className="villes-index">
      <Navbar />
      
      <main className="villes-main">
        <div className="seo-container">
          <nav className="seo-breadcrumb">
             <a href="/">Accueil</a>
             <span className="sep">›</span>
             <span className="curr">France</span>
          </nav>

          <header className="villes-header">
            <h1>Annuaire des Villes de France par Département</h1>
            <p className="villes-subtitle">
              Accédez aux verdicts de <strong>pureté et qualité de l'eau</strong> pour chaque commune française. 
              Naviguez par département pour consulter les derniers rapports ARS 2026.
            </p>
          </header>

          {loading ? (
            <div className="loading-state">Chargement du répertoire national...</div>
          ) : (
            <div className="dept-grid">
              {departements.map(dept => (
                <a key={dept.code} href={`/departement/${dept.code}`} className="dept-link-card">
                  <span className="dept-code">{dept.code}</span>
                  <span className="dept-name">{dept.nom}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .villes-main {
          padding-top: 100px;
          min-height: 80vh;
        }
        .villes-header {
          margin-bottom: 50px;
        }
        .villes-header h1 {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          color: var(--text-main);
        }
        .villes-subtitle {
          font-size: 1.1rem;
          color: var(--text-muted);
          max-width: 800px;
          line-height: 1.6;
          margin-top: 15px;
        }
        .dept-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 80px;
        }
        .dept-link-card {
          background: white;
          padding: 25px;
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          gap: 15px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .dept-link-card:hover {
          transform: translateY(-3px);
          border-color: var(--primary-solid);
          box-shadow: 0 10px 25px rgba(0, 102, 255, 0.08);
        }
        .dept-code {
          background: rgba(0, 102, 255, 0.05);
          color: var(--primary-solid);
          font-weight: 800;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 1.1rem;
          min-width: 45px;
          text-align: center;
        }
        .dept-name {
          color: var(--text-main);
          font-weight: 600;
          font-size: 1rem;
        }
        .loading-state {
          padding: 50px;
          text-align: center;
          color: var(--text-light);
        }
      `}</style>
    </div>
  );
}
