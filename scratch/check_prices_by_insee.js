const fs = require('fs');

const prices = JSON.parse(fs.readFileSync('c:/Users/thoma/Documents/APP/eaupotable-net/source-data/prices.json', 'utf8'));

const missingInsee = {
  "Argis": "01017",
  "Briord": "01064",
  "Challes-la-Montagne": "01077",
  "Conand": "01111",
  "Haut Valromey": "01187",
  "Labalme": "01200",
  "Les Neyrolles": "01274",
  "Saint-Alban": "01331",
  "Saint-Martin-du-Frêne": "01373",
  "Sault-Brénaz": "01396"
};

const results = {};
for (const name in missingInsee) {
  const insee = missingInsee[name];
  results[name] = { insee, price: prices[insee] || null };
}

console.log(JSON.stringify(results, null, 2));
