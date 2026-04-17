
async function testLyonChlore() {
  const cityName = "Lyon";
  const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&size=5000`;
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
  
  const chloreRecords = reports.filter(r => [1398, 1399].includes(parseInt(r.code_parametre)));
  console.log(`Chlore found for Lyon:`, chloreRecords.length);
  chloreRecords.slice(0, 10).forEach(r => {
      console.log(`- ${r.date_prelevement}: ${r.resultat_numerique || r.resultat_alphanumerique} (${r.libelle_parametre}) [${r.code_parametre}]`);
  });
}

testLyonChlore();
