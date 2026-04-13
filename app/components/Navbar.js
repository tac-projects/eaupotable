'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <header className="transparent-header">
        <div className="container nav-wrapper">
          <Link href="/" className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
              <path d="M12 21.5C16.1421 21.5 19.5 18.1421 19.5 14C19.5 9.85786 12 2.5 12 2.5C12 2.5 4.5 9.85786 4.5 14C4.5 18.1421 7.85786 21.5 12 21.5Z" fill="url(#crystalGradient)" />
              <path d="M12 5.5C10 7.5 7.5 10.5 7.5 14" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
              <circle cx="9.5" cy="11.5" r="1.5" fill="white" opacity="0.8" />
              <path d="M11 19.5C13 19.5 16 18.5 17 16" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
              <defs>
                <linearGradient id="crystalGradient" x1="12" y1="2.5" x2="12" y2="21.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3FA9FE" />
                  <stop offset="0.5" stopColor="#0066FF" />
                  <stop offset="1" stopColor="#0047AB" />
                </linearGradient>
              </defs>
            </svg>
            EauPotable.net
          </Link>
          <button 
            id="hamburger" 
            className={`hamburger-btn ${isOpen ? 'is-active' : ''}`} 
            aria-label="Menu" 
            onClick={toggleMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <div id="main-menu" className={`main-menu ${isOpen ? 'active' : ''}`}>
        <button id="close-menu" className="close-menu" aria-label="Fermer le menu" onClick={() => setIsOpen(false)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="logo-menu">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-menu-icon">
            <path d="M12 21.5C16.1421 21.5 19.5 18.1421 19.5 14C19.5 9.85786 12 2.5 12 2.5C12 2.5 4.5 9.85786 4.5 14C4.5 18.1421 7.85786 21.5 12 21.5Z" fill="url(#crystalGradientMenu)" />
            <path d="M12 5.5C10 7.5 7.5 10.5 7.5 14" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
            <circle cx="9.5" cy="11.5" r="1.5" fill="white" opacity="0.8" />
            <path d="M11 19.5C13 19.5 16 18.5 17 16" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
            <defs>
              <linearGradient id="crystalGradientMenu" x1="12" y1="2.5" x2="12" y2="21.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3FA9FE" />
                <stop offset="0.5" stopColor="#0066FF" />
                <stop offset="1" stopColor="#0047AB" />
              </linearGradient>
            </defs>
          </svg>
          EauPotable.net
        </div>

        <ul className="menu-items">
          <li><Link href="/" onClick={() => setIsOpen(false)}>Carte Interactive</Link></li>
          <li><Link href="/mentions-legales" onClick={() => setIsOpen(false)}>Mentions Légales</Link></li>
          <li><Link href="/contact" onClick={() => setIsOpen(false)}>Contact</Link></li>
        </ul>

        <div className="menu-footer">
          <p>&copy; 2026 EauPotable.net - La transparence sur votre eau</p>
        </div>
      </div>
    </>
  );
}
