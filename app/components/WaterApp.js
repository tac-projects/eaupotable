'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  calculateCrystalScore,
  getParameterStatus,
  PARAM_ICONS,
  RANGES,
  CENTERED_PARAMS,
  parseValue
} from '@/lib/water-utils';

export default function WaterApp({ initialCity = null }) {
  const router = useRouter();
  const [map, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [waterData, setWaterData] = useState(null);
  const [isPanelActive, setIsPanelActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [placeholder, setPlaceholder] = useState('');

  // PWA States
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPWABanner, setShowPWABanner] = useState(false);
  const [isPWAExcluded, setIsPWAExcluded] = useState(false);

  const mapContainerRef = useRef(null);
  const mapboxToken = 'pk.eyJ1IjoiY3Jhenl0YXJwZSIsImEiOiJjbW5wdDczZHQwMDc4MnJxeXN2OTMzYmFlIn0.V2B4cX82xIQntOorHu0XSA';

  const POPULAR_CITIES = [
    { name: "Paris", slug: "paris" },
    { name: "Lyon", slug: "lyon" },
    { name: "Marseille", slug: "marseille" },
    { name: "Nantes", slug: "nantes" },
    { name: "Bordeaux", slug: "bordeaux" },
    { name: "Toulouse", slug: "toulouse" }
  ];

  // 1. Animation Typewriter
  useEffect(() => {
    const texts = ["Paris, 75000", "Lyon, 69000", "Marseille, 13000", "Toulouse, 31000", "Nantes, 44000"];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeout;

    const type = () => {
      const currentText = texts[textIndex];
      if (isDeleting) {
        setPlaceholder(currentText.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setPlaceholder(currentText.substring(0, charIndex + 1));
        charIndex++;
      }

      let speed = isDeleting ? 50 : 100;

      if (!isDeleting && charIndex === currentText.length) {
        isDeleting = true;
        speed = 2000; // Pause at end
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        speed = 500;
      }

      timeout = setTimeout(type, speed);
    };

    type();
    return () => clearTimeout(timeout);
  }, []);

  // 2. Logique PWA
  useEffect(() => {
    // Vérification de l'exclusion
    const exclusionDate = localStorage.getItem('pwa-banner-excluded');
    if (exclusionDate && new Date().getTime() < parseInt(exclusionDate)) {
      setIsPWAExcluded(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // On force l'affichage pour le test (on ignore l'exclusion localStorage temporairement)
      setTimeout(() => {
        setShowPWABanner(true);
      }, 5000);
    };


    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPWABanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismissPWABanner = () => {
    setShowPWABanner(false);
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const expiryDate = new Date().getTime() + sevenDaysInMs;
    localStorage.setItem('pwa-banner-excluded', expiryDate.toString());
  };

  // 3. Mapbox Init
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = mapboxToken;
    const m = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [2.2137, 46.2276],
      zoom: 5.0,
      projection: 'globe'
    });

    m.on('style.load', () => { m.setFog({}); });
    m.on('load', () => {
      const layers = m.getStyle().layers;
      for (let layer of layers) {
        if (layer.layout && layer.layout['text-field']) {
          m.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name_fr'], ['get', 'name']]);
        }
      }
      setMap(m);
    });

    m.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      m.getCanvas().style.cursor = 'wait';
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=place&country=FR&language=fr&limit=1`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.features?.length > 0) { handleSearchSelection(data.features[0]); }
      } finally {
        m.getCanvas().style.cursor = 'pointer';
      }
    });

    return () => m.remove();
  }, []);

  // 4. City Zoom Effect
  useEffect(() => {
    if (!map || !initialCity) return;
    const fetchAndZoom = async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(initialCity)}.json?access_token=${mapboxToken}&country=FR&types=place&language=fr&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features?.length > 0) {
          const feature = data.features[0];
          map.flyTo({ center: feature.center, zoom: 13, essential: true });
          // On ne remplit pas searchQuery pour laisser le placeholder animé tourner
          fetchWaterData(feature.text);
        }
      } catch (err) { console.error("Zoom error", err); fetchWaterData(initialCity); }
    };
    fetchAndZoom();
  }, [map, initialCity]);

  const handleSearchSelection = async (feature) => {
    setSearchQuery(""); // On vide la barre pour laisser le placeholder animé
    setSuggestions([]);
    const cityName = feature.text;
    const slug = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    router.push(`/ville/${slug}`, { scroll: false });
    setSelectedCity(cityName);
    setIsLoading(true);
  };

  const fetchWaterData = async (cityName) => {
    setIsPanelActive(false);
    setTimeout(() => { setIsPanelActive(true); }, 400);


    try {
      const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&size=3000`;
      const response = await fetch(url);
      const data = await response.json();
      if (!data.data || data.data.length === 0) {
        setWaterData({ error: `Aucune donnée Hub'Eau pour ${cityName}.` });
        return;
      }
      const reports = data.data;
      reports.sort((a, b) => new Date(b.date_prelevement) - new Date(a.date_prelevement));

      const getParam = (codes, keywords, requiredUnits = []) => {
        const match = reports.find(r => {
          const unit = (r.libelle_unite || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const label = (r.libelle_parametre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const code = `${r.code_parametre}`;
          if ((unit.includes("°") && !unit.includes("°f")) || unit.includes("deg") || label.includes("temp") || label.includes("t°")) return false;
          if (requiredUnits.length > 0) {
            const hasRequiredUnit = requiredUnits.some(ru => unit.includes(ru.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
            if (!hasRequiredUnit) return false;
          }
          const isCodeMatch = codes.some(c => code === `${c}`);
          const isWordMatch = keywords.some(kw => {
            const lowKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (lowKw.length <= 3) {
              const regex = new RegExp(`\\b${lowKw}\\b`, 'i');
              return regex.test(label) || (lowKw === 'ph' && label.includes('potentiel hydrogene'));
            }
            return label.includes(lowKw);
          });
          return (isCodeMatch || isWordMatch) && (r.resultat_numerique !== null || r.resultat_alphanumerique !== null);
        });
        if (!match) return null;
        const rawVal = (match.resultat_alphanumerique && match.resultat_alphanumerique !== "null") ? match.resultat_alphanumerique : match.resultat_numerique;
        return {
          val: rawVal !== null ? `${rawVal}` : '--',
          unit: match.libelle_unite?.replace(/\(.*\)/g, '').replace('unité ', '').trim() || '',
          date: new Date(match.date_prelevement).toLocaleDateString('fr-FR'),
          label: match.libelle_parametre
        };
      };

      const stats = {
        nitrates: getParam([1340, 1342], ["nitrate"]),
        ph: getParam([1301, 1302], ["ph", "potentiel hydrogene"], ["ph"]),
        hardness: getParam([1345], ["hydrotimetrique", "durete", "calcaire", "th", "titre"]),
        chlorine: getParam([1399], ["chlore libre", "chlore total"]),
        conductivity: getParam([1302, 1303], ["conductivite"], ["µS", "siemens", "us/cm"]),
        turbidity: getParam([1305], ["turbidite", "turb"]),
        iron: getParam([1393, 1374], ["fer total", "fer dissous"]),
        manganese: getParam([1394, 1373], ["manganese"]),
        pesticides: getParam([1107, 1667, 6272, 6273, 6274, 6275, 6276, 6277], ["pesticide"]),
        ammonium: getParam([1331], ["ammonium"]),
        copper: getParam([1392], ["cuivre"]),
        cot: getParam([1341], ["organique total", "cot"])
      };

      const conclusion = reports[0].conclusion_conformite_prelevement || "";
      const isConform = conclusion.toLowerCase().includes("conforme") && !conclusion.toLowerCase().includes("non conforme");
      const crystal = calculateCrystalScore(stats, isConform);
      setWaterData({ stats, isConform, crystal, meta: reports[0], cityName });
    } catch (error) { console.error("Erreur API:", error); setWaterData({ error: "Erreur technique." }); } finally { setIsLoading(false); }
  };

  const onSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length < 3) { setSuggestions([]); return; }
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${mapboxToken}&country=FR&types=place,postcode&language=fr&limit=5`;
    const res = await fetch(url);
    const data = await res.json();
    setSuggestions(data.features || []);
  };

  const geolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=place&language=fr&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features?.length > 0) { handleSearchSelection(data.features[0]); }
    });
  };

  return (
    <main>
      <section id="map-section">
        <div id="map" ref={mapContainerRef}></div>

        {/* Bandeau d'installation PWA */}
        {showPWABanner && (
          <div id="install-banner" className={`install-banner ${showPWABanner ? 'visible' : ''} ${isPanelActive ? 'with-panel' : ''}`}>
            <div className="install-content">
              <img src="/img/icons/icon-512-v3.png" alt="App Icon" className="install-icon" />
              <div className="install-text">

                <p><strong>EauPotable.net</strong></p>
                <span>Installer l'application sur votre écran</span>
              </div>
              <div className="install-actions">
                <button className="btn-install-primary" onClick={handleInstallClick}>Installer</button>
                <button className="btn-install-close" onClick={dismissPWABanner}>×</button>
              </div>
            </div>
          </div>
        )}

        {/* Barre de recherche */}
        <div className={`search-floating bottom-search ${showPWABanner ? 'pwa-active' : ''} ${isPanelActive ? 'with-panel' : ''}`}>
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
              <button className="clear-search visible" onClick={() => { setSearchQuery(''); setSuggestions([]); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
            <button className="geolocate-btn" onClick={geolocate}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </button>
          </div>

          <div className={`search-results ${isSearchFocused && (suggestions.length > 0 || !searchQuery) ? 'active' : ''}`}>
            {!searchQuery && !selectedCity && (
              <div className="popular-cities-list">
                <p style={{ padding: '10px 20px', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-light)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Villes populaires</p>
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

        <div id="side-panel" className={`side-panel ${isPanelActive ? 'active' : ''}`}>
          <button className="close-panel" onClick={() => setIsPanelActive(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div id="panel-content">
            {waterData ? (
              waterData.error ? (<div style={{ padding: '2rem', textAlign: 'center' }}>{waterData.error}</div>) : (<WaterReport data={waterData} />)
            ) : (
              <div className="skeleton-container">
                <div className="vignette-hero"><div className="skeleton" style={{ position: 'absolute', inset: 0 }}></div></div>
                <div style={{ marginTop: '2rem', padding: '0 2rem' }}>
                  <div className="skeleton" style={{ width: '100%', height: '45px', borderRadius: '100px', marginBottom: '2.5rem' }}></div>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
                      <div style={{ flex: 1 }}><div className="skeleton" style={{ width: '70%', height: '12px', marginBottom: '8px' }}></div><div className="skeleton" style={{ width: '40%', height: '8px' }}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function WaterReport({ data }) {
  const { cityName, crystal, stats, isConform, meta } = data;
  const nomReseau = meta.nom_distributeur || meta.nom_reseau || "Réseau Municipal";
  let scoreClass = (crystal.final < 5) ? "status-critical" : (crystal.final < 8) ? "status-warning" : (crystal.final < 8.5) ? "status-good" : "status-excellent";

  const paramsList = [
    { name: "Microbiologie", key: "bacteria", data: { val: "Absence", unit: "", date: new Date(meta.date_prelevement).toLocaleDateString('fr-FR') } },
    { name: "Nitrates", key: "nitrates", data: stats.nitrates },
    { name: "Calcaire", key: "hardness", data: stats.hardness },
    { name: "Acidité (pH)", key: "ph", data: stats.ph },
    { name: "Conductivité", key: "cond", data: stats.conductivity },
    { name: "Chlore Libre", key: "chlorine", data: stats.chlorine },
    { name: "Turbidité", key: "turb", data: stats.turbidity },
    { name: "Pesticides", key: "pesticides", data: stats.pesticides },
  ];

  return (
    <>
      <div className="vignette-hero">
        <div className="hero-bg" style={{ backgroundImage: "url('/img/vignette-bg.png')" }}></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-score-card"><div className="hero-score-val">{crystal.final}/10</div><div className={`hero-status-badge ${scoreClass}`}>{crystal.label}</div></div>
          <div className="hero-footer"><h2 className="hero-city">{cityName}</h2><div className="hero-network">{nomReseau}</div></div>
        </div>
      </div>
      <div className="report-content" style={{ padding: '0 1.5rem 2rem' }}>
        <div className="report-section" style={{ marginTop: '2rem' }}><div className="section-header"><span>Analyse détaillée</span></div>
          {paramsList.map((p, i) => (<ParameterRow key={i} parameter={p} />))}
        </div>
        <div className="report-footer" style={{ marginTop: '2rem' }}><div className={`legal-badge ${isConform ? 'legal-ok' : 'legal-ko'}`}><span>Conformité : <strong>{isConform ? 'CONFORME' : 'NON CONFORME'}</strong></span></div></div>
      </div>
    </>
  );
}

function ParameterRow({ parameter }) {
  const [isOpen, setIsOpen] = useState(false);
  const { name, key, data } = parameter;
  const status = getParameterStatus(key, data?.val);
  const range = RANGES[key];
  const val = parseValue(data?.val);
  const isCentered = CENTERED_PARAMS.includes(key);

  let pos = 50;
  if (key === "bacteria") { pos = (status.status === "perfect") ? 10 : 90; }
  else if (range && val && !isNaN(val)) {
    if (isCentered) {
      const [c1, w1, g1, g2, w2, c2] = range;
      if (val <= g1) pos = 25; else if (val >= g2) pos = 75; else pos = 50;
    } else {
      const [b1, b2, b3] = range;
      if (val <= b1) pos = 15; else if (val <= b2) pos = 45; else if (val <= b3) pos = 75; else pos = 90;
    }
  }

  return (
    <div className="yuka-row-wrapper">
      <div className="yuka-row" onClick={() => setIsOpen(!isOpen)}>
        <div className="yuka-icon" dangerouslySetInnerHTML={{ __html: PARAM_ICONS[key] }} />
        <span className="yuka-name">{name}</span>
        <div className="yuka-val">{data?.val || '--'} <small>{data?.unit || ''}</small></div>
        <div className={`yuka-dot-small ${status.class}`}></div>
        <svg style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }} className="yuka-toggle-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        <span className="yuka-subtitle">{status.subtitle}</span>
      </div>
      {isOpen && (
        <div className="yuka-details active">
          <div className="yuka-range-container">
            <div className={`yuka-range-bar ${isCentered ? 'centered' : 'linear'}`} style={{ '--marker-pos': `${pos}%`, '--marker-color': `var(--${status.class})` }}>
              <div className="yuka-marker"></div>
            </div>
            <div className="yuka-date-info" style={{ marginTop: '10px', fontSize: '0.7rem', opacity: 0.6 }}>Analyse du {data?.date || 'N/A'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
