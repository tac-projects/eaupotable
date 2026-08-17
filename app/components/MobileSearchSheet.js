'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { POPULAR_CITIES } from '@/lib/water-utils';

export default function MobileSearchSheet({ open, onClose }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSuggestions([]);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
        }
      } catch (err) {
        console.error("MobileSearchSheet error:", err);
      }
    };

    const handler = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSelect = (slug) => {
    onClose();
    router.push(`/ville/${slug}`);
    window.scrollTo(0, 0);
  };

  if (!open) return null;

  return (
    <>
      <div className="mss-overlay" onClick={onClose} aria-hidden="true"></div>
      <div className="mobile-search-sheet">
        <div className="mss-header">
        <div className="mss-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mss-search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Rechercher une ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions.length > 0) { handleSelect(suggestions[0].slug); }
            }}
            className="mss-input"
            ref={inputRef}
          />
          <button className="mss-close" onClick={onClose} aria-label="Fermer la recherche">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {isFocused && (suggestions.length > 0 || !searchQuery) && (
        <div className="mss-results">
          {!searchQuery && (
            <div className="mss-popular-cities">
              <p className="mss-results-title">Villes populaires</p>
              {POPULAR_CITIES.slice(0, 5).map(city => (
                <div
                  key={city.slug}
                  className="mss-suggestion-item"
                  onClick={() => handleSelect(city.slug)}
                >
                  {city.name}
                </div>
              ))}
            </div>
          )}
          {suggestions.map((city, i) => (
            <div key={i} className="mss-suggestion-item" onClick={() => handleSelect(city.slug)}>
              <strong>{city.text}</strong> <span className="mss-suggestion-context">({city.dpt})</span>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
