
const { fetchCitySummary } = require('../lib/water-utils');

async function getLyonDetail() {
  const city = "Lyon";
  try {
    const summary = await fetchCitySummary(city);
    console.log(`\n--- DETAILS FOR ${city} ---`);
    console.log("Score:", summary.score);
    // Note: fetchCitySummary returns the summary, we need to see what's inside.
    // I will check the water-utils.js again to see if I can get the raw crystal object.
  } catch (e) {
    console.error(e);
  }
}

getLyonDetail();
