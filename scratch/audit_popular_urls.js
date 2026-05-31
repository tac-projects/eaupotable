const fs = require('fs');
const path = require('path');

function simulateRecovery(requestedSlug, cityIndex) {
    const cleanSlug = requestedSlug.toLowerCase().replace(/-+/g, '-').replace(/-$/, '').replace(/^-/, '');
    
    // Si c'est directement dans l'index
    if (cityIndex[cleanSlug]) return { status: 'OK', target: cleanSlug };
    if (cityIndex[requestedSlug]) return { status: 'OK', target: requestedSlug };

    const allSlugs = Object.keys(cityIndex);
    
    // 1. Normalisation ultra-agressive (on ne garde que les consonnes et chiffres pour le "son")
    const fuzzy = (s) => s.toLowerCase().replace(/[aeiouyœæ]/g, '').replace(/-+/g, '');
    const cleanFuzzy = fuzzy(cleanSlug);
    
    const fuzzyMatch = allSlugs.find(s => fuzzy(s) === cleanFuzzy);
    if (fuzzyMatch) return { status: 'REDIRECT_FUZZY', target: fuzzyMatch };

    // 2. Patchs syntaxiques
    const noDash = cleanSlug.replace(/-/g, '');
    const noDashMatch = allSlugs.find(s => s.replace(/-/g, '') === noDash);
    if (noDashMatch) return { status: 'REDIRECT_NODASH', target: noDashMatch };

    // 3. Patch d'inversion d'article (ex: ulmes-les -> les-ulmes)
    if (cleanSlug.includes('-')) {
        const parts = cleanSlug.split('-');
        if (parts.length > 1) {
            const lastToFront = [parts[parts.length - 1], ...parts.slice(0, -1)].join('-');
            if (cityIndex[lastToFront]) return { status: 'REDIRECT_ARTICLE', target: lastToFront };
        }
    }

    // 4. Inclusion
    const partialMatch = allSlugs.find(s => 
      (cleanSlug.startsWith(s + '-') || s.startsWith(cleanSlug + '-')) && 
      Math.abs(s.length - cleanSlug.length) < 20
    );
    if (partialMatch) return { status: 'REDIRECT_PARTIAL', target: partialMatch };

    return { status: '404', target: null };
}

// Charger l'index des villes
const indexPath = path.join(__dirname, '..', 'public', 'city-index.json');
if (!fs.existsSync(indexPath)) {
    console.error("Index des villes introuvable à la racine !");
    process.exit(1);
}
const cityIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

// Charger le fichier brut
const rawFilePath = path.join(__dirname, 'search_console_raw.txt');
if (!fs.existsSync(rawFilePath)) {
    console.error("Fichier brut introuvable !");
    process.exit(1);
}
const rawContent = fs.readFileSync(rawFilePath, 'utf8');

// Extraire les URLs uniques
const urlRegex = /https:\/\/www\.eaupotable\.net[^\s\t]*/g;
const urls = [...new Set(rawContent.match(urlRegex) || [])];

console.log(`Nombre d'URLs uniques trouvées dans le rapport : ${urls.length}\n`);

const results = {
    OK: [],
    REDIRECT_NORMALIZE: [],
    REDIRECT_FUZZY: [],
    REDIRECT_NODASH: [],
    REDIRECT_ARTICLE: [],
    REDIRECT_PARTIAL: [],
    '404': []
};

