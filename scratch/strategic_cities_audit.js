const fs = require('fs');
const path = require('path');

const checks = [
    { dept: '44', city: 'nantes' },
    { dept: '13', city: 'marseille' },
    { dept: '75', city: 'paris' },
    { dept: '69', city: 'lyon' },
    { dept: '33', city: 'bordeaux' }
];

checks.forEach(check => {
    const file = `public/data/departments/${check.dept}.json`;
    if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        const city = data.cities[check.city];
        if (city) {
            const stats = city.stats;
            const dates = Object.values(stats).map(s => s.date).filter(d => d !== 'N/A');
            const uniqueDates = [...new Set(dates)];
            const missing = Object.entries(stats).filter(([k,v]) => v.val === '--').map(([k,v]) => k);
            
            console.log(`--- ${city.cityName} (Score: ${city.crystal.final}/10) ---`);
            console.log(`Dates d'analyses fusionnées: ${uniqueDates.join(', ')}`);
            console.log(`Indicateurs manquants: ${missing.length > 0 ? missing.join(', ') : 'AUCUN (Parfait)'}`);
            console.log('');
        }
    }
});
