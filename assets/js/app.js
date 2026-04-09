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
const closeMenuBtn = document.getElementById('close-menu');
const geolocateBtn = document.getElementById('geolocate-btn');
const clearSearchBtn = document.getElementById('clear-search');

hamburger.onclick = () => {
    hamburger.classList.toggle('is-active');
    mainMenu.classList.toggle('active');
};

if (closeMenuBtn) {
    closeMenuBtn.onclick = () => {
        mainMenu.classList.remove('active');
        hamburger.classList.remove('is-active');
    };
}

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
        const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&size=10000`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            panelContent.innerHTML = `<div style="padding:2rem; text-align:center;">Aucune donnée officielle pour ${cityName}.</div>`;
            return;
        }

        const reports = data.data;
        reports.sort((a, b) => new Date(b.date_prelevement) - new Date(a.date_prelevement));

        const getParam = (codes, keywords) => {
            const match = reports.find(r => {
                const unit = (r.libelle_unite || "").toLowerCase();
                const label = r.libelle_parametre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
                const isTemp = label.includes("temperature") || label.includes("t°") || (unit.includes("c") && unit.includes("°"));
                if (isTemp) return false;

                const isCodeMatch = codes.some(c => `${r.code_parametre}` === `${c}`);
                if (isCodeMatch) return (r.resultat_numerique !== null || r.resultat_alphanumerique !== null);

                const isWordMatch = keywords.some(kw => {
                    const lowKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (lowKw.length <= 3) {
                        const regex = new RegExp(`\\b${lowKw}\\b`, 'i');
                        return regex.test(label);
                    }
                    return label.includes(lowKw);
                });
                return isWordMatch && (r.resultat_numerique !== null || r.resultat_alphanumerique !== null);
            });

            if (!match) return null;
            const rawVal = (match.resultat_alphanumerique && match.resultat_alphanumerique !== "null") ? match.resultat_alphanumerique : match.resultat_numerique;
            return {
                val: (rawVal !== null) ? `${rawVal}` : '--',
                unit: (match.libelle_unite || "").replace(/\(.*\)/g, '').trim(),
                date: new Date(match.date_prelevement).toLocaleDateString('fr-FR'),
                label: match.libelle_parametre
            };
        };

        const stats = {
            nitrates: getParam([1340, 1342], ["nitrate"]),
            ph: getParam([1301], ["ph", "potentiel hydrogene"]),
            hardness: getParam([1345], ["hydrotimetrique", "durete", " th "]),
            chlorine: getParam([1399], ["chlore libre", "chlore total"]),
            conductivity: getParam([1302], ["conductivite"]),
            turbidity: getParam([1305], ["turbidite"]),
            iron: getParam([1393, 1374], ["fer total"]),
            manganese: getParam([1394, 1373], ["manganese"]),
            pesticides: getParam([1107, 1667], ["pesticide"])
        };

        const conclusion = reports[0].conclusion_conformite_prelevement || "";
        const isConform = conclusion.toLowerCase().includes("conforme") && !conclusion.toLowerCase().includes("non conforme");

        renderReport(cityName, reports[0], stats, isConform);

    } catch (error) {
        console.error("Erreur Hub'Eau:", error);
        panelContent.innerHTML = `<div style="padding:2rem;">Erreur technique API.</div>`;
    }
}

const RANGES = {
    nitrates: [10, 25, 50],
    ph: [6.5, 6.8, 8.2, 8.5, 9, 9.5],
    hardness: [5, 15, 30, 40, 50, 60],
    chlorine: [0.1, 0.5, 1.0],
    conductivity: [200, 400, 1100],
    turbidity: [0.5, 1.0, 2.0],
    iron: [50, 100, 200],
    manganese: [10, 20, 50],
    pesticides: [0.05, 0.1, 0.5]
};

const CENTERED_PARAMS = ["ph", "hardness"];

function parseValue(val) {
    if (val === undefined || val === null) return NaN;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace('<', '').replace('>', '').replace(',', '.').trim());
}

function calculateCrystalScore(s, isConform) {
    if (!isConform) return { final: 2.1, label: "NON CONFORME" };
    let score = 10.0;
    if (s.nitrates) {
        const n = parseValue(s.nitrates.val);
        if (n > 50) score -= 8; else if (n > 25) score -= 2;
    }
    if (s.pesticides) {
        const p = parseValue(s.pesticides.val);
        if (p > 0) score -= 1;
    }
    score = Math.max(0, Math.min(10, score));
    return { final: Math.round(score * 10) / 10, label: score >= 8.5 ? "EXCELLENTE" : "BIEN" };
}

function getParameterStatus(key, val) {
    if (!val || val === "null" || val === "--") return { class: "", statusLabel: "Inconnu", subtitle: "Non analysé", status: "none" };
    
    if (key === "bacteria") {
        if (val.toLowerCase().includes("absence")) return { class: "status-excellent", statusLabel: "Sain", subtitle: "Aucun germe détecté", status: "perfect" };
        return { class: "status-critical", statusLabel: "Danger", subtitle: "Présence bactérienne", status: "critical" };
    }

    const n = parseValue(val);
    
    switch(key) {
        case "nitrates":
            if (n <= 5) return { class: "status-excellent", statusLabel: "Sain", subtitle: "Pureté maximale", status: "perfect" };
            if (n <= 25) return { class: "status-good", statusLabel: "Correct", subtitle: "Taux faible", status: "perfect" };
            if (n <= 50) return { class: "status-warning", statusLabel: "Vigilance", subtitle: "Taux modéré", status: "warning" };
            return { class: "status-critical", statusLabel: "Hors Norme", subtitle: "Seuil dépassé", status: "critical" };
        case "hardness":
            if (n >= 15 && n <= 30) return { class: "status-excellent", statusLabel: "Idéal", subtitle: "Équilibre parfait", status: "perfect" };
            if ((n >= 10 && n < 15) || (n > 30 && n <= 35)) return { class: "status-good", statusLabel: n < 15 ? "Eau Douce" : "Calcaire", subtitle: "Écart léger", status: "perfect" };
            return { class: "status-warning", statusLabel: "Déséquilibre", subtitle: "Entartrant ou Corrosif", status: "warning" };
        case "pesticides":
            if (isNaN(n) || n === 0) return { class: "status-excellent", statusLabel: "Nul", subtitle: "Aucun résidu", status: "perfect" };
            if (n <= 0.1) return { class: "status-good", statusLabel: "Sain", subtitle: "Traces infimes", status: "perfect" };
            return { class: "status-critical", statusLabel: "Alerte", subtitle: "Dépassement", status: "critical" };
        case "ph":
            if (n >= 6.8 && n <= 8.2) return { class: "status-excellent", statusLabel: "Neutre", subtitle: "pH idéal", status: "perfect" };
            return { class: "status-warning", statusLabel: "Déséquilibré", subtitle: "Acidité / Alcalinité", status: "warning" };
        default:
            const range = RANGES[key];
            if (range && n <= range[0]) return { class: "status-excellent", statusLabel: "Excellent", subtitle: "Paramètre sain", status: "perfect" };
            if (range && n <= range[1]) return { class: "status-good", statusLabel: "Correct", subtitle: "Dans les normes", status: "perfect" };
            return { class: "status-warning", statusLabel: "Vigilance", subtitle: "Taux élevé", status: "warning" };
    }
}

const PARAM_ICONS = {
    bacteria: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M6 18h8"/></svg>',
    nitrates: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/></svg>',
    hardness: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
    ph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12"/><path d="m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z"/><path d="m2 22 .414-.414"/></svg>',
    chlorine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>',
    pesticides: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>',
    turbidity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4 4 4Z"/></svg>'
};

function renderReport(cityName, meta, s, isConform) {
    const nomReseau = meta.nom_distributeur || meta.nom_reseau || "Réseau Municipal";
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
        const hasData = rawVal !== undefined && rawVal !== null && rawVal !== "null" && rawVal !== "--";
        const isCentered = CENTERED_PARAMS.includes(p.key);
        
        if (p.key === "bacteria") {
            pos = (p.status === "perfect") ? 10 : 90;
            htmlLabels = `<span style="left: 0%;">ABSENCE</span><span style="left: 100%; transform: translateX(-100%);">PRÉSENCE</span>`;
        } else if (range && hasData && !isNaN(val)) {
            if (isCentered) {
                const [c1, w1, g1, g2, w2, c2] = range;
                if (val <= g1) pos = 15; else if (val >= g2) pos = 85; else pos = 50;
                htmlLabels = `<span style="left: 10%;">${c1}</span><span style="left: 50%;">${g1}</span><span style="left: 90%;">${c2}</span>`;
            } else {
                const [b1, b2, b3] = range;
                pos = Math.min(100, (val / b3) * 100);
                htmlLabels = `<span style="left: 33%;">${b1}</span><span style="left: 66%;">${b2}</span><span style="left: 100%; transform: translateX(-100%);">${b3}</span>`;
            }
        }

        const rowId = `row-${p.key}-${index}`;
        return `
            <div class="yuka-row-wrapper">
                <div class="yuka-row" onclick="toggleYukaRow('${rowId}')">
                    <div class="yuka-icon">${PARAM_ICONS[p.key] || ''}</div>
                    <span class="yuka-name">${p.name}</span>
                    <div class="yuka-val">${hasData ? p.data.val : '--'} <small>${(hasData && p.data.unit) ? p.data.unit : ''}</small></div>
                    <div class="yuka-dot-small ${p.class}"></div>
                    <svg class="yuka-toggle-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    <span class="yuka-subtitle">${p.subtitle}</span>
                </div>
                <div id="${rowId}" class="yuka-details">
                    <div class="yuka-range-container">
                        ${hasData ? `
                            <div class="yuka-range-bar ${isCentered ? 'centered' : 'linear'}" style="--marker-pos: ${pos}%; --marker-color: var(--${p.class})">
                                <div class="yuka-marker"></div>
                            </div>
                            <div class="yuka-range-labels">${htmlLabels}</div>
                        ` : '<div class="text-mini" style="text-align:center; padding:1rem;">Données non disponibles</div>'}
                    </div>
                </div>
            </div>
        `;
    };

    let scoreClass = "status-excellent";
    if (crystal.final < 5) scoreClass = "status-critical";
    else if (crystal.final < 8.5) scoreClass = "status-warning";

    panelContent.innerHTML = `
        <div class="vignette-hero">
            <div class="hero-bg" style="background-image: url('assets/img/vignette-bg.png')"></div>
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="hero-score-card">
                    <div class="hero-score-val">${crystal.final}/10</div>
                    <div class="hero-status-badge ${scoreClass}">${crystal.label}</div>
                    <div class="score-disclaimer">Indice indépendant</div>
                </div>
                <div class="hero-footer">
                    <h2 class="hero-city">${cityName}</h2>
                    <div class="hero-network">${nomReseau}</div>
                </div>
            </div>
        </div>

        <button class="share-btn" onclick="shareReport('${cityName}')" style="margin: 1.5rem auto;">
            Partager l'analyse
        </button>

        ${vulnerabilities.length > 0 ? `
            <div class="report-section">
                <div class="section-header"><span>À surveiller</span><span class="count">${vulnerabilities.length}</span></div>
                ${vulnerabilities.map((p, idx) => renderYukaRow(p, idx)).join('')}
            </div>
        ` : ''}

        <div class="report-section">
            <div class="section-header"><span>Qualité de l'eau</span><span class="count">${qualities.length}</span></div>
            ${qualities.map((p, idx) => renderYukaRow(p, idx + 100)).join('')}
        </div>

        <div style="padding:1.5rem;">
            <p class="text-mini">Source : Ministère de la Santé (ARS). Cet indice est une interprétation indépendante sans valeur réglementaire.</p>
        </div>
    `;
}

function toggleYukaRow(rowId) {
    const details = document.getElementById(rowId);
    if (!details) return;
    details.classList.toggle('active');
    const arrow = details.previousElementSibling.querySelector('.yuka-toggle-arrow');
    if (arrow) arrow.style.transform = details.classList.contains('active') ? "rotate(180deg)" : "rotate(0deg)";
}

// Share Logic
async function shareReport(cityName) {
    const shareData = { title: "Qualité de l'eau", url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
}

async function checkUrlParams() {
    const city = new URLSearchParams(window.location.search).get('v');
    if (city) fetchWaterData(city);
}

document.onclick = (e) => {
    if (e.target !== searchInput) searchResults.classList.remove('active');
};

// Placeholder Animation
const phrases = ["Paris, 75000", "Lyon, 69000", "Marseille, 13000"];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typePlaceholder() {
    if (searchInput.value.length > 0) return;
    const fullPhrase = phrases[phraseIndex];
    searchInput.setAttribute('placeholder', isDeleting ? fullPhrase.substring(0, charIndex - 1) : fullPhrase.substring(0, charIndex + 1));
    charIndex = isDeleting ? charIndex - 1 : charIndex + 1;
    let speed = isDeleting ? 50 : 100;
    if (!isDeleting && charIndex === fullPhrase.length) { speed = 2000; isDeleting = true; }
    else if (isDeleting && charIndex === 0) { isDeleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; speed = 500; }
    setTimeout(typePlaceholder, speed);
}

window.onload = () => setTimeout(typePlaceholder, 1000);

/* --- PWA LOGIC --- */
let deferredPrompt;
const pwaBanner = document.getElementById('pwa-install-banner');
const installBtn = document.getElementById('pwa-install-btn');
const closePwaBtn = document.getElementById('pwa-close-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const isDismissed = localStorage.getItem('pwa-banner-dismissed');
    const now = new Date().getTime();
    if (!isDismissed || (isDismissed && now > parseInt(isDismissed))) {
        setTimeout(() => {
            if (pwaBanner) {
                pwaBanner.classList.add('active');
                document.body.classList.add('pwa-active');
            }
        }, 5000);
    }
});

if (installBtn) {
    installBtn.onclick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                pwaBanner.classList.remove('active');
                document.body.classList.remove('pwa-active');
            }
            deferredPrompt = null;
        }
    };
}

if (closePwaBtn) {
    closePwaBtn.onclick = () => {
        if (pwaBanner) pwaBanner.classList.remove('active');
        document.body.classList.remove('pwa-active');
        localStorage.setItem('pwa-banner-dismissed', new Date().getTime() + (7 * 24 * 60 * 60 * 1000));
    };
}

window.addEventListener('appinstalled', () => {
    if (pwaBanner) pwaBanner.classList.remove('active');
    document.body.classList.remove('pwa-active');
});
