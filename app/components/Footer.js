'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="premium-footer">
      <div className="footer-container-centered">
        {/* LOGO & BIO SEO */}
        <div className="footer-brand-section">
          <Link href="/" className="footer-logo-premium">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
              <path d="M12 21.5C16.1421 21.5 19.5 18.1421 19.5 14C19.5 9.85786 12 2.5 12 2.5C12 2.5 4.5 9.85786 4.5 14C4.5 18.1421 7.85786 21.5 12 21.5Z" fill="var(--primary-solid)" />
              <path d="M12 5.5C10 7.5 7.5 10.5 7.5 14" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
              <circle cx="9.5" cy="11.5" r="1.5" fill="white" opacity="0.8" />
              <path d="M11 19.5C13 19.5 16 18.5 17 16" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
            </svg>
            <span className="logo-text">EauPotable.net</span>
          </Link>
          <p className="footer-mission-text">
            L'observatoire citoyen indépendant qui démocratise l'accès aux données sanitaires. 
            Suivi quotidien des PFAS, nitrates et pesticides dans 35 000 communes de France 
            pour une transparence totale sur l'eau de votre robinet.
          </p>
        </div>

        {/* LIENS DE NAVIGATION (UNE LIGNE) */}
        <nav className="footer-nav-minimal">
          <Link href="/">Accueil</Link>
          <Link href="/villes">Toutes les villes</Link>
          <Link href="/methodologie">Méthodologie</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/mentions-legales">Mentions Légales</Link>
        </nav>

        {/* TRUST SIGNALS (DISCRETS) */}
        <div className="footer-trust-monochrome">
          <a href="https://sante.gouv.fr" target="_blank" rel="noopener noreferrer" className="trust-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Données ARS
          </a>
          <a href="https://data.gouv.fr" target="_blank" rel="noopener noreferrer" className="trust-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
            Data.gouv.fr
          </a>
          <a href="https://alliance.numerique.gouv.fr" target="_blank" rel="noopener noreferrer" className="trust-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
            Open Data
          </a>
        </div>

        {/* COPYRIGHT & SOURCE SÈCHE */}
        <div className="footer-copyright-slim">
          <p>© 2026 EauPotable.net • Données officielles Hub'Eau (Ministère de la Santé)</p>
        </div>
      </div>
    </footer>
  );
}
