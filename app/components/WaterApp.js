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
      let reports = data.data;
      
      // Filtrage strict par nom de commune pour éviter les ambiguïtés (ex: Marseille vs Marseille-en-Beauvaisis)
      const exactMatch = reports.filter(r => 
        r.nom_commune.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, ' ') === 
        cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, ' ')
      );

      if (exactMatch.length > 0) {
        reports = exactMatch;
      }

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

      {/* Section SEO dynamique sous la carte */}
      {selectedCity && <CitySEOContent cityName={selectedCity} data={waterData} />}
    </main>
  );
}

function CitySEOContent({ cityName, data }) {
  const [deptAvg, setDeptAvg] = useState(null);

  useEffect(() => {
    if (!data || data.error || !data.meta?.code_departement) return;
    const dpt = data.meta.code_departement;
    
    // Appel discret pour récupérer les prélèvements du département
    fetch(`https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_departement=${dpt}&size=500`)
      .then(r => r.json())
      .then(res => {
        if (!res.data) return;
        const nArr = [];
        const hArr = [];
        const cArr = [];
        let conformCount = 0;
        let evaluatedCount = 0;
        res.data.forEach(r => {
          // Utilisation des champs globaux du prélèvement (avec _prelevement)
          const isPhysicoConform = r.conformite_limites_pc_prelevement === 'C';
          const isBactConform = r.conformite_limites_bact_prelevement === 'C';

          // On vérifie s'il y a au moins une donnée de conformité disponible
          if (r.conformite_limites_pc_prelevement === 'C' || r.conformite_limites_pc_prelevement === 'N') {
              evaluatedCount++;
              // L'eau est jugée conforme si les DEUX volets (PC et Bact) sont 'C'
              if (isPhysicoConform && isBactConform) conformCount++;
          }
          
          if (r.resultat_numerique === null) return;
          const lbl = (r.libelle_parametre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (lbl.includes("nitrate")) nArr.push(r.resultat_numerique);
          if (lbl.includes("hydrotimetrique") || lbl.includes("durete")) hArr.push(r.resultat_numerique);
          if (lbl.includes("chlore")) cArr.push(r.resultat_numerique);
        });
        const getAvg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;
        const total = evaluatedCount || 1;
        const avgCl = cArr.length ? (cArr.reduce((a, b) => a + b, 0) / cArr.length).toFixed(2) : null;
        setDeptAvg({ 
          nitrates: getAvg(nArr), 
          hardness: getAvg(hArr), 
          chlorine: avgCl,
          conformRate: ((conformCount / total) * 100).toFixed(0) 
        });
      }).catch(() => {});
  }, [data]);

  if (!data || data.error) return null; // We only show SEO content when we have actual data to describe

  const { crystal, stats, isConform, meta } = data;
  const nomReseau = meta.nom_distributeur || meta.nom_reseau || "Réseau Municipal";
  const dateAnalyse = new Date(meta.date_prelevement).toLocaleDateString('fr-FR');
  const dpt = meta.code_departement || "";

  // Helper func
  const getVal = (stat) => stat?.val && stat.val !== '--' ? parseFloat(stat.val.replace(',', '.')) : null;
  
  const nitrates = getVal(stats.nitrates);
  const durete = getVal(stats.hardness);
  const chlore = getVal(stats.chlorine);
  const ph = getVal(stats.ph);

  // Helper func pour le Spintax déterministe (garde la page stable pour Google mais différente par ville)
  const spin = (variants) => {
    const idx = cityName.length % variants.length;
    return variants[idx].replace(/\{cityName\}/g, cityName).replace(/\{nomReseau\}/g, nomReseau);
  };

  // 1. Synthèse (Crystal Score) avec Spintax
  let introSynthese = spin([
    `L'eau distribuée à {cityName} par le réseau {nomReseau} présente une note de qualité de ${crystal.final}/10.`,
    `Le bilan de santé de l'eau à {cityName} ({nomReseau}) affiche un score global de ${crystal.final}/10.`,
    `Concernant la zone de {cityName}, les analyses du réseau {nomReseau} révèlent une qualité d'eau notée à ${crystal.final}/10.`
  ]);
  
  let syntheseTexte = introSynthese + " ";
  if (crystal.final >= 9) {
    syntheseTexte += `C'est une eau d'une pureté exceptionnelle, parfaitement adaptée à la consommation quotidienne par tous les membres de la famille, y compris les nourrissons.`;
  } else if (crystal.final >= 7) {
    syntheseTexte += `La qualité globale est tout à fait satisfaisante. Elle respecte les normes de santé publique en vigueur, avec seulement de légères variations sur certains paramètres mineurs de confort.`;
  } else if (crystal.final >= 5) {
    const defaultText = `Bien que l'eau reste globalement propre à la consommation, son confort d'usage (goût, tartre) est impacté par certains éléments de traitement.`;
    if (durete > 25 && chlore > 0.2) {
      syntheseTexte += `Bien que l'eau reste propre à la consommation, la dureté élevée de l'eau couplée au chlore viennent peser sur son confort d'usage quotidien.`;
    } else if (chlore > 0.3) {
      syntheseTexte += `Bien que l'eau reste globalement propre à la consommation, une forte présence de chlore (ajouté pour la désinfection) vient peser sur le confort gustatif au quotidien.`;
    } else if (durete > 30) {
      syntheseTexte += `Bien que l'eau reste propre à la consommation, un taux de calcaire très élevé impacte son confort d'usage (assèchement de la peau, entartrage).`;
    } else {
      syntheseTexte += defaultText;
    }
  } else {
    syntheseTexte += `Des points de vigilance majeurs ont été soulevés lors des dernières analyses. Il est recommandé de consulter les avis locaux de votre mairie (Département ${dpt}).`;
  }

  // 1.b Ajout du comparatif départemental à la synthèse
  if (deptAvg) {
      if (nitrates !== null && deptAvg.nitrates !== null) {
          const avgN = parseFloat(deptAvg.nitrates);
          if (nitrates < avgN) {
              syntheseTexte += ` De plus, avec un taux de nitrates de seulement ${nitrates} mg/L, l'eau de ${cityName} est sensiblement plus pure que la moyenne du département ${dpt} (${avgN} mg/L).`;
          } else if (nitrates > avgN + 5) {
              syntheseTexte += ` À noter cependant que le taux de nitrates local (${nitrates} mg/L) est légèrement supérieur à la moyenne départementale (${avgN} mg/L), bien qu'il reste dans les normes.`;
          }
      }
      if (deptAvg.conformRate) {
          syntheseTexte += ` Globalement, le département ${dpt} affiche un taux de conformité sanitaire de ${deptAvg.conformRate}%, une dynamique dans laquelle ${cityName} s'inscrit pleinement.`;
      }
  }

  // 2. Dossier Calcaire
  let calcaireTitre = spin([
    "Teneur en Calcaire",
    "Qualité de l'eau et Calcaire",
    "Dureté de l'eau à {cityName}"
  ]);

  let calcaireTexte = spin([
    `Les dernières analyses montrent une dureté normale pour {cityName}. Vos appareils électroménagers ne nécessitent pas de traitement anti-calcaire agressif.`,
    `À {cityName}, le Titre Hydrotimétrique est équilibré. L'eau ne présente pas de risque majeur d'entartrage précoce pour votre plomberie.`,
    `L'équilibre minéral de {cityName} est satisfaisant. La douceur de l'eau préserve nativement vos installations des dépôts de tartre.`
  ]);

  if (durete && durete > 30) {
    calcaireTitre = spin(["Une eau très calcaire (dure)", "Alerte Calcaire à {cityName}", "Forte dureté de l'eau"]);
    calcaireTexte = spin([
      `L'eau de {cityName} affiche une dureté importante (supérieure à 30°f). Si le calcium est excellent pour votre santé locale, le tartre menace vos appareils.`,
      `Le réseau {nomReseau} distribue une eau chargée en calcaire. Un entretien régulier de vos cafetières et chauffe-eau est recommandé à {cityName}.`,
      `Avec plus de 30°f, la dureté de l'eau à {cityName} impose une vigilance sur l'entartrage de vos résistances électriques.`
    ]);
  } else if (durete && durete < 15) {
    calcaireTitre = spin(["Une eau plutôt douce", "Douceur de l'eau à {cityName}", "Faible taux de calcaire"]);
    calcaireTexte = spin([
      `Avec sa faible dureté, l'eau s'écoulant de vos robinets à {cityName} protège nativement votre électroménager du calcaire redouté.`,
      `Bonne nouvelle pour les habitants de {cityName} : l'eau est douce, ce qui permet de réduire la dose de savon et de protéger sa peau.`,
      `À {cityName}, la minéralité est légère. L'absence de calcaire marqué est un atout précieux pour la longévité de vos appareils.`
    ]);
  }

  if (deptAvg && durete !== null && deptAvg.hardness !== null) {
      const avgC = parseFloat(deptAvg.hardness);
      if (durete < avgC - 2) {
          calcaireTexte += ` C'est une excellente nouvelle : avec ${durete}°f, l'eau d'ici est moins calcaire que la moyenne du département (${avgC}°f).`;
      } else if (durete > avgC + 2) {
          calcaireTexte += ` Pour information, avec ${durete}°f, elle est plus concentrée en calcaire que la moyenne départementale (${avgC}°f).`;
      } else {
          calcaireTexte += ` À noter que ce taux de ${durete}°f est parfaitement dans la moyenne du département (${avgC}°f).`;
      }
  }

  // 3. Chlore & Goût
  let chloreTitre = "Conseils de dégustation";
  let chloreTexte = `Pour libérer tous les arômes de votre eau, placez-la toujours en carafe ouverte au réfrigérateur environ 20 minutes avant de la consommer. Le léger résidu de chlore réglementaire s'évaporera naturellement.`;
  if (chlore && chlore > 0.3) {
    chloreTitre = "Atténuer le goût de chlore";
    chloreTexte = `Afin de garantir une désinfection totale le long du réseau de ${nomReseau}, une dose de chlore légèrement perceptible est ajoutée. Si l'eau a un goût au robinet, l'astuce de la rondelle de citron ou de la conservation en carafe de verre au réfrigérateur fera des miracles à ${cityName}.`;
  } else if (chlore && chlore <= 0.1) {
    chloreTitre = "Une eau au goût neutre";
    chloreTexte = `Grâce à un réseau optimisé, le taux de chlore résiduel à ${cityName} est extrêmement faible. Cela garantit une eau au goût quasi-neutre tout en préservant une qualité bactériologique impeccable.`;
  }
  // 4. Origine & Environnement avec Spintax Structurel
  let bassin = dpt ? `(Département ${dpt})` : "de la région";
  let origineIntro = spin([
    `Bien que les données géographiques exactes du captage soient spécifiques à chaque quartier, l'eau distribuée dans le secteur de {cityName} ${bassin} provient principalement d'eaux souterraines ou de cours d'eau régionaux hautement surveillés.`,
    `Le captage qui alimente {cityName} ${bassin} puise sa ressource dans des nappes phréatiques ou des rivières de proximité faisant l'objet d'un suivi environnemental constant de la part de {nomReseau}.`,
    `À {cityName}, l'approvisionnement en eau potable repose sur un maillage de forages et de stations de pompage {bassin} garantissant une continuité de service pour tous les foyers.`
  ]);

  let origineTexte = `${origineIntro} \n\nAvant d'arriver à votre robinet, cette eau brute traverse un réseau d'infrastructures de traitement complexes : décantation, filtration sur sable, ozonation et ajout sécurisé de chlore pour prévenir toute contamination bactériologique dans la tuyauterie. \n\nLes installations qui desservent {cityName} sont soumises à des audits stricts pilotés par l'Agence Régionale de Santé (ARS), garantissant que l'impact environnemental local est minimisé tout en fournissant une eau sécurisée à la demande.`;

  let filterReason = "";
  if (durete > 25 && chlore > 0.2) filterReason = "la dureté de l'eau (niveau de calcaire) et la présence résiduelle de chlore";
  else if (durete > 25) filterReason = "la dureté importante de l'eau (tartre/calcaire)";
  else if (chlore > 0.2) filterReason = "la présence résiduelle de chlore (goût de javel)";
  else filterReason = "le confort gustatif souhaité";

  // 5. FAQ Dynamique
  let faqItems = [
    {
      q: `Peut-on boire l'eau du robinet à ${cityName} tous les jours ?`,
      a: crystal.final >= 6 ? `Oui, absolument. Les résultats des analyses montrent une excellente conformité avec les normes sanitaires françaises. L'eau de ${cityName} peut être consommée quotidiennement comme principale source d'hydratation sans risque pour un adulte en bonne santé.` : `L'eau respecte globalement les normes, mais au vu des récents paramètres, il est conseillé de surveiller les annonces de la mairie ou d'utiliser un système de filtration pour un usage quotidien intensif.`
    },
    {
      q: `Faut-il acheter de l'eau en bouteille ou un filtre à ${cityName} ?`,
      a: (durete > 25 || chlore > 0.2) ? `Au vu de ${filterReason}, utiliser une carafe filtrante classique peut considérablement améliorer le confort gustatif de vos boissons chaudes (thé, café) à ${cityName}. Cependant, sur le strict plan sanitaire, l'eau en bouteille n'est pas une obligation scientifique pour la santé.` : `Non, l'eau de ${cityName} présente d'excellentes caractéristiques de base. L'eau en bouteille (qui coûte 100 à 300 fois plus cher et génère polution plastique) n'apportera pas de bénéfice sanitaire supplémentaire pour la santé.`
    },
    {
      q: `L'eau de ${cityName} convient-elle aux nourrissons ?`,
      a: (nitrates && nitrates < 10) ? `Oui. Le taux de nitrates y est remarquablement bas (moins de 10 mg/L), ce qui respecte largement les recommandations pédiatriques les plus strictes pour la préparation des biberons des tout-petits.` : `Il est recommandé de vérifier les taux précis via la mairie avant de préparer systématiquement des biberons. Dans le doute, l'usage d'une eau en bouteille spécifique ("Convient pour la préparation des aliments des nourrissons") reste la norme pour les nouveau-nés de moins de 6 mois.`
    }
  ];

  return (
    <section className="seo-section">
      {/* JSON-LD Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://eaupotable.net/" },
                  { "@type": "ListItem", "position": 2, "name": "France", "item": "https://eaupotable.net/villes" },
                  { "@type": "ListItem", "position": 3, "name": `Département ${dpt}`, "item": `https://eaupotable.net/departement/${dpt}` },
                  { "@type": "ListItem", "position": 4, "name": cityName }
                ]
              },
              {
                "@type": "FAQPage",
                "mainEntity": faqItems.map(item => ({
                  "@type": "Question",
                  "name": item.q,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": item.a
                  }
                }))
              }
            ]
          })
        }}
      />

      <div className="seo-container">
        
        {/* Fil d'Ariane SEO */}
        <nav className="seo-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Accueil</a>
          <span className="sep">›</span>
          <a href="/villes">France</a>
          <span className="sep">›</span>
          <a href={`/departement/${dpt}`}>Département {dpt}</a>
          <span className="sep">›</span>
          <span className="curr">{cityName}</span>
        </nav>

        <div className="seo-header">
          <h1 className="seo-title">Rapport détaillé de l'eau à {cityName}</h1>
          <p className="seo-subtitle">Analyse experte basée sur le prélèvement officiel du <strong>{dateAnalyse}</strong></p>
        </div>

        {/* 1. SECTION VERDICT : Bilan & Comparaison */}
        <section className="seo-section-block">
          <h2 className="seo-section-title">🩺 Bilan de Santé Publique : {crystal.final}/10</h2>
          <div className="seo-expertise-block">
            {deptAvg && (
              <div className="seo-comparison-summary">
                <div className="summary-table-wrapper">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Indicateur</th>
                        <th className="col-highlight">À {cityName}</th>
                        <th>Moyenne {dpt}</th>
                        <th className="hide-mobile">Tendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Conformité</strong></td>
                        <td className="col-highlight">{isConform ? '✅ 100%' : '⚠️ Alerte'}</td>
                        <td>{deptAvg.conformRate}%</td>
                        <td className="hide-mobile">
                          <span className={`seo-badge ${isConform ? 'badge-success' : 'badge-warn'}`}>
                            {isConform ? 'Standard' : 'Alerte'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Nitrates</strong></td>
                        <td className="col-highlight">{nitrates || '--'} mg/L</td>
                        <td>{deptAvg.nitrates || '--'} mg/L</td>
                        <td className="hide-mobile">
                          <span className={`seo-badge ${nitrates < parseFloat(deptAvg.nitrates) ? 'badge-success' : 'badge-warn'}`}>
                            {nitrates < parseFloat(deptAvg.nitrates) ? 'Excellente' : 'Vigilance'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Calcaire</strong></td>
                        <td className="col-highlight">{durete || '--'} °f</td>
                        <td>{deptAvg.hardness || '--'} °f</td>
                        <td className="hide-mobile">
                          <span className={`seo-badge ${durete < parseFloat(deptAvg.hardness) ? 'badge-success' : 'badge-warn'}`}>
                            {durete < parseFloat(deptAvg.hardness) ? 'Plus douce' : 'Plus dure'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Chlore</strong></td>
                        <td className="col-highlight">{chlore || '--'} mg/L</td>
                        <td>{deptAvg.chlorine || '--'} mg/L</td>
                        <td className="hide-mobile">
                          <span className={`seo-badge ${chlore <= parseFloat(deptAvg.chlorine) ? 'badge-success' : 'badge-warn'}`}>
                            {chlore <= parseFloat(deptAvg.chlorine) ? 'Plus neutre' : 'Plus marqué'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p className="seo-main-text">{syntheseTexte}</p>
          </div>
        </section>

        {/* 2. SECTION CONSEILS : Mieux consommer */}
        <section className="seo-section-block">
          <h2 className="seo-section-title">💧 Guide pratique : bien consommer l'eau à {cityName}</h2>
          <div className="seo-grid">
            <div className="seo-card">
              <div className="seo-card-icon">🚰</div>
              <h3>{calcaireTitre}</h3>
              <p>{calcaireTexte}</p>
            </div>

            <div className="seo-card">
              <div className="seo-card-icon">🍋</div>
              <h3>{chloreTitre}</h3>
              <p>{chloreTexte}</p>
            </div>

            <div className="seo-card">
              <div className="seo-card-icon">🔎</div>
              <h3>Contrôle Nitrate & Pesticide</h3>
              <p>
                Les résultats pour les polluants agricoles à {cityName} ont été vérifiés. 
                {nitrates && nitrates < 10 
                   ? " La qualité des nappes souterraines est excellente avec moins de 10 mg/L de nitrates, ce qui est extrêmement rassurant pour la biodiversité locale." 
                   : " Les indicateurs sont surveillés de près par les autorités sinitaires pour garantir une eau sécurisée."}
              </p>
            </div>
          </div>
        </section>

        {/* 3. SECTION FAQ : Questions locales */}
        <section className="seo-section-block">
          <h2 className="seo-section-title">💬 Foire Aux Questions (FAQ Locale)</h2>
          <div className="seo-longform-card">
            <div className="seo-faq-list">
              {faqItems.map((item, i) => (
                <div key={i} className="seo-faq-item">
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. SECTION TECHNIQUE : Origine & Data */}
        <section className="seo-section-block">
          <h2 className="seo-section-title">🌍 Origine et Parcours de l'Eau</h2>
          <div className="seo-longform">
            <div className="seo-longform-card dark-mode-soft">
              <p>
                Bien que les données géographiques exactes du captage soient spécifiques à chaque quartier, 
                l'eau distribuée dans le secteur de {cityName} (Département {dpt}) provient 
                principalement d'eaux souterraines ou de cours d'eau régionaux hautement surveillés.
              </p>
              <p>
                Avant d'arriver à votre robinet, cette eau brute traverse un réseau d'infrastructures de traitement complexes : 
                décantation, filtration sur sable, ozonation et ajout sécurisé de chlore pour prévenir toute contamination bactériologique dans la tuyauterie.
                Les installations qui desservent {cityName} sont soumises à des audits stricts pilotés par l'Agence Régionale de Santé (ARS), 
                garantissant que l'impact environnemental local est minimisé tout en fournissant une eau sécurisée à la demande.
              </p>
            </div>
          </div>
          
          <h2 className="seo-section-title">📋 Registre officiel des paramètres physico-chimiques</h2>
          <SeoDataTable cityName={cityName} stats={stats} nomReseau={nomReseau} isConform={isConform} />
        </section>
        
        <NearbyCities dpt={dpt} currentCity={cityName} />
        
        <div className="seo-footer-trust">
          <span>Sources : ARS & Ministère de la Santé</span>
          <span>•</span>
          <span>Réseau Municipal : {nomReseau}</span>
        </div>
      </div>
    </section>
  );
}

function NearbyCities({ dpt, currentCity }) {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (!dpt) return;
    fetch(`https://geo.api.gouv.fr/departements/${dpt}/communes`)
      .then(r => r.json())
      .then(data => {
        const filtered = data.filter(c => c.nom.toLowerCase() !== currentCity.toLowerCase());
        const sorted = filtered.sort((a, b) => (b.population || 0) - (a.population || 0));
        const selected = sorted.slice(0, 50).sort(() => 0.5 - Math.random()).slice(0, 8);
        setCities(selected);
      })
      .catch(e => console.error(e));
  }, [dpt, currentCity]);

  if (cities.length === 0) return null;

  return (
    <div className="seo-local-links">
      <h3>📍 Explorez la qualité de l'eau dans votre bassin</h3>
      <div className="seo-tags-grid">
        {cities.map(c => {
          const slug = c.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');
          return (
            <a key={c.code} href={`/ville/${slug}`} className="seo-city-tag">
              Eau à {c.nom}
            </a>
          )
        })}
      </div>
    </div>
  );
}

function SeoDataTable({ cityName, stats, nomReseau, isConform }) {
  const rowData = [
    { name: "Microbiologie", data: { val: isConform ? "Absence" : "Contrôlée", unit: "germes" }, limit: "0 n/mL" },
    { name: "Nitrates", data: stats.nitrates, limit: "50 mg/L" },
    { name: "Pesticides totaux", data: stats.pesticides, limit: "0.1 µg/L" },
    { name: "Chlore Libre", data: stats.chlorine, limit: "< 0.1 recommandé" },
    { name: "Calcaire (Dureté)", data: stats.hardness, limit: "Indicateur" },
    { name: "Potentiel Hydrogène (pH)", data: stats.ph, limit: "6.5 - 9.0" },
    { name: "Turbidité", data: stats.turbidity, limit: "< 2 NFU" },
    { name: "Conductivité", data: stats.conductivity, limit: "1100 µS/cm" },
    { name: "Fer total", data: stats.iron, limit: "200 µg/L" },
    { name: "Manganèse", data: stats.manganese, limit: "50 µg/L" },
    { name: "Ammonium", data: stats.ammonium, limit: "0.1 mg/L" },
    { name: "Cuivre", data: stats.copper, limit: "2.0 mg/L" },
    { name: "Carbone Organique (COT)", data: stats.cot, limit: "< 2 mg/L" },
  ];

  return (
    <div className="seo-table-container">
      <h3>📋 Registre officiel des paramètres physico-chimiques</h3>
      <p>Données brutes issues des relevés de l'ARS pour le réseau {nomReseau} ({cityName}).</p>
      <div className="table-responsive-wrapper">
        <table className="seo-data-table">
          <thead>
            <tr>
              <th>Paramètre testé</th>
              <th>Valeur relevée</th>
              <th>Unité</th>
              <th>Limite de Qualité (Norme)</th>
            </tr>
          </thead>
          <tbody>
            {rowData.map((row, i) => {
              if (!row.data || !row.data.val) return null;
              return (
                <tr key={i}>
                  <td>{row.name}</td>
                  <td className="seo-table-val"><strong>{row.data.val}</strong></td>
                  <td>{row.data.unit || "-"}</td>
                  <td>{row.limit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function WaterReport({ data }) {
  const { cityName, crystal, stats, isConform, meta } = data;
  const nomReseau = meta.nom_distributeur || meta.nom_reseau || "Réseau Municipal";
  let scoreClass = (crystal.final < 5) ? "status-critical" : (crystal.final < 8) ? "status-warning" : (crystal.final < 8.5) ? "status-good" : "status-excellent";

  const paramsList = [
    { name: "Microbiologie", key: "bacteria", data: { val: "Absence", unit: "", date: new Date(meta.date_prelevement).toLocaleDateString('fr-FR') } },
    { name: "Nitrates", key: "nitrates", data: stats.nitrates },
    { name: "Pesticides", key: "pesticides", data: stats.pesticides },
    { name: "Chlore Libre", key: "chlorine", data: stats.chlorine },
    { name: "Calcaire", key: "hardness", data: stats.hardness },
    { name: "Acidité (pH)", key: "ph", data: stats.ph },
    { name: "Turbidité", key: "turb", data: stats.turbidity },
    { name: "Conductivité", key: "cond", data: stats.conductivity },
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
      <div className="report-content" style={{ padding: '0 0.5rem 2rem' }}>
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
            <div className="yuka-range-labels">
              {isCentered ? (
                <>
                  <span style={{ left: '11%' }}>{range[0]}</span>
                  <span style={{ left: '33%' }}>{range[2]}</span>
                  <span style={{ left: '67%' }}>{range[3]}</span>
                  <span style={{ left: '89%' }}>{range[5]}</span>
                </>
              ) : (
                range && (
                  <>
                    <span style={{ left: '0' }}>0</span>
                    <span style={{ left: '25%' }}>{range[0]}</span>
                    <span style={{ left: '50%' }}>{range[1]}</span>
                    <span style={{ left: '75%' }}>{range[2]}</span>
                    <span style={{ left: '100%', transform: 'translateX(-100%)' }}>
                      {Math.round((range[2] + (range[2] - range[1])) * 100) / 100}
                    </span>
                  </>
                )
              )}
            </div>
            <div className="yuka-date-info" style={{ marginTop: '10px', fontSize: '0.7rem', opacity: 0.6 }}>Analyse du {data?.date || 'N/A'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
