
const { fetchCitySummary } = require('../lib/water-utils');

async function getScores() {
  const cities = ["Paris", "Lyon", "Marseille", "Nantes", "Lille", "Montpellier", "Bordeaux", "Toulouse"];
  const results = [];
  
  for (const city of cities) {
    try {
      console.log(`Fetching ${city}...`);
      const summary = await fetchCitySummary(city);
      results.push({
        name: city,
        score: summary ? summary.score : "N/A"
      });
    } catch (e) {
      console.error(`Error for ${city}:`, e);
      results.push({ name: city, score: "Error" });
    }
  }
  
  console.log("\n--- FINAL SCORES ---");
  console.log(JSON.stringify(results, null, 2));
}

getScores();
