
const waterUtils = require('./lib/water-utils');
const { fetchCitySummary } = waterUtils;

// On va injecter un log dans calculateCrystalScore
const original = waterUtils.calculateCrystalScore;
waterUtils.calculateCrystalScore = (stats, isConform) => {
    console.log("LOG_STATS:", JSON.stringify(stats));
    console.log("LOG_CONFORM:", isConform);
    return original(stats, isConform);
};

async function check() {
    await fetchCitySummary("Lyon");
}

check();
