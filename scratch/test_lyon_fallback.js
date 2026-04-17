
async function testLyonFallback() {
  const networks = ['069000270', '069003595', '069000229', '069000069'];
  const pesticideCodes = "1107,1667,6272,6273,6274,6275,6276,6277,6278,6279,6280,7150";
  
  console.log(`Checking fallback for Lyon networks: ${networks.join(', ')}`);
  const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_reseau=${networks.join(',')}&code_parametre=${pesticideCodes}&size=5&sort=desc`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.data && data.data.length > 0) {
      console.log(`Found ${data.data.length} pesticide records via fallback.`);
      data.data.forEach(r => {
          console.log(`- ${r.date_prelevement}: ${r.resultat_numerique || r.resultat_alphanumerique} (${r.libelle_parametre}) in ${r.nom_commune} [Network: ${r.reseaux?.[0]?.code}]`);
      });
  } else {
      console.log("No pesticide records found via fallback.");
  }
}

testLyonFallback();
