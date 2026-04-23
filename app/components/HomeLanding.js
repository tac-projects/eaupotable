'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { POPULAR_CITIES } from '@/lib/water-utils';

export default function HomeLanding({ onCitySelect, searchProps }) {
  const [email, setEmail] = useState('');
  const [cityName, setCityName] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE, SENDING, SUCCESS, ERROR
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [vigilanceSuggestions, setVigilanceSuggestions] = useState([]);
  const [isVigilanceFocused, setIsVigilanceFocused] = useState(false);
  const [metropolisScores, setMetropolisScores] = useState([
    { name: "Paris", score: "5.5", dpt: "75", slug: "paris" },
    { name: "Marseille", score: "10", dpt: "13", slug: "marseille" },
    { name: "Lyon", score: "8.5", dpt: "69", slug: "lyon" },
    { name: "Toulouse", score: "10", dpt: "31", slug: "toulouse" },
    { name: "Nice", score: "9.5", dpt: "06", slug: "nice" },
    { name: "Nantes", score: "8", dpt: "44", slug: "nantes" },
    { name: "Montpellier", score: "7.5", dpt: "34", slug: "montpellier" },
    { name: "Strasbourg", score: "9", dpt: "67", slug: "strasbourg" },
    { name: "Bordeaux", score: "8", dpt: "33", slug: "bordeaux" },
    { name: "Lille", score: "5.5", dpt: "59", slug: "lille" }
  ]);
  const turnstileRef = useRef(null);

  // Chargement des scores réels depuis l'archiviste
  useEffect(() => {
    fetch('/data/metropolis.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMetropolisScores(data);
      })
      .catch(err => console.log("Note: scores par défaut utilisés pour l'accueil"));
  }, []);


  const SITE_KEY = "0x4AAAAAAC_xXPQR0f_6hAhk";
  const mapboxToken = 'pk.eyJ1IjoiY3Jhenl0YXJwZSIsImEiOiJjbW5wdDczZHQwMDc4MnJxeXN2OTMzYmFlIn0.V2B4cX82xIQntOorHu0XSA';

  const {
    searchQuery,
    suggestions,
    isSearchFocused,
    placeholder,
    onSearchChange,
    handleSearchSelection,
    setIsSearchFocused,
    setSearchQuery,
    setSuggestions,
    geolocate
  } = searchProps;

  const handleVigilanceCityChange = async (val) => {
    setCityName(val);
    if (val.length < 3) {
      setVigilanceSuggestions([]);
      return;
    }
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${mapboxToken}&country=FR&types=place,postcode&language=fr&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      setVigilanceSuggestions(data.features || []);
    } catch (err) {
      console.error("Mapbox error:", err);
    }
  };

  const handleVigilanceCitySelect = (feature) => {
    setCityName(feature.text);
    setVigilanceSuggestions([]);
    setIsVigilanceFocused(false);
  };

  const handleVigilanceSubmit = async (e) => {
    e.preventDefault();
    if (!email || !cityName || !turnstileToken) return;

    setStatus('SENDING');

    try {
      const response = await fetch('https://formspree.io/f/xeevkvqa', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          ville: cityName,
          "cf-turnstile-response": turnstileToken,
          _subject: `Nouvel abonnement Vigilance : ${cityName}`,
          message: `Demande d'inscription aux alertes de vigilance pour la ville de ${cityName}.`
        })
      });

      if (response.ok) {
        setStatus('SUCCESS');
        setEmail('');
        setCityName('');
        // Reset turnstile for next time
        if (window.turnstile) window.turnstile.reset(turnstileRef.current);
        setTurnstileToken(null);
        setTimeout(() => setStatus('IDLE'), 5000);
      } else {
        setStatus('ERROR');
      }
    } catch (error) {
      console.error("Vigilance error:", error);
      setStatus('ERROR');
    }
  };

  return (
    <div className="home-landing-page">
      <div className="hero-section">
        <div className="hero-mesh-background">
          <div className="mesh-blob blob-1"></div>
          <div className="mesh-blob blob-2"></div>
          <div className="mesh-blob blob-3"></div>
          <div className="mesh-noise"></div>
        </div>
        <div className="seo-container">
          <div className="seo-header">
            <h1 className="seo-title">Quelle est la qualité de <br />votre <span className="text-primary">eau potable{'\u00A0'}?</span></h1>
            <p className="seo-subtitle">
              Vérifiez instantanément la qualité de l'eau du robinet dans votre ville. Accédez au verdict de pureté globale basé sur les analyses de pesticides, nitrates, PFAS et bactéries.
            </p>
          </div>

          <div className="home-search-container">
            {/* ... barre de recherche existante ... */}
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={onSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && suggestions.length > 0) { handleSearchSelection(suggestions[0]); }
                }}
                placeholder={placeholder}
                className="search-input"
                aria-label="Rechercher une ville ou un code postal"
              />
              {searchQuery && (
                <button
                  className="clear-search visible"
                  onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                  aria-label="Effacer la recherche"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
              <button className="geolocate-btn" onClick={geolocate} aria-label="Me géolocaliser">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </button>
            </div>

            <div className={`search-results ${isSearchFocused && (suggestions.length > 0 || !searchQuery) ? 'active' : ''}`}>
              {!searchQuery && (
                <div className="popular-cities-list">
                  <p className="popular-cities-title">Villes populaires</p>
                  {POPULAR_CITIES.slice(0, 8).map(city => (
                    <div key={city.slug} className="suggestion-item" onClick={() => handleSearchSelection({ text: city.name, place_name: city.name })}>
                      {city.name}
                    </div>
                  ))}
                </div>
              )}
              {suggestions.map((f, i) => (
                <div key={i} className="suggestion-item" onClick={() => handleSearchSelection(f)}>
                  <strong>{f.text}</strong> <span className="suggestion-context-text">({f.context?.[0]?.text || ''})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="seo-source-line">
            <span className="source-label">Sources officielles :</span>
            <div className="source-links">
              <a 
                href="https://sante.gouv.fr/sante-et-environnement/eaux/eau" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="source-link"
              >
                Données ARS 2026 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
              <a 
                href="https://www.data.gouv.fr/fr/reuses/eaupotable-net-observatoire-citoyen-de-la-qualite-de-leau-et-des-pfas/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="source-link"
              >
                Référencé Data.gouv.fr <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
              <a 
                href="https://alliance.numerique.gouv.fr/licence-ouverte-open-licence/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="source-link"
              >
                Partenaire Open Data <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 1. NOS SERVICES */}
      <section className="home-content-section gray">
        <div className="seo-container">
          <div className="seo-section-block">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Nos Services d'Analyse</h2>
              <p className="seo-main-subtitle">Découvrez les différents aspects de la qualité de votre eau grâce à nos outils d'analyse simplifiés.</p>
            </div>

            <div className="seo-grid">
              <div className="seo-card">
                <div className="seo-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /><path d="M9 14h2" /><path d="M9 12a2 2 0 1 1-2-2V6h6v4a2 2 0 1 1-2 2Z" /><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></svg>
                </div>
                <h3>Analyse Intégrale</h3>
                <p>Nous scrutons 15 paramètres critiques : nitrates, bactéries, pesticides, PFAS et métaux. Une vision à 360° de votre eau, bien au-delà des rapports simplifiés.</p>
              </div>

              <div className="seo-card highlight">
                <div className="popular-badge">ESSENTIEL</div>
                <div className="seo-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3h12l4 6-10 13L2 9Z" />
                    <path d="M12 3l-4 6 4 13 4-13-4-6" />
                    <path d="M2 9h20" />
                  </svg>
                </div>
                <h3>Le Crystal Score</h3>
                <p>Un algorithme qui traduit la complexité chimique en une note santé de 0 à 10. Indispensable pour la préparation des biberons et la protection de vos proches.</p>
              </div>

              <div className="seo-card">
                <div className="seo-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                </div>
                <h3>Confort & Économies</h3>
                <p>Maîtrisez la dureté de votre eau. Protégez vos équipements du calcaire, prévenez les problèmes de peau (eczéma) et optimisez votre consommation d'énergie.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

       {/* 2. COMMENT ÇA MARCHE */}
      <section className="home-content-section white">
        <div className="seo-container">
          <div className="seo-section-block">
            <div className="seo-section-header">
              <h2 className="seo-main-title">3 étapes pour vérifier votre eau</h2>
              <p className="seo-main-subtitle">Une méthode simple et transparente pour décrypter les données sanitaires de votre commune en quelques secondes.</p>
            </div>
            <div className="how-it-works-steps">
              <div className="step-item">
                <span className="step-num">1</span>
                <h3>Trouvez votre ville</h3>
                <p>Utilisez notre barre de recherche pour sélectionner votre commune en un clic.</p>
              </div>
              <div className="step-item">
                <span className="step-num">2</span>
                <h3>Déchiffrez le score</h3>
                <p>Découvrez votre Crystal Score et les détails des derniers relevés sanitaires.</p>
              </div>
              <div className="step-item">
                <span className="step-num">3</span>
                <h3>Optimisez votre eau</h3>
                <p>Suivez nos conseils pour filtrer et consommer votre eau en toute sérénité.</p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* 3. SECTION METROPOLES : Analyses réelles */}
      <section className="home-content-section gray">
        <div className="seo-container">
          <div className="seo-section-block">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Qualité de l'eau des métropoles</h2>
              <p className="seo-main-subtitle">Explorez les scores de pureté et la conformité bactériologique des plus grandes agglomérations de France.</p>
            </div>

            <div className="premium-metropolis-container">
              <div className="premium-metropolis-header">
                <div className="col-city">MÉTROPOLE</div>
                <div className="col-score">SCORE MOYEN</div>
              </div>
              <div className="premium-metropolis-body">
                {metropolisScores.map(city => {
                  const scoreNum = parseFloat(city.score);

                  const scoreClass = scoreNum >= 8 ? 'excellent' : scoreNum >= 6 ? 'good' : scoreNum >= 4 ? 'warning' : 'critical';

                  return (
                    <button
                      key={city.slug}
                      onClick={() => onCitySelect({ name: city.name })}
                      className="premium-metropolis-row"
                    >
                      <div className="col-city">
                        <strong>{city.name}</strong>
                        <span className="city-dpt">({city.dpt})</span>
                      </div>
                      <div className="col-score">
                        <span className={`score-badge score-v2-${scoreClass}`}>
                          {scoreNum.toFixed(1)} / 10
                        </span>
                      </div>

                    </button>
                  );
                })}
              </div>
            </div>

            <div className="all-cities-link-container">
              <a href="/villes" className="btn-all-cities">
                <span>Explorer toutes les villes de France</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ GENERALE */}
      <section className="home-content-section white">
        <div className="seo-container">
          <div className="seo-section-block">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Foire Aux Questions</h2>
              <p className="seo-main-subtitle">Tout ce que vous devez savoir sur la potabilité, le calcaire et les polluants émergents (PFAS).</p>
            </div>
            <div className="seo-faq-accordion">
              {[
                {
                  q: "Pourquoi vérifier la qualité de son eau au-delà de la potabilité\u00A0?",
                  a: "En France, l'eau est traitée pour être potable (normes de sécurité immédiate). Cependant, le Crystal Score évalue la pureté à long terme : présence de nitrates, résidus de pesticides ou de polluants éternels (PFAS). Savoir ce que l'on boit permet d'adapter sa consommation, notamment pour les nourrissons."
                },
                {
                  q: "Comment est calculé le Crystal Score 2026\u00A0?",
                  a: "Notre algorithme analyse 15 paramètres physico-chimiques issus de l'ARS. Il pondère la sécurité (bactériologie), la pureté (pesticides, PFAS) et le confort (dureté, chlore) pour offrir une note de 0 à 10 immédiatement compréhensible."
                },
                {
                  q: "Peut-on utiliser l'eau du robinet pour la préparation des biberons\u00A0?",
                  a: "Oui, si l'eau affiche un Crystal Score élevé et une teneur en nitrates inférieure à 50mg/L. Notre outil vous permet de vérifier ces critères critiques d'un coup d'œil pour garantir la sécurité de votre nourrisson."
                },
                {
                  q: "Est-il plus sain de boire l'eau du robinet ou de l'eau en bouteille\u00A0?",
                  a: "L'eau du robinet est le produit alimentaire le plus contrôlé. Elle évite la pollution plastique et la migration de microplastiques. Avec une eau notée 'Excellente', le robinet est souvent l'option la plus saine et écologique."
                },
                {
                  q: "L'eau de mon robinet contient-elle des PFAS (polluants éternels)\u00A0?",
                  a: "Depuis le 1er janvier 2026, toutes les communes doivent tester les PFAS. EauPotable.net intègre ces données dès leur publication. Vérifiez sur la fiche de votre ville si des résidus ont été détectés récemment."
                },
                {
                  q: "Adoucisseur vs Carafe filtrante\u00A0: que conseiller\u00A0?",
                  a: "Si votre score 'Dureté' est élevé (> 25°f), un adoucisseur protégera vos installations. Pour le goût du chlore, une carafe filtrante suffit. Aucune filtration n'est requise pour les eaux notées 'Excellentes'."
                },
                {
                  q: "D'où proviennent les données du site\u00A0?",
                  a: "Nous exploitons les données de l'API Hub'Eau (État français) via notre base de données locale accélérée. Ces informations proviennent des prélèvements réels effectués par les autorités sanitaires (ARS) pour garantir une fiabilité totale."

                }
              ].map((item, i) => (
                <details key={i} className="seo-faq-item">
                  <summary className="seo-faq-question">
                    <h3>{item.q}</h3>
                    <span className="faq-icon"></span>
                  </summary>
                  <div className="seo-faq-answer">
                    <p>{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
            
            <div className="faq-more-cta">
              <Link href="/faq" className="faq-more-btn">
                Voir toutes les questions fréquentes
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA ALERTE VIGILANCE PREMIUM */}
      <section className="home-content-section gray">
        <div className="seo-container">
          <div className="seo-section-block">
            <div className="cta-alert-card">
              <div className={`cta-alert-icon ${status === 'SENDING' ? 'ringing' : ''}`}>
                <span>🔔</span>
              </div>
              <div className="cta-alert-content">
                <h3>Vigilance Active</h3>
                <p>Recevez une notification immédiate par email si la qualité de l'eau de votre commune subit une modification ou un rappel sanitaire.</p>

                <form className="cta-form-inline" onSubmit={handleVigilanceSubmit}>
                  <div className="cta-input-wrapper">
                    <input
                      type="text"
                      placeholder="Votre ville ou CP..."
                      className="cta-input"
                      value={cityName}
                      onChange={(e) => handleVigilanceCityChange(e.target.value)}
                      onFocus={() => setIsVigilanceFocused(true)}
                      onBlur={() => setTimeout(() => setIsVigilanceFocused(false), 200)}
                      required
                      disabled={status === 'SENDING' || status === 'SUCCESS'}
                    />
                    {isVigilanceFocused && vigilanceSuggestions.length > 0 && (
                      <div className="vigilance-suggestions-dropdown">
                        {vigilanceSuggestions.map((f, i) => (
                          <div
                            key={i}
                            className="vigilance-suggestion-item"
                            onClick={() => handleVigilanceCitySelect(f)}
                          >
                            <strong>{f.text}</strong> <span className="suggestion-context">({f.context?.[0]?.text || ''})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="email"
                    placeholder="Votre email..."
                    className="cta-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === 'SENDING' || status === 'SUCCESS'}
                  />

                  <div ref={turnstileRef} className="cf-turnstile-container-inline"></div>

                  <button
                    type="submit"
                    className="cta-btn-inline"
                    disabled={status === 'SENDING' || status === 'SUCCESS' || !turnstileToken}
                  >
                    {status === 'SENDING' ? '...' : status === 'SUCCESS' ? 'OK' : "S'abonner"}
                  </button>
                </form>

                {status === 'SUCCESS' && (
                  <div className="cta-status success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Inscription confirmée. Merci pour votre confiance.
                  </div>
                )}
                {status === 'ERROR' && (
                  <div className="cta-status error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    Erreur serveur. Veuillez réessayer plus tard.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>


        {/* SEO POWER: JSON-LD Structured Data for Home */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Pourquoi vérifier la qualité de son eau au-delà de la potabilité ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "En France, l'eau est traitée pour être potable (normes de sécurité immédiate). Cependant, le Crystal Score évalue la pureté à long terme : présence de nitrates, résidus de pesticides ou de polluants éternels (PFAS). Savoir ce que l'on boit permet d'adapter sa consommation."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Comment est calculé le Crystal Score 2026 ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Notre algorithme analyse 15 paramètres physico-chimiques issus de l'ARS. Il pondère la sécurité (bactériologie), la pureté (pesticides, PFAS) et le confort (dureté, chlore) pour offrir une note de 0 à 10 immédiatement compréhensible."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Peut-on utiliser l'eau du robinet pour la préparation des biberons ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Oui, si l'eau affiche un Crystal Score élevé et une teneur en nitrates inférieure à 50mg/L. Notre outil vous permet de vérifier cette conformité critique pour la sécurité des nourrissons."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Est-il plus sain de boire l'eau du robinet ou de l'eau en bouteille ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "L'eau du robinet est le produit alimentaire le plus contrôlé. Elle évite la pollution plastique et contient moins de microplastiques que l'eau en bouteille. C'est l'option la plus saine et écologique."
                  }
                },
                {
                  "@type": "Question",
                  "name": "L'eau du robinet contient-elle des PFAS (polluants éternels) ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Depuis le 1er janvier 2026, toutes les communes ont l'obligation de tester les PFAS. EauPotable.net intègre ces nouvelles données dès leur publication officielle par les ARS pour chaque commune de France."
                  }
                },
                {
                  "@type": "Question",
                  "name": "D'où proviennent les données du site ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Nous exploitons l'API Hub'Eau, le portail officiel de l'État français. Les données proviennent des prélèvements réels en sortie de robinet effectués par les autorités sanitaires (ARS)."
                  }
                }
              ]
            })
          }}
        />

        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="lazyOnload"
          onLoad={() => {
            if (window.turnstile && turnstileRef.current) {
              window.turnstile.render(turnstileRef.current, {
                sitekey: SITE_KEY,
                callback: (token) => setTurnstileToken(token),
                theme: 'dark'
              });
            }
          }}
        />
    </div>

  );
}
