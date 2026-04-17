
async function findPositivePFAS() {
    const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=Lyon&size=5000`;
    const res = await fetch(url);
    const data = await res.json();
    
    const pfasKeywords = ['pfas', 'perfluo', 'perfluoro', 'acide perfluoro'];
    const pfasMatches = data.data.filter(r => 
        pfasKeywords.some(k => r.libelle_parametre.toLowerCase().includes(k))
    );
    
    console.log(`Found ${pfasMatches.length} PFAS records.`);
    
    const positiveDetections = pfasMatches.filter(r => {
        const val = (r.resultat_alphanumerique || r.resultat_numerique || "").toString();
        return !val.includes('<') && parseFloat(val.replace(',', '.')) > 0;
    });
    
    console.log(`Positive detections: ${positiveDetections.length}`);
    positiveDetections.forEach(r => {
        console.log(`ALERTE: ${r.libelle_parametre} | Value: ${r.resultat_alphanumerique || r.resultat_numerique} | Date: ${r.date_prelevement}`);
    });
}
findPositivePFAS();
