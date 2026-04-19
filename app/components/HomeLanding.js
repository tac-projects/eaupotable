'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import { POPULAR_CITIES } from '@/lib/water-utils';

export default function HomeLanding({ onCitySelect, searchProps }) {
  const [email, setEmail] = useState('');
  const [cityName, setCityName] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE, SENDING, SUCCESS, ERROR
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [vigilanceSuggestions, setVigilanceSuggestions] = useState([]);
  const [isVigilanceFocused, setIsVigilanceFocused] = useState(false);
  const turnstileRef = useRef(null);

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
    <section className="seo-section home-landing">
      <div className="hero-section">
        <div className="seo-container">
          <div className="seo-header">
            <h1 className="seo-title">Quelle est la qualité de votre eau potable{'\u00A0'}?</h1>
            <p className="seo-subtitle">
              Au-delà de la potabilité, accédez au verdict de <strong>pureté globale</strong>. 
              Analyses ARS 2026 : pesticides, nitrates, bactéries, calcaire et PFAS.
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
                    <p style={{ padding: '10px 20px', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', borderBottom: '1px solid rgba(0,0,0,0.05)', letterSpacing: '0.05em' }}>Villes populaires</p>
                    {POPULAR_CITIES.map(city => (
                    <div key={city.slug} className="suggestion-item" onClick={() => handleSearchSelection({ text: city.name, place_name: city.name })}>
                        {city.name}
                    </div>
                    ))}
                </div>
                )}
                {suggestions.map((f, i) => (
                <div key={i} className="suggestion-item" onClick={() => handleSearchSelection(f)}>
                    <strong>{f.text}</strong> <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>({f.context?.[0]?.text || ''})</span>
                </div>
                ))}
            </div>
          </div>

          <div className="seo-trust-group" >
            <div className="seo-trust-badge green">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Analyses ARS 2026
            </div>
            <div className="seo-trust-badge purple">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              Référencé Data.gouv.fr
            </div>
            <div className="seo-trust-badge orange">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Partenaire Open Data
            </div>
          </div>
        </div>
      </div>

      <div className="seo-container">
        {/* 1. ARGUMENTS CLEFS : Sécurité / Pureté / Confort */}
        <h2 className="sr-only">Pourquoi analyser votre eau potable ?</h2>
        <div className="seo-grid">
          <div className="seo-card">
            <div className="seo-card-icon">🧪</div>
            <h3>Analyse Intégrale</h3>
            <p>Nous scrutons 15 paramètres critiques : nitrates, bactéries, pesticides, PFAS et métaux. Une vision à 360° de votre eau, bien au-delà des rapports simplifiés.</p>
          </div>

          <div className="seo-card">
            <div className="seo-card-icon">💎</div>
            <h3>Le Crystal Score</h3>
            <p>Un algorithme qui traduit la complexité chimique en une note santé de 0 à 10. Indispensable pour la préparation des biberons et la protection de vos proches.</p>
          </div>

          <div className="seo-card">
            <div className="seo-card-icon">🚿</div>
            <h3>Confort & Économies</h3>
            <p>Maîtrisez la dureté de votre eau. Protégez vos équipements du calcaire, prévenez les problèmes de peau (eczéma) et optimisez votre consommation d'énergie.</p>
          </div>

          <div className="seo-card">
            <div className="seo-card-icon">🔔</div>
            <h3>Vigilance Active</h3>
            <p>Ne subissez plus les pollutions locales. Soyez alerté immédiatement si un pic de nitrates ou une non-conformité bactériologique est détecté sur votre réseau.</p>
          </div>
        </div>

        {/* 2. COMMENT ÇA MARCHE */}
        <div className="seo-section-block">
          <h2 className="seo-section-title">🔍 3 étapes pour vérifier la qualité de votre eau{'\u00A0'}?</h2>
          <div className="how-it-works-steps">
            <div className="step-item">
              <span className="step-num">1</span>
              <h3>Trouvez votre ville</h3>
              <p>Utilisez la barre de recherche pour identifier votre réseau de distribution.</p>
            </div>
            <div className="step-item">
              <span className="step-num">2</span>
              <h3>Déchiffrez le score</h3>
              <p>Consultez votre Crystal Score et les rapports sanitaires officiels.</p>
            </div>
            <div className="step-item">
              <span className="step-num">3</span>
              <h3>Optimisez votre eau</h3>
              <p>Suivez nos conseils pour filtrer le chlore ou le calcaire au quotidien.</p>
            </div>
          </div>
        </div>

        {/* 3. SECTION METROPOLES : Analyses réelles */}
        <div className="seo-section-block">
          <h2 className="seo-section-title">📍 Qualité de l'eau dans les métropoles</h2>
          <div className="top-cities-grid">
            {[
              { name: "Paris", score: "7.9", dpt: "75", slug: "paris" },
              { name: "Marseille", score: "5.1", dpt: "13", slug: "marseille" },
              { name: "Lyon", score: "4.0", dpt: "69", slug: "lyon" },
              { name: "Toulouse", score: "9.4", dpt: "31", slug: "toulouse" },
              { name: "Nice", score: "9.4", dpt: "06", slug: "nice" },
              { name: "Nantes", score: "9.6", dpt: "44", slug: "nantes" },
              { name: "Montpellier", score: "8.6", dpt: "34", slug: "montpellier" },
              { name: "Strasbourg", score: "9.1", dpt: "67", slug: "strasbourg" },
              { name: "Bordeaux", score: "8.6", dpt: "33", slug: "bordeaux" },
              { name: "Lille", score: "8.3", dpt: "59", slug: "lille" }
            ].map(city => (
              <button key={city.slug} onClick={() => onCitySelect({ name: city.name })} className="top-city-item premium-city-card">
                <span className="city-name">{city.name} ({city.dpt})</span>
                <span className="city-score">{city.score}/10</span>
              </button>
            ))}
          </div>
          
          <div className="all-cities-link-container">
            <a href="/villes" className="btn-all-cities">
              <span>Explorer toutes les villes de France</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </div>
        </div>

        {/* 4. FAQ GENERALE */}
        <div className="seo-section-block">
          <h2 className="seo-section-title">💬 Questions fréquentes sur l'eau potable</h2>
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
                a: "Nous exploitons l'API Hub'Eau, le portail officiel de l'État. Ces données proviennent des prélèvements réels en sortie de robinet effectués par les autorités sanitaires (ARS / Ministère de la Santé)."
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
        </div>

        {/* 5. CTA ALERTE VIGILANCE PREMIUM */}
        <div className="seo-section-block">
          <div className="cta-alert-card">
            <div className={`cta-alert-icon ${status === 'SENDING' ? 'ringing' : ''}`}>
              <span>🔔</span>
            </div>
            <div className="cta-alert-content">
              <h3>Vigilance Qualité Eau</h3>
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
    </section>
  );
}
