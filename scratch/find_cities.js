const fs = require('fs');
const lines = fs.readFileSync('source-data/archives/2026/DIS_COM_UDI_2026.txt', 'utf8').split('\n');
lines.forEach(l => {
    if (l.startsWith('"70') && l.toUpperCase().includes('SAINT-LAURENT')) {
        console.log(l);
    }
});
