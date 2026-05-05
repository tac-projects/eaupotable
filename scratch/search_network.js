const fs = require('fs');
const path = require('path');

const target = "001001072";
const root = "c:/Users/thoma/Documents/APP/eaupotable-net/source-data/archives";

const years = ["2026", "2025", "2024", "2023"];
years.forEach(year => {
    const file = path.join(root, year, `DIS_PLV_${year}_001.txt`);
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes(target)) {
            console.log(`Found in ${year}`);
            const lines = content.split('\n').filter(l => l.includes(target));
            console.log(lines);
        } else {
            console.log(`Not found in ${year}`);
        }
    }
});
