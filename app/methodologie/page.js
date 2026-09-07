import Image from 'next/image';
import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/methodology.css';
import { SEO_DOSSIERS } from '../../lib/params-registry';

const CURRENT_YEAR = new Date().getFullYear();
const METHOD_UPDATE = 'septembre 2026';

// Source unique des FAQ (rendu visible + JSON-LD) — ne jamais dupliquer.
const FAQ_DATA = [
  {
    q: "D'où proviennent les données analysées par le Crystal Score ?",
    a: "Les données proviennent exclusivement de la base officielle <strong>SISE-Eaux</strong> du Ministère de la Santé, accessible via les API Hub'Eau. Nous n'inventons rien : nous auditons les résultats publics certifiés par les Agences Régionales de Santé (ARS) pour les rendre compréhensibles par tous."
  },
  {
    q: 'Quelle est la différence entre "potabilité" et "Crystal Score" ?',
    a: "Une eau peut être légalement \"potable\" tout en contenant des traces de polluants (pesticides, PFAS) juste en dessous des limites réglementaires. Le Crystal Score est <strong>plus exigeant</strong> : il retire des points dès la première trace détectable pour valoriser la pureté originelle, au-delà de la simple conformité administrative."
  },
  {
    q: 'Le Crystal Score est-il un organisme officiel ?',
    a: "Non, EauPotable.net est une plateforme <strong>indépendante</strong>. Notre mission est d'apporter une couche de transparence supplémentaire. Notre algorithme est public et basé sur les recommandations de santé publique les plus strictes, mais il n'a pas de valeur juridique officielle."
  },
  {
    q: "Pourquoi mon score peut-il varier d'un mois à l'autre ?",
    a: "Les scores sont recalculés à chaque nouvelle publication de données par l'ARS (environ tous les mois). Si un prélèvement récent détecte une variation de chlore ou une trace de pesticide, le Crystal Score s'ajuste instantanément pour refléter la qualité actuelle de votre robinet."
  },
  {
    q: "Le Crystal Score est-il le même pour tous les foyers d'une même ville ?",
    a: "Généralement oui, car les données sont agrégées par Unité de Distribution (UDI). Cependant, dans les très grandes métropoles, il peut exister plusieurs réseaux. Notre algorithme identifie l'UDI principale desservant la majorité de la population pour garantir le score le plus représentatif de votre commune."
  },
  {
    q: "Un score inférieur à 7 signifie-t-il que l'eau est dangereuse ?",
    a: "Pas nécessairement. Une eau avec un score de 5 ou 6 reste \"potable\" au sens de la loi, mais elle présente des défauts de pureté (traces de pesticides, chlore excessif, calcaire). Ce score est un indicateur de vigilance : il vous signale simplement qu'une filtration domestique (charbon actif, osmose) pourrait être bénéfique pour retrouver une pureté optimale."
  },
  {
    q: "Comment gérez-vous les polluants qui n'ont pas encore de limites réglementaires ?",
    a: "C'est là que le Crystal Score se distingue. Dès qu'une recommandation de l'ANSES ou une étude scientifique sérieuse signale un risque sur une molécule (même sans seuil légal strict), nous appliquons un principe de précaution et déduisons des points. Nous n'attendons pas les mises à jour administratives pour vous alerter."
  },
  {
    q: "Quelle est la norme des nitrates dans l'eau du robinet ?",
    a: "La limite de qualité sanitaire des nitrates est fixée à 50 mg/L par la réglementation (arrêté du 11 janvier 2007). En dessous de ce seuil, l'eau est potable. Le Crystal Score, lui, pénalise progressivement dès 15 mg/L pour valoriser les eaux les plus pures."
  },
  {
    q: "Les traces de pesticides (0,1 µg/L) sont-elles dangereuses ?",
    a: "La limite réglementaire est de 0,1 µg/L par substance et 0,5 µg/L au total. Une valeur conforme ne présente pas de risque sanitaire démontré. Le Crystal Score retire néanmoins des points dès la première trace détectée, par principe de précaution et pour distinguer les eaux les plus pures."
  },
  {
    q: "L'eau calcaire est-elle mauvaise pour la santé ?",
    a: "Non. Une eau calcaire n'est pas nocive : elle contribue même aux apports en calcium et magnésium. Elle peut simplement entartrer les canalisations et les appareils. Le Crystal Score ne pénalise que les eaux très dures (plus de 35 °f)."
  },
  {
    q: "Pourquoi mon eau du robinet a-t-elle un goût de chlore ?",
    a: "Le chlore assure la désinfection de l'eau pendant son transport dans les canalisations. Un léger goût est normal et sans danger. Il disparaît souvent en laissant l'eau reposer quelques minutes au frais."
  },
  {
    q: "Quels sont les seuils réglementaires des PFAS depuis 2026 ?",
    a: "Depuis janvier 2026, la directive (UE) 2020/2184 impose deux valeurs dans l'eau du robinet : 0,5 µg/L pour la somme des PFAS suivis et 0,1 µg/L pour un sous-ensemble prioritaire de 4 substances (PFOA, PFNA, PFHxS, PFOS). L'analyse est désormais obligatoire. Consultez notre <a href=\"/pfas-eau-potable\">carte nationale des PFAS</a> pour vérifier votre commune."
  },
  {
    q: "Quelle différence entre « limite de qualité » et « référence de qualité » ?",
    a: "La limite de qualité est une valeur sanitaire à ne pas dépasser (ex. nitrates à 50 mg/L). La référence de qualité est un repère de confort ou de bon fonctionnement (ex. pH, turbidité, fer) : son dépassement n'implique pas de risque pour la santé."
  },
  {
    q: "À quelle fréquence la qualité de l'eau est-elle contrôlée ?",
    a: "Les ARS contrôlent l'eau au minimum plusieurs fois par an selon la taille de la population desservie, et plus souvent dans les grandes unités de distribution. Les gros réseaux peuvent cumuler plusieurs centaines d'analyses par an."
  },
  {
    q: "Une eau notée 10/10 est-elle pure à 100 % ?",
    a: "Un 10/10 signifie qu'aucun paramètre mesuré n'a déclenché de pénalité sur les derniers contrôles. Cela ne garantit pas l'absence totale de toute molécule : cela reflète la qualité des prélèvements officiels disponibles, qui varient en nombre et en profondeur selon les communes."
  }
];

