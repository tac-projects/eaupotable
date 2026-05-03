import Image from 'next/image';
import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/methodology.css';

export const metadata = {
  title: "Méthodologie Crystal Score™ | Comment nous auditons la qualité de l'eau",
  description: "Découvrez l'algorithme rigoureux derrière le Crystal Score. Transparence totale sur les seuils de polluants, pesticides, PFAS et microbiologie.",
  alternates: {
    canonical: 'https://eaupotable.net/methodologie',
  },
};

const MethodologyPage = () => {
  return (
    <>
      <Navbar />
      <main className="methodologyPage">
        {/* Synchronized Hero Section */}
        <section className="hero-section">
          <div className="hero-mesh-background">
            <div className="mesh-blob blob-1"></div>
            <div className="mesh-blob blob-2"></div>
            <div className="mesh-blob blob-3"></div>
            <div className="mesh-noise"></div>
          </div>
          
          <div className="seo-container">
            <nav className="city-hero-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: '2rem' }}>
              <a href="/">Accueil</a>
              <span className="sep">›</span>
              <span className="curr">Méthodologie</span>
            </nav>
            
            <div className="hero-split-container">
              <div className="hero-left">
                <div className="seo-header">
                  <h1 className="seo-title">La Méthodologie <span className="text-primary">Crystal Score™</span></h1>
                  <p className="seo-subtitle">
                    L'audit indépendant qui traduit la chimie complexe en une note de pureté transparente. 
                    Découvrez comment nous analysons <strong>pesticides</strong>, <strong>PFAS</strong> et <strong>microbiologie</strong> pour protéger votre santé et celle de vos proches.
                  </p>
                </div>

                <div className="seo-source-line">
                  <div className="source-links">
                    <a href="https://sante.gouv.fr" target="_blank" rel="noopener noreferrer" className="source-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="trust-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      Données ARS 2026
                    </a>
                    <a href="https://data.gouv.fr" target="_blank" rel="noopener noreferrer" className="source-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="trust-icon"><path d="M12 2l10 5v10l-10 5L2 17V7l10-5z"/><path d="M12 22V12"/><path d="M22 7l-10 5L2 7"/></svg>
                      Référencé Data.gouv.fr
                    </a>
                    <a href="https://alliance.numerique.gouv.fr" target="_blank" rel="noopener noreferrer" className="source-link">
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
                 <div className="hero-water-image-container">
                  <Image 
                    src="/images/methodology-hero-premium.webp" 
                    alt="Analyse scientifique de la pureté de l'eau Crystal Score" 
                    className="hero-water-image"
                    width={600}
                    height={500}
                    priority={true}
                    style={{ objectFit: 'cover', borderRadius: '24px' }}
                  />
                  <div className="crystal-score-badge">
                    <div className="crystal-badge-header">
                      <svg className="crystal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 3h12l4 6-10 13L2 9Z" />
                        <path d="M12 3l-4 6 4 13 4-13-4-6" />
                      </svg>
                      Algorithme
                    </div>
                    <div className="crystal-badge-val">10.0</div>
                    <div className="crystal-badge-desc">Standard de<br />pureté maximale</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Penalty Grid Section */}
        <section className="section">
          <div className="sectionContainer">
            <div className="seo-section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 className="seo-main-title">Le Calcul du Crystal Score™</h2>
              <p className="seo-main-subtitle">Une analyse rigoureuse basée sur 6 piliers de pureté</p>
            </div>
            <div className="introText">
              <p>
                Contrairement aux approches classiques qui partent de zéro pour ajouter des points, 
                le <strong>Crystal Score™</strong> fonctionne par déduction. Nous considérons que l'eau potable 
                devrait être pure par nature. 
              </p>
              <p style={{ marginTop: '1rem' }}>
                Chaque trace de polluant, chaque traitement chimique et chaque risque sanitaire retire 
                des points à ce capital de pureté originelle.
              </p>
            </div>

            <div className="penaltyGrid">
              {/* 1. Microbiology */}
              <div className="penaltyCard">
                <div className="cardIcon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M6 18h8"/></svg>
                </div>
                <h3>Microbiologie</h3>
                <span className="penaltyBadge">-5.0 POINTS</span>
                <p className="cardExplanation">
                  Sanction immédiate pour toute présence de bactéries (E. coli). C'est le critère 
                  numéro 1 de la sécurité sanitaire.
                </p>
                <p className="expertQuote">"La santé ne souffre aucun compromis."</p>
              </div>

              {/* 2. Pesticides */}
              <div className="penaltyCard">
                <div className="cardIcon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v10"/><path d="m16 8-4 4-4-4"/><path d="M18 22H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2Z"/></svg>
                </div>
                <h3>Pesticides</h3>
                <span className="penaltyBadge">
                  <span className="responsive-range">
                    <span>-1.5</span>
                    <span>à</span>
                    <span>-4.0</span>
                  </span>
                  <span style={{ marginLeft: '4px' }}>POINTS</span>
                </span>
                <p className="cardExplanation">
                  Détection de molécules chimiques issues de l'agriculture. Pénalisé dès la première 
                  trace pour anticiper les risques d'exposition.
                </p>
                <p className="expertQuote">"Préserver la pureté chimique."</p>
              </div>

              {/* 3. PFAS */}
              <div className="penaltyCard">
                <div className="cardIcon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                </div>
                <h3>Polluants PFAS</h3>
                <span className="penaltyBadge">
                  <span className="responsive-range">
                    <span>-1.5</span>
                    <span>à</span>
                    <span>-4.0</span>
                  </span>
                  <span style={{ marginLeft: '4px' }}>POINTS</span>
                </span>
                <p className="cardExplanation">
                  Les "polluants éternels" sont traités avec une tolérance zéro. Leur persistance 
                  exceptionnelle justifie une déduction majeure.
                </p>
                <p className="expertQuote">"Face aux molécules persistantes."</p>
              </div>

              {/* 4. Nitrates */}
              <div className="penaltyCard">
                <div className="cardIcon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/></svg>
                </div>
                <h3>Nitrates</h3>
                <span className="penaltyBadge">
                  <span className="responsive-range">
                    <span>-1.0</span>
                    <span>à</span>
                    <span>-4.0</span>
                  </span>
                  <span style={{ marginLeft: '4px' }}>POINTS</span>
                </span>
                <p className="cardExplanation">
                  Indicateurs de la pression agricole sur les nappes. Déduction par paliers 
                  (15, 25 et 40 mg/L) pour valoriser les eaux de source.
                </p>
                <p className="expertQuote">"Le reflet de nos écosystèmes."</p>
              </div>

              {/* 5. Historique ARS */}
              <div className="penaltyCard">
                <div className="cardIcon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6"/><path d="M6 20V10"/><path d="M18 20V4"/><path d="M3 20h18"/></svg>
                </div>
                <h3>Régularité (ARS)</h3>
                <span className="penaltyBadge">-2.5 POINTS</span>
                <p className="cardExplanation">
                  Analyse de l'historique annuel. Si des prélèvements ont été non conformes 
                  durant l'année, le score de confiance est dégradé.
                </p>
                <p className="expertQuote">"La stabilité est un gage de qualité."</p>
              </div>

              {/* 6. Confort & Goût */}
              <div className="penaltyCard">
                <div className="cardIcon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
                </div>
                <h3>Confort & Goût</h3>
                <span className="penaltyBadge warning">
                  <span className="responsive-range">
                    <span>-0.5</span>
                    <span>à</span>
                    <span>-2.0</span>
                  </span>
                  <span style={{ marginLeft: '4px' }}>POINTS</span>
                </span>
                <p className="cardExplanation">
                  Impact du Chlore (goût) et du Calcaire (dureté). Des bémols mineurs qui 
                  différencient une eau potable d'une eau agréable.
                </p>
                <p className="expertQuote">"Le plaisir au quotidien."</p>
              </div>
            </div>
          </div>
        </section>

        {/* Scale Section */}
        <section className="section zebra">
          <div className="sectionContainer">
            <div className="seo-section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 className="seo-main-title">L'Échelle de Qualité</h2>
              <p className="seo-main-subtitle">Comprendre votre verdict en un coup d'œil</p>
            </div>
            <div className="table-responsive-wrapper" style={{ marginTop: '2rem' }}>
              <table className="seo-data-table-unified">
                <thead>
                  <tr>
                    <th>Plage de Score</th>
                    <th>Verdict Visuel</th>
                    <th>Interprétation Technique</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong className="responsive-range" style={{ fontSize: '1.1rem', color: 'var(--primary-solid)' }}>
                        <span>9.7</span>
                        <span>—</span>
                        <span>10.0</span>
                      </strong>
                    </td>
                    <td>
                      <div className="seo-status-pill status-excellent" style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: '100px', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        EXCEPTIONNEL
                      </div>
                    </td>
                    <td className="param-limit-col">Une pureté totale, digne des meilleures eaux de source.</td>
                  </tr>
                  <tr>
                    <td>
                      <strong className="responsive-range" style={{ fontSize: '1.1rem', color: 'var(--primary-solid)' }}>
                        <span>9.2</span>
                        <span>—</span>
                        <span>9.6</span>
                      </strong>
                    </td>
                    <td>
                      <div className="seo-status-pill status-excellent" style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: '100px', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        EXCELLENT
                      </div>
                    </td>
                    <td className="param-limit-col">Qualité remarquable, quasiment aucun polluant détecté.</td>
                  </tr>
                  <tr>
                    <td>
                      <strong className="responsive-range" style={{ fontSize: '1.1rem', color: 'var(--primary-solid)' }}>
                        <span>8.5</span>
                        <span>—</span>
                        <span>9.1</span>
                      </strong>
                    </td>
                    <td>
                      <div className="seo-status-pill status-good" style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: '100px', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        TRÈS BON
                      </div>
                    </td>
                    <td className="param-limit-col">Très bonne qualité globale, malgré quelques paramètres mineurs.</td>
                  </tr>
                  <tr>
                    <td>
                      <strong className="responsive-range" style={{ fontSize: '1.1rem', color: 'var(--primary-solid)' }}>
                        <span>7.0</span>
                        <span>—</span>
                        <span>8.4</span>
                      </strong>
                    </td>
                    <td>
                      <div className="seo-status-pill status-good" style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: '100px', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        SATISFAISANT
                      </div>
                    </td>
                    <td className="param-limit-col">Une eau saine qui respecte les équilibres fondamentaux.</td>
                  </tr>
                  <tr>
                    <td>
                      <strong className="responsive-range" style={{ fontSize: '1.1rem', color: 'var(--primary-solid)' }}>
                        <span>5.0</span>
                        <span>—</span>
                        <span>6.9</span>
                      </strong>
                    </td>
                    <td>
                      <div className="seo-status-pill status-warning" style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: '100px', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        MÉDIOCRE
                      </div>
                    </td>
                    <td className="param-limit-col">Qualité passable présentant plusieurs points de vigilance.</td>
                  </tr>
                  <tr>
                    <td><strong style={{ fontSize: '1.1rem', color: 'var(--primary-solid)' }}>&lt; 5.0</strong></td>
                    <td>
                      <div className="seo-status-pill status-critical" style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: '100px', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        DÉGRADÉ
                      </div>
                    </td>
                    <td className="param-limit-col">La qualité de l'eau est impactée par des paramètres critiques.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section">
          <div className="sectionContainer">
            <div className="seo-section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 className="seo-main-title">Foire Aux Questions</h2>
              <p className="seo-main-subtitle">Tout comprendre sur notre audit indépendant</p>
            </div>
            
            <div className="seo-faq-accordion">
              <details className="seo-faq-item">
                <summary className="seo-faq-question">
                  <h3>D'où proviennent les données analysées par le Crystal Score ?</h3>
                  <span className="faq-icon"></span>
                </summary>
                <div className="seo-faq-answer">
                  <p>
                    Les données proviennent exclusivement de la base officielle <strong>SISE-Eaux</strong> du Ministère de la Santé, 
                    accessible via les API Hub'Eau. Nous n'inventons rien : nous auditons les résultats publics certifiés par 
                    les Agences Régionales de Santé (ARS) pour les rendre compréhensibles par tous.
                  </p>
                </div>
              </details>

              <details className="seo-faq-item">
                <summary className="seo-faq-question">
                  <h3>Quelle est la différence entre "potabilité" et "Crystal Score" ?</h3>
                  <span className="faq-icon"></span>
                </summary>
                <div className="seo-faq-answer">
                  <p>
                    Une eau peut être légalement "potable" tout en contenant des traces de polluants (pesticides, PFAS) 
                    juste en dessous des limites réglementaires. Le Crystal Score est <strong>plus exigeant</strong> : 
                    il retire des points dès la première trace détectable pour valoriser la pureté originelle, au-delà 
                    de la simple conformité administrative.
                  </p>
                </div>
              </details>

              <details className="seo-faq-item">
                <summary className="seo-faq-question">
                  <h3>Le Crystal Score est-il un organisme officiel ?</h3>
                  <span className="faq-icon"></span>
                </summary>
                <div className="seo-faq-answer">
                  <p>
                    Non, EauPotable.net est une plateforme <strong>indépendante</strong>. Notre mission est d'apporter 
                    une couche de transparence supplémentaire. Notre algorithme est public et basé sur les recommandations 
                    de santé publique les plus strictes, mais il n'a pas de valeur juridique officielle.
                  </p>
                </div>
              </details>

              <details className="seo-faq-item">
                <summary className="seo-faq-question">
                  <h3>Pourquoi mon score peut-il varier d'un mois à l'autre ?</h3>
                  <span className="faq-icon"></span>
                </summary>
                <div className="seo-faq-answer">
                  <p>
                    Les scores sont recalculés à chaque nouvelle publication de données par l'ARS (environ tous les mois). 
                    Si un prélèvement récent détecte une variation de chlore ou une trace de pesticide, le Crystal Score 
                    s'ajuste instantanément pour refléter la qualité actuelle de votre robinet.
                  </p>
                </div>
              </details>

              <details className="seo-faq-item">
                <summary className="seo-faq-question">
                  <h3>Le Crystal Score est-il le même pour tous les foyers d'une même ville ?</h3>
                  <span className="faq-icon"></span>
                </summary>
                <div className="seo-faq-answer">
                  <p>
                    Généralement oui, car les données sont agrégées par Unité de Distribution (UDI). Cependant, dans les très grandes métropoles, il peut exister plusieurs réseaux. Notre algorithme identifie l'UDI principale desservant la majorité de la population pour garantir le score le plus représentatif de votre commune.
                  </p>
                </div>
              </details>

              <details className="seo-faq-item">
                <summary className="seo-faq-question">
                  <h3>Un score inférieur à 7 signifie-t-il que l'eau est dangereuse ?</h3>
                  <span className="faq-icon"></span>
                </summary>
                <div className="seo-faq-answer">
                  <p>
                    Pas nécessairement. Une eau avec un score de 5 ou 6 reste "potable" au sens de la loi, mais elle présente des défauts de pureté (traces de pesticides, chlore excessif, calcaire). Ce score est un indicateur de vigilance : il vous signale simplement qu'une filtration domestique (charbon actif, osmose) pourrait être bénéfique pour retrouver une pureté optimale.
                  </p>
                </div>
              </details>

              <details className="seo-faq-item">
                <summary className="seo-faq-question">
                  <h3>Comment gérez-vous les polluants qui n'ont pas encore de limites réglementaires ?</h3>
                  <span className="faq-icon"></span>
                </summary>
                <div className="seo-faq-answer">
                  <p>
                    C'est là que le Crystal Score se distingue. Dès qu'une recommandation de l'ANSES ou une étude scientifique sérieuse signale un risque sur une molécule (même sans seuil légal strict), nous appliquons un principe de précaution et déduisons des points. Nous n'attendons pas les mises à jour administratives pour vous alerter.
                  </p>
                </div>
              </details>
            </div>

            {/* Fin de section FAQ */}
          </div>
        </section>

        {/* JSON-LD Structured Data for SEO Master */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Accueil",
                    "item": "https://eaupotable.net"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Méthodologie",
                    "item": "https://eaupotable.net/methodologie"
                  }
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "D'où proviennent les données analysées par le Crystal Score ?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Les données proviennent exclusivement de la base officielle SISE-Eaux du Ministère de la Santé, accessible via les API Hub'Eau. Nous auditons les résultats publics certifiés par les Agences Régionales de Santé (ARS)."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Quelle est la différence entre potabilité et Crystal Score ?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Une eau peut être légalement potable tout en contenant des traces de polluants. Le Crystal Score est plus exigeant : il retire des points dès la première trace détectable pour valoriser la pureté originelle."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Le Crystal Score est-il un organisme officiel ?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Non, EauPotable.net est une plateforme indépendante. Notre mission est d'apporter une couche de transparence supplémentaire via un algorithme public basé sur les recommandations de santé publique."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Pourquoi mon score peut-il varier d'un mois à l'autre ?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Les scores sont recalculés à chaque nouvelle publication de données par l'ARS. Si un prélèvement récent détecte une variation, le Crystal Score s'ajuste instantanément."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Le Crystal Score est-il le même pour tous les foyers d'une même ville ?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Généralement oui, car les données sont agrégées par Unité de Distribution (UDI). Cependant, dans les très grandes métropoles, il peut exister plusieurs réseaux. Notre algorithme identifie l'UDI principale desservant la majorité de la population."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Un score inférieur à 7 signifie-t-il que l'eau est dangereuse ?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Pas nécessairement. Une eau avec un score de 5 ou 6 reste potable au sens de la loi, mais elle présente des défauts de pureté. Ce score est un indicateur de vigilance suggérant qu'une filtration domestique pourrait être bénéfique."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Comment gérez-vous les polluants qui n'ont pas encore de limites réglementaires ?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Dès qu'une recommandation de l'ANSES ou une étude scientifique signale un risque sur une molécule (même sans seuil légal strict), nous appliquons un principe de précaution et déduisons des points sans attendre les mises à jour administratives."
                    }
                  }
                ]
              }
            ])
          }}
        />
      </main>
    </>
  );
};

export default MethodologyPage;
