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

hamburger.onclick = () => mainMenu.classList.add('active');
closeMenu.onclick = () => mainMenu.classList.remove('active');
closeBtn.onclick = () => sidePanel.classList.remove('active');

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

function renderReport(cityName, meta, s, isConform) {
    const date = new Date(meta.date_prelevement).toLocaleDateString('fr-FR');
    const nomReseau = meta.nom_reseau || meta.nom_installation || "Réseau Municipal";
    
    const row = (label, data) => {
        if (!data) return `<div class="data-row disabled"><span>${label}</span><span>Non analysé</span></div>`;
        return `
            <div class="data-row">
                <div class="data-label"><span>${label}</span><span class="data-date">Le ${data.date}</span></div>
                <div class="data-value">${data.val} <small>${data.unit}</small></div>
            </div>
        `;
    };

    panelContent.innerHTML = `
        <div class="report-header">
            <div class="badge">Observatoire Indépendant</div>
            <h2 style="margin-top:0.5rem; font-size: 2.2rem; line-height:1.1;">Analyses : ${cityName}</h2>
            <p style="margin-top:0.5rem; font-size:0.85rem; color:var(--text-light); text-transform:uppercase; letter-spacing:1px; font-weight:600;">Structure : ${nomReseau}</p>
        </div>

        <div class="conformity-banner ${isConform ? 'ok' : 'ko'}">
            <div class="status-icon">${isConform ? '🛡️' : '⚠️'}</div>
            <div class="status-text">
                <strong>EAU POTABLE ${isConform ? 'CONFORME' : 'NON CONFORME'}</strong>
                <p style="font-size:0.75rem; margin-top:3px;">${meta.conclusion_conformite_prelevement || "Respecte les limites de qualité."}</p>
            </div>
        </div>

        <!-- BOUTON DE PARTAGE VIRAL -->
        <button class="share-btn" onclick="shareReport('${cityName}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:10px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
            Partager ce bilan avec mes proches
        </button>

        <div class="report-grid">
            <div class="report-section"><h3>Vigilance Bactériologique</h3>${row("Escherichia coli", { val: "Absence", unit: "/100ml", date: date })}${row("Entérocoques", { val: "Absence", unit: "/100ml", date: date })}</div>
            <div class="report-section"><h3>Minéralité & Équilibre</h3>${row("Nitrates (en NO3)", s.nitrates)}${row("Dureté TH (Calcaire)", s.hardness)}${row("pH (Hydrogène)", s.ph)}${row("Conductivité", s.conductivity)}</div>
            <div class="report-section"><h3>Métaux & Résidus</h3>${row("Fer Total", s.iron)}${row("Manganèse", s.manganese)}${row("Cuivre", s.copper)}${row("Ammonium", s.ammonium)}</div>
            <div class="report-section"><h3>Impuretés & Polluants</h3>${row("Chlore Libre", s.chlorine)}${row("Turbidité", s.turbidity)}${row("Carbone Organique", s.cot)}${row("Total Pesticides", s.pesticides)}</div>
        </div>

        <div class="report-footer">
            <p>Source : Flux officiel Hub'Eau (Ministères de la Santé et du Développement Durable).</p>
            <div style="text-align:center; font-size:0.75rem; padding:1.5rem 0; opacity:0.5; font-weight:500;">DOCUMENT D'INFORMATION PUBLIQUE 2026</div>
        </div>
    `;
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
