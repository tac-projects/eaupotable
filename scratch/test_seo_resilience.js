const fs = require('fs');
const path = require('path');

function simulateRecovery(requestedSlug, cityIndex) {
    const cleanSlug = requestedSlug.toLowerCase().replace(/-+/g, '-').replace(/-$/, '').replace(/^-/, '');
    
    if (cityIndex[cleanSlug]) return { status: 'OK', target: cleanSlug };

    const allSlugs = Object.keys(cityIndex);
    
    // 1. Normalisation ultra-agressive
    const fuzzy = (s) => s.toLowerCase().replace(/[aeiouyœæ]/g, '').replace(/-+/g, '');
    const cleanFuzzy = fuzzy(cleanSlug);
    
    const fuzzyMatch = allSlugs.find(s => fuzzy(s) === cleanFuzzy);
    if (fuzzyMatch) return { status: 'REDIRECT_FUZZY', target: fuzzyMatch };

    // 2. Patchs syntaxiques
    const noDash = cleanSlug.replace(/-/g, '');
    const noDashMatch = allSlugs.find(s => s.replace(/-/g, '') === noDash);
    if (noDashMatch) return { status: 'REDIRECT_NODASH', target: noDashMatch };

    // 3. Inclusion (TOLERANCE 20)
    const partialMatch = allSlugs.find(s => 
      (cleanSlug.startsWith(s + '-') || s.startsWith(cleanSlug + '-')) && 
      Math.abs(s.length - cleanSlug.length) < 20
    );

    if (partialMatch) return { status: 'REDIRECT_PARTIAL', target: partialMatch };

    return { status: '404', target: null };
}

const cityIndex = JSON.parse(fs.readFileSync('public/city-index.json', 'utf8'));

const tests = [
    'crevec-ur-le-grand',
    'saint-gineys-en-coiron',
    'saint-christol-lez-ales',
    'saint-pere-marc-en-poulet'
];

console.log('--- TEST DE RÉSILIENCE SEO (V4 - FINAL) ---');
tests.forEach(t => {
    const res = simulateRecovery(t, cityIndex);
    console.log(`Input: ${t} -> [${res.status}] Target: ${res.target}`);
});
