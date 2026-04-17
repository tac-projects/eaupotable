
async function testLyonFull() {
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

  const uniqueParams = [...new Set(reports.map(r => `${r.code_parametre} - ${r.libelle_parametre}`))];
  console.log(`Unique parameters found for ${cityName}:`, uniqueParams.length);
  console.log(uniqueParams.slice(0, 50));
  
  const reseaux = [...new Set(reports.flatMap(r => r.reseaux?.map(res => `${res.code} - ${res.nom}`) || []))];
  console.log(`Networks found:`, reseaux);
}

testLyonFull();
