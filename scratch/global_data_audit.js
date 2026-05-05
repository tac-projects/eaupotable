const fs = require('fs');
const path = require('path');

const dir = 'public/data/departments/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Audit de ${files.length} départements...\n`);

const results = [];

files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const cities = Object.values(data.cities);
    const total = cities.length;
    
    const noPrice = cities.filter(c => !c.prix || c.prix.total === 0).length;
    const noStats = cities.filter(c => Object.values(c.stats).every(s => s.val === '--')).length;
    const incompleteExcludingPFAS = cities.filter(c => Object.entries(c.stats).some(([k,v]) => k !== 'pfas' && v.val === '--')).length;

    results.push({
        dept: data.deptInfo.code,
        name: data.deptInfo.name,
        total,
        noPrice,
        noStats,
        incompleteExcludingPFAS,
        priceRate: ((total - noPrice) / total * 100).toFixed(1) + '%',
        healthRate: ((total - incompleteExcludingPFAS) / total * 100).toFixed(1) + '%'
    });
});

// Trier par les départements les plus "vides" en prix
results.sort((a, b) => parseFloat(a.priceRate) - parseFloat(b.priceRate));

console.table(results.slice(0, 15)); // Les 15 plus mauvais en prix
console.log('\n--- Focus sur les stats (Hors PFAS) ---\n');
results.sort((a, b) => parseFloat(a.healthRate) - parseFloat(b.healthRate));
console.table(results.slice(0, 15)); // Les 15 plus mauvais en stats
