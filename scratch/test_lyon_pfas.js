
async function testLyonPFAS() {
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

  const pfas = reports.filter(r => r.libelle_parametre.toLowerCase().includes("pfas") || [7149, 7150].includes(parseInt(r.code_parametre)));
  console.log(`PFAS found for Lyon:`, pfas.length);
  pfas.forEach(r => {
      console.log(`- ${r.date_prelevement}: ${r.resultat_numerique || r.resultat_alphanumerique} (${r.libelle_parametre})`);
  });
}

testLyonPFAS();
