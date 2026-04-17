
async function testSize(size) {
  const cityName = "Paris";
  const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&size=${size}`;
  const response = await fetch(url);
  const data = await response.json();
  
  const reports = data.data.filter(r => 
    r.nom_commune.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, ' ') === 
    cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, ' ')
  );

  const allReseauCodes = [...new Set(reports.flatMap(r => r.reseaux?.map(res => res.code) || []))].filter(Boolean);
  return { size, networkCount: allReseauCodes.length, reportCount: reports.length, networks: allReseauCodes };
}

async function run() {
  const s1000 = await testSize(1000);
  const s5000 = await testSize(5000);
  
  console.log("Size 1000:", s1000.networkCount, "networks", `(${s1000.reportCount} reports)`);
  console.log("Size 5000:", s5000.networkCount, "networks", `(${s5000.reportCount} reports)`);
  
  const diff = s5000.networks.filter(n => !s1000.networks.includes(n));
  if (diff.length > 0) {
      console.log("Missing networks in 1000 rows:", diff);
  }
}

run();
