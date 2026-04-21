'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  calculateCrystalScore,
  getParameterStatus,
  PARAM_ICONS,
  RANGES,
  CENTERED_PARAMS,
  parseValue,
  POPULAR_CITIES
} from '@/lib/water-utils';

// Imports normaux pour SSR et LCP optimal
import CitySEOContent from './CitySEOContent';
import HomeLanding from './HomeLanding';
import CityHero from './CityHero';

// WaterReport dynamique (lourd, non critique au LCP)
const WaterReport = dynamic(() => import('./WaterReport'), { ssr: false });

const mapboxToken = 'pk.eyJ1IjoiY3Jhenl0YXJwZSIsImEiOiJjbW5wdDczZHQwMDc4MnJxeXN2OTMzYmFlIn0.V2B4cX82xIQntOorHu0XSA';

export default function WaterApp({ initialCity = null }) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [waterData, setWaterData] = useState(null);
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

  // mapContainerRef supprimé car géré par MapBackground
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

    // On réduit le délai d'attente avant le démarrage de l'animation (500ms au lieu de 1500ms)
    const startTimeout = setTimeout(type, 500);
    setPlaceholder("Votre ville...");
    
    return () => {
      clearTimeout(timeout);
      clearTimeout(startTimeout);
    };
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
      if (window.scrollY > 300) setShowShareFab(true);
      else setShowShareFab(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  // La logique Mapbox a été déportée dans le composant dynamique MapBackground.js

  // 4. City initial data fetch
  useEffect(() => {
    if (!initialCity) return;
    fetchWaterData(initialCity);
  }, [initialCity]);

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
      {/* 2. PWA Install Banner - Toujours disponible si activée */}
      {(deferredPrompt || showPWABanner) && (
        <div id="install-banner" className={`install-banner ${(deferredPrompt || showPWABanner) ? 'visible' : ''} ${isScrolled ? 'scrolled' : ''}`}>
          <div className="install-content">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="install-icon-svg">
              <path d="M12 21.5C16.1421 21.5 19.5 18.1421 19.5 14C19.5 9.85786 12 2.5 12 2.5C12 2.5 4.5 9.85786 4.5 14C4.5 18.1421 7.85786 21.5 12 21.5Z" fill="var(--primary-solid)" />
              <path d="M12 5.5C10 7.5 7.5 10.5 7.5 14" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
              <circle cx="9.5" cy="11.5" r="1.5" fill="white" opacity="0.8" />
              <path d="M11 19.5C13 19.5 16 18.5 17 16" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
            </svg>
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



      {/* Section SEO dynamique : Rapport Ville ou Home Landing */}
      {selectedCity ? (
        <div className="city-page-content">
          <CityHero 
            cityName={selectedCity} 
            dpt={waterData?.meta?.code_departement || ''} 
            dateAnalyse={waterData?.meta ? new Date(waterData.meta.date_prelevement).toLocaleDateString('fr-FR') : ''}
            score={waterData?.crystal?.final || '--'}
            label={waterData?.crystal?.label || 'ANALYSE'}
          />

          <CitySEOContent cityName={selectedCity} data={waterData} />
        </div>
      ) : (
        <HomeLanding 
          onCitySelect={(city) => handleSearchSelection({ text: city.name, place_name: city.name })}
          searchProps={{
            searchQuery,
            suggestions,
            isSearchFocused,
            placeholder,
            onSearchChange,
            handleSearchSelection,
            setIsSearchFocused,
            setSearchQuery,
            setSuggestions,
            geolocate
          }}
        />
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

