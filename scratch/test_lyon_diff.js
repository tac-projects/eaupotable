
async function testLyon(size) {
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

  reports.sort((a, b) => new Date(b.date_prelevement) - new Date(a.date_prelevement));
  
  const pesticidesRecords = reports.filter(r => [1107, 1667, 6272, 6273, 6274, 6275, 6276, 6277, 6278, 6279, 6280, 7150].includes(parseInt(r.code_parametre)));
  
  console.log(`--- Results for Size ${size} ---`);
  console.log(`Total filtered reports: ${reports.length}`);
  console.log(`Pesticides found: ${pesticidesRecords.length}`);
  if (pesticidesRecords.length > 0) {
      console.log(`Latest pesticide: ${pesticidesRecords[0].resultat_numerique || pesticidesRecords[0].resultat_alphanumerique} on ${pesticidesRecords[0].date_prelevement} in ${pesticidesRecords[0].nom_commune}`);
  }
}

async function run() {
  await testLyon(1000);
  await testLyon(5000);
}

run();
