// Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1IjoiY3Jhenl0YXJwZSIsImEiOiJjbW5wdDczZHQwMDc4MnJxeXN2OTMzYmFlIn0.V2B4cX82xIQntOorHu0XSA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [2.2137, 46.2276],
    zoom: 5.0,
    projection: 'globe'
});

map.on('load', () => {
    const layers = map.getStyle().layers;
    for (let layer of layers) {
        if (layer.layout && layer.layout['text-field']) {
            map.setLayoutProperty(layer.id, 'text-field', [
                'coalesce',
                ['get', 'name_fr'],
                ['get', 'name']
            ]);
        }
    }
    // Véritable chargement initial depuis l'URL
    checkUrlParams();
});

// Interaction directe avec la carte : Clic pour sélectionner une ville
map.on('click', async (e) => {
    const { lng, lat } = e.lngLat;
    
    // Feedback visuel de chargement
    map.getCanvas().style.cursor = 'wait';

    try {
        // Restriction à la France uniquement (country=FR)
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&types=place&country=FR&language=fr&limit=1`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            // Sécurité supplémentaire : on vérifie que le résultat est bien en France via son contexte
            const isFrance = feature.context?.some(c => c.id.includes('country') && c.short_code === 'fr');
            if (isFrance || feature.place_name.toLowerCase().includes('france')) {
                selectLocation(feature);
            }
        }
    } catch (error) {
        console.error("Erreur Reverse Geocoding:", error);
    } finally {
        map.getCanvas().style.cursor = 'pointer';
    }
});

// Curseur interactif
map.on('mouseenter', () => {
    map.getCanvas().style.cursor = 'pointer';
});
map.on('mouseleave', () => {
    map.getCanvas().style.cursor = '';
});

const sidePanel = document.getElementById('side-panel');
const panelContent = document.getElementById('panel-content');
const closeBtn = document.querySelector('.close-panel');
const searchInput = document.getElementById('searchVille');
const searchResults = document.getElementById('search-results');
const hamburger = document.getElementById('hamburger');
const mainMenu = document.getElementById('main-menu');
const geolocateBtn = document.getElementById('geolocate-btn');
const clearSearchBtn = document.getElementById('clear-search');

hamburger.onclick = () => {
    hamburger.classList.toggle('is-active');
    mainMenu.classList.toggle('active');
};

closeBtn.onclick = () => sidePanel.classList.remove('active');

// Logique de Géolocalisation
geolocateBtn.onclick = () => {
    if (!navigator.geolocation) {
        alert("La géolocalisation n'est pas supportée par votre navigateur.");
        return;
    }

    geolocateBtn.classList.add('loading');

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
            // Reverse Geocoding pour trouver le nom de la ville
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxgl.accessToken}&types=place&language=fr&limit=1`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                // On utilise la fonction existante pour unifier le comportement
                selectLocation(feature);
            } else {
                map.flyTo({ center: [longitude, latitude], zoom: 13, essential: true });
            }
        } catch (error) {
            console.error("Erreur Géolocalisation:", error);
        } finally {
            geolocateBtn.classList.remove('loading');
        }
    }, (error) => {
        geolocateBtn.classList.remove('loading');
        console.warn("Erreur géo:", error);
        alert("Localisation impossible. Vérifiez vos paramètres de confidentialité.");
    });
};

// Suppression de la recherche
clearSearchBtn.onclick = () => {
    searchInput.value = '';
    searchResults.classList.remove('active');
    clearSearchBtn.classList.remove('visible');
    searchInput.focus();
};

