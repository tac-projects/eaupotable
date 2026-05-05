const fs = require('fs');
const path = require('path');

const root = "c:/Users/thoma/Documents/APP/eaupotable-net/source-data/archives";
const targetUdi = "001001072"; // GIRON
const years = ["2026", "2025", "2024", "2023", "2022", "2021"];

const allRefs = [];
years.forEach(year => {
    const file = path.join(root, year, `DIS_PLV_${year}_001.txt`);
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        content.split('\n').forEach(line => {
            if (line.includes(targetUdi)) {
                const parts = line.split(',');
                const ref = parts[7]?.replace(/\"/g, '');
                if (ref) allRefs.push({ ref, year });
            }
        });
    }
});

console.log(`Giron: ${allRefs.length} prélèvements trouvés.`);

allRefs.forEach(item => {
    const file = path.join(root, item.year, `DIS_RESULT_${item.year}_001.txt`);
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        content.split('\n').forEach(line => {
            if (line.includes(item.ref)) {
                console.log(`[${item.year}] ${line}`);
            }
        });
    }
});
