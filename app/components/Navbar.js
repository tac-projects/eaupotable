'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { POPULAR_CITIES } from '@/lib/water-utils';

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  const mapboxToken = 'pk.eyJ1IjoiY3Jhenl0YXJwZSIsImEiOiJjbW5wdDczZHQwMDc4MnJxeXN2OTMzYmFlIn0.V2B4cX82xIQntOorHu0XSA';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
      setSuggestions([]);
      setIsFocused(false);
    }
  };

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${mapboxToken}&country=FR&types=place,postcode&language=fr&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) {
      console.error("Sidebar Search error:", err);
    }
  };

  const handleSelect = (feature) => {
    const cityName = feature.text;
    const slug = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    setIsOpen(false);
    setSearchQuery('');
    setSuggestions([]);
    router.push(`/ville/${slug}`);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  };

  return (
    <>
      <header className="transparent-header">
        <div className="nav-wrapper">
          <Link href="/" className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
              <path d="M12 21.5C16.1421 21.5 19.5 18.1421 19.5 14C19.5 9.85786 12 2.5 12 2.5C12 2.5 4.5 9.85786 4.5 14C4.5 18.1421 7.85786 21.5 12 21.5Z" fill="var(--primary-solid)" />
              <path d="M12 5.5C10 7.5 7.5 10.5 7.5 14" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
              <circle cx="9.5" cy="11.5" r="1.5" fill="white" opacity="0.8" />
              <path d="M11 19.5C13 19.5 16 18.5 17 16" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
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

      <div className={`menu-overlay ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)}></div>

      <div id="main-menu" className={`main-menu ${isOpen ? 'active' : ''}`}>
        <button id="close-menu" className="close-menu" aria-label="Fermer le menu" onClick={() => setIsOpen(false)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <Link href="/" className="logo-menu" onClick={() => setIsOpen(false)}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-menu-icon">
            <path d="M12 21.5C16.1421 21.5 19.5 18.1421 19.5 14C19.5 9.85786 12 2.5 12 2.5C12 2.5 4.5 9.85786 4.5 14C4.5 18.1421 7.85786 21.5 12 21.5Z" fill="var(--primary-solid)" />
            <path d="M12 5.5C10 7.5 7.5 10.5 7.5 14" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
            <circle cx="9.5" cy="11.5" r="1.5" fill="white" opacity="0.8" />
            <path d="M11 19.5C13 19.5 16 18.5 17 16" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
          </svg>
          EauPotable.net
        </Link>

        <div className="menu-search-wrapper">
          <div className="menu-search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-search-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Rechercher une ville..." 
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && suggestions.length > 0) { handleSelect(suggestions[0]); }
              }}
              className="menu-search-input"
            />
          </div>
          {isFocused && (suggestions.length > 0 || !searchQuery) && (
            <div className="menu-search-results">
              {!searchQuery && (
                <div className="menu-popular-cities">
                  <p className="menu-results-title">Villes populaires</p>
                  {POPULAR_CITIES.slice(0, 5).map(city => (
                    <div 
                      key={city.slug} 
                      className="menu-suggestion-item" 
                      onClick={() => {
                        setSearchQuery('');
                        setSuggestions([]);
                        setIsOpen(false);
                        router.push(`/ville/${city.slug}`);
                      }}
                    >
                      {city.name}
                    </div>
                  ))}
                </div>
              )}
              {suggestions.map((f, i) => (
                <div key={i} className="menu-suggestion-item" onClick={() => handleSelect(f)}>
                  <strong>{f.text}</strong> <span className="menu-suggestion-context">({f.context?.[0]?.text || ''})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <ul className="menu-items">
          <li>
            <Link href="/" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="menu-icon">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Accueil
            </Link>
          </li>
          <li>
            <Link href="/villes" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="menu-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Toutes les villes
            </Link>
          </li>
          <li>
            <Link href="/faq" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="menu-icon">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              FAQ
            </Link>
          </li>
          <li>
            <Link href="/contact" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="menu-icon">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Contact
            </Link>
          </li>
          <li>
            <Link href="/mentions-legales" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="menu-icon">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Mentions Légales
            </Link>
          </li>
        </ul>

        <div className="menu-footer">
          <p>&copy; 2026 EauPotable.net - La transparence sur votre eau</p>
        </div>
      </div>
    </>
  );
}
