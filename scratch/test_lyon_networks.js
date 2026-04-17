
async function testSize(size) {
  const cityName = "Lyon";
  const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&size=${size}`;
  const response = await fetch(url);
  const data = await response.json();
  
  const cleanTarget = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, ' ');
  const reports = data.data.filter(r => {
    const c = r.nom_commune.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, ' ');
    const metropoles = ['lyon', 'paris', 'marseille', 'bordeaux', 'toulouse', 'nantes', 'lille', 'montpellier'];
    if (metropoles.includes(cleanTarget)) {
      return c === cleanTarget || c.startsWith(cleanTarget + " ") || c.startsWith(cleanTarget + "-");
    }
    return c === cleanTarget || c.startsWith(cleanTarget + " ");
  });

  const allReseauCodes = [...new Set(reports.flatMap(r => r.reseaux?.map(res => res.code) || []))].filter(Boolean);
  return { size, networkCount: allReseauCodes.length, networks: allReseauCodes };
}

async function run() {
  const s1000 = await testSize(1000);
  const s5000 = await testSize(5000);
  
  console.log("Size 1000:", s1000.networkCount, "networks");
  console.log("Size 5000:", s5000.networkCount, "networks");
  
  const diff = s5000.networks.filter(n => !s1000.networks.includes(n));
  if (diff.length > 0) {
      console.log("Missing networks in 1000 rows:", diff);
  }
}

run();
