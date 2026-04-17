'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="global-footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link href="/" className="logo" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
                <path d="M12 21.5C16.1421 21.5 19.5 18.1421 19.5 14C19.5 9.85786 12 2.5 12 2.5C12 2.5 4.5 9.85786 4.5 14C4.5 18.1421 7.85786 21.5 12 21.5Z" fill="url(#crystalGradientFooter)" />
                <path d="M12 5.5C10 7.5 7.5 10.5 7.5 14" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                <circle cx="9.5" cy="11.5" r="1.5" fill="white" opacity="0.8" />
                <path d="M11 19.5C13 19.5 16 18.5 17 16" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
                <defs>
                  <linearGradient id="crystalGradientFooter" x1="12" y1="2.5" x2="12" y2="21.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3FA9FE" />
                    <stop offset="0.5" stopColor="#0066FF" />
                    <stop offset="1" stopColor="#0047AB" />
                  </linearGradient>
                </defs>
              </svg>
              EauPotable.net
            </Link>
            <p className="footer-tagline">La transparence totale sur l'eau de votre robinet.</p>
          </div>
          
          <div className="footer-nav-grid">
            <div className="footer-nav-col">
              <h4>Navigation</h4>
              <ul>
                <li><a href="/">Carte Interactive</a></li>
                <li><a href="/villes">Toutes les villes</a></li>
              </ul>
            </div>
            <div className="footer-nav-col">
              <h4>Assistance</h4>
              <ul>
                <li><a href="/faq">FAQ</a></li>
                <li><a href="/contact">Inscriptions / Contact</a></li>
              </ul>
            </div>
            <div className="footer-nav-col">
              <h4>Légal</h4>
              <ul>
                <li><a href="/mentions-legales">Mentions Légales</a></li>
                <li><a href="/rgpd">RGPD</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-row">
            <span className="footer-copyright">© 2026 EauPotable.net.</span>
            
            <span className="footer-divider"></span>

            <span className="footer-data-source">
              Données Hub'Eau.{' '}
              <a 
                href="https://www.data.gouv.fr/fr/reuses/eaupotable-net-observatoire-citoyen-de-la-qualite-de-leau-et-des-pfas/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Réutilisation officielle certifiée
              </a>
            </span>

            <span className="footer-divider"></span>

            <div className="footer-badges-inline">
              <div className="footer-status-badge smaller">
                <span className="status-dot"></span>
                Analyses ARS 2026
              </div>
              <a 
                href="https://www.data.gouv.fr/fr/reuses/eaupotable-net-observatoire-citoyen-de-la-qualite-de-leau-et-des-pfas/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-trust-badge smaller"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                Certifié Data.gouv.fr
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
