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

const sidePanel = document.getElementById('side-panel');
const panelContent = document.getElementById('panel-content');
const closeBtn = document.querySelector('.close-panel');
const searchInput = document.getElementById('searchVille');
const searchResults = document.getElementById('search-results');
const hamburger = document.getElementById('hamburger');
const mainMenu = document.getElementById('main-menu');
const closeMenu = document.querySelector('.close-menu');
const geolocateBtn = document.getElementById('geolocate-btn');

hamburger.onclick = () => mainMenu.classList.add('active');
closeMenu.onclick = () => mainMenu.classList.remove('active');
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

let searchTimeout;
searchInput.oninput = (e) => {
    const query = e.target.value.trim();
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
    
    // Mise à jour de la carte
    map.flyTo({ center: coords, zoom: 13, essential: true });
    
    // Partage : Mise à jour de l'URL sans recharger
    const cityName = feature.text;
    const url = new URL(window.location);
    url.searchParams.set('v', cityName);
    window.history.pushState({}, '', url);

    fetchWaterData(cityName);
}

async function fetchWaterData(cityName) {
    sidePanel.classList.add('active');
    panelContent.innerHTML = `<div style="padding:2rem; text-align:center;">Extraction des bilans sanitaires...</div>`;

    try {
        const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&size=500`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            panelContent.innerHTML = `<div style="padding:2rem; text-align:center;">Aucune donnée Hub'Eau pour ${cityName}.</div>`;
            return;
        }

        const reports = data.data;
        reports.sort((a, b) => new Date(b.date_prelevement) - new Date(a.date_prelevement));

        const getParam = (keywords) => {
            const match = reports.find(r => 
                keywords.some(kw => r.libelle_parametre.toLowerCase().includes(kw.toLowerCase())) &&
                (r.resultat_numerique !== undefined || r.resultat_alphanumerique !== undefined)
            );
            return match ? {
                val: `${match.resultat_numerique || match.resultat_alphanumerique}`,
                unit: match.libelle_unite || '',
                date: new Date(match.date_prelevement).toLocaleDateString('fr-FR'),
                label: match.libelle_parametre
            } : null;
        };

        const stats = {
            nitrates: getParam(["nitrate"]),
            ph: getParam(["ph"]),
            hardness: getParam(["hydrotimétrique", "dureté"]),
            chlorine: getParam(["chlore libre"]),
            conductivity: getParam(["conductivité"]),
            turbidity: getParam(["turbidité"]),
            iron: getParam(["fer total"]),
            ammonium: getParam(["ammonium"]),
            cot: getParam(["organique total"]),
            manganese: getParam(["manganèse"]),
            copper: getParam(["cuivre"]),
            pesticides: getParam(["pesticides totaux"])
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
            if (n < 5) return { class: "status-excellent", statusLabel: "Exceptionnel", subtitle: "Pureté maximale", status: "perfect" };
            if (n < 20) return { class: "status-good", statusLabel: "Sain", subtitle: "Taux très faible", status: "perfect" };
            if (n < 50) return { class: "status-warning", statusLabel: "Vigilance", subtitle: "Taux modéré", status: "warning" };
            return { class: "status-critical", statusLabel: "Hors Norme", subtitle: "Seuil dépassé", status: "critical" };
        case "hardness":
            if (n >= 15 && n <= 25) return { class: "status-excellent", statusLabel: "Idéal", subtitle: "Équilibre minéral parfait", status: "perfect" };
            if (n >= 10 && n < 15) return { class: "status-good", statusLabel: "Eau Douce", subtitle: "Peu calcaire, sain", status: "perfect" };
            if (n > 25 && n < 35) return { class: "status-warning", statusLabel: "Calcaire", subtitle: "Entartrage probable", status: "warning" };
            if (n < 5) return { class: "status-critical", statusLabel: "Corrosif", subtitle: "Trop peu de minéraux", status: "critical" };
            return { class: "status-critical", statusLabel: "Très Calcaire", subtitle: "Nuisance technique forte", status: "critical" };
        case "pesticides":
            if (n === 0 || isNaN(n) || n < 0.01) return { class: "status-excellent", statusLabel: "Nul", subtitle: "Aucun résidu détecté", status: "perfect" };
            if (n < 0.1) return { class: "status-warning", statusLabel: "Traces", subtitle: "Présence infime de résidus", status: "warning" };
            return { class: "status-critical", statusLabel: "Alerte", subtitle: "Dépassement de seuil", status: "critical" };
        case "ph":
            if (n >= 7.0 && n <= 7.8) return { class: "status-excellent", statusLabel: "Neutre", subtitle: "PH idéal", status: "perfect" };
            if (n >= 6.5 && n <= 8.5) return { class: "status-good", statusLabel: "Correct", subtitle: "Équilibre sain", status: "perfect" };
            return { class: "status-warning", statusLabel: "Déséquilibré", subtitle: "Acidité ou Alcalinité", status: "warning" };
        case "chlorine":
            if (n < 0.05) return { class: "status-excellent", statusLabel: "Pur", subtitle: "Aucun goût détecté", status: "perfect" };
            if (n < 0.1) return { class: "status-good", statusLabel: "Sain", subtitle: "Goût imperceptible", status: "perfect" };
            if (n < 0.5) return { class: "status-warning", statusLabel: "Marqué", subtitle: "Léger goût de chlore", status: "warning" };
            return { class: "status-critical", statusLabel: "Fort", subtitle: "Goût très présent", status: "critical" };
        case "iron":
            if (n < 20 || isNaN(n)) return { class: "status-excellent", statusLabel: "Excellent", subtitle: "Pur", status: "perfect" };
            if (n < 100) return { class: "status-good", statusLabel: "Correct", subtitle: "Traces minimes", status: "perfect" };
            return { class: "status-warning", statusLabel: "Traces", subtitle: "Eau ferreuse", status: "warning" };
        case "manganese":
            if (n < 5 || isNaN(n)) return { class: "status-excellent", statusLabel: "Excellent", subtitle: "Pur", status: "perfect" };
            if (n < 20) return { class: "status-good", statusLabel: "Correct", subtitle: "Traces minimes", status: "perfect" };
            return { class: "status-warning", statusLabel: "Traces", subtitle: "Légère présence", status: "warning" };
        case "cond":
            if (n < 400) return { class: "status-excellent", statusLabel: "Stable", subtitle: "Faiblement minéralisée", status: "perfect" };
            if (n < 800) return { class: "status-good", statusLabel: "Équilibré", subtitle: "Minéralisation moyenne", status: "perfect" };
            return { class: "status-warning", statusLabel: "Chargée", subtitle: "Eau riche en minéraux", status: "warning" };
        case "turb":
            if (n < 0.1) return { class: "status-excellent", statusLabel: "Cristalline", subtitle: "Eau ultra-pure", status: "perfect" };
            if (n < 0.5) return { class: "status-good", statusLabel: "Limpide", subtitle: "Excellente visibilité", status: "perfect" };
            return { class: "status-warning", statusLabel: "Trouble", subtitle: "Légère opacité", status: "warning" };
        default:
            return { class: "status-good", statusLabel: "Satisfaisant", subtitle: "Dans les normes", status: "perfect" };
    }
}

