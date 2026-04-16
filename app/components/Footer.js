'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
                <path d="M12 21.5C16.1421 21.5 19.5 18.1421 19.5 14C19.5 9.85786 12 2.5 12 2.5C12 2.5 4.5 9.85786 4.5 14C4.5 18.1421 7.85786 21.5 12 21.5Z" fill="url(#footerGradient)" />
                <defs>
                  <linearGradient id="footerGradient" x1="12" y1="2.5" x2="12" y2="21.5" gradientUnits="userSpaceOnUse">
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

          <div className="footer-links-group">
            <div className="footer-column">
              <h4>Navigation</h4>
              <Link href="/">Carte Interactive</Link>
              <Link href="/villes">Toutes les villes</Link>
            </div>
            <div className="footer-column">
              <h4>Assistance</h4>
              <Link href="/mentions-legales">Mentions Légales</Link>
              <Link href="/contact">Inscriptions / Contact</Link>
            </div>
          </div>

          <div className="footer-badge-area">
             <div className="footer-trust-badge">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
               </svg>
               <span>Analyses ARS 2026</span>
             </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-legal-row">
            <p>&copy; 2026 EauPotable.net. Données publiques Hub'Eau. Une initiative pour la santé publique.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
