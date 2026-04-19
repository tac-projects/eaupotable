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
  parseValue,
  POPULAR_CITIES
} from '@/lib/water-utils';
import CitySEOContent from './CitySEOContent';
import HomeLanding from './HomeLanding';
import WaterReport from './WaterReport';

const mapboxToken = 'pk.eyJ1IjoiY3Jhenl0YXJwZSIsImEiOiJjbW5wdDczZHQwMDc4MnJxeXN2OTMzYmFlIn0.V2B4cX82xIQntOorHu0XSA';

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
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showPWABanner, setShowPWABanner] = useState(false);
  const [isPWAExcluded, setIsPWAExcluded] = useState(false);

  // Sharing States
  const [showShareFab, setShowShareFab] = useState(false);

  const mapContainerRef = useRef(null);
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

  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      // Si on scrolle plus de 100px, on passe en mode "bas de page"
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // On attend aussi 5s ici pour ne pas court-circuiter le délai design
      setTimeout(() => {
        setShowPWABanner(true);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // FORÇAGE TOTAL POUR TEST DESIGN (ignore le localStorage)
    let forceTimer;
    if (!selectedCity) {
      forceTimer = setTimeout(() => {
        setShowPWABanner(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (forceTimer) clearTimeout(forceTimer);
    };
  }, [selectedCity]);

  // 3. Logique de Partage & FAB
  const handleShare = async () => {
    if (!waterData) return;
    const shareData = {
      title: `Qualité de l'eau à ${selectedCity}`,
      text: `L'eau de ${selectedCity} est notée ${waterData.crystal.final}/10 sur EauPotable.net. Découvrez l'analyse complète !`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Lien copié dans le presse-papier !");
      }
    } catch (err) { console.log("Partage annulé ou erreur:", err); }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isPanelActive && window.scrollY > 300) setShowShareFab(true);
      else setShowShareFab(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPanelActive]);

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
      projection: 'globe',
      interactive: false
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

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  const handleSearchSelection = async (feature) => {
    setSearchQuery(""); // On vide la barre pour laisser le placeholder animé
    setSuggestions([]);
    const cityName = feature.text;
    const slug = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    
    // On retire { scroll: false } pour permettre le scroll auto de Next.js
    // Et on force window.scrollTo(0,0) pour être certain d'arriver en haut (évite le glitch si le composant est persistent)
    router.push(`/ville/${slug}`);
    window.scrollTo(0, 0);
    
    setSelectedCity(cityName);
    setIsLoading(true);
  };

  const fetchWaterData = async (cityName) => {
    setIsPanelActive(false);
    setTimeout(() => { setIsPanelActive(true); }, 400);


    try {
      const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&size=5000`;
      const response = await fetch(url);
      const data = await response.json();
      if (!data.data || data.data.length === 0) {
        setWaterData({ error: `Aucune donnée Hub'Eau pour ${cityName}.` });
        return;
      }
      let reports = data.data;
      
      // Filtrage intelligent : pour les grandes villes, on accepte les arrondissements
      const cleanTarget = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, ' ');
      const exactMatch = reports.filter(r => {
        const c = r.nom_commune.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, ' ');
        // Pour les grandes métropoles, on accepte tout ce qui commence par le nom (Lyon 01, Paris 75...)
        // On évite ainsi "Le Touquet Paris Plage" pour "Paris"
        const metropoles = ['lyon', 'paris', 'marseille', 'bordeaux', 'toulouse', 'nantes', 'lille', 'montpellier'];
        if (metropoles.includes(cleanTarget)) {
          return c === cleanTarget || c.startsWith(cleanTarget + " ") || c.startsWith(cleanTarget + "-");
        }
        return c === cleanTarget || c.startsWith(cleanTarget + " ");
      });

      if (exactMatch.length > 0) {
        reports = exactMatch;
      }

      reports.sort((a, b) => new Date(b.date_prelevement) - new Date(a.date_prelevement));

      const getParam = (codes, keywords, requiredUnits = []) => {
        const match = reports.find(r => {
          const unit = (r.libelle_unite || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const label = (r.libelle_parametre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const code = `${r.code_parametre}`;
          // Filtrage spécifique : On veut tout sauf la température
          const isTemp = label.includes("temp") || label.includes("t°") || unit.includes("°c") || unit.includes("celsius");
          if (isTemp) return false;
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
        nitrates: getParam([1340, 1342], []), 
        ph: getParam([1301, 1302], ["ph", "potentiel hydrogene"], ["ph"]),
        hardness: getParam([1345, 2708], ["hydrotimetrique", "durete", "th"]),
        chlorine: getParam([1399, 1398], ["chlore libre", "chlore total"]),
        conductivity: getParam([1302, 1303], ["conductivite"], ["µS", "siemens", "us/cm"]),
        turbidity: getParam([1305], ["turbidite", "turb"]),
        iron: getParam([1393, 1374], ["fer total", "fer dissous"]),
        manganese: getParam([1394, 1373], ["manganese"]),
        pesticides: getParam([1107, 1667, 6272, 6273, 6274, 6275, 6276, 6277, 6278, 6279, 6280, 7150], ["pesticide"]),
        pfas: getParam([7149, 7148, 8194], ["pfas", "perfluoro"]),
        microbiology: getParam([1321, 1322], ["escherichia", "enterocoques", "coliformes"]),
        ammonium: getParam([1331, 1335], ["ammonium"]),
        copper: getParam([1392], ["cuivre"]),
        cot: getParam([1341], ["organique total", "cot"])
      };

      const conclusion = reports[0].conclusion_conformite_prelevement || "";
      const isConform = conclusion.toLowerCase().includes("conforme") && !conclusion.toLowerCase().includes("non conforme");
      
      // Fallback Réseau "Mémoire Longue" (Sniper Zéro Vide Multi-Réseaux)
      const allReseauCodes = [...new Set(reports.flatMap(r => r.reseaux?.map(res => res.code) || []))].filter(Boolean);
      
      if (allReseauCodes.length > 0) {
          const reseauQuery = allReseauCodes.join(',');
          const paramsToFetch = [];
          const missingKeys = [];
          
          const fallbackConfig = {
              nitrates: "1340,1342",
              ph: "1301,1302",
              hardness: "1345,2708",
              chlorine: "1399,1398",
              conductivity: "1302,1303",
              turbidity: "1305",
              iron: "1393,1374",
              manganese: "1394,1373",
              pesticides: "1107,1667,6272,6273,6274,6275,6276,6277,6278,6279,6280,7150",
              pfas: "7149,7148,8194,5980,6542,8738,6561,8740,6549,6025,8742",
              bacteria: "1321,1322",
              ammonium: "1331,1335",
              copper: "1392",
              cot: "1341"
          };

          for (let key of Object.keys(fallbackConfig)) {
              if (!stats[key] || stats[key].val === '--') {
                  paramsToFetch.push(fallbackConfig[key]);
                  missingKeys.push(key);
              }
          }

          if (missingKeys.length > 0) {
              try {
                  await Promise.all(missingKeys.map(async (key) => {
                      const targetCodes = fallbackConfig[key];
                      const rUrl = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_reseau=${reseauQuery}&code_parametre=${targetCodes}&size=1&sort=desc`;
                      
                      let rRes = await fetch(rUrl);
                      let rData = await rRes.json();
                      
                      // Fallback ultime par Commune si pas de données sur le réseau spécifique (pour PFAS et Pesticides Globaux)
                      if ((!rData.data || rData.data.length === 0) && selectedCity) {
                          const communeUrl = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(selectedCity)}&code_parametre=${targetCodes}&size=1&sort=desc`;
                          const cRes = await fetch(communeUrl);
                          rData = await cRes.json();
                      }
                      
                      if (rData.data && rData.data.length > 0) {
                          const match = rData.data[0];
                          const rawVal = (match.resultat_alphanumerique && match.resultat_alphanumerique !== "null") ? match.resultat_alphanumerique : match.resultat_numerique;
                          
                          if (rawVal !== null && rawVal !== undefined) {
                              stats[key] = {
                                  val: `${rawVal}`,
                                  unit: match.libelle_unite?.replace(/\(.*\)/g, '').replace('unité ', '').trim() || '',
                                  date: new Date(match.date_prelevement).toLocaleDateString('fr-FR'),
                                  label: match.libelle_parametre
                              };
                          }
                      }
                  }));
              } catch (e) {
                  console.error("Zéro-Vide Fallback error:", e);
              }
          }
      }

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

        {/* 1. Scroll Indicator - À cheval sur la coupure carte/contenu */}
          <div 
            className={`scroll-indicator ${isPanelActive ? 'scroll-with-panel' : ''}`}
            onClick={scrollToContent}
            aria-label="Descendre vers les analyses"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg>
          </div>

        {/* 2. PWA Install Banner - Uniquement si disponible et panel fermé */}
        {(deferredPrompt || showPWABanner) && (
          <div id="install-banner" className={`install-banner ${(deferredPrompt || showPWABanner) ? 'visible' : ''} ${isPanelActive ? 'banner-with-panel' : ''} ${isScrolled ? 'scrolled' : ''}`}>
            <div className="install-content">
              <img src="/img/icons/icon-512-v3.png" alt="EauPotableLogo" className="install-icon" />
              <div className="install-text">
                <p><strong>EauPotable.net</strong></p>
                <span>Application gratuite</span>
              </div>
              <div className="install-actions">
                <button className="btn-install-primary" onClick={handleInstallClick}>Installer</button>
                <button className="btn-install-close" onClick={() => { setDeferredPrompt(null); setShowPWABanner(false); }}>✕</button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Barre de recherche flottante */}
        <div className={`search-floating bottom-search ${(deferredPrompt || showPWABanner) ? 'pwa-active' : ''} ${isPanelActive ? 'search-with-panel' : ''}`}>
          <div className="search-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
            Qualité de l’eau potable à :
          </div>
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

        {/* Report Panel - Uniquement si une ville est sélectionnée ou en cours de chargement */}
        {(selectedCity || isLoading) && (
          <div id="side-panel" className={`side-panel ${isPanelActive ? 'active' : ''}`}>
            <button className="close-panel" onClick={() => setIsPanelActive(false)} aria-label="Fermer le panneau">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div id="panel-handle" className="panel-handle"></div>
            <div id="panel-content">
              {isLoading ? (
                <div className="skeleton-container" style={{ padding: '2rem' }}>
                  <div className="skeleton" style={{ width: '100%', height: '45px', borderRadius: '100px', marginBottom: '2.5rem' }}></div>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
                      <div style={{ flex: 1 }}><div className="skeleton" style={{ width: '70%', height: '12px', marginBottom: '8px' }}></div><div className="skeleton" style={{ width: '40%', height: '8px' }}></div></div>
                    </div>
                  ))}
                </div>
              ) : waterData ? (
                waterData.error ? (<div style={{ padding: '2rem', textAlign: 'center' }}>{waterData.error}</div>) : (<WaterReport data={waterData} onShare={handleShare} />)
              ) : null}
            </div>
          </div>
        )}
      </section>

      {/* Section SEO dynamique : Rapport Ville ou Home Landing */}
      {selectedCity ? (
        <CitySEOContent cityName={selectedCity} data={waterData} />
      ) : (
        <HomeLanding onCitySelect={(city) => handleSearchSelection({ text: city.name, place_name: city.name })} />
      )}

      {/* Bouton de Partage Flottant (FAB) */}
      <button 
        className={`floating-share-fab ${showShareFab ? 'visible' : ''}`}
        onClick={handleShare}
        aria-label="Partager ce rapport"
      >
        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>
      </button>
    </main>
  );
}

