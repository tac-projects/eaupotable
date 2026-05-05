const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:/Users/thoma/Documents/APP/eaupotable-net/public/data/departments/01.json', 'utf8'));
console.log(Object.keys(data.cities).slice(0, 50));