let searchTimeout;
searchInput.oninput = (e) => {
    const query = e.target.value.trim();
    
    // Visibilité de la croix
    if (query.length > 0) {
        clearSearchBtn.classList.add('visible');
    } else {
        clearSearchBtn.classList.remove('visible');
    }

    clearTimeout(searchTimeout);
    if (query.length < 3) {
        searchResults.classList.remove('active');
        return;
    }
    searchTimeout = setTimeout(async () => {
        try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&country=FR&types=place,postcode&language=fr&limit=5`;
            const response = await fetch(url);
            const data = await response.json();
            showSuggestions(data.features);
        } catch (error) {
            console.error("Erreur Autocomplétion:", error);
        }
    }, 300);
};

function showSuggestions(features) {
    if (features.length === 0) {
        searchResults.classList.remove('active');
        return;
    }
    searchResults.innerHTML = '';
    features.forEach(feature => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `<strong>${feature.text}</strong> <span style="font-size:0.8rem; color:var(--text-light)">(${feature.context?.[0]?.text || ''})</span>`;
        div.onclick = () => selectLocation(feature);
        searchResults.appendChild(div);
    });
    searchResults.classList.add('active');
}

function selectLocation(feature) {
    const coords = feature.center;
    searchInput.value = feature.place_name;
    searchResults.classList.remove('active');
    clearSearchBtn.classList.add('visible');
    
    // Mise à jour de la carte
    map.flyTo({ center: coords, zoom: 13, essential: true });
    
    // Partage : Mise à jour de l'URL sans recharger
    const cityName = feature.text;
    const url = new URL(window.location);
    url.searchParams.set('v', cityName);
    window.history.pushState({}, '', url);

    // On lance le chargement en arrière-plan immédiatement
    fetchWaterData(cityName);
}

let openPanelTimeout;
async function fetchWaterData(cityName) {
    clearTimeout(openPanelTimeout);
    
    // On prépare le skeleton mais on attend avant de montrer la vignette
    panelContent.innerHTML = `
        <div class="vignette-hero">
            <div class="skeleton" style="position:absolute; inset:0; border-radius:inherit;"></div>
        </div>
        <div style="margin-top:2rem;">
            <div class="skeleton-line skeleton" style="width:100%; height:45px; border-radius:100px; margin-bottom:2.5rem;"></div>
            <div class="skeleton-line skeleton" style="width:40%; margin-bottom:1.5rem;"></div>
            <div class="skeleton-row">
                <div class="skeleton" style="width:32px; height:32px; border-radius:50%;"></div>
                <div style="flex:1;">
                    <div class="skeleton-line skeleton" style="width:70%;"></div>
                    <div class="skeleton-line-sm skeleton"></div>
                </div>
            </div>
            <div class="skeleton-row">
                <div class="skeleton" style="width:32px; height:32px; border-radius:50%;"></div>
                <div style="flex:1;">
                    <div class="skeleton-line skeleton" style="width:70%;"></div>
                    <div class="skeleton-line-sm skeleton"></div>
                </div>
            </div>
            <div class="skeleton-row">
                <div class="skeleton" style="width:32px; height:32px; border-radius:50%;"></div>
                <div style="flex:1;">
                    <div class="skeleton-line skeleton" style="width:70%;"></div>
                    <div class="skeleton-line-sm skeleton"></div>
                </div>
            </div>
        </div>
    `;

    // Ouverture différée de la vignette (4s) pour laisser la carte voler
    openPanelTimeout = setTimeout(() => {
        sidePanel.classList.add('active');
    }, 4000);

    try {
        // Pour les très grandes villes comme Paris, on monte à 10000 résultats pour remonter assez loin dans le temps
        // car les tests de routine (chlore) noient les analyses complètes (pesticides, etc.)
        const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&size=10000`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            panelContent.innerHTML = `<div style="padding:2rem; text-align:center;">Aucune donnée Hub'Eau pour ${cityName}.</div>`;
            return;
        }

        const reports = data.data;
        reports.sort((a, b) => new Date(b.date_prelevement) - new Date(a.date_prelevement));

        // Helper interne robuste utilisant les codes Sandre (officiels) et les mots-clés
        const getParam = (codes, keywords) => {
            const match = reports.find(r => {
                const unit = (r.libelle_unite || "").toLowerCase();
                const label = r.libelle_parametre.toLowerCase()
                                .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 

                // 1. Exclusion radicale de la température (très robuste contre les erreurs de labo)
                const containsC = unit.includes("c") || unit.includes("deg");
                const containsDegreeSign = unit.includes("°") || unit.includes("º") || label.includes("°");
                const isTempLabel = label.includes("temperature") || label.includes("t°") || label.startsWith("t ");
                
                if (isTempLabel || (containsC && containsDegreeSign)) return false;

                // 2. Priorité au Code Sandre (infaillible)
                const isCodeMatch = codes.some(c => `${r.code_parametre}` === `${c}`);
                if (isCodeMatch) return (r.resultat_numerique !== null || r.resultat_alphanumerique !== null);

                // 3. Fallback sur le libellé textuel (plus strict pour éviter les faux positifs)
                const isWordMatch = keywords.some(kw => {
                    const lowKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    // Si le mot clé est très court (ex: ph, th, cond), on exige qu'il soit un mot isolé
                    if (lowKw.length <= 3) {
                        const regex = new RegExp(`\\b${lowKw}\\b`, 'i');
                        return regex.test(label) || (lowKw === 'ph' && label.includes('potentiel hydrogene'));
                    }
                    return label.includes(lowKw);
                });

                return isWordMatch && (r.resultat_numerique !== null || r.resultat_alphanumerique !== null);
            });

            if (!match) return null;

            const rawVal = (match.resultat_alphanumerique && match.resultat_alphanumerique !== "null") 
                           ? match.resultat_alphanumerique 
                           : match.resultat_numerique;

            const cleanUnit = (u) => {
                if (!u) return '';
                // Simplification des unités techniques (ex: mg(Cl2)/L -> mg/L)
                return u.replace(/\(.*\)/g, '').replace('unité ', '').trim();
            };
            
            return {
                val: (rawVal !== null && rawVal !== undefined) ? `${rawVal}` : '--',
                unit: cleanUnit(match.libelle_unite),
                date: new Date(match.date_prelevement).toLocaleDateString('fr-FR'),
                label: match.libelle_parametre
            };
        };

        const stats = {
            nitrates: getParam([1340, 1342], ["nitrate"]),
            ph: getParam([1301], ["ph", "potentiel hydrogene"]),
            hardness: getParam([1345], ["hydrotimetrique", "durete", "calcaire", " th "]),
            chlorine: getParam([1399], ["chlore libre", "chlore total"]),
            conductivity: getParam([1302], ["conductivite"]),
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

        renderReport(cityName, reports[0], stats, isConform);

    } catch (error) {
        console.error("Erreur Hub'Eau:", error);
        panelContent.innerHTML = `<div style="padding:2rem;">Erreur technique API.</div>`;
    }
}



/**
 * Aide à parser les valeurs numériques avec des symboles comme < ou >
 */
function parseValue(val) {
    if (val === undefined || val === null) return NaN;
    if (typeof val === 'number') return val;
    const clean = val.toString().replace('<', '').replace('>', '').replace(',', '.').trim();
    return parseFloat(clean);
}

function calculateCrystalScore(s, isConform) {
    let score = 10.0;
    let breakdown = [];
    
    // 1. Sanction Radicale : Non-Conformité
    if (!isConform) {
        return { 
            final: 2.1, 
            label: "NON CONFORME", 
            explanation: "L'eau présente des dépassements de seuils réglementaires sur des paramètres critiques.",
            items: [{ label: "Conformité Légale", score: "Échec", impact: "Critique" }]
        };
    }

    // 2. Nitrates (Poids fort)
    if (s.nitrates) {
        const n = parseValue(s.nitrates.val);
        if (n > 50) score -= 8;
        else if (n > 40) { score -= 4; }
        else if (n > 25) { score -= 2; }
        else if (n > 10) { score -= 0.5; }
    }

    // 3. Pesticides
    if (s.pesticides) {
        const p = parseValue(s.pesticides.val);
        if (p > 0.1) score -= 6;
        else if (p > 0.05) { score -= 3; }
        else if (p > 0) { score -= 1; }
    }

    // 4. Calcaire (Poids confort)
    if (s.hardness) {
        const h = parseValue(s.hardness.val);
        if (h > 35) { score -= 2; }
        else if (h > 25) { score -= 1; }
        else if (h < 10) { score -= 0.5; }
    }

    // 5. Chlore (Goût)
    if (s.chlorine) {
        const c = parseValue(s.chlorine.val);
        if (c > 0.5) score -= 1.5;
        else if (c > 0.1) score -= 0.5;
    }

    // 6. Pénalités pour tous les autres métaux et résidus (Warning/Critical)
    const others = [s.iron, s.manganese, s.copper, s.ammonium, s.turbidity, s.conductivity];
    others.forEach(stat => {
        if (!stat) return;
        const n = parseValue(stat.val);
        if (isNaN(n)) return;
        // Si valeur trop élevée, petite pénalité de "confort"
        if (n > 50) score -= 0.5; 
    });

    // Garantir les limites
    score = Math.max(0, Math.min(10, score));
    score = Math.round(score * 10) / 10;

    let label = "BIEN";
    let explanation = "Votre eau est conforme et de qualité standard.";
    
    if (score >= 9.8) {
        label = "EXCEPTIONNELLE";
        explanation = "Une eau d'une pureté rare, surpassant largement les standards nationaux.";
    } else if (score >= 8.5) {
        label = "EXCELLENTE";
        explanation = "Très bonne qualité globale, supérieure à la moyenne française.";
    } else if (score < 5) {
        label = "DÉGRADÉE";
        explanation = "La qualité de l'eau est impactée par certains paramètres. Vigilance recommandée.";
    } else if (score < 8) {
        label = "MÉDIOCRE";
        explanation = "La qualité de l'eau présente plusieurs points de vigilance.";
    }

    return { final: score, label, explanation };
}

function getParameterStatus(key, val) {
    if (val === undefined || val === null || val === "null") return { class: "", statusLabel: "Inconnu", subtitle: "Non analysé", status: "none" };
    
    if (key === "bacteria") {
        if (val.toLowerCase().includes("absence")) return { class: "status-excellent", statusLabel: "Sain", subtitle: "Aucun germe détecté", status: "perfect" };
        return { class: "status-critical", statusLabel: "Danger", subtitle: "Présence bactérienne", status: "critical" };
    }

    const n = parseValue(val);
    
    switch(key) {
        case "nitrates":
            if (n <= 5) return { class: "status-excellent", statusLabel: "Exceptionnel", subtitle: "Pureté maximale", status: "perfect" };
            if (n <= 20) return { class: "status-good", statusLabel: "Sain", subtitle: "Taux très faible", status: "perfect" };
            if (n <= 50) return { class: "status-warning", statusLabel: "Vigilance", subtitle: "Taux modéré", status: "warning" };
            return { class: "status-critical", statusLabel: "Hors Norme", subtitle: "Seuil dépassé", status: "critical" };
        case "hardness":
            if (n >= 15 && n <= 30) return { class: "status-excellent", statusLabel: "Idéal", subtitle: "Équilibre minéral parfait", status: "perfect" };
            if ((n >= 10 && n < 15) || (n > 30 && n <= 35)) return { class: "status-good", statusLabel: n < 15 ? "Eau Douce" : "Calcaire", subtitle: n < 15 ? "Peu calcaire, sain" : "Entartrage léger", status: "perfect" };
            if ((n >= 5 && n < 10) || (n > 35 && n <= 40)) return { class: "status-warning", statusLabel: n < 10 ? "Corrosive" : "Très Calcaire", subtitle: n < 10 ? "Sous-minéralisée" : "Entartrage fort", status: "warning" };
            return { class: "status-critical", statusLabel: "Extrême", subtitle: "Hors normes idéales", status: "critical" };
        case "pesticides":
            const p = parseValue(val);
            if (isNaN(p) || p === 0) return { class: "status-excellent", statusLabel: "Nul", subtitle: "Aucun résidu détecté", status: "perfect" };
            if (p <= 0.05) return { class: "status-excellent", statusLabel: "Excellent", subtitle: "Traces infimes", status: "perfect" };
            if (p <= 0.1) return { class: "status-good", statusLabel: "Bon", subtitle: "Présence de résidus", status: "perfect" };
            if (p <= 0.15) return { class: "status-warning", statusLabel: "Médiocre", subtitle: "Limite de conformité", status: "warning" };
            return { class: "status-critical", statusLabel: "Alerte", subtitle: "Dépassement de seuil", status: "critical" };
        case "ph":
            if (n >= 6.8 && n <= 8.2) return { class: "status-excellent", statusLabel: "Neutre", subtitle: "PH idéal", status: "perfect" };
            if ((n >= 6.4 && n < 6.8) || (n > 8.2 && n <= 8.6)) return { class: "status-good", statusLabel: "Correct", subtitle: "Équilibre sain", status: "perfect" };
            if ((n >= 5.9 && n < 6.4) || (n > 8.6 && n <= 9.1)) return { class: "status-warning", statusLabel: "Déséquilibré", subtitle: "Acidité/Alcalinité", status: "warning" };
            return { class: "status-critical", statusLabel: "Instable", subtitle: "Très corrosif ou entartrant", status: "critical" };
        case "chlorine":
            if (n <= 0.05) return { class: "status-excellent", statusLabel: "Pur", subtitle: "Aucun goût détecté", status: "perfect" };
            if (n <= 0.1) return { class: "status-good", statusLabel: "Sain", subtitle: "Goût imperceptible", status: "perfect" };
            if (n <= 0.5) return { class: "status-warning", statusLabel: "Marqué", subtitle: "Léger goût de chlore", status: "warning" };
            return { class: "status-critical", statusLabel: "Fort", subtitle: "Goût très présent", status: "critical" };
        case "iron":
            if (n <= 20 || isNaN(n)) return { class: "status-excellent", statusLabel: "Excellent", subtitle: "Pur", status: "perfect" };
            if (n <= 100) return { class: "status-good", statusLabel: "Correct", subtitle: "Traces minimes", status: "perfect" };
            return { class: "status-warning", statusLabel: "Traces", subtitle: "Eau ferreuse", status: "warning" };
        case "manganese":
            if (n <= 5 || isNaN(n)) return { class: "status-excellent", statusLabel: "Excellent", subtitle: "Pur", status: "perfect" };
            if (n <= 20) return { class: "status-good", statusLabel: "Correct", subtitle: "Traces minimes", status: "perfect" };
            return { class: "status-warning", statusLabel: "Traces", subtitle: "Légère présence", status: "warning" };
        case "cond":
            if (n <= 400) return { class: "status-excellent", statusLabel: "Stable", subtitle: "Faiblement minéralisée", status: "perfect" };
            if (n <= 800) return { class: "status-good", statusLabel: "Équilibré", subtitle: "Minéralisation moyenne", status: "perfect" };
            return { class: "status-warning", statusLabel: "Chargée", subtitle: "Eau riche en minéraux", status: "warning" };
        case "turb":
            if (n <= 0.1) return { class: "status-excellent", statusLabel: "Cristalline", subtitle: "Eau ultra-pure", status: "perfect" };
            if (n <= 0.5) return { class: "status-good", statusLabel: "Limpide", subtitle: "Excellente visibilité", status: "perfect" };
            return { class: "status-warning", statusLabel: "Trouble", subtitle: "Légère opacité", status: "warning" };
        default:
            return { class: "status-good", statusLabel: "Satisfaisant", subtitle: "Dans les normes", status: "perfect" };
    }
}

const PARAM_ICONS = {
    bacteria: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M6 18h8"/></svg>',
    nitrates: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/></svg>',
    hardness: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
    ph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12"/><path d="m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z"/><path d="m2 22 .414-.414"/></svg>',
    cond: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
    conductivity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
    chlorine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>',
    turb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
    pesticides: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    iron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/><path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"/><path d="M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"/><path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/></svg>',
    manganese: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>'
};

// Échelles de visualisation et bornes de mapping visuel
const RANGES = {
    nitrates: [5, 20, 50],
    pesticides: [0.05, 0.1, 0.15],
    ph: [5.9, 6.4, 6.8, 8.2, 8.6, 9.1], // centered
    chlorine: [0.05, 0.1, 0.5],
    iron: [20, 100, 200],
    manganese: [5, 20, 50],
    turb: [0.1, 0.5, 2.0],
    cond: [400, 800, 1500],
    copper: [1.0, 2.0, 3.0],
    ammonium: [0.1, 0.5, 1.0],
    hardness: [5, 10, 15, 30, 35, 40] // centered
};

const CENTERED_PARAMS = ["ph", "hardness"];

function renderReport(cityName, meta, s, isConform) {
    const nomReseau = meta.nom_distributeur || meta.nom_reseau || meta.nom_uge || meta.nom_installation || "Réseau Municipal";
    const crystal = calculateCrystalScore(s, isConform);

    const params = [
        { name: "Microbiologie", data: { val: "Absence", unit: "" }, key: "bacteria" },
        { name: "Nitrates", data: s.nitrates, key: "nitrates" },
        { name: "Calcaire", data: s.hardness, key: "hardness" },
        { name: "Acidité (pH)", data: s.ph, key: "ph" },
        { name: "Conductivité", data: s.conductivity, key: "cond" },
        { name: "Chlore Libre", data: s.chlorine, key: "chlorine" },
        { name: "Turbidité", data: s.turbidity, key: "turb" },
        { name: "Pesticides", data: s.pesticides, key: "pesticides" },
        { name: "Fer", data: s.iron, key: "iron" },
        { name: "Manganèse", data: s.manganese, key: "manganese" }
    ];

    const processed = params.map(p => {
        const info = getParameterStatus(p.key, p.data?.val);
        return { ...p, ...info };
    });

    const qualities = processed.filter(p => p.status === "perfect" || p.status === "none");
    const vulnerabilities = processed.filter(p => p.status !== "perfect" && p.status !== "none");

    const renderYukaRow = (p, index) => {
        let pos = 50;
        let htmlLabels = '';
        const range = RANGES[p.key];
        const rawVal = p.data?.val;
        const val = parseValue(rawVal);
        const hasData = rawVal !== undefined && rawVal !== null && rawVal !== "null";
        const isCentered = CENTERED_PARAMS.includes(p.key);
        
        if (p.key === "bacteria") {
            pos = (p.status === "perfect") ? 10 : 90;
            htmlLabels = `
                <span style="left: 0%; transform: translateX(0%); color: var(--text-muted); font-weight:700;">Absence</span>
                <span style="left: 100%; transform: translateX(-100%);">Risque</span>
            `;
        } else if (range && hasData && !isNaN(val)) {
            if (isCentered) {
                const [c1, w1, g1, g2, w2, c2] = range;
                if (val < c1) {
                    pos = ((val - (c1 - (w1 - c1))) / (w1 - c1)) * 11; 
                } else if (val <= w1) {
                    pos = 11 + ((val - c1) / (w1 - c1)) * 11;
                } else if (val <= g1) {
                    pos = 22 + ((val - w1) / (g1 - w1)) * 11;
                } else if (val <= g2) {
                    pos = 33 + ((val - g1) / (g2 - g1)) * 34; // Middle ideal zone is 34% width
                } else if (val <= w2) {
                    pos = 67 + ((val - g2) / (w2 - g2)) * 11;
                } else if (val <= c2) {
                    pos = 78 + ((val - w2) / (c2 - w2)) * 11;
                } else {
                    pos = 89 + Math.min(11, ((val - c2) / (c2 - w2)) * 11);
                }
                pos = Math.max(0, Math.min(100, pos));

                htmlLabels = `
                    <span style="left: 11%; transform: translateX(-50%);">${c1}</span>
                    <span style="left: 33%; transform: translateX(-50%);">${g1}</span>
                    <span style="left: 67%; transform: translateX(-50%);">${g2}</span>
                    <span style="left: 89%; transform: translateX(-50%);">${c2}</span>
                `;
            } else {
                const [b1, b2, b3] = range;
                if (val <= b1) {
                    pos = (val / b1) * 25;
                } else if (val <= b2) {
                    pos = 25 + ((val - b1) / (b2 - b1)) * 25;
                } else if (val <= b3) {
                    pos = 50 + ((val - b2) / (b3 - b2)) * 25;
                } else {
                    pos = 75 + Math.min(25, ((val - b3) / (b3 * 0.5)) * 25);
                }
                pos = Math.max(0, Math.min(100, pos));

                htmlLabels = `
                    <span style="left: 0%; transform: translateX(0%); color: var(--text-muted); font-weight:700;">0</span>
                    <span style="left: 25%; transform: translateX(-50%);">${b1}</span>
                    <span style="left: 50%; transform: translateX(-50%);">${b2}</span>
                    <span style="left: 75%; transform: translateX(-50%);">${b3}</span>
                `;
            }
        } else {
            htmlLabels = `<span style="position:static;">Échelle de mesure standard</span>`;
        }

        const rowId = `row-${p.key}-${index}`;

        return `
            <div class="yuka-row-wrapper">
                <div class="yuka-row" onclick="toggleYukaRow('${rowId}')">
                    <div class="yuka-icon">${PARAM_ICONS[p.key] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>'}</div>
                    <span class="yuka-name">${p.name}</span>
                    <div class="yuka-val">${hasData ? p.data.val : '--'} <small>${(hasData && p.data.unit) ? p.data.unit : ''}</small></div>
                    <div class="yuka-dot-small ${p.class}"></div>
                    <svg class="yuka-toggle-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    <span class="yuka-subtitle">${p.subtitle}</span>
                </div>
                <div id="${rowId}" class="yuka-details">
                    <div class="yuka-range-container">
                        ${hasData ? `
                            <div class="yuka-range-bar ${isCentered ? 'centered' : 'linear'}" style="--marker-pos: ${pos}%; --marker-color: var(--${p.class})">
                                <div class="yuka-marker"></div>
                            </div>
                            <div class="yuka-range-labels">
                                ${htmlLabels}
                            </div>
                        ` : `
                            <div style="text-align:center; font-size:0.8rem; color:var(--text-light); padding:1rem;">
                                Aucune analyse récente disponible pour ce paramètre.
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    };

    // Déterminer la classe du dot global (Uniformisé)
    let scoreClass = "status-excellent";
    if (crystal.final < 5) scoreClass = "status-critical";
    else if (crystal.final < 8) scoreClass = "status-warning";
    else if (crystal.final < 8.5) scoreClass = "status-good";

    panelContent.innerHTML = `
        <div class="vignette-hero">
            <div class="hero-bg" style="background-image: url('assets/img/vignette-bg.png')"></div>
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="hero-score-card">
                    <div class="hero-score-val">${crystal.final}/10</div>
                    <div class="hero-status-badge ${scoreClass}">${crystal.label}</div>
                </div>
                <div class="hero-footer">
                    <h2 class="hero-city">${cityName}</h2>
                    <div class="hero-network">${nomReseau}</div>
                </div>
            </div>
        </div>

        <button class="share-btn" onclick="shareReport('${cityName}')" style="margin-bottom:2rem;">
            Partager l'analyse de ${cityName}
        </button>

        ${vulnerabilities.length > 0 ? `
            <div class="report-section">
                <div class="section-header">
                    <span>À surveiller</span>
                    <span class="count">${vulnerabilities.length} points</span>
                </div>
                ${vulnerabilities.map((p, idx) => renderYukaRow(p, idx)).join('')}
            </div>
        ` : ''}

        <div class="report-section">
            <div class="section-header">
                <span>Qualité de l'eau</span>
                <span class="count">${qualities.length} points</span>
            </div>
            ${qualities.map((p, idx) => renderYukaRow(p, idx + 100)).join('')}
        </div>

        <div class="report-footer">
            <div class="legal-badge ${isConform ? 'legal-ok' : 'legal-ko'}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    ${isConform 
                        ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
                        : '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
                    }
                </svg>
                <span>Conformité légale : <strong>${isConform ? 'CONFORME' : 'NON CONFORME'}</strong></span>
            </div>
            <div class="disclaimer-text">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                <span>Source des données : Ministère de la Santé (ARS)</span>
            </div>
        </div>
    `;
}

/**
 * Toggle le détail d'un test spécifique (Yuka Range)
 */
function toggleYukaRow(rowId) {
    const details = document.getElementById(rowId);
    if (!details) return;
    details.classList.toggle('active');
    
    // On peut aussi gérer la rotation de la flèche ici si besoin de compatibilité
    const arrow = details.previousElementSibling.querySelector('.yuka-toggle-arrow');
    if (arrow) {
        if (details.classList.contains('active')) {
            arrow.style.transform = "rotate(180deg)";
        } else {
            arrow.style.transform = "rotate(0deg)";
        }
    }
}

/**
 * Toggle l'affichage du détail du score
 */
function toggleBreakdown() {
    const content = document.getElementById('breakdown-content');
    content.classList.toggle('active');
    const svg = document.querySelector('.breakdown-toggle svg');
    if (content.classList.contains('active')) {
        svg.style.transform = "rotate(180deg)";
    } else {
        svg.style.transform = "rotate(0deg)";
    }
}

// Fonction de partage viral utilisant l'API Native du smartphone
async function shareReport(cityName) {
    const shareData = {
        title: `Qualité de l'eau à ${cityName}`,
        text: `Découvrez le bilan sanitaire complet de l'eau potable à ${cityName} sur EauPotable.net`,
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // Fallback : copie dans le presse-papier
            await navigator.clipboard.writeText(window.location.href);
            alert("Lien d'analyse copié ! Partagez-le avec vos proches.");
        }
    } catch (err) {
        console.error("Erreur partage:", err);
    }
}

