
async function findLyonPFAS() {
    const cityName = "Lyon";
    const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=${encodeURIComponent(cityName)}&size=5000`;
    const res = await fetch(url);
    const data = await res.json();
    
    const pfas = data.data.filter(r => 
        (r.libelle_parametre.toLowerCase().includes('pfas') || 
         [7149, 7148, 8194, 7150].includes(parseInt(r.code_parametre))) &&
        (r.resultat_numerique !== null || r.resultat_alphanumerique !== null)
    );
    
    pfas.forEach(r => {
        console.log(`PFAS Found: ${r.resultat_numerique || r.resultat_alphanumerique} | Reseau: ${r.libelle_reseau} (${r.code_reseau}) | Date: ${r.date_prelevement}`);
    });
}
findLyonPFAS();