export const metadata = {
  title: "Méthodologie Crystal Score™ | Comment nous auditons la qualité de l'eau",
  description: "Découvrez l'algorithme rigoureux derrière le Crystal Score. Transparence totale sur les seuils de polluants, pesticides, PFAS et microbiologie.",
  alternates: {
    canonical: 'https://www.eaupotable.net/methodologie',
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
                  <p className="seo-subtitle" style={{ marginTop: '1.25rem', borderLeft: '3px solid var(--primary-solid)', paddingLeft: '0.9rem' }}>
                    En une phrase : le Crystal Score part d'une note de 10/10 et retire des points à chaque
                    trace de polluant ou risque sanitaire détecté par les contrôles ARS (bactéries, pesticides,
                    PFAS, nitrates). Seuls les extrêmes de confort sont pénalisés ; la conformité réglementaire
                    s'affiche séparément, sous forme de badge.
                  </p>
                  <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', opacity: 0.75 }}>
                    Méthodologie mise à jour en {METHOD_UPDATE}.
                  </p>
                </div>

                <div className="seo-source-line">
                  <div className="source-links">
                    <a href="https://sante.gouv.fr" target="_blank" rel="noopener noreferrer" className="source-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="trust-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      Données ARS {CURRENT_YEAR}
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
              <p className="seo-main-subtitle">Un score par déduction, fondé sur 5 critères sanitaires — la conformité ARS s'affiche séparément</p>
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
              <p style={{ marginTop: '1rem' }}>
                La conformité réglementaire (ARS) est un statut à part, affiché comme un badge : elle ne se
                mélange pas au score. Une eau déclarée non conforme est plafonnée à 6/10 si la cause est
                technique (calcaire, fer, goût) ou à 2/10 si un dépassement sanitaire est avéré (bactérie,
                pesticide, PFAS, nitrates).
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

              {/* 5. Extrêmes de confort */}
              <div className="penaltyCard">
                <div className="cardIcon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
                </div>
                <h3>Extrêmes de confort</h3>
                <span className="penaltyBadge">-0.5 POINTS</span>
                <p className="cardExplanation">
                  Seuls les extrêmes sont pénalisés : chlore marqué (&gt; 0,4 mg/L) ou calcaire très fort
                  (&gt; 35 °f). Le chlore et le calcaire courants sont affichés mais ne retirent plus de
                  points — une eau dure reste une bonne eau.
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

        {/* Seuils & repères utilisés */}
        <section className="section">
          <div className="sectionContainer">
            <div className="seo-section-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 className="seo-main-title">Seuils &amp; repères utilisés</h2>
              <p className="seo-main-subtitle">Les valeurs affichées sur les fiches communales</p>
            </div>
            <p className="introText">
              Le tableau ci-dessous regroupe les valeurs affichées sur les fiches communales. Les
              <strong> limites de qualité </strong> (nitrates, pesticides, microbiologie…) sont des valeurs
              sanitaires réglementaires ; les <strong>références de qualité</strong> (pH, turbidité, fer,
              chlore…) sont des repères de fonctionnement et de confort, sans enjeu sanitaire direct.
            </p>
            <div className="table-responsive-wrapper" style={{ marginTop: '1.5rem' }}>
              <table className="seo-data-table-unified">
                <thead>
                  <tr>
                    <th>Paramètre</th>
                    <th>Valeur (limite / repère)</th>
                  </tr>
                </thead>
                <tbody>
                  {SEO_DOSSIERS.map((g, gi) => (
                    <React.Fragment key={gi}>
                      <tr>
                        <td colSpan="2"><strong>{g.name}</strong></td>
                      </tr>
                      {g.keys.map((k) => (
                        <tr key={k.key}>
                          <td>{k.label}</td>
                          <td>{k.limit}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: '1.5rem' }}>
              Chaque paramètre est expliqué en détail sur notre page <a href="/definitions">définitions</a>.
            </p>
          </div>
        </section>

        {/* Références réglementaires & sources */}
        <section className="section zebra">
          <div className="sectionContainer">
            <div className="seo-section-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 className="seo-main-title">Références réglementaires &amp; sources</h2>
              <p className="seo-main-subtitle">Des valeurs alignées sur les textes officiels en vigueur</p>
            </div>
            <p className="introText">
              La notation s'appuie exclusivement sur les contrôles sanitaires officiels et les valeurs
              réglementaires en vigueur en France. Voici les textes et sources que nous utilisons :
            </p>
            <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '1.5rem' }}>
              <li style={{ marginBottom: '1rem' }}>
                <a href="https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000465980/" target="_blank" rel="noopener noreferrer">
                  Arrêté du 11 janvier 2007
                </a> relatif aux limites et références de qualité des eaux destinées à la consommation humaine —
                <em> base des seuils affichés (nitrates, pesticides, microbiologie…).</em>
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <a href="https://eur-lex.europa.eu/eli/dir/2020/2184/oj" target="_blank" rel="noopener noreferrer">
                  Directive (UE) 2020/2184
                </a> relative à la qualité des eaux destinées à la consommation humaine (refonte) —
                <em> source des nouvelles valeurs paramétriques PFAS applicables à partir de 2026.</em>
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <a href="https://www.anses.fr/fr" target="_blank" rel="noopener noreferrer">ANSES</a> —
                avis et travaux sur les polluants émergents (PFAS, pesticides, métabolites) —
                <em> principe de précaution appliqué aux molécules sans seuil réglementaire encore fixé.</em>
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <a href="https://sante.gouv.fr/sante-et-environnement/eaux/eau" target="_blank" rel="noopener noreferrer">
                  Ministère chargé de la Santé
                </a> — base SISE-Eaux : résultats des contrôles réalisés par les Agences Régionales de Santé (ARS).
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <a href="https://hubeau.eaufrance.fr/" target="_blank" rel="noopener noreferrer">Hub'Eau / EauFrance</a> —
                API officielles par lesquelles nous récupérons ces données de prélèvement.
              </li>
            </ul>
            <p style={{ marginTop: '1rem' }}>
              Pour aller plus loin : la carte des <a href="/pfas-eau-potable">PFAS en France</a> et le classement
              complet des <a href="/villes">communes par score</a>.
            </p>
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
              {FAQ_DATA.map((f) => (
                <details className="seo-faq-item" key={f.q}>
                  <summary className="seo-faq-question">
                    <h3>{f.q}</h3>
                    <span className="faq-icon"></span>
                  </summary>
                  <div className="seo-faq-answer">
                    <p dangerouslySetInnerHTML={{ __html: f.a }} />
                  </div>
                </details>
              ))}
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
                    "item": "https://www.eaupotable.net"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Méthodologie",
                    "item": "https://www.eaupotable.net/methodologie"
                  }
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": FAQ_DATA.map((f) => ({
                  "@type": "Question",
                  "name": f.q,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f.a.replace(/<[^>]+>/g, "")
                  }
                }))
              }
            ])
          }}
        />
      </main>
    </>
  );
};

export default MethodologyPage;