// Chargement initial basé sur l'URL
async function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('v');
    if (city) {
        // Géocodage pour placer la carte
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${mapboxgl.accessToken}&country=FR&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
            const f = data.features[0];
            map.flyTo({ center: f.center, zoom: 13 });
            searchInput.value = f.place_name;
            clearSearchBtn.classList.add('visible');
            
            fetchWaterData(city);
        }
    }
}

document.onclick = (e) => {
    // Fermeture de la recherche
    if (e.target !== searchInput) {
        searchResults.classList.remove('active');
    }

    // Fermeture du menu si clic à l'extérieur
    if (mainMenu.classList.contains('active') && 
        !mainMenu.contains(e.target) && 
        !hamburger.contains(e.target)) {
        mainMenu.classList.remove('active');
        hamburger.classList.remove('is-active');
    }
};

// Animation du Placeholder pour guider l'utilisateur
const phrases = [
    "Paris, 75000",
    "Lyon, 69000",
    "Marseille, 13000",
    "Toulouse, 31000",
    "Bordeaux, 33000",
    "Lille, 59000",
    "Nantes, 44000",
    "Nice, 06000",
    "Strasbourg, 67000",
    "Montpellier, 34000"
];

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let isStarted = false;

function typePlaceholder() {
    // Si l'utilisateur tape quelque chose, on arrête l'animation pour ne pas le gêner
    if (searchInput.value.length > 0) {
        searchInput.setAttribute('placeholder', 'Entrez votre ville...');
        isStarted = false;
        return;
    }

    isStarted = true;
    const fullPhrase = phrases[phraseIndex];
    
    let currentText = isDeleting 
        ? fullPhrase.substring(0, charIndex - 1) 
        : fullPhrase.substring(0, charIndex + 1);

    charIndex = isDeleting ? charIndex - 1 : charIndex + 1;
    searchInput.setAttribute('placeholder', currentText);

    let typeSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === fullPhrase.length) {
        typeSpeed = 2000; // Pause à la fin d'une phrase
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 500;
    }

    setTimeout(typePlaceholder, typeSpeed);
}