urls.forEach(urlStr => {
    try {
        const urlObj = new URL(urlStr);
        const pathname = urlObj.pathname;

        // Cas 1 : Racine, Mentions, Méthodologie, Villes
        if (pathname === '/' || pathname === '/villes' || pathname === '/mentions-legales' || pathname === '/methodologie' || pathname === '/contact') {
            results.OK.push({ url: urlStr, details: 'Page statique ou racine' });
            return;
        }

        // Cas 2 : Départements (/departement/XX)
        const deptMatch = pathname.match(/^\/departement\/([a-zA-Z0-9]+)\/?$/);
        if (deptMatch) {
            const deptCode = deptMatch[1];
            const deptFilePath = path.join(__dirname, '..', 'public', 'data', 'departments', `${deptCode}.json`);
            if (fs.existsSync(deptFilePath)) {
                results.OK.push({ url: urlStr, details: `Département ${deptCode} (fichier existant)` });
            } else {
                results['404'].push({ url: urlStr, details: `Département ${deptCode} (fichier JSON manquant)` });
            }
            return;
        }

        // Cas 3 : Villes (/ville/slug)
        const cityMatch = pathname.match(/^\/ville\/([^\/]+)\/?$/);
        if (cityMatch) {
            const originalSlug = cityMatch[1];
            const cleanSlug = originalSlug.toLowerCase().replace(/-+/g, '-').replace(/-$/, '').replace(/^-/, '');

            // Redirection de normalisation de base (si le slug d'origine n'était pas clean)
            if (originalSlug !== cleanSlug) {
                const recoveryRes = simulateRecovery(cleanSlug, cityIndex);
                if (recoveryRes.status === 'OK') {
                    results.REDIRECT_NORMALIZE.push({ url: urlStr, target: `/ville/${cleanSlug}` });
                } else if (recoveryRes.status.startsWith('REDIRECT')) {
                    results[recoveryRes.status].push({ url: urlStr, target: `/ville/${recoveryRes.target}` });
                } else {
                    results['404'].push({ url: urlStr, details: `Slug non normalisé faisant 404 après nettoyage` });
                }
                return;
            }

            // Si le slug est propre, faire la recherche complète
            const recoveryRes = simulateRecovery(cleanSlug, cityIndex);
            if (recoveryRes.status === 'OK') {
                // Vérifier si le fichier du département existe bien et si la ville y est
                const deptCode = cityIndex[cleanSlug];
                const deptFilePath = path.join(__dirname, '..', 'public', 'data', 'departments', `${deptCode}.json`);
                if (fs.existsSync(deptFilePath)) {
                    const deptData = JSON.parse(fs.readFileSync(deptFilePath, 'utf8'));
                    if (deptData.cities[cleanSlug]) {
                        results.OK.push({ url: urlStr, details: `Ville ${cleanSlug} dans département ${deptCode}` });
                    } else {
                        // Gérer le cas des homonymes (slug sans code dept mais stocké avec code dept dans le fichier JSON, ou inversement)
                        let rawCityData = deptData.cities[cleanSlug];
                        if (!rawCityData && cleanSlug.includes('-')) {
                            const parts = cleanSlug.split('-');
                            const lastPart = parts[parts.length - 1].toUpperCase();
                            if (/^\d{2,3}$|^2[AB]$/.test(lastPart)) {
                                const baseSlug = parts.slice(0, -1).join('-');
                                rawCityData = deptData.cities[baseSlug];
                            }
                        }
                        if (rawCityData) {
                            results.OK.push({ url: urlStr, details: `Ville ${cleanSlug} (homonyme résolu) dans département ${deptCode}` });
                        } else {
                            results['404'].push({ url: urlStr, details: `Ville présente dans l'index mais manquante dans le fichier du département ${deptCode}` });
                        }
                    }
                } else {
                    results['404'].push({ url: urlStr, details: `Fichier du département ${deptCode} introuvable pour la ville ${cleanSlug}` });
                }
            } else if (recoveryRes.status.startsWith('REDIRECT')) {
                results[recoveryRes.status].push({ url: urlStr, target: `/ville/${recoveryRes.target}` });
            } else {
                results['404'].push({ url: urlStr, details: `Slug introuvable dans l'index` });
            }
            return;
        }

        // Cas non géré par les routes de l'application
        results['404'].push({ url: urlStr, details: `Format d'URL inconnu` });

    } catch (err) {
        results['404'].push({ url: urlStr, details: `Erreur de parsing URL : ${err.message}` });
    }
});

// Afficher le rapport d'analyse
console.log('=== RAPPORT D\'ANALYSE DE RÉSILIENCE ET DES 404 ===');
console.log(`Total URLs analysées : ${urls.length}\n`);

console.log(`✅ OK (Pages fonctionnelles) : ${results.OK.length}`);
console.log(`🔄 REDIRECT_NORMALIZE (Redirections de casse/tirets de base) : ${results.REDIRECT_NORMALIZE.length}`);
console.log(`🔄 REDIRECT_FUZZY (Redirections phonétiques) : ${results.REDIRECT_FUZZY.length}`);
console.log(`🔄 REDIRECT_NODASH (Redirections sans tirets) : ${results.REDIRECT_NODASH.length}`);
console.log(`🔄 REDIRECT_ARTICLE (Redirections d'inversion d'article) : ${results.REDIRECT_ARTICLE.length}`);
console.log(`🔄 REDIRECT_PARTIAL (Redirections partielles/inclusions) : ${results.REDIRECT_PARTIAL.length}`);
console.log(`❌ 404 (Erreurs pures ou fichiers manquants) : ${results['404'].length}\n`);

if (results.REDIRECT_NORMALIZE.length > 0) {
    console.log('--- EXEMPLES DE REDIRECTIONS DE NORMALISATION ---');
    results.REDIRECT_NORMALIZE.slice(0, 10).forEach(r => console.log(`  ${r.url} -> ${r.target}`));
    console.log('');
}

if (results.REDIRECT_FUZZY.length > 0) {
    console.log('--- EXEMPLES DE REDIRECTIONS FUZZY ---');
    results.REDIRECT_FUZZY.slice(0, 10).forEach(r => console.log(`  ${r.url} -> ${r.target}`));
    console.log('');
}

if (results.REDIRECT_PARTIAL.length > 0) {
    console.log('--- EXEMPLES DE REDIRECTIONS PARTIELLES ---');
    results.REDIRECT_PARTIAL.slice(0, 10).forEach(r => console.log(`  ${r.url} -> ${r.target}`));
    console.log('');
}

if (results['404'].length > 0) {
    console.log('--- LISTE COMPLÈTE DES 404 ---');
    results['404'].forEach(r => console.log(`  ❌ ${r.url} : ${r.details}`));
    console.log('');
}
