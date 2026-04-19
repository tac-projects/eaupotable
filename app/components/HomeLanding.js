'use client';

import { useState } from 'react';

export default function HomeLanding({ onCitySelect }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE, SENDING, SUCCESS, ERROR

  const handleVigilanceSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

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
          _subject: 'Nouvel abonnement : Vigilance Qualité Eau',
          message: 'Demande d\'inscription aux alertes de vigilance sanitaire.'
        })
      });

      if (response.ok) {
        setStatus('SUCCESS');
        setEmail('');
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
      <div className="seo-container">
        <div className="seo-header">

          <div className="seo-trust-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Veille Sanitaire & PFAS : Certifiée 2026
          </div>
          <h1 className="seo-title">Quelle est la qualité de votre eau potable ?</h1>
          <p className="seo-subtitle">
            Au-delà de la simple potabilité, accédez au verdict de <strong>pureté globale</strong> de votre réseau. 
            Analyses ARS 2026 en temps réel sur les pesticides, le calcaire et les polluants éternels (PFAS).
          </p>
        </div>

        {/* 1. ARGUMENTS CLEFS : Sécurité / Pureté / Confort */}
        <div className="seo-grid">
          <div className="seo-card">
            <div className="seo-card-icon">🧪</div>
            <h3>Expertise & Pureté</h3>
            <p>Nous analysons la présence de polluants émergents comme les PFAS et les résidus de pesticides, là où les rapports classiques s'arrêtent souvent à la conformité de base.</p>
          </div>

          <div className="seo-card">
            <div className="seo-card-icon">💎</div>
            <h3>Le Crystal Score</h3>
            <p>Un algorithme qui traduit la complexité chimique en une note santé de 0 à 10. Indispensable pour la préparation des biberons et la protection de votre santé.</p>
            <div className="score-mini-visual">
              <div className="mini-bar"><div className="fill" style={{ width: '85%' }}></div></div>
              <span>Qualité Excellente</span>
            </div>
          </div>

          <div className="seo-card">
            <div className="seo-card-icon">🚿</div>
            <h3>Confort & Maison</h3>
            <p>Calculez précisément la dureté de l'eau à votre adresse. Protégez vos équipements du calcaire et prévenez les problèmes de peau (eczéma, sécheresse) liés au tartre.</p>
          </div>
        </div>

        {/* 2. COMMENT ÇA MARCHE */}
        <div className="seo-section-block">
          <h2 className="seo-section-title">🔍 Comment analyser votre eau ?</h2>
          <div className="how-it-works-steps">
            <div className="step-item">
              <span className="step-num">1</span>
              <h4>Recherchez votre ville</h4>
              <p>Utilisez la barre de recherche ou la géolocalisation pour identifier votre réseau de distribution.</p>
            </div>
            <div className="step-item">
              <span className="step-num">2</span>
              <h4>Consultez le score</h4>
              <p>Découvrez votre Crystal Score et le verdict de conformité sanitaire immédiat.</p>
            </div>
            <div className="step-item">
              <span className="step-num">3</span>
              <h4>Agissez au quotidien</h4>
              <p>Suivez nos conseils de dégustation et de protection contre le calcaire adaptés à votre localité.</p>
            </div>
          </div>
        </div>

        {/* 3. SECTION METROPOLES : Analyses réelles */}
        <div className="seo-section-block">
          <h2 className="seo-section-title">📍 Qualité de l'eau dans les métropoles</h2>
          <div className="top-cities-grid">
            {[
              { name: "Paris", score: "7.9", dpt: "75", slug: "paris" },
              { name: "Lyon", score: "4.0", dpt: "69", slug: "lyon" },
              { name: "Marseille", score: "5.1", dpt: "13", slug: "marseille" },
              { name: "Nantes", score: "9.6", dpt: "44", slug: "nantes" },
              { name: "Lille", score: "8.3", dpt: "59", slug: "lille" },
              { name: "Montpellier", score: "8.6", dpt: "34", slug: "montpellier" },
              { name: "Bordeaux", score: "8.6", dpt: "33", slug: "bordeaux" },
              { name: "Toulouse", score: "9.4", dpt: "31", slug: "toulouse" }
            ].map(city => (
              <button key={city.slug} onClick={() => onCitySelect({ name: city.name })} className="top-city-item premium-city-card">
                <span className="city-name">{city.name} ({city.dpt})</span>
                <span className="city-score">Score Crystal : <strong>{city.score}</strong>/10</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. FAQ GENERALE */}
        <div className="seo-section-block">
          <h2 className="seo-section-title">💬 Questions fréquentes sur l'eau potable</h2>
          <div className="seo-faq-accordion">
            {[
              {
                q: "Pourquoi vérifier la qualité de son eau au-delà de la potabilité ?",
                a: "En France, l'eau est traitée pour être potable (normes de sécurité immédiate). Cependant, le Crystal Score évalue la pureté à long terme : présence de nitrates, résidus de pesticides ou de polluants éternels (PFAS). Savoir ce que l'on boit permet d'adapter sa consommation, notamment pour les nourrissons."
              },
              {
                q: "Comment est calculé le Crystal Score 2026 ?",
                a: "Notre algorithme analyse 15 paramètres physico-chimiques issus de l'ARS. Il pondère la sécurité (bactériologie), la pureté (pesticides, PFAS) et le confort (dureté, chlore) pour offrir une note de 0 à 10 immédiatement compréhensible."
              },
              {
                q: "L'eau de mon robinet contient-elle des PFAS (polluants éternels) ?",
                a: "Depuis le 1er janvier 2026, toutes les communes ont l'obligation de tester les PFAS. EauPotable.net intègre ces nouvelles données dès leur publication officielle par les ARS. Vérifiez sur la fiche de votre ville si des résidus ont été détectés lors des derniers contrôles."
              },
              {
                q: "Adoucisseur vs Carafe filtrante : que conseiller ?",
                a: "Si votre score 'Dureté' est défavorable (> 25°f), un adoucisseur protégera vos canalisations. Si vous n'aimez pas le goût du chlore, une carafe filtrante suffit. Aucune filtration n'est cependant nécessaire pour les eaux notées 'Excellentes', déjà très pures."
              },
              {
                q: "D'où proviennent les données du site ?",
                a: "Nous exploitons l'API Hub'Eau, le portail officiel des données sur l'eau en France. Ces données proviennent des prélèvements réels effectués sur les points de puisage et robinets par les autorités sanitaires (Ministère de la Santé)."
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
              
              <form className="cta-form" onSubmit={handleVigilanceSubmit}>
                <input 
                  type="email" 
                  placeholder="Votre email..." 
                  className="cta-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === 'SENDING' || status === 'SUCCESS'}
                />
                <button 
                  type="submit" 
                  className="cta-btn" 
                  disabled={status === 'SENDING' || status === 'SUCCESS'}
                >
                  {status === 'SENDING' ? 'Traitement...' : status === 'SUCCESS' ? 'Bien inscrit !' : "M'abonner à l'alerte"}
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
                  "name": "L'eau du robinet contient-elle des PFAS (polluants éternels) ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Depuis le 1er janvier 2026, toutes les communes ont l'obligation de tester les PFAS. EauPotable.net intègre ces nouvelles données dès leur publication officielle par les ARS pour chaque commune de France."
                  }
                }
              ]
            })
          }}
        />
      </div>
    </section>
  );
}