// Relancer l'animation si l'utilisateur efface tout
searchInput.onblur = () => {
    if (searchInput.value.length === 0 && !isStarted) {
        typePlaceholder();
    }
};

// --- Logique d'installation PWA (Bandeau) ---
let deferredPrompt;

function initPWA() {
    const installBanner = document.getElementById('install-banner');
    const btnInstall = document.getElementById('btn-install');
    const btnCloseBanner = document.getElementById('btn-close-banner');
    const searchFloating = document.querySelector('.search-floating');

    if (!installBanner || !btnInstall || !btnCloseBanner) return;

    // Vérification de l'exclusion de 7 jours (localStorage)
    function isBannerExcluded() {
        const exclusionDate = localStorage.getItem('pwa-banner-excluded');
        if (!exclusionDate) return false;
        const now = new Date().getTime();
        return now < parseInt(exclusionDate);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        if (!isBannerExcluded()) {
            setTimeout(() => {
                // On revérifie au cas où l'utilisateur a fermé ou ouvert une analyse entre-temps
                if (deferredPrompt && !isBannerExcluded() && !installBanner.classList.contains('hidden-by-action')) {
                    installBanner.classList.add('visible');
                    searchFloating.classList.add('pwa-active');
                }
            }, 5000);
        }
    });

    btnInstall.onclick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBanner.classList.remove('visible');
            searchFloating.classList.remove('pwa-active');
        }
        deferredPrompt = null;
    };

    btnCloseBanner.onclick = () => {
        installBanner.classList.remove('visible');
        searchFloating.classList.remove('pwa-active');
        
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        const expiryDate = new Date().getTime() + sevenDaysInMs;
        localStorage.setItem('pwa-banner-excluded', expiryDate.toString());
    };
}

// Lancer l'initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPWA);
} else {
    initPWA();
}

// Cacher le bandeau si on ouvre une analyse
const originalFetchWaterData = fetchWaterData;
fetchWaterData = async (cityName) => {
    const banner = document.getElementById('install-banner');
    const search = document.querySelector('.search-floating');
    if (banner) {
        banner.classList.remove('visible');
        banner.classList.add('hidden-by-action');
    }
    if (search) search.classList.remove('pwa-active');
    return originalFetchWaterData(cityName);
};

typePlaceholder();
