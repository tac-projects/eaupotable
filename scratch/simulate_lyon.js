
const { calculateCrystalScore, parseValue } = require('../lib/water-utils');

const stats = {
  pesticides: { val: "0.5" },
  nitrates: { val: "5.8" },
  chlorine: { val: "0.12" }, 
  hardness: { val: "20.15" },
  ph: { val: "7.3" },
  turbidity: { val: "0.1" },
  conductivity: { val: "382" }
};

const result = calculateCrystalScore(stats, true);
console.log("FINAL SCORE:", result.final);
console.log("LABEL:", result.label);