const PARAM_ICONS = {
    bacteria: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
    nitrates: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M5.3 5.3l13.4 13.4M18.7 5.3L5.3 18.7"/></svg>',
    hardness: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>',
    pesticides: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 6 7.5 1-5.5 5.5 1.3 7.5-6.3-3.3-6.3 3.3 1.3-7.5-5.5-5.5 7.5-1z"/></svg>',
    ph: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    chlorine: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    cond: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    turb: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>'
};

// Échelles de visualisation pour le spectre Yuka
const RANGES = {
    nitrates: [0, 5, 20, 50],
    hardness: [0, 15, 25, 45],
    pesticides: [0, 0.05, 0.1, 0.2],
    ph: [5.5, 7.0, 7.8, 9.5],
    chlorine: [0, 0.05, 0.1, 0.5],
    iron: [0, 20, 100, 200],
    manganese: [0, 5, 20, 50],
    turb: [0, 0.1, 0.5, 1.0],
    cond: [0, 200, 1100, 2500],
    copper: [0, 0.1, 0.5, 1.0],
    ammonium: [0, 0.05, 0.1, 0.5]
};

const CENTERED_PARAMS = ["ph", "hardness"];

function renderReport(cityName, meta, s, isConform) {
    const nomReseau = meta.nom_reseau || meta.nom_installation || "Réseau Municipal";
    const crystal = calculateCrystalScore(s, isConform);

    const params = [
        { name: "Microbiologie", data: { val: "Absence", unit: "/100ml" }, key: "bacteria" },
        { name: "Nitrates (en NO3)", data: s.nitrates, key: "nitrates" },
        { name: "Calcaire (TH)", data: s.hardness, key: "hardness" },
        { name: "pH (Hydrogène)", data: s.ph, key: "ph" },
        { name: "Conductivité", data: s.conductivity, key: "cond" },
        { name: "Chlore Libre", data: s.chlorine, key: "chlorine" },
        { name: "Turbidité", data: s.turbidity, key: "turb" },
        { name: "Total Pesticides", data: s.pesticides, key: "pesticides" },
        { name: "Fer Total", data: s.iron, key: "iron" },
        { name: "Manganèse", data: s.manganese, key: "manganese" }
    ];

    const processed = params.map(p => {
        const info = getParameterStatus(p.key, p.data?.val);
        return { ...p, ...info };
    });

    const qualities = processed.filter(p => p.status === "perfect" || p.status === "none");
    const vulnerabilities = processed.filter(p => p.status !== "perfect" && p.status !== "none");

    const renderYukaRow = (p, index) => {
        // Calcul position curseur (0 à 100%)
        let pos = 50;
        const range = RANGES[p.key];
        const rawVal = p.data?.val;
        const val = parseValue(rawVal);
        const hasData = rawVal !== undefined && rawVal !== null && rawVal !== "null";
        
        if (p.key === "bacteria") {
            pos = (p.status === "perfect") ? 5 : 95; // Légèrement décalé pour le style
        } else if (range && hasData && !isNaN(val)) {
            const min = range[0];
            const max = range[3];
            pos = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
        }

        const rowId = `row-${p.key}-${index}`;
        const isCentered = CENTERED_PARAMS.includes(p.key);

        return `
            <div class="yuka-row-wrapper">
                <div class="yuka-row" onclick="toggleYukaRow('${rowId}')">
                    <div class="yuka-icon">${PARAM_ICONS[p.key] || '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'}</div>
                    <div class="yuka-content">
                        <span class="yuka-name">${p.name}</span>
                        <span class="yuka-subtitle">${p.statusLabel} • ${p.subtitle}</span>
                    </div>
                    <div class="yuka-value-group">
                        <span class="yuka-val">${hasData ? p.data.val : '--'} <small>${(hasData && p.data.unit) ? p.data.unit : ''}</small></span>
                        <div class="yuka-dot-small ${p.class}"></div>
                        <svg class="yuka-toggle-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </div>
                <div id="${rowId}" class="yuka-details">
                    <div class="yuka-range-container">
                        ${hasData ? `
                            <div class="yuka-range-bar ${isCentered ? 'centered' : 'linear'}" style="--marker-pos: ${pos}%">
                                <div class="yuka-marker"></div>
                            </div>
                            <div class="yuka-range-labels">
                                ${range ? `
                                    <span>${range[0]}</span>
                                    <span>${range[1]}</span>
                                    <span>${range[2]}</span>
                                    <span>${range[3]}+</span>
                                ` : '<span>Échelle de conformité sanitaire standard</span>'}
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
    else if (crystal.final < 9) scoreClass = "status-good";

    panelContent.innerHTML = `
        <div class="yuka-header">
            <img src="./crystal_droplet.png" class="product-image" alt="Eau de ${cityName}">
            <div class="product-info">
                <h2 class="product-title">${cityName}</h2>
                <p style="font-size:0.8rem; color:var(--text-light); margin-bottom:0.5rem;">${nomReseau}</p>
                <div class="product-score-line">
                    <div class="score-dot ${scoreClass}"></div>
                    <span>${crystal.final}/10 • ${crystal.label}</span>
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
            <p>Conformité légale : <strong>${isConform ? 'CONFORME' : 'NON CONFORME'}</strong></p>
            <p style="margin-top:5px;">Source : Hub'Eau / Ministère de la Santé.</p>
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
            fetchWaterData(city);
        }
    }
}

document.onclick = (e) => {
    if (e.target !== searchInput) {
        searchResults.classList.remove('active');
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

typePlaceholder();
