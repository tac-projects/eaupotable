'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  calculateCrystalScore,
  getParameterStatus,
  harvestWaterData,
  PARAM_ICONS,
  RANGES,
  CENTERED_PARAMS,
  parseValue,
  POPULAR_CITIES
} from '@/lib/water-utils';

// Imports normaux pour SSR et LCP optimal
// Imports dynamiques pour réduire le bundle initial et le TBT
const CitySEOContent = dynamic(() => import('./CitySEOContent'), { ssr: true });
const HomeLanding = dynamic(() => import('./HomeLanding'), { ssr: true });

// WaterReport dynamique (lourd, non critique au LCP)
const WaterReport = dynamic(() => import('./WaterReport'), { ssr: false });


export default function WaterApp({ initialCity = null, initialData = null }) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [waterData, setWaterData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData && !!initialCity);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // PWA States
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showPWABanner, setShowPWABanner] = useState(false);
  const [isPWAExcluded, setIsPWAExcluded] = useState(false);

  // Sharing States
  const [showShareFab, setShowShareFab] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkPWAStatus = () => {
      const isExcluded = localStorage.getItem('pwa-banner-excluded');
      const now = new Date().getTime();
      if (isExcluded && now < parseInt(isExcluded)) return false;

      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator && window.navigator.standalone);
      if (isStandalone) return false;

      return true;
    };

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (checkPWAStatus()) {
        setTimeout(() => {
          setShowPWABanner(true);
        }, 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Affichage intelligent (respecte le status et le localStorage)
    let smartTimer;
    if (!selectedCity && checkPWAStatus()) {
      smartTimer = setTimeout(() => {
        setShowPWABanner(true);
      }, 5000); // Un peu plus de délai pour ne pas agresser au chargement
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (smartTimer) clearTimeout(smartTimer);
    };
  }, [selectedCity]);

  // 3. Logique de Partage & FAB
  const buildShareData = () => {
    // Page d'accueil (aucune ville) ou erreur fetch : partage générique du site
    if (!waterData || !waterData.crystal || !selectedCity) {
      return {
        title: "EauPotable.net — Qualité de l'eau en France",
        text: "Découvrez la qualité de l'eau du robinet de votre ville : calcaire, nitrates, PFAS et prix, grâce au Crystal Score™ sur EauPotable.net.",
        url: window.location.href
      };
    }
    // Page ville : partage spécifique au rapport
    return {
      title: `Qualité de l'eau à ${selectedCity}`,
      text: `L'eau de ${selectedCity} est notée ${waterData.crystal.final.toFixed(1)}/10 sur EauPotable.net. Découvrez l'analyse complète !`,
      url: window.location.href
    };
  };

  const handleShare = async () => {
    const shareData = buildShareData();
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Lien copié dans le presse-papier !");
      }
    } catch (err) { console.log("Partage annulé ou erreur:", err); }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowShareFab(true);
      else setShowShareFab(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPWABanner(false);
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      const expiryDate = new Date().getTime() + threeDaysInMs;
      localStorage.setItem('pwa-banner-excluded', expiryDate.toString());
    }
    setDeferredPrompt(null);
  };

  const dismissPWABanner = () => {
    setShowPWABanner(false);
    setDeferredPrompt(null);
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const expiryDate = new Date().getTime() + threeDaysInMs;
    localStorage.setItem('pwa-banner-excluded', expiryDate.toString());
  };

  // 4. City initial data fetch
  useEffect(() => {
    if (!initialCity || initialData) return;
    fetchWaterData(initialCity);
  }, [initialCity, initialData]);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  const handleSearchSelection = async (feature) => {
    setSearchQuery(""); // On vide la barre pour laisser le placeholder animé
    setSuggestions([]);
    const slug = feature.slug;
    const cityName = feature.text;
    
    // On retire { scroll: false } pour permettre le scroll auto de Next.js
    // Et on force window.scrollTo(0,0) pour être certain d'arriver en haut (évite le glitch si le composant est persistent)
    router.push(`/ville/${slug}`);
    window.scrollTo(0, 0);
    
    setSelectedCity(cityName);
    setIsLoading(true);
  };

  const fetchWaterData = async (cityName) => {
    setIsLoading(true);
    setWaterData(null);
    try {
      const data = await harvestWaterData(cityName);
      if (!data) {
        setWaterData({ error: `Aucune donnée Hub'Eau pour ${cityName}.` });
        return;
      }
      setWaterData(data);
    } catch (err) {
      setWaterData({ error: "Erreur de connexion aux serveurs Hub'Eau." });
    } finally {
      setIsLoading(false);
    }
  };

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
        console.error("Search error:", err);
      }
    };

    const handler = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const onSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const geolocate = () => {
    // Géolocalisation désactivée car elle dépendait de Mapbox.
    alert("La géolocalisation est temporairement indisponible.");
  };

  return (
    <main>
      {/* 2. PWA Install Banner - Toujours disponible si activée */}
      {showPWABanner && (
        <div id="install-banner" className={`install-banner visible ${isScrolled ? 'scrolled' : ''}`}>
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
              <button className="btn-install-close" onClick={dismissPWABanner}>✕</button>
            </div>
          </div>
        </div>
      )}



      {/* Section SEO dynamique : Rapport Ville ou Home Landing */}
      {selectedCity ? (
        <div className="city-page-content">
          <CitySEOContent cityName={selectedCity} data={waterData} />
        </div>
      ) : (
        <HomeLanding 
          onCitySelect={(city) => handleSearchSelection({ text: city.name, slug: city.slug })}
          searchProps={{
            searchQuery,
            suggestions,
            isSearchFocused,
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
        className={`floating-share-fab ${showShareFab && !showPWABanner ? 'visible' : ''}`}
        onClick={handleShare}
        aria-label={selectedCity ? 'Partager ce rapport' : 'Partager EauPotable.net'}
      >
        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>
      </button>
    </main>
  );
}

