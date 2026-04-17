
async function test() {
  const cityName = "Paris";
  console.log(`--- Testing Paris Data Recovery ---`);
  
  // 1. Initial Fetch
  const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&size=1000`;
  const response = await fetch(url);
  const data = await response.json();
  
  const reports = data.data.filter(r => 
    r.nom_commune.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, ' ') === 
    cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, ' ')
  );

  console.log(`Found ${reports.length} reports for Paris in initial fetch.`);

  // 2. Identify Networks
  const allReseauCodes = [...new Set(reports.flatMap(r => r.reseaux?.map(res => res.code) || []))].filter(Boolean);
  const reseauQuery = allReseauCodes.join(',');
  console.log(`Networks identified: ${allReseauCodes.length}`);

  // 3. Fallback Parameters
  const fallbackConfig = {
      hardness: "1345,2708",
      pesticides: "1107,1667,6272,6273,6274,6275,6276,6277,6278,6279,6280,7149,7150"
  };

  // 4. Execute Targeted Fallbacks
  console.log("\nExecuting targeted fallbacks...");
  await Promise.all(Object.keys(fallbackConfig).map(async (key) => {
      const targetCodes = fallbackConfig[key];
      const rUrl = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_reseau=${reseauQuery}&code_parametre=${targetCodes}&size=1&sort=desc`;
      
      const rRes = await fetch(rUrl);
      const rData = await rRes.json();
      
      if (rData.data && rData.data.length > 0) {
          const match = rData.data[0];
          console.log(`[SUCCESS] ${key} found!`);
          console.log(`  Value: ${match.resultat_numerique || match.resultat_alphanumerique}`);
          console.log(`  Date: ${match.date_prelevement}`);
          console.log(`  Network: ${match.reseaux?.[0]?.nom} (${match.reseaux?.[0]?.code})`);
      } else {
          console.log(`[FAILED] ${key} not found.`);
      }
  }));
}

test();
