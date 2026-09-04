"use client";
import Navbar from '../../components/Navbar';
import Image from 'next/image';
import { computeDeptEditorial, buildDeptEditorialText, buildDeptFaq } from '../../../lib/dept-editorial';
import '../../styles/seo.css';
import '../../styles/components.css';

export default function DepartementClient({ code, deptData }) {
  const deptInfo = deptData?.deptInfo || {};
  const citiesObj = deptData?.cities || {};
  
  // Conversion de l'objet cities en tableau et tri par score (décroissant)
  const citiesList = Object.keys(citiesObj).map(slug => ({
    slug,
    ...citiesObj[slug]
  })).sort((a, b) => (b.crystal?.final || 0) - (a.crystal?.final || 0));

  const deptName = deptInfo.name || `Département ${code}`;
  const deptScore = deptInfo.avgScore || 'N/A';
  const topCities = deptInfo.topCities || [];

  // Éditorial data-driven (unique par département)
  const currentYear = new Date().getFullYear();
  const editorial = computeDeptEditorial(deptData);
  const editorialParagraphs = buildDeptEditorialText(deptData, currentYear);
  const deptFaq = buildDeptFaq(deptData, currentYear);

  return (
    <div className="dept-page">
      <Navbar />
      
      <main className="dept-main">
        <section className="city-hero-section">
          <div className="city-hero-mesh"></div>
          <div className="city-hero-grain"></div>
          
          <div className="seo-container">
            <nav className="city-hero-breadcrumb" aria-label="Breadcrumb">
              <a href="/">Accueil</a>
              <span className="sep">›</span>
              <a href="/villes">France</a>
              <span className="sep">›</span>
              <span className="curr">{deptName}</span>
            </nav>

            <div className="hero-split-container">
              <div className="hero-left">
                <div className="city-hero-badge">
                  <span className="badge-pulse"></span>
                  BILAN DÉPARTEMENTAL 2026
                </div>
                
                <h1 className="city-hero-title">
                  Qualité de l'eau : <span className="highlight">{deptName} ({code})</span>
                </h1>

                <p className="city-hero-subtitle">
                  Analyse consolidée pour les <strong>{citiesList.length} communes</strong> du département. Bilan basé sur les derniers relevés sanitaires officiels.
                </p>

                <div className="seo-source-line">
                  <div className="source-links">
                    <span className="source-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="trust-icon">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      Données ARS 2026
                    </span>
                    <span className="source-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="trust-icon">
                        <path d="M12 2l10 5v10l-10 5L2 17V7l10-5z"/>
                        <path d="M12 22V12"/><path d="M22 7l-10 5L2 7"/>
                      </svg>
                      Référencé Data.gouv.fr
                    </span>
                    <span className="source-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="trust-icon">
                        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                        <path d="M2 21c0-3 1.85-5.36 5.08-6C10.9 14.19 13.1 13 15 12"/>
                      </svg>
                      Partenaire Open Data
                    </span>
                  </div>
                </div>
              </div>

              <div className="hero-right">
                <div className="hero-water-image-container city-variant">
                  <Image
                    src="/images/hero-water-glass.webp"
                    alt={`Analyse de la qualité de l'eau : département ${deptName}`}
                    className="hero-water-image"
                    width={600}
                    height={600}
                    priority
                  />
                  <div className="crystal-score-badge city-variant">
                    <div className="crystal-badge-header">
                      <svg className="crystal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 3h12l4 6-10 13L2 9Z" />
                        <path d="M12 3l-4 6 4 13 4-13-4-6" />
                      </svg>
                      Crystal Score™
                    </div>
                    <div className="crystal-badge-val">
                      {deptScore}<span>/10</span>
                    </div>
                    <div className="crystal-badge-desc">
                      Verdict : <strong>{parseFloat(deptScore) > 7.5 ? "EXCELLENT" : "VIGILANCE"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="dept-content-zebra">
          {/* SECTION 1 : EXPERTISE & DASHBOARD (BLANC) */}
          <section className="zebra-section white">
            <div className="dept-container">
              <div className="section-header">
                <h2 className="seo-main-title">Expertise de la Qualité de l'Eau : {deptName}</h2>
                <p className="seo-main-subtitle">Analyse approfondie de la potabilité et des indicateurs sanitaires du département {code}</p>
              </div>

              <div className="dept-stats-dashboard">
                <div className="dept-stat-main">
                  <div className="dept-score-circle">
                    <span className="score-val">{deptInfo.avgScore || 'N/A'}</span>
                    <span className="score-label">Score Moyen</span>
                  </div>
                  <div className="dept-verdict">
                    {editorialParagraphs.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                <div className="dept-stats-grid">
                  {[
                    { key: 'conformity', label: 'Conformité', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', val: `${deptInfo.conformRate}%` },
                    { key: 'microbiology', label: 'Microbiologie', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M6 18h8"/></svg>', val: deptInfo.averages?.microbiology?.val || 'Absence' },
                    { key: 'pfas', label: 'PFAS', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', val: `${deptInfo.averages?.pfas?.val || '--'} ${deptInfo.averages?.pfas?.unit || ''}` },
                    { key: 'pesticides', label: 'Pesticides', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>', val: `${deptInfo.averages?.pesticides?.val || '--'} ${deptInfo.averages?.pesticides?.unit || ''}` },
                    { key: 'chlorine', label: 'Chlore', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>', val: `${deptInfo.averages?.chlorine?.val || '--'} ${deptInfo.averages?.chlorine?.unit || ''}` },
                    { key: 'nitrates', label: 'Nitrates', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/></svg>', val: `${deptInfo.averages?.nitrates?.val || '--'} ${deptInfo.averages?.nitrates?.unit || ''}` },
                    { key: 'hardness', label: 'Calcaire', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>', val: `${deptInfo.averages?.hardness?.val || '--'} ${deptInfo.averages?.hardness?.unit || ''}` },
                    { key: 'ph', label: 'pH', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12"/><path d="m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z"/><path d="m2 22 .414-.414"/></svg>', val: `${deptInfo.averages?.ph?.val || '--'} ${deptInfo.averages?.ph?.unit || ''}` },
                    { key: 'turbidity', label: 'Turbidité', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>', val: `${deptInfo.averages?.turbidity?.val || '--'} ${deptInfo.averages?.turbidity?.unit || ''}` },
                    { key: 'conductivity', label: 'Conductivité', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>', val: `${deptInfo.averages?.conductivity?.val || '--'} ${deptInfo.averages?.conductivity?.unit || ''}` }
                  ].map(stat => (
                    <div className="stat-mini-card" key={stat.key}>
                      <div className="stat-icon-wrapper" dangerouslySetInnerHTML={{ __html: stat.icon }} />
                      <div className="stat-text">
                        <span className="mini-label">{stat.label}</span>
                        <span className="mini-value">{stat.val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2 : TOP 10 (GRIS) */}
          <section className="zebra-section gray">
            <div className="dept-container">
              <div className="section-header">
                <h2 className="seo-main-title">Classement : Top 10 des communes les plus saines</h2>
                <p className="seo-main-subtitle">Les villes de : {deptName} ayant le meilleur indice de pureté Crystal Score™</p>
              </div>
              <div className="top-ten-grid">
                {citiesList.slice(0, 10).map((city, idx) => (
                  <a key={city.slug} href={`/ville/${city.slug}`} className="top-ten-item" aria-label={`Qualité de l'eau à ${city.cityName} - Voir l'analyse`}>
                    <span className="ten-rank">N°{idx + 1}</span>{' '}
                    <span className="ten-name">{city.cityName}</span>{' '}
                    <span className="ten-score">{city.crystal?.final?.toFixed(1).replace('.', ',')}/10</span>
                    {idx < Math.min(citiesList.length, 10) - 1 && <span className="sr-only"> - </span>}
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 2 BIS : PRINCIPALES VILLES (BLANC) */}
          {topCities.length > 0 && (
            <section className="zebra-section white">
              <div className="dept-container">
                <div className="section-header">
                  <h2 className="seo-main-title">Focus : Qualité de l'eau dans les plus grandes villes</h2>
                  <p className="seo-main-subtitle">Analyses et indices de pureté des principales communes de : {deptName}</p>
                </div>
                <div className="top-ten-grid">
                  {topCities.map((city, idx) => (
                    <a key={city.slug} href={`/ville/${city.slug}`} className="top-ten-item" aria-label={`Qualité de l'eau à ${city.name} - Voir l'analyse`}>
                      <span className="ten-rank">N°{idx + 1}</span>{' '}
                      <span className="ten-name">{city.name}</span>{' '}
                      <span className="ten-score">{city.score !== null && city.score !== undefined ? city.score.toFixed(1).replace('.', ',') : 'N/A'}/10</span>
                      {idx < topCities.length - 1 && <span className="sr-only"> - </span>}
                    </a>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2 TER : FOURNISSEURS & PRIX (GRIS) */}
          {(editorial.distributors.length > 0 || editorial.priceStats) && (
            <section className="zebra-section gray">
              <div className="dept-container">
                <div className="section-header">
                  <h2 className="seo-main-title">Fournisseurs d'eau & prix dans le {deptName}</h2>
                  <p className="seo-main-subtitle">Qui distribue l'eau dans le département et à quel tarif selon les communes ?</p>
                </div>
                <div className="dept-suppliers-grid">
                  {editorial.distributors.length > 0 && (
                    <div className="suppliers-block">
                      <h3 className="suppliers-title">Principaux opérateurs</h3>
                      <ul className="suppliers-list">
                        {editorial.distributors.map((d, i) => (
                          <li key={i} className="supplier-item">
                            <span className="supplier-rank">{i === 0 ? 'Principal' : `N°${i + 1}`}</span>{' '}
                            <span className="supplier-name">{d.name}</span>{' '}
                            <span className="supplier-count">{d.count} communes</span>{' '}
                            <span className="supplier-pct">{d.pct}%</span>
                            {i < editorial.distributors.length - 1 && <span className="sr-only"> - </span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {editorial.priceStats && (
                    <div className="price-block">
                      <h3 className="suppliers-title">Prix de l'eau</h3>
                      <div className="price-cards">
                        <div className="price-card">
                          <span className="price-label">Moyenne</span>
                          <span className="price-value">{editorial.priceStats.avg.toFixed(2).replace('.', ',')} €/m³</span>
                        </div>
                        <div className="price-card">
                          <span className="price-label">Minimum</span>
                          <span className="price-value">{editorial.priceStats.min.toFixed(2).replace('.', ',')} €/m³</span>
                        </div>
                        <div className="price-card">
                          <span className="price-label">Maximum</span>
                          <span className="price-value">{editorial.priceStats.max.toFixed(2).replace('.', ',')} €/m³</span>
                        </div>
                      </div>
                      <p className="price-note">Tarifs relevés dans {editorial.priceStats.count} communes du département, hors abonnement.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3 : REPERTOIRE (GRIS) */}
          <section className="zebra-section gray">
            <div className="dept-container">
              <div className="section-header">
                <h2 className="seo-main-title">Répertoire Complet des {citiesList.length} Communes</h2>
                <p className="seo-main-subtitle">Accédez au rapport de pureté détaillé de chaque ville du département</p>
              </div>

              <div className="city-list-grid">
                {citiesList.map(city => (
                  <a key={city.slug} href={`/ville/${city.slug}`} className="city-link-card" aria-label={`Qualité de l'eau à ${city.cityName} - Voir l'analyse`}>
                    <div className="city-card-header">
                      <span className="city-name">{city.cityName}</span>
                      <div className={`city-score-badge ${city.crystal?.statusClass || ''}`}>
                        {city.crystal?.final?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                    <div className="city-card-meta">
                      <span className="city-label">{city.crystal?.label || 'Analyse en cours'}</span>
                      <span className="city-sep">•</span>
                      <span className={`city-status ${city.isConform ? 'conform' : 'non-conform'}`}>
                        {city.isConform ? 'Conforme' : 'Non conforme'}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 4 : FAQ (BLANC) */}
          <section className="zebra-section white">
            <div className="seo-container">
              <div className="seo-section-header">
                <h2 className="seo-main-title">Foire Aux Questions</h2>
                <p className="seo-main-subtitle">Réponses aux interrogations les plus fréquentes des habitants de {deptName}.</p>
              </div>
              <div className="seo-faq-accordion">
                {deptFaq.map((item, i) => (
                  <details key={i} className="seo-faq-item">
                    <summary className="seo-faq-question"><h3>{item.q}</h3><span className="faq-icon"></span></summary>
                    <div className="seo-faq-answer"><p>{item.a}</p></div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        .dept-main {
          padding: 0;
          min-height: 80vh;
          background: white;
        }

        .dept-content-zebra {
          width: 100%;
        }

        .zebra-section {
          padding: 100px 0;
          width: 100%;
        }

        .zebra-section.white { background: #ffffff; }
        .zebra-section.gray { 
          background: #f9fafb; 
        }

        .dept-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 25px;
        }

        /* HEADERS (EXACT CITY PAGE STYLE) */
        .dept-header, .section-header {
          text-align: center;
          margin-bottom: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          border-bottom: none !important;
        }

        .dept-header::after, .section-header::after {
          content: "";
          display: block;
          width: 50px;
          height: 4px;
          background: #0052FF;
          margin-top: 30px;
          border-radius: 10px;
        }

        .dept-title, .seo-main-title {
          font-family: var(--font-heading, "Outfit", sans-serif);
          font-size: 2.8rem;
          color: #0F172A;
          font-weight: 900;
          margin-bottom: 15px;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }

        .dept-subtitle, .seo-main-subtitle {
          font-size: 1.1rem;
          color: #475569;
          max-width: 650px;
          line-height: 1.6;
          margin: 0 auto;
          font-weight: 500;
          letter-spacing: 0;
        }

        /* EXPERT DASHBOARD */
        .dept-stats-dashboard {
          background: transparent;
          border-radius: 0;
          padding: 0;
          box-shadow: none;
          border: none;
          margin-top: 20px;
        }

        .dept-stat-main {
          display: flex;
          align-items: center;
          gap: 50px;
          margin-bottom: 60px;
          padding: 0;
        }

        .dept-score-circle {
          background: #0052FF;
          color: white;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          box-shadow: 0 15px 30px rgba(0,82,255,0.25);
        }

        .score-val { font-size: 2.8rem; font-weight: 900; line-height: 1; }
        .score-label { color: #FFFFFF; font-size: 0.8rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; margin-top: 5px; }

        .dept-verdict h3 { color: #1E293B; font-size: 1.6rem; margin-bottom: 15px; font-weight: 800; }
        .dept-verdict p { color: #475569; line-height: 1.7; font-size: 1.1rem; margin: 0; }
        .verdict-detail { margin-top: 20px !important; padding-top: 20px; border-top: 1px dashed #E2E8F0; font-size: 1rem !important; }

        .dept-stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 30px;
          padding-top: 20px;
        }

        .stat-mini-card { display: flex; align-items: center; gap: 15px; }
        .stat-icon-wrapper {
          width: 42px; height: 42px; background: rgba(0,82,255,0.08); color: #0052FF;
          border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .stat-icon-wrapper :global(svg) { width: 22px; height: 22px; }
        .stat-text { display: flex; flex-direction: column; gap: 2px; }
        .mini-label { font-size: 0.7rem; color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
        .mini-value { font-size: 1rem; color: #1E293B; font-weight: 700; white-space: nowrap; }

        /* TOP 10 GRID */
        .top-ten-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 40px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .top-ten-item {
          display: flex; align-items: center; gap: 20px; text-decoration: none;
          padding: 18px 25px; background: white; border-radius: 20px;
          border: 1px solid rgba(0,0,0,0.04); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
          position: relative;
        }

        .top-ten-item:hover {
          transform: translateY(-5px);
          border-color: #0052FF;
          box-shadow: 0 15px 35px rgba(0,82,255,0.1);
        }

        .ten-rank { font-weight: 900; color: #0052FF; font-size: 1.2rem; width: 45px; }
        .ten-name { flex: 1; font-weight: 700; color: #1E293B; font-size: 1.1rem; }
        .ten-score { font-weight: 800; background: #DCFCE7; color: #166534; padding: 5px 12px; border-radius: 10px; font-size: 0.95rem; }


        /* REPERTOIRE */
        .city-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 25px;
        }

        .city-link-card {
          background: white; padding: 25px; border-radius: 20px;
          border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 15px;
          text-decoration: none; transition: all 0.3s ease;
        }

        .city-link-card:hover {
          transform: translateY(-5px);
          border-color: #0052FF;
          box-shadow: 0 15px 30px rgba(0,0,0,0.05);
        }

        .city-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .city-name { color: #1E293B; font-weight: 800; font-size: 1.25rem; }
        .city-score-badge {
          padding: 5px 12px; border-radius: 10px; font-weight: 900; font-size: 0.9rem;
          min-width: 50px; text-align: center;
        }
        .city-score-badge.status-good { background: #DCFCE7; color: #166534; }
        .city-score-badge.status-warning { background: #FEF9C3; color: #854D0E; }
        .city-score-badge.status-danger { background: #FEE2E2; color: #991B1B; }

        .city-card-meta { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: #94A3B8; font-weight: 600; }
        .city-status.conform { color: #22C55E; }
        .city-status.non-conform { color: #EF4444; }

        /* FOURNISSEURS & PRIX */
        .dept-suppliers-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .suppliers-title {
          color: #1E293B;
          font-size: 1.2rem;
          margin-bottom: 20px;
          font-weight: 800;
        }

        .suppliers-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .supplier-item {
          display: flex;
          align-items: center;
          gap: 15px;
          background: white;
          border: 1px solid rgba(0,0,0,0.05);
          border-radius: 16px;
          padding: 15px 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          position: relative;
        }

        .supplier-rank {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #0052FF;
          background: rgba(0,82,255,0.08);
          padding: 4px 10px;
          border-radius: 99px;
          white-space: nowrap;
        }

        .supplier-name {
          flex: 1;
          font-weight: 700;
          color: #1E293B;
          font-size: 0.95rem;
        }

        .supplier-count { color: #64748B; font-weight: 600; font-size: 0.9rem; white-space: nowrap; }
        .supplier-pct {
          font-weight: 800;
          background: #DCFCE7;
          color: #166534;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 0.85rem;
          white-space: nowrap;
        }

        .price-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .price-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border: 1px solid rgba(0,0,0,0.05);
          border-radius: 16px;
          padding: 15px 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .price-label { color: #64748B; font-weight: 600; font-size: 0.9rem; }
        .price-value { font-weight: 800; color: #0052FF; font-size: 1.05rem; }

        .price-note {
          margin-top: 15px;
          font-size: 0.85rem;
          color: #94A3B8;
          line-height: 1.5;
        }

        @media (max-width: 1100px) {
          .dept-stats-grid { grid-template-columns: repeat(3, 1fr); }
          .dept-stat-main { flex-direction: column; text-align: center; }
          .faq-grid, .top-ten-grid { grid-template-columns: 1fr; }
          .dept-suppliers-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .dept-title, .seo-main-title { font-size: 2.2rem; }
          .dept-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .dept-stats-dashboard { padding: 30px; }
          .zebra-section { padding: 60px 0; }
        }
      `}</style>
    </div>
  );
}
