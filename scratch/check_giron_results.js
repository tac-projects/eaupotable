const fs = require('fs');
const path = require('path');

const root = "c:/Users/thoma/Documents/APP/eaupotable-net/source-data/archives";
const refs = ["00100139403", "00100140057", "00100141643", "00100142328", "00100142329", "00100142330", "00100142331", "00100142335", "00100142543", "00100143031"];

const file = path.join(root, "2024", `DIS_RESULT_2024_001.txt`);
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const results = lines.filter(line => refs.some(ref => line.includes(ref)));
console.log(results.slice(0, 100));
