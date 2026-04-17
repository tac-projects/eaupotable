
async function checkLyonPFAS() {
  const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=Lyon&size=5000`;
  const response = await fetch(url);
  const data = await response.json();
  
  const pfas = data.data.filter(r => 
    (r.libelle_parametre.toLowerCase().includes('pfas') || 
     [7149, 7148, 8194, 7150].includes(parseInt(r.code_parametre))) &&
    (r.resultat_numerique !== null || r.resultat_alphanumerique !== null)
  );
  
  console.log(`PFAS found for Lyon:`, pfas.length);
  pfas.sort((a,b) => new Date(b.date_prelevement) - new Date(a.date_prelevement));
  pfas.slice(0, 5).forEach(r => {
      console.log(`- ${r.date_prelevement}: ${r.resultat_numerique || r.resultat_alphanumerique} (${r.libelle_parametre}) [${r.code_parametre}]`);
  });
}

checkLyonPFAS();
