'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="global-footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
                <path d="M12 21.5C16.1421 21.5 19.5 18.1421 19.5 14C19.5 9.85786 12 2.5 12 2.5C12 2.5 4.5 9.85786 4.5 14C4.5 18.1421 7.85786 21.5 12 21.5Z" fill="url(#crystalGradientFooter)" />
                <path d="M12 5.5C10 7.5 7.5 10.5 7.5 14" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                <circle cx="9.5" cy="11.5" r="1.5" fill="white" opacity="0.8" />
                <path d="M11 19.5C13 19.5 16 18.5 17 16" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
                <defs>
                  <linearGradient id="crystalGradientFooter" x1="12" y1="2.5" x2="12" y2="21.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3FA9FE" />
                    <stop offset="0.5" stopColor="#0055FF" />
                    <stop offset="1" stopColor="#003399" />
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
              Données en temps réel Hub'Eau (Ministère de la Santé).
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
                className="footer-trust-badge smaller blue"
                aria-label="Voir la réutilisation officielle sur data.gouv.fr"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="footer-badge-icon">
                  <path d="M12 2L1 12l1.41 1.41L12 3.83l9.59 9.58L23 12 12 2z" />
                </svg>
                Réutilisation officielle
              </a>

              <a 
                href="https://www.data.gouv.fr/fr/reuses/eaupotable-net-observatoire-citoyen-de-la-qualite-de-leau-et-des-pfas/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-trust-badge smaller indigo"
                aria-label="Voir notre référencement sur Data.gouv.fr"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="footer-badge-icon">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                Référencé Data.gouv.fr
              </a>

              <div className="footer-trust-badge smaller gold">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="footer-badge-icon">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                Partenaire Open Data
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
